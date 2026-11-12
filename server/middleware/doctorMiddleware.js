
const doctorMiddleware = (req, res, next) => {
    // Check whether the user is authenticated as a doctor
    if (!req.user || req.user.role !== "doctor") {
        return res.status(403).json({
            message: "Access denied. Doctor account required."
        });
    }

    next();
};

module.exports = doctorMiddleware;
