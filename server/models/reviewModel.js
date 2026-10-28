const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    reviewText: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// Compound unique index: one review per user per movie
reviewSchema.index({ userEmail: 1, movieId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
