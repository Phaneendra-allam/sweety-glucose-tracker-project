
const pool = require("../config/db");

const isValidDate = (date) => {
    if (typeof date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return false;
    }

    const parsed = new Date(`${date}T00:00:00Z`);

    return !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === date;
};

const getPatientId = (req) => {
    const patientId = Number(req.params.id);

    return Number.isSafeInteger(patientId) && patientId > 0
        ? patientId
        : null;
};

// Confirm the patient is assigned to this doctor
const verifyPatientAssignment = async (doctorId, patientId) => {
    const result = await pool.query(
        `SELECT p.id, p.name, p.email
         FROM doctor_patient_assignments a
         INNER JOIN users p ON p.id = a.patient_id
         WHERE a.doctor_id = $1
           AND a.patient_id = $2
           AND p.role = 'patient'`,
        [doctorId, patientId]
    );

    return result.rows[0] || null;
};

// Return the doctor's assigned patients
exports.getAssignedPatients = async (req, res) => {
    try {
        const doctorId = req.user.id;

        const result = await pool.query(
            `SELECT
                p.id,
                p.name,
                p.email,
                a.assigned_at,
                (
                    SELECT COUNT(*)::INTEGER
                    FROM readings r
                    WHERE r.user_id = p.id
                ) AS total_readings,
                (
                    SELECT TO_CHAR(r.reading_date, 'YYYY-MM-DD')
                    FROM readings r
                    WHERE r.user_id = p.id
                    ORDER BY r.reading_date DESC, r.id DESC
                    LIMIT 1
                ) AS latest_reading_date,
                (
                    SELECT r.glucose_value
                    FROM readings r
                    WHERE r.user_id = p.id
                    ORDER BY r.reading_date DESC, r.id DESC
                    LIMIT 1
                ) AS latest_glucose,
                (
                    SELECT ROUND(AVG(r.glucose_value)::NUMERIC, 1)
                    FROM readings r
                    WHERE r.user_id = p.id
                      AND r.reading_date >= CURRENT_DATE - INTERVAL '6 days'
                      AND r.reading_date < CURRENT_DATE + INTERVAL '1 day'
                ) AS avg_glucose_7_days
             FROM doctor_patient_assignments a
             INNER JOIN users p ON p.id = a.patient_id
             WHERE a.doctor_id = $1
               AND p.role = 'patient'
             ORDER BY p.name ASC`,
            [doctorId]
        );

        return res.json({
            total_patients: result.rows.length,
            patients: result.rows.map((patient) => ({
                ...patient,
                total_readings: Number(patient.total_readings),
                latest_glucose: patient.latest_glucose === null
                    ? null
                    : Number(patient.latest_glucose),
                avg_glucose_7_days: patient.avg_glucose_7_days === null
                    ? null
                    : Number(patient.avg_glucose_7_days)
            }))
        });
    } catch (error) {
        console.error("Get assigned patients error:", error);

        return res.status(500).json({
            message: "Unable to retrieve assigned patients."
        });
    }
};

// Generate a report for one assigned patient
const generatePatientReport = async (
    req, res, startDate, endDate, reportType, patientId
) => {
    try {
        const patient = await verifyPatientAssignment(
            req.user.id,
            patientId
        );

        if (!patient) {
            return res.status(404).json({
                message: "Patient not found or not assigned to you."
            });
        }

        const result = await pool.query(
            `SELECT
                id,
                TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
                time_slot,
                glucose_value
             FROM readings
             WHERE user_id = $1
               AND reading_date >= $2::date
               AND reading_date < $3::date
             ORDER BY reading_date ASC, id ASC`,
            [patientId, startDate, endDate]
        );

        const readings = result.rows;
        const values = readings.map(
            (reading) => Number(reading.glucose_value)
        );

        const summary = {
            highest: values.length ? Math.max(...values) : null,
            lowest: values.length ? Math.min(...values) : null,
            average: values.length
                ? Number((
                    values.reduce((sum, value) => sum + value, 0) /
                    values.length
                ).toFixed(1))
                : null,
            total_readings: readings.length
        };

        return res.json({
            patient: {
                id: patient.id,
                name: patient.name,
                email: patient.email
            },
            report_type: reportType,
            start_date: startDate,
            end_date: endDate,
            summary,
            readings,
            message: readings.length
                ? "Patient report generated successfully."
                : "No glucose readings found for this period."
        });
    } catch (error) {
        console.error("Patient report error:", error);

        return res.status(500).json({
            message: "Unable to generate patient report."
        });
    }
};

// Daily report for an assigned patient
exports.patientDailyReport = async (req, res) => {
    const patientId = getPatientId(req);
    const date = req.query.date;

    if (!patientId) {
        return res.status(400).json({
            message: "Invalid patient ID."
        });
    }

    if (!isValidDate(date)) {
        return res.status(400).json({
            message: "Please provide a valid date in YYYY-MM-DD format."
        });
    }

    const nextDate = new Date(`${date}T00:00:00Z`);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);

    return generatePatientReport(
        req,
        res,
        date,
        nextDate.toISOString().slice(0, 10),
        "Daily",
        patientId
    );
};

// Month-to-date report for an assigned patient
exports.patientMonthToDateReport = async (req, res) => {
    const patientId = getPatientId(req);
    const date = req.query.date;

    if (!patientId) {
        return res.status(400).json({
            message: "Invalid patient ID."
        });
    }

    if (!isValidDate(date)) {
        return res.status(400).json({
            message: "Please provide a valid date in YYYY-MM-DD format."
        });
    }

    const startDate = `${date.slice(0, 7)}-01`;
    const nextDate = new Date(`${date}T00:00:00Z`);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);

    return generatePatientReport(
        req,
        res,
        startDate,
        nextDate.toISOString().slice(0, 10),
        "Month-to-date",
        patientId
    );
};

// Previous-month report for an assigned patient
exports.patientMonthlyReport = async (req, res) => {
    const patientId = getPatientId(req);
    const date = req.query.date;

    if (!patientId) {
        return res.status(400).json({
            message: "Invalid patient ID."
        });
    }

    if (!isValidDate(date)) {
        return res.status(400).json({
            message: "Please provide a valid date in YYYY-MM-DD format."
        });
    }

    const selectedDate = new Date(`${date}T00:00:00Z`);

    const firstDayCurrentMonth = new Date(Date.UTC(
        selectedDate.getUTCFullYear(),
        selectedDate.getUTCMonth(),
        1
    ));

    const firstDayPreviousMonth = new Date(Date.UTC(
        selectedDate.getUTCFullYear(),
        selectedDate.getUTCMonth() - 1,
        1
    ));

    return generatePatientReport(
        req,
        res,
        firstDayPreviousMonth.toISOString().slice(0, 10),
        firstDayCurrentMonth.toISOString().slice(0, 10),
        "Previous month",
        patientId
    );
};
