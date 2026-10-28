const express = require('express');
const router = express.Router();
const {
  addFavorite,
  removeFavorite,
  getUserFavorites,
} = require('../controllers/favoriteController');
const authMiddleware = require('../middleware/authMiddleware');

// Watchlist routes
router.get('/:email', authMiddleware, getUserFavorites);
router.post('/', authMiddleware, addFavorite);
router.delete('/', authMiddleware, removeFavorite);
router.delete('/:email/:movieId', authMiddleware, removeFavorite);

module.exports = router;
