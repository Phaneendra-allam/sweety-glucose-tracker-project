
require("dotenv").config();

const pool = require("../config/db");
const bcrypt = require("bcryptjs");

async function seedDatabase() {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const name = "Demo User";
        const email = "demo@sweety.com";
        const password = "Sweety12345";

        const hashedPassword = await bcrypt.hash(password, 12);

        const userResult = await client.query(
            `INSERT INTO users (name, email, password)
             VALUES ($1, $2, $3)
             ON CONFLICT (email)
             DO UPDATE SET
                name = EXCLUDED.name,
                password = EXCLUDED.password
             RETURNING id`,
            [name, email, hashedPassword]
        );

        const userId = userResult.rows[0].id;

        // Reset only this demo user's readings
        await client.query(
            "DELETE FROM readings WHERE user_id = $1",
            [userId]
        );

        const today = new Date();
        const date = [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, "0"),
            String(today.getDate()).padStart(2, "0")
        ].join("-");

        const sampleReadings = [
            ["Morning", 110],
            ["After breakfast", 125],
            ["After lunch", 113],
            ["After dinner", 118]
        ];

        for (const [slot, value] of sampleReadings) {
            await client.query(
                `INSERT INTO readings
                 (user_id, reading_date, time_slot, glucose_value)
                 VALUES ($1, $2, $3, $4)`,
                [userId, date, slot, value]
            );
        }

        await client.query("COMMIT");

        console.log("Demo data created successfully.");
        console.log("Email: demo@sweety.com");
        console.log("Password: Sweety12345");
        console.log("Sample readings: 4");

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Seed error:", error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

seedDatabase();
