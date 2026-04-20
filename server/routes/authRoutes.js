const express = require("express");
const router = express.Router();
const { register, login, getDoctors, getProfileByUniqueId } = require("../controllers/authController");

// Register
router.post("/register", register);

// Login
router.post("/login", login);

//List of Doctors
router.get("/doctors", getDoctors);

router.get("/:uniqueId", getProfileByUniqueId);

module.exports = router;