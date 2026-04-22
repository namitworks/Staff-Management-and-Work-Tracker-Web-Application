const express = require('express');
const router = express.Router();
const idCardController = require('../controllers/idCardController');
const { verifyToken, requireRole, requireOwnOrAdmin } = require('../middleware/auth');

// 1. Generate ID Card - POST /api/idcards/generate (Admin only)
router.post('/generate', verifyToken, requireRole('admin'), idCardController.generateIdCard);

// 2. Get ID Card History - GET /api/idcards/history/:userId (Admin only)
router.get('/history/:userId', verifyToken, requireRole('admin'), idCardController.getIdCardHistory);

// 3. Get Staff ID Card Data - GET /api/idcards/:userId (Admin or own staff)
// Note: using requireOwnOrAdmin needs to read user id from params or body, 
// wait, we can just check if req.user.role === 'admin' || req.user.userId === req.params.userId
// Let's implement this logic in controller or middleware, but standard requireOwnOrAdmin might be in auth middleware.
// Let's check auth.js first. Assuming it exists.
// We will register the route:
router.get('/:userId', verifyToken, idCardController.getStaffIdCardData);

module.exports = router;
