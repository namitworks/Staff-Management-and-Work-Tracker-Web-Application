const express = require('express');
const router = express.Router();
const { getAllTasks, createTask, updateTaskStatus, toggleChecklistItem } = require('../controllers/taskController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', getAllTasks);
router.post('/', requireRole('admin', 'team_lead'), createTask);
router.put('/:id/status', updateTaskStatus);
router.put('/checklist/:id', toggleChecklistItem);

module.exports = router;
