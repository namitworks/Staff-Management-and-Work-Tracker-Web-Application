const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  toggleChecklistItem
} = require('../controllers/taskController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', requireRole('admin', 'team_lead'), createTask);
router.put('/:id', updateTask);
router.put('/:id/status', updateTaskStatus);
router.delete('/:id', requireRole('admin', 'team_lead'), deleteTask);
router.put('/checklist/:id', toggleChecklistItem);

module.exports = router;
