const express = require('express');
const router = express.Router();
const bloodReportController = require('../controllers/bloodReportController');
const authMiddleware = require('../middlewares/authMiddleware'); // Import auth middleware for delete

// Upload report
router.post('/upload', bloodReportController.uploadReport, bloodReportController.addReport);

// Get all reports for a user
router.get('/my-reports/:uniqueId', bloodReportController.getReports);

// Download specific report by ID
router.get('/download/:id', bloodReportController.getReportFile);

// Preview specific report by ID
router.get('/preview/:id', bloodReportController.previewReportFile); // <-- ADD THIS

// Delete a report by ID
router.delete('/:id', authMiddleware, bloodReportController.deleteReport); // <-- ADD THIS

module.exports = router;