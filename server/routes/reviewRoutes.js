const express = require('express');
const router = express.Router();
const {
  addOrUpdateReview,
  getMovieReviews,
  deleteReview,
} = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

// Public: get reviews for a movie
router.get('/movie/:movieId', getMovieReviews);

// Private: add/update and delete reviews
router.post('/', authMiddleware, addOrUpdateReview);
router.delete('/:reviewId', authMiddleware, deleteReview);

module.exports = router;
