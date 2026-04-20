// server/routes/profileRoutes.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { getProfile, updateProfile } = require('../controllers/profileController');

// @route   GET api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', authMiddleware, getProfile);

// @route   PUT api/profile/me
// @desc    Update current user's profile
// @access  Private
router.put('/me', authMiddleware, updateProfile);

module.exports = router;