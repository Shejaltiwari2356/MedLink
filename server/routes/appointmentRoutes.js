const express = require("express");
const router = express.Router();
const {
    bookAppointment,
    getDoctorAppointments,
    getPatientAppointments,
    completeAppointment,
    payForAppointment,
    getAvailableSlots, 
    getLatestUpcomingAppointment,
    getDoctorTodayAppointments, 
    // 🌟 Import the new function
} = require("../controllers/appointmentController");

// =================== APPOINTMENT ROUTES ====================

// Get available slots for a specific doctor
router.get("/slots/:doctorId", getAvailableSlots);

// Patient books an appointment
router.post("/book", bookAppointment);

// Doctor views all appointments
router.get("/doctor/:doctorId", getDoctorAppointments);
// 🚨 NEW ROUTE: Doctor views ONLY today's appointments (Must be first)
router.get("/doctor/today/:doctorId", getDoctorTodayAppointments);
// Patient views all appointments
router.get("/patient/:patientId", getPatientAppointments);

// 🚨 NEW ROUTE: Fetch the single nearest upcoming appointment for the dashboard
router.get("/patient/latest-upcoming/:patientId", getLatestUpcomingAppointment); 

router.put("/:id/complete", completeAppointment);

// Patient pays for appointment
router.post("/:id/pay", payForAppointment);

module.exports = router;


