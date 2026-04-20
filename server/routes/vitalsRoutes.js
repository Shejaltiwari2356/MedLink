const express = require('express');
const router = express.Router();
// IMPORTANT: Add getRecentVitals to the imports
const { addVitals, getVitals, deleteVitals, getRecentVitals } = require('../controllers/vitalsController');
const authMiddleware = require('../middlewares/authMiddleware');

// PROTECTED ROUTES (Require user to be logged in)
router.post('/add', authMiddleware, addVitals);
router.get('/', authMiddleware, getVitals);
router.delete('/:id', authMiddleware, deleteVitals);


// NEW/CRITICAL ROUTE FOR DASHBOARD FETCH
// This endpoint must be unprotected so the Dashboard can fetch data immediately after login
router.get('/recent/:uniqueId', getRecentVitals); 

module.exports = router;
