const mongoose = require('mongoose');

const theatreSchema = new mongoose.Schema(
  {
    theatreName: {
      type: String,
      required: [true, 'Theatre name is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    balconySeatPrice: {
      type: Number,
      required: [true, 'Balcony seat price is required'],
      min: 0,
    },
    middleSeatPrice: {
      type: Number,
      required: [true, 'Middle seat price is required'],
      min: 0,
    },
    lowerSeatPrice: {
      type: Number,
      required: [true, 'Lower seat price is required'],
      min: 0,
    },
    // Seat layout stored as a plain object: { A1: { total: 1, available: 1 }, ... }
    balconySeats: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    middleSeats: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lowerSeats: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Theatre', theatreSchema);
