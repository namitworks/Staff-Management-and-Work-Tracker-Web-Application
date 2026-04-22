const express = require('express');
const router = express.Router();
const idCardController = require('../controllers/idCardController');
const { verifyToken, requireRole } = require('../middleware/auth');

// 1. Request ID Card - POST /api/idcards/request (Staff own request)
router.post('/request', verifyToken, idCardController.requestIdCard);

// 2. Generate ID Card - POST /api/idcards/generate (Admin only)
router.post('/generate', verifyToken, requireRole('admin'), idCardController.generateIdCard);

// 3. Reject ID Card Request - PUT /api/idcards/:userId/reject (Admin only)
router.put('/:userId/reject', verifyToken, requireRole('admin'), idCardController.rejectIdCardRequest);

// 4. Get ID Card History - GET /api/idcards/history/:userId (Admin/own access)
router.get('/history/:userId', verifyToken, idCardController.getIdCardHistory);

// 5. Get Staff ID Card Data - GET /api/idcards/:userId (Admin/own access)
router.get('/:userId', verifyToken, idCardController.getStaffIdCardData);

module.exports = router;
