
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    addReading,
    getReadings,
    updateReading,
    deleteReading
} = require("../controllers/readingController");

router.post("/", authMiddleware, addReading);
router.get("/", authMiddleware, getReadings);
router.put("/:id", authMiddleware, updateReading);
router.delete("/:id", authMiddleware, deleteReading);

module.exports = router;
