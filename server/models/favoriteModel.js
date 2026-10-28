const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: [true, 'User email is required'],
      lowercase: true,
      trim: true,
    },
    movieId: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Movie ID is required'],
    },
    movieData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound unique index: one favorite entry per user per movie
favoriteSchema.index({ userEmail: 1, movieId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
