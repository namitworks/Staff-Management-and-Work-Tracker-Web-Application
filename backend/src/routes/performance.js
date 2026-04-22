const express = require('express');
const router = express.Router();
const {
  addNote,
  getPerformanceByUser,
  getPerformanceSummary,
  updateNote,
  deleteNote
} = require('../controllers/performanceController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.post('/', requireRole('admin'), addNote);
router.get('/summary/:userId', getPerformanceSummary);
router.get('/:userId', getPerformanceByUser);
router.put('/:id', requireRole('admin'), updateNote);
router.delete('/:id', requireRole('admin'), deleteNote);

module.exports = router;
