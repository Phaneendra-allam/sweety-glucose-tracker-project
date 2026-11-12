
const pool = require("../config/db");

// Validate YYYY-MM-DD date
const isValidDate = (date) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
        return false;
    }

    const parsed = new Date(`${date}T00:00:00Z`);

    return !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === date;
};

// Generate report
const generateReport = async (req, res, startDate, endDate, reportType) => {
    try {
        const userId = req.user.id;

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
            [userId, startDate, endDate]
        );

        const readings = result.rows;
        const values = readings.map(row => Number(row.glucose_value));

        let highest = null;
        let lowest = null;
        let average = null;

        if (values.length > 0) {
            highest = Math.max(...values);
            lowest = Math.min(...values);

            const total = values.reduce((sum, value) => sum + value, 0);

            average = Number((total / values.length).toFixed(1));
        }

        res.json({
            report_type: reportType,
            start_date: startDate,
            end_date: endDate,

            summary: {
                highest,
                lowest,
                average,
                total_readings: readings.length
            },

            readings,

            message: readings.length === 0
                ? "No glucose readings found for this period."
                : "Report generated successfully."
        });

    } catch (error) {
        console.error("Report error:", error);

        res.status(500).json({
            message: "Failed to generate report."
        });
    }
};

// DAILY REPORT
exports.dailyReport = async (req, res) => {
    const date = req.query.date;

    if (!isValidDate(date)) {
        return res.status(400).json({
            message: "Please provide a valid date in YYYY-MM-DD format."
        });
    }

    const nextDate = new Date(`${date}T00:00:00Z`);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);

    const endDate = nextDate.toISOString().slice(0, 10);

    return generateReport(
        req, res, date, endDate, "Daily"
    );
};

// MONTH-TO-DATE REPORT
exports.monthToDateReport = async (req, res) => {
    const date = req.query.date;

    if (!isValidDate(date)) {
        return res.status(400).json({
            message: "Please provide a valid date in YYYY-MM-DD format."
        });
    }

    const startDate = `${date.slice(0, 7)}-01`;

    const nextDate = new Date(`${date}T00:00:00Z`);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);

    const endDate = nextDate.toISOString().slice(0, 10);

    return generateReport(
        req, res, startDate, endDate, "Month-to-date"
    );
};

// PREVIOUS MONTH REPORT
exports.monthlyReport = async (req, res) => {
    const date = req.query.date;

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

    const startDate = firstDayPreviousMonth.toISOString().slice(0, 10);
    const endDate = firstDayCurrentMonth.toISOString().slice(0, 10);

    return generateReport(
        req, res, startDate, endDate, "Previous month"
    );
};
