
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    dailyReport,
    monthToDateReport,
    monthlyReport
} = require("../controllers/reportController");

router.get("/daily", authMiddleware, dailyReport);
router.get("/month-to-date", authMiddleware, monthToDateReport);
router.get("/monthly", authMiddleware, monthlyReport);

module.exports = router;
