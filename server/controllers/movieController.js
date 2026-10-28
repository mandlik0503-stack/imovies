const Movie = require('../models/movieModel');

// @desc    Add a new movie
// @route   POST /api/movie
// @access  Admin
const addMovie = async (req, res) => {
  const { movieName, description, genres, releaseDate, language, duration, certification, posterUrl } = req.body;

  if (!movieName || !description || !releaseDate || !language || !duration) {
    return res.status(400).json({ success: false, message: 'Required fields: movieName, description, releaseDate, language, duration.' });
  }

  const movie = await Movie.create({
    movieName,
    description,
    genres: genres || [],
    releaseDate,
    language,
    duration,
    certification: certification || 'U',
    posterUrl: posterUrl || '',
  });

  res.status(201).json({ success: true, message: 'Movie added successfully.', data: movie });
};

// @desc    Get all movies with optional filters
// @route   GET /api/movie?genre=&language=
// @access  Public
const getAllMovies = async (req, res) => {
  const filter = {};

  if (req.query.genre) {
    filter.genres = { $in: [new RegExp(req.query.genre, 'i')] };
  }
  if (req.query.language) {
    filter.language = new RegExp(req.query.language, 'i');
  }

  const movies = await Movie.find(filter).sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: movies });
};

// @desc    Get single movie by ID
// @route   GET /api/movie/:id
// @access  Public
const getMovieById = async (req, res) => {
  const movie = await Movie.findById(req.params.id);

  if (!movie) {
    return res.status(404).json({ success: false, message: 'Movie not found.' });
  }

  res.status(200).json({ success: true, data: movie });
};

// @desc    Update a movie
// @route   PUT /api/movie/:id
// @access  Admin
const updateMovie = async (req, res) => {
  const movie = await Movie.findById(req.params.id);

  if (!movie) {
    return res.status(404).json({ success: false, message: 'Movie not found.' });
  }

  const updatedMovie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, message: 'Movie updated successfully.', data: updatedMovie });
};

// @desc    Delete a movie
// @route   DELETE /api/movie/:id
// @access  Admin
const deleteMovie = async (req, res) => {
  const movie = await Movie.findById(req.params.id);

  if (!movie) {
    return res.status(404).json({ success: false, message: 'Movie not found.' });
  }

  await movie.deleteOne();

  res.status(200).json({ success: true, message: 'Movie deleted successfully.' });
};

// @desc    Search movies by name
// @route   GET /api/movie/search?q=
// @access  Public
const searchMovies = async (req, res) => {
  const query = req.query.q || '';

  if (!query.trim()) {
    return res.status(400).json({ success: false, message: 'Search query is required.' });
  }

  const movies = await Movie.find({
    movieName: new RegExp(query, 'i'),
  }).sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: movies });
};

module.exports = { addMovie, getAllMovies, getMovieById, updateMovie, deleteMovie, searchMovies };
