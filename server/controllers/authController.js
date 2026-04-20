const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate unique ID based on role
async function generateUniqueId(role) {
  let prefix = role === "doctor" ? "DOC" : "PAT";
  let lastUser = await User.findOne({ role }).sort({ createdAt: -1 });

  if (!lastUser) {
    return `${prefix}-10000`;
  } else {
    let lastIdNum = parseInt(lastUser.uniqueId.split("-")[1]);
    return `${prefix}-${lastIdNum + 1}`;
  }
}

// Registration stays the same, no change needed
exports.register = async (req, res) => {
    try {
        const { email, role, password } = req.body;

        // --- 1. Validation ---
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already registered" });

        if (!role) return res.status(400).json({ message: "Role is required for registration." });
        if (!password) return res.status(400).json({ message: "Password is required." });

        // --- 2. Preparation ---
        const uniqueId = await generateUniqueId(role); // Assumes you have this helper function
        const hashedPassword = await bcrypt.hash(password, 10); // Assumes you use bcrypt

        // --- 3. User Creation (The Fix) ---
        // 🚨 FIX: Use req.body (spread operator) to include all fields 
        // (including specialization, experience, and availability for doctors)
        // Then, explicitly override the uniqueId and the password.
        const user = new User({
            ...req.body, // Includes all fields sent from the frontend (common + doctor-specific)
            uniqueId,    // Overrides the uniqueId
            password: hashedPassword // Overrides the plain text password
        });
        // console.log(user);
        // Mongoose will automatically:
        // - Save doctor-specific fields if 'role' is 'doctor'.
        // - Ignore doctor-specific fields if 'role' is 'patient'.

        await user.save();

        res.status(201).json({ message: "User registered successfully", uniqueId });
    } catch (error) {
        // Handle common errors like Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: "Validation failed: " + messages.join(', ') });
        }
        
        console.error("Server error during registration:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Login
exports.login = async (req, res) => {
  try {
    const { uniqueId, password } = req.body;

    const user = await User.findOne({ uniqueId });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // ✅ Use uniqueId in token, not _id
    const payload = {
      uniqueId: user.uniqueId,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });

    res.json({ message: "Login successful", token, uniqueId: user.uniqueId });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


// Get all doctors
exports.getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor" }).select("uniqueId firstName lastName degree specialization experience fees contact");
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch doctors", error: error.message });
  }
};


// Handles fetching profile data for both Doctor and Patient by their uniqueId
exports.getProfileByUniqueId = async (req, res) => {
    try {
        const uniqueId = req.params.uniqueId;
        const user = await User.findOne({ uniqueId }).select("-password");

        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: `User with ID ${uniqueId} not found.`,
            });
        }

        // --- Prepare COMMON profile data ---
        let profileData = {
            id: user.uniqueId,
            role: user.role,
            name: `${user.firstName} ${user.lastName}`,
            // dob is passed as a Date object or string from MongoDB
            dob: user.dob, 
        };

        // --- Add Patient-Specific Fields (FIX: Ensure these fields are explicitly added) ---
        if (user.role === 'patient') {
            profileData = {
                ...profileData,
                // These fields are now explicitly included for the patient role
                gender: user.gender || 'N/A', 
                bloodGroup: user.bloodGroup || 'N/A', 
            };
        }

        // --- Add Doctor-Specific Fields ---
        if (user.role === 'doctor') {
            profileData = {
                ...profileData,
                license: user.uniqueId,
                degree: user.degree || 'N/A',
                specialization: user.specialization || 'N/A',
            };
        }

        res.status(200).json({
            status: 'success',
            data: profileData,
        });

    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};