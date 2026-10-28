const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['available', 'locked', 'booked'],
      default: 'available',
    },
    lockedBy: {
      type: String,
      default: null,
    },
    lockExpiry: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const showSchema = new mongoose.Schema(
  {
    adminEmail: {
      type: String,
      required: [true, 'Admin email is required'],
      lowercase: true,
      trim: true,
    },
    showId: {
      type: String,
      required: true,
      unique: true,
    },
    movieId: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Movie ID is required'],
    },
    theatreName: {
      type: String,
      required: [true, 'Theatre name is required'],
      trim: true,
    },
    showDate: {
      type: Date,
      required: [true, 'Show date is required'],
    },
    showTime: {
      type: String,
      required: [true, 'Show time is required'],
    },
    // tickets: { balcony: { A1: { status, lockedBy, lockExpiry }, ... }, middle: {...}, lower: {...} }
    tickets: {
      balcony: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      middle: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      lower: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Show', showSchema);
