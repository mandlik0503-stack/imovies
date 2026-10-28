const express = require('express');
const router = express.Router();
const {
  addShow,
  getAllShows,
  getShowById,
  getShowsByMovieId,
  deleteShow,
  cleanupExpiredLocks,
} = require('../controllers/showController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Public routes
router.get('/', getAllShows);
router.get('/movie/:movieId', getShowsByMovieId);
router.get('/:id', getShowById);

// Admin routes
router.post('/', authMiddleware, adminMiddleware, addShow);
router.delete('/:id', authMiddleware, adminMiddleware, deleteShow);

// Admin utility: cleanup expired locks
router.post('/cleanup/locks', authMiddleware, adminMiddleware, cleanupExpiredLocks);

module.exports = router;
