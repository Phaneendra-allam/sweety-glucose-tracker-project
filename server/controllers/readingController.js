
const pool = require("../config/db");

const VALID_SLOTS = [
    "Morning",
    "After breakfast",
    "After lunch",
    "After dinner"
];

// Get today's date in Indian timezone
const getToday = () => {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const dateParts = {};
    parts.forEach((part) => {
        dateParts[part.type] = part.value;
    });

    return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
};

// Validate date format and prevent future dates
const isValidDate = (date) => {
    if (typeof date !== "string") return false;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return false;
    }

    const parsed = new Date(`${date}T00:00:00Z`);

    if (
        Number.isNaN(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== date
    ) {
        return false;
    }

    return date <= getToday();
};

// Validate glucose value
const isValidGlucose = (value) => {
    return (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        Number.isInteger(Number(value)) &&
        Number(value) >= 40 &&
        Number(value) <= 600
    );
};

// Add glucose reading
const addReading = async (req, res) => {
    try {
        const { reading_date, time_slot, glucose_value } = req.body;
        const userId = req.user.id;

        if (
            glucose_value === undefined ||
            glucose_value === null ||
            glucose_value === ""
        ) {
            return res.status(400).json({
                message: "Please enter a glucose value."
            });
        }

        if (!isValidGlucose(glucose_value)) {
            return res.status(400).json({
                message: "Value must be between 40 and 600 mg/dl."
            });
        }

        if (!reading_date || !time_slot) {
            return res.status(400).json({
                message: "Please provide a date and time slot."
            });
        }

        if (!isValidDate(reading_date)) {
            return res.status(400).json({
                message: "Date cannot be in the future or invalid."
            });
        }

        if (!VALID_SLOTS.includes(time_slot)) {
            return res.status(400).json({
                message: "Invalid time slot."
            });
        }

        const existing = await pool.query(
            `SELECT time_slot
             FROM readings
             WHERE user_id = $1 AND reading_date = $2`,
            [userId, reading_date]
        );

        if (existing.rows.some((row) => row.time_slot === time_slot)) {
            return res.status(409).json({
                message: `You already have an ${time_slot} reading for this date.`
            });
        }

        if (existing.rows.length >= 4) {
            return res.status(409).json({
                message: "You can add only 4 readings per day."
            });
        }

        const result = await pool.query(
            `INSERT INTO readings
                (user_id, reading_date, time_slot, glucose_value)
             VALUES ($1, $2, $3, $4)
             RETURNING
                id,
                user_id,
                TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
                time_slot,
                glucose_value,
                created_at`,
            [userId, reading_date, time_slot, Number(glucose_value)]
        );

        return res.status(201).json({
            message: "Reading added successfully.",
            reading: result.rows[0]
        });

    } catch (error) {
        console.error("Add reading error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "You already have a reading for this date and time slot."
            });
        }

        return res.status(500).json({
            message: "Unable to add reading."
        });
    }
};

// Get all readings belonging to logged-in user
const getReadings = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT
                id,
                user_id,
                TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
                time_slot,
                glucose_value,
                created_at
             FROM readings
             WHERE user_id = $1
             ORDER BY reading_date DESC, id DESC`,
            [userId]
        );

        return res.status(200).json({
            readings: result.rows
        });

    } catch (error) {
        console.error("Get readings error:", error);

        return res.status(500).json({
            message: "Unable to retrieve readings."
        });
    }
};

// Update existing glucose reading
const updateReading = async (req, res) => {
    try {
        const { id } = req.params;
        const { reading_date, time_slot, glucose_value } = req.body;
        const userId = req.user.id;

        if (
            glucose_value === undefined ||
            glucose_value === null ||
            glucose_value === ""
        ) {
            return res.status(400).json({
                message: "Please enter a glucose value."
            });
        }

        if (!isValidGlucose(glucose_value)) {
            return res.status(400).json({
                message: "Value must be between 40 and 600 mg/dl."
            });
        }

        if (!reading_date || !time_slot) {
            return res.status(400).json({
                message: "Please provide a date and time slot."
            });
        }

        if (!isValidDate(reading_date)) {
            return res.status(400).json({
                message: "Date cannot be in the future or invalid."
            });
        }

        if (!VALID_SLOTS.includes(time_slot)) {
            return res.status(400).json({
                message: "Invalid time slot."
            });
        }

        const current = await pool.query(
            `SELECT id
             FROM readings
             WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );

        if (current.rows.length === 0) {
            return res.status(404).json({
                message: "Reading not found."
            });
        }

        const existing = await pool.query(
            `SELECT id, time_slot
             FROM readings
             WHERE user_id = $1
               AND reading_date = $2
               AND id <> $3`,
            [userId, reading_date, id]
        );

        if (existing.rows.some((row) => row.time_slot === time_slot)) {
            return res.status(409).json({
                message: `You already have an ${time_slot} reading for this date.`
            });
        }

        if (existing.rows.length >= 4) {
            return res.status(409).json({
                message: "You can add only 4 readings per day."
            });
        }

        const result = await pool.query(
            `UPDATE readings
             SET reading_date = $1,
                 time_slot = $2,
                 glucose_value = $3
             WHERE id = $4 AND user_id = $5
             RETURNING
                id,
                user_id,
                TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
                time_slot,
                glucose_value,
                created_at`,
            [reading_date, time_slot, Number(glucose_value), id, userId]
        );

        return res.status(200).json({
            message: "Reading updated successfully.",
            reading: result.rows[0]
        });

    } catch (error) {
        console.error("Update reading error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "You already have a reading for this date and time slot."
            });
        }

        return res.status(500).json({
            message: "Unable to update reading."
        });
    }
};

// Delete glucose reading
const deleteReading = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await pool.query(
            `DELETE FROM readings
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Reading not found."
            });
        }

        return res.status(200).json({
            message: "Reading deleted successfully."
        });

    } catch (error) {
        console.error("Delete reading error:", error);

        return res.status(500).json({
            message: "Unable to delete reading."
        });
    }
};

module.exports = {
    addReading,
    getReadings,
    updateReading,
    deleteReading
};
