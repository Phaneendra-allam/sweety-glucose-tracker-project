
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    sendMessage,
    getTodaySummary
} = require("../controllers/chatController");

// Only authenticated patient accounts can use this chatbot
router.use(authMiddleware);

router.use((req, res, next) => {
    if (req.user.role !== "patient") {
        return res.status(403).json({
            message: "This chatbot is available for patient accounts."
        });
    }

    next();
});

router.post("/message", sendMessage);
router.get("/today-summary", getTodaySummary);

module.exports = router;
