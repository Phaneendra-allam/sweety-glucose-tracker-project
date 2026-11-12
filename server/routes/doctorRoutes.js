
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const doctorMiddleware = require("../middleware/doctorMiddleware");

const {
    getAssignedPatients,
    patientDailyReport,
    patientMonthToDateReport,
    patientMonthlyReport
} = require("../controllers/doctorController");

// Every route requires login and a doctor role
router.use(authMiddleware, doctorMiddleware);

// Assigned patient list
router.get("/patients", getAssignedPatients);

// Reports for a specific assigned patient
router.get(
    "/patients/:id/reports/daily",
    patientDailyReport
);

router.get(
    "/patients/:id/reports/month-to-date",
    patientMonthToDateReport
);

router.get(
    "/patients/:id/reports/monthly",
    patientMonthlyReport
);

module.exports = router;
