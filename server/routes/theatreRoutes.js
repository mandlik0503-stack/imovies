const express = require('express');
const router = express.Router();
const {
  addTheatre,
  getAllTheatres,
  getTheatreById,
  updateTheatre,
  deleteTheatre,
} = require('../controllers/theatreController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Public routes
router.get('/', getAllTheatres);
router.get('/:id', getTheatreById);

// Admin routes
router.post('/', authMiddleware, adminMiddleware, addTheatre);
router.put('/:id', authMiddleware, adminMiddleware, updateTheatre);
router.delete('/:id', authMiddleware, adminMiddleware, deleteTheatre);

module.exports = router;
