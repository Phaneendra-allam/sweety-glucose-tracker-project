
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT token with account role
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

// Register patient and automatically assign the configured doctor
exports.register = async (req, res) => {
    let client;
    let transactionStarted = false;

    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedName = name.trim();

        const defaultDoctorEmail =
            process.env.DEFAULT_DOCTOR_EMAIL?.trim().toLowerCase();

        if (!defaultDoctorEmail) {
            return res.status(503).json({
                message: "Patient registration is not configured."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        client = await pool.connect();

        await client.query("BEGIN");
        transactionStarted = true;

        // Find the configured doctor account
        const doctorResult = await client.query(
            `SELECT id, name, email
             FROM users
             WHERE LOWER(email) = $1
               AND role = 'doctor'
             FOR SHARE`,
            [defaultDoctorEmail]
        );

        if (doctorResult.rows.length === 0) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(503).json({
                message: "The configured doctor account was not found."
            });
        }

        const doctor = doctorResult.rows[0];

        // Create the new patient account
        const patientResult = await client.query(
            `INSERT INTO users (name, email, password, role)
             VALUES ($1, $2, $3, 'patient')
             RETURNING id, name, email, role`,
            [normalizedName, normalizedEmail, hashedPassword]
        );

        const patient = patientResult.rows[0];

        // Automatically assign this patient to the configured doctor
        await client.query(
            `INSERT INTO doctor_patient_assignments
                (doctor_id, patient_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [doctor.id, patient.id]
        );

        await client.query("COMMIT");
        transactionStarted = false;

        return res.status(201).json({
            message: "Registration successful. Doctor assigned successfully.",
            token: generateToken(patient),
            user: patient,
            assigned_doctor: {
                name: doctor.name,
                email: doctor.email
            }
        });

    } catch (error) {
        if (client && transactionStarted) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Rollback error:", rollbackError.message);
            }
        }

        console.error("Registration error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "Email already registered."
            });
        }

        return res.status(500).json({
            message: "Registration failed."
        });

    } finally {
        if (client) {
            client.release();
        }
    }
};

// Login patient or doctor
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const result = await pool.query(
            `SELECT id, name, email, password, role
             FROM users
             WHERE email = $1`,
            [normalizedEmail]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const user = result.rows[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        return res.json({
            message: "Login successful.",
            token: generateToken(user),
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Login failed."
        });
    }
};
