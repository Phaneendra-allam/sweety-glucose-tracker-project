
require("dotenv").config();

const pool = require("../config/db");
const bcrypt = require("bcryptjs");

async function setupDoctor() {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Demo doctor account
        const doctorName = "Dr. Demo";
        const doctorEmail = "doctor@sweety.com";
        const doctorPassword = "Doctor12345";

        const hashedPassword = await bcrypt.hash(
            doctorPassword,
            12
        );

        // Check whether the doctor account already exists
        const existingDoctor = await client.query(
            "SELECT id, role FROM users WHERE email = $1",
            [doctorEmail]
        );

        let doctorId;

        if (existingDoctor.rows.length > 0) {
            if (existingDoctor.rows[0].role !== "doctor") {
                throw new Error(
                    "This email already belongs to a non-doctor account."
                );
            }

            doctorId = existingDoctor.rows[0].id;

            await client.query(
                `UPDATE users
                 SET name = $1, password = $2
                 WHERE id = $3`,
                [doctorName, hashedPassword, doctorId]
            );
        } else {
            const doctorResult = await client.query(
                `INSERT INTO users
                    (name, email, password, role)
                 VALUES ($1, $2, $3, 'doctor')
                 RETURNING id`,
                [doctorName, doctorEmail, hashedPassword]
            );

            doctorId = doctorResult.rows[0].id;
        }

        // Find the existing demo patient
        const patientResult = await client.query(
            `SELECT id
             FROM users
             WHERE email = $1 AND role = 'patient'`,
            ["demo@sweety.com"]
        );

        if (patientResult.rows.length === 0) {
            throw new Error(
                "Demo patient not found. Run the seed script first."
            );
        }

        const patientId = patientResult.rows[0].id;

        // Assign the demo patient to the doctor
        await client.query(
            `INSERT INTO doctor_patient_assignments
                (doctor_id, patient_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [doctorId, patientId]
        );

        await client.query("COMMIT");

        console.log("Doctor account setup successful.");
        console.log("Doctor email:", doctorEmail);
        console.log("Doctor password:", doctorPassword);
        console.log("Assigned patient: demo@sweety.com");

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Doctor setup failed:", error.message);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

setupDoctor();
