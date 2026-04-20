// server/controllers/profileController.js

const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/profile/me
// @access  Private
exports.getProfile = async (req, res) => {
    try {
        // req.user.uniqueId is attached by the authMiddleware
        const user = await User.findOne({ uniqueId: req.user.uniqueId }).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update user profile
// @route   PUT /api/profile/me
// @access  Private
exports.updateProfile = async (req, res) => {
    // Destructure all the fields you want to be updatable from the request body
    const { firstName, lastName, bloodGroup, contact, address } = req.body;

    // Build profile object dynamically based on what was sent
    const profileFields = {};
    if (firstName) profileFields.firstName = firstName;
    if (lastName) profileFields.lastName = lastName;
    if (bloodGroup) profileFields.bloodGroup = bloodGroup;
    if (contact) profileFields.contact = contact;
    if (address) profileFields.address = address;

    try {
        let user = await User.findOne({ uniqueId: req.user.uniqueId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find the user by their uniqueId and update with the new fields
        user = await User.findOneAndUpdate(
            { uniqueId: req.user.uniqueId },
            { $set: profileFields },
            { new: true } // This option returns the document after it has been updated
        ).select('-password');

        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};