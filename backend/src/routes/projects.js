const express = require('express');
const router = express.Router();
const { createProject, getAllProjects, getProjectById } = require('../controllers/projectController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', getAllProjects);
router.post('/', requireRole('admin', 'team_lead'), createProject);
router.get('/:id', getProjectById);

module.exports = router;
