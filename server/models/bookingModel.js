const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
    },
    userEmail: {
      type: String,
      required: [true, 'User email is required'],
      lowercase: true,
      trim: true,
    },
    showId: {
      type: String,
      required: [true, 'Show ID is required'],
    },
    movieId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    movieName: {
      type: String,
      default: '',
    },
    theatreName: {
      type: String,
      required: true,
      trim: true,
    },
    showDate: {
      type: Date,
      default: null,
    },
    showTime: {
      type: String,
      default: '',
    },
    selectedSeats: {
      type: [String],
      required: true,
      default: [],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Cancelled'],
      default: 'Completed',
    },
    paymentMethod: {
      type: String,
      default: 'Razorpay',
    },
    tier: {
      type: String,
      default: 'Balcony',
    },
    razorpayOrderId: {
      type: String,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
