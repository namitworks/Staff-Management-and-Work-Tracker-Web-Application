const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} = require('../controllers/projectController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', requireRole('admin'), createProject);
router.put('/:id', requireRole('admin'), updateProject);
router.delete('/:id', requireRole('admin'), deleteProject);

module.exports = router;
