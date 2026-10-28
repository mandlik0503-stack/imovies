const Review = require('../models/reviewModel');

// @desc    Add or update a review (upsert - one per user per movie)
// @route   POST /api/review
// @access  Private (User)
const addOrUpdateReview = async (req, res) => {
  const userEmail = req.body.userEmail || (req.user && req.user.email);
  const movieId = req.body.movieId;
  const rating = req.body.rating;
  const reviewText = req.body.reviewText || req.body.review || '';

  if (!userEmail || !movieId || rating == null) {
    return res.status(400).json({ success: false, message: 'userEmail, movieId, and rating are required.' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
  }

  const review = await Review.findOneAndUpdate(
    { userEmail: userEmail.toLowerCase(), movieId },
    { userEmail: userEmail.toLowerCase(), movieId, rating, reviewText },
    { upsert: true, new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Review saved successfully.',
    data: review,
  });
};

// @desc    Get all reviews for a movie
// @route   GET /api/review/movie/:movieId
// @access  Public
const getMovieReviews = async (req, res) => {
  const { movieId } = req.params;

  const reviews = await Review.find({ movieId }).sort({ createdAt: -1 });

  // Compute average rating
  const totalRatings = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = reviews.length > 0 ? (totalRatings / reviews.length).toFixed(1) : 0;

  // Returning array directly in data so frontend `.some()` or `.map()` works seamlessly
  res.status(200).json({
    success: true,
    data: reviews,
    reviews,
    averageRating: parseFloat(averageRating),
    totalReviews: reviews.length,
  });
};

// @desc    Delete a review (user can delete own)
// @route   DELETE /api/review/:reviewId
// @access  Private (User)
const deleteReview = async (req, res) => {
  const { reviewId } = req.params;
  const userEmail = req.user && req.user.email;

  const review = await Review.findById(reviewId);
  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found.' });
  }

  if (review.userEmail !== userEmail && !req.user.isAdmin) {
    return res.status(403).json({ success: false, message: 'Unauthorized to delete this review.' });
  }

  await review.deleteOne();
  res.status(200).json({ success: true, message: 'Review deleted successfully.' });
};

module.exports = { addOrUpdateReview, getMovieReviews, deleteReview };
