const Favorite = require('../models/favoriteModel');

// @desc    Add a movie to favorites (upsert)
// @route   POST /api/favorite OR POST /api/user/watchlist
// @access  Private (User)
const addFavorite = async (req, res) => {
  const userEmail = req.body.userEmail || req.body.email || (req.user && req.user.email);
  const movieId = req.body.movieId;
  const movieData = req.body.movieData || null;

  if (!userEmail || !movieId) {
    return res.status(400).json({ success: false, message: 'userEmail and movieId are required.' });
  }

  const favorite = await Favorite.findOneAndUpdate(
    { userEmail: userEmail.toLowerCase(), movieId: String(movieId) },
    { userEmail: userEmail.toLowerCase(), movieId: String(movieId), movieData },
    { upsert: true, new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Movie added to watchlist.',
    data: favorite,
  });
};

// @desc    Remove a movie from favorites
// @route   DELETE /api/favorite OR DELETE /api/user/watchlist/:email/:movieId
// @access  Private (User)
const removeFavorite = async (req, res) => {
  const userEmail = req.body.userEmail || req.body.email || req.params.email || (req.user && req.user.email);
  const movieId = req.body.movieId || req.params.movieId;

  if (!userEmail || !movieId) {
    return res.status(400).json({ success: false, message: 'userEmail and movieId are required.' });
  }

  const favorite = await Favorite.findOneAndDelete({
    userEmail: userEmail.toLowerCase(),
    movieId: String(movieId),
  });

  if (!favorite) {
    return res.status(404).json({ success: false, message: 'Item not found in watchlist.' });
  }

  res.status(200).json({ success: true, message: 'Movie removed from watchlist.' });
};

// @desc    Get all favorites / watchlist for a user (with movie details)
// @route   GET /api/favorite/:email OR GET /api/user/watchlist/:email
// @access  Private (User)
const getUserFavorites = async (req, res) => {
  const email = req.params.email || (req.user && req.user.email) || '';

  const favorites = await Favorite.find({ userEmail: email.toLowerCase() })
    .populate('movieId', 'movieName posterUrl releaseDate language genres duration certification')
    .sort({ createdAt: -1 });

  // Extract populated movie objects or embedded movieData for seamless UI rendering
  const watchlist = favorites
    .map((f) => {
      if (f.movieData) return f.movieData;
      if (f.movieId && typeof f.movieId === 'object' && f.movieId.movieName) return f.movieId;
      return { _id: f.movieId, id: f.movieId };
    })
    .filter(Boolean);

  res.status(200).json({
    success: true,
    data: watchlist,
    watchlist,
    favorites,
  });
};

module.exports = { addFavorite, removeFavorite, getUserFavorites };
