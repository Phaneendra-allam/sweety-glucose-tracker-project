
const pool = require("../config/db");

const FAQS = [
    {
        keywords: ["add reading", "add glucose", "save reading", "new reading"],
        answer: "To add a glucose reading, open your Dashboard, select the date and time slot, enter your glucose value in mg/dl, and click Save reading."
    },
    {
        keywords: ["history", "old reading", "previous reading", "all readings"],
        answer: "Open Reading History from your sidebar to see your previously recorded glucose readings. You can also delete a reading there."
    },
    {
        keywords: ["report", "average", "highest", "lowest", "monthly"],
        answer: "Open Reports from your sidebar. You can view Daily, Month-to-Date and Previous Month reports, including your highest, lowest and average recorded values."
    },
    {
        keywords: ["edit", "update reading", "change reading"],
        answer: "To edit a reading, open your Dashboard, find the reading under Recent readings, select Edit, change the required details and save it."
    },
    {
        keywords: ["delete", "remove reading"],
        answer: "You can delete a reading from your Dashboard or Reading History. The application will ask you to confirm before deletion."
    },
    {
        keywords: ["time slot", "slots", "when to record"],
        answer: "Sweety supports four reading slots: Morning, After breakfast, After lunch and After dinner. You can record one reading for each slot per day."
    },
    {
keywords: [
    "limit",
    "maximum",
    "four readings",
    "how many readings"
],        answer: "You can record up to four readings per day, one for each available time slot."
    },
    {
        keywords: ["glucose range", "normal range", "high glucose", "low glucose"],
        answer: "Glucose targets vary depending on the person, meal timing and medical circumstances. Please discuss your personal target range and unusual readings with your healthcare professional."
    },
    {
        keywords: ["hello", "hi", "hey", "good morning"],
        answer: "Hello! Welcome to Sweety. I can help you use the dashboard, record readings and understand the reports available in your account."
    },
    {
        keywords: ["thank you", "thanks"],
        answer: "You're welcome! I'm happy to help you use Sweety."
    },
    {
        keywords: ["who are you", "what can you do", "help"],
        answer: "I'm Sweety's Health Assistant. I can explain how to use the application, help you find readings and reports, and answer general glucose-tracking questions."
    }
];

const HEALTH_INSTRUCTIONS = `
You are Sweety Health Assistant, a friendly assistant inside a glucose tracking application.

Rules:
1. Help users understand application features and general glucose-tracking concepts.
2. Use simple, short and polite language.
3. Do not diagnose diseases or interpret a user's condition.
4. Do not prescribe medicines, change medication doses or recommend treatment.
5. Encourage users to contact a qualified healthcare professional for personal medical decisions or concerning symptoms.
6. Do not invent glucose readings or claim to have accessed the user's database.
7. Do not request passwords, API keys, full names, email addresses or other identifying details.
8. Do not claim that a glucose value is safe or unsafe for a particular person without their clinician's guidance.
9. Keep answers concise and easy to understand.
`;

// Simple per-user rate limit: 10 requests per minute
const requestTimes = new Map();

function isRateLimited(userId) {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;

    const recentRequests = (
        requestTimes.get(userId) || []
    ).filter((time) => time > oneMinuteAgo);

    if (recentRequests.length >= 10) {
        requestTimes.set(userId, recentRequests);
        return true;
    }

    recentRequests.push(now);
    requestTimes.set(userId, recentRequests);

    return false;
}

function findFAQ(message) {
    const normalized = message.toLowerCase().trim();

    return FAQS.find((faq) =>
        faq.keywords.some((keyword) =>
            normalized.includes(keyword)
        )
    );
}

// Local FAQ and optional Gemini AI response
exports.sendMessage = async (req, res) => {
    try {
        const { message } = req.body;

        if (typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                message: "Please enter a message."
            });
        }

        const userMessage = message.trim();

        if (userMessage.length > 1000) {
            return res.status(400).json({
                message: "Please keep your message below 1000 characters."
            });
        }

        if (isRateLimited(req.user.id)) {
            return res.status(429).json({
                message: "You have sent several messages. Please try again in a minute."
            });
        }

        // FAQ answers do not need an AI API key
        const faq = findFAQ(userMessage);

        if (faq) {
            return res.json({
                reply: faq.answer,
                mode: "faq"
            });
        }

        // Fall back to FAQ mode when no API key is configured
        if (!process.env.GEMINI_API_KEY) {
            return res.json({
                reply: "I can help with adding readings, editing records, history and reports. Try one of the suggested questions below. AI chat is not configured yet.",
                mode: "faq"
            });
        }

        // Only the user's typed message goes to Gemini.
        // Readings and account information are never added here.
        try {
            const { GoogleGenAI } = await import("@google/genai");

            const ai = new GoogleGenAI({
                apiKey: process.env.GEMINI_API_KEY
            });

            const response = await ai.models.generateContent({
                model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
                contents:
                    `${HEALTH_INSTRUCTIONS}\n\nUser message: ${userMessage}`,
                config: {
                    temperature: 0.4,
                    maxOutputTokens: 400
                }
            });

            const reply = response.text?.trim();

            if (!reply) {
                throw new Error("The AI returned an empty response.");
            }

            return res.json({
                reply,
                mode: "ai"
            });

        } catch (aiError) {
            console.error("Gemini chat error:", aiError.message);

            return res.json({
                reply: "The AI assistant is temporarily unavailable or its free quota has been reached. You can still use the quick questions for help with Sweety.",
                mode: "faq"
            });
        }

    } catch (error) {
        console.error("Chat controller error:", error);

        return res.status(500).json({
            message: "Unable to process your message right now."
        });
    }
};

// Get the logged-in patient's own readings for a selected date.
// This endpoint does not send readings to Gemini.
exports.getTodaySummary = async (req, res) => {
    try {
        const date = req.query.date;

        if (
            typeof date !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(date)
        ) {
            return res.status(400).json({
                message: "Please provide a valid date."
            });
        }

        const parsedDate = new Date(`${date}T00:00:00Z`);

        if (
            Number.isNaN(parsedDate.getTime()) ||
            parsedDate.toISOString().slice(0, 10) !== date
        ) {
            return res.status(400).json({
                message: "Please provide a valid date."
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
               AND reading_date = $2::date
             ORDER BY id ASC`,
            [req.user.id, date]
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
            date,
            summary,
            readings
        });

    } catch (error) {
        console.error("Chat summary error:", error);

        return res.status(500).json({
            message: "Unable to load your reading summary."
        });
    }
};
