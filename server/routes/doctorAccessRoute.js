const express = require('express');
const router = express.Router();
const { generateOtp, verifyOtpAndGetData } = require('../controllers/doctorAccessController');
const authMiddleware = require('../middlewares/authMiddleware'); // Protect these routes

// Middleware to check if the user is a doctor
const isDoctor = (req, res, next) => {
    if (req.user && req.user.role === 'doctor') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Doctors only.' });
    }
};

router.post('/generate-otp', authMiddleware, isDoctor, generateOtp);
router.post('/verify-otp', authMiddleware, isDoctor, verifyOtpAndGetData);

module.exports = router;