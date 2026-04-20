
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware'); // Assumed authentication middleware
const consultController = require('../controllers/instantConsultationController');

// PATIENT ROUTES
router.get('/live-doctors', auth, consultController.getLiveDoctors);
router.post('/initiate', auth, consultController.initiateInstantConsultation);
router.post('/:sessionId/confirm-payment', auth, consultController.confirmPaymentAndAlertDoctor);

// DOCTOR/GENERAL ROUTES
router.get('/status', auth, consultController.getInstantStatus); // 🔑 NEW: Route to fetch current instant status
router.post('/toggle-instant-status', auth, consultController.toggleInstantStatus);
router.post('/:sessionId/join-doctor', auth, consultController.doctorJoinsCall);
router.post('/:sessionId/end', auth, consultController.endConsultation);

module.exports = router;

