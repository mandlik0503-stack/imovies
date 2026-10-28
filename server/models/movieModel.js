const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    movieName: {
      type: String,
      required: [true, 'Movie name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    genres: {
      type: [String],
      default: [],
    },
    releaseDate: {
      type: Date,
      required: [true, 'Release date is required'],
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      trim: true,
    },
    duration: {
      type: String,
      required: [true, 'Duration is required'],
    },
    certification: {
      type: String,
      trim: true,
      default: 'U',
    },
    posterUrl: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Movie', movieSchema);
