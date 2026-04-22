const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Protected routes (Admin / Team Lead can view stats)
router.get('/stats', verifyToken, requireRole('admin', 'team_lead'), getDashboardStats);

module.exports = router;
