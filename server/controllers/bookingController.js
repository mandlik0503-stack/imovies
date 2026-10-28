const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Show = require('../models/showModel');
const Booking = require('../models/bookingModel');
const emailService = require('../services/emailService');
const { findShowByIdOrShowId } = require('./showController');
const { isShowExpired } = require('../utils/timeUtils');

// Helper: detect tier and raw seat ID from seat identifier
const parseSeat = (seatId, fallbackTier) => {
  if (!seatId) return { tierKey: 'middle', rawId: '' };
  const str = String(seatId).trim();
  
  if (str.startsWith('B-')) return { tierKey: 'balcony', rawId: str.substring(2) };
  if (str.startsWith('M-')) return { tierKey: 'middle', rawId: str.substring(2) };
  if (str.startsWith('L-')) return { tierKey: 'lower', rawId: str.substring(2) };

  if (fallbackTier) {
    const t = fallbackTier.toLowerCase();
    if (['balcony', 'middle', 'lower'].includes(t)) {
      return { tierKey: t, rawId: str.replace(/^[BML]-/, '') };
    }
  }

  // Row letter based heuristic:
  // Nearest to screen: Lower (A-C), Middle (D-G), Furthest: Balcony (H-K)
  const row = str.charAt(0).toUpperCase();
  if (['A', 'B', 'C'].includes(row)) return { tierKey: 'lower', rawId: str };
  if (['D', 'E', 'F', 'G'].includes(row)) return { tierKey: 'middle', rawId: str };
  return { tierKey: 'balcony', rawId: str };
};

// @desc    Lock seats temporarily (10 min) for checkout
// @route   POST /api/bookings/lock
// @access  Private (User)
const lockSeats = async (req, res) => {
  const showId = req.body.showId;
  const seats = req.body.selectedSeats || req.body.seats || [];
  const userEmail = req.body.userEmail || (req.user && req.user.email);
  const explicitTier = req.body.tier;

  if (!showId || !seats.length || !userEmail) {
    return res.status(400).json({
      success: false,
      message: 'showId, selectedSeats/seats, and userEmail are required.',
    });
  }

  const show = await findShowByIdOrShowId(showId, req.body.showDetails || req.body);
  if (!show) {
    return res.status(404).json({
      success: false,
      message: 'Show not found. Please refresh and select an available showtime.',
    });
  }

  // Real-Time Showtime Expiry Validation (reject past/started showtimes)
  const expiryCheck = isShowExpired(show.showDate, show.showTime);
  if (expiryCheck.expired) {
    return res.status(400).json({
      success: false,
      message: expiryCheck.message || 'This show has already started or ended. Online booking is closed.',
    });
  }

  // Ensure tickets object exists
  if (!show.tickets) {
    show.tickets = { balcony: {}, middle: {}, lower: {} };
  }

  const now = new Date();

  // Validate availability for each seat
  for (const seat of seats) {
    const { tierKey, rawId } = parseSeat(seat, explicitTier);
    if (!show.tickets[tierKey]) show.tickets[tierKey] = {};
    const seatRecord = show.tickets[tierKey][rawId];

    if (seatRecord) {
      if (seatRecord.status === 'booked') {
        return res.status(409).json({
          success: false,
          message: `Seat ${seat} is already booked.`,
        });
      }

      if (seatRecord.status === 'locked' && seatRecord.lockedBy !== userEmail) {
        if (!seatRecord.lockExpiry || new Date(seatRecord.lockExpiry) > now) {
          return res.status(409).json({
            success: false,
            message: `Seat ${seat} is currently reserved by another customer.`,
          });
        }
      }
    }
  }

  const lockExpiry = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

  // Lock seats
  for (const seat of seats) {
    const { tierKey, rawId } = parseSeat(seat, explicitTier);
    if (!show.tickets[tierKey]) show.tickets[tierKey] = {};
    show.tickets[tierKey][rawId] = {
      status: 'locked',
      lockedBy: userEmail,
      lockExpiry,
    };
  }

  show.markModified('tickets');
  await show.save();

  const lockId = `${show.showId}_${userEmail}_${Date.now()}`;

  res.status(200).json({
    success: true,
    message: 'Seats locked successfully for 10 minutes.',
    data: {
      lockId,
      showId: show.showId,
      lockExpiry,
      lockedSeats: seats,
    },
    lockId,
    lockExpiry,
  });
};

// @desc    Confirm booking after payment
// @route   POST /api/bookings/confirm
// @access  Private (User)
const confirmBooking = async (req, res) => {
  const showId = req.body.showId;
  const seats = req.body.selectedSeats || req.body.seats || [];
  const userEmail = req.body.userEmail || (req.user && req.user.email);
  const totalAmount = req.body.totalAmount;
  const explicitTier = req.body.tier;

  if (!showId || !seats.length || !userEmail || totalAmount == null) {
    return res.status(400).json({
      success: false,
      message: 'showId, selectedSeats/seats, userEmail, and totalAmount are required.',
    });
  }

  const show = await findShowByIdOrShowId(showId, req.body.showDetails || req.body);
  if (!show) {
    return res.status(404).json({ success: false, message: 'Show not found. Please re-select your show.' });
  }

  // Real-Time Showtime Expiry Validation (reject past/started showtimes)
  const expiryCheck = isShowExpired(show.showDate, show.showTime);
  if (expiryCheck.expired) {
    return res.status(400).json({
      success: false,
      message: expiryCheck.message || 'This show has already started or ended. Online booking is closed.',
    });
  }

  if (!show.tickets) {
    show.tickets = { balcony: {}, middle: {}, lower: {} };
  }

  const now = new Date();

  // Verify seat lock or availability
  for (const seat of seats) {
    const { tierKey, rawId } = parseSeat(seat, explicitTier);
    const seatRecord = show.tickets[tierKey] && show.tickets[tierKey][rawId];

    if (seatRecord) {
      if (seatRecord.status === 'booked') {
        return res.status(409).json({
          success: false,
          message: `Seat ${seat} is already booked.`,
        });
      }
      if (seatRecord.status === 'locked' && seatRecord.lockedBy !== userEmail) {
        if (!seatRecord.lockExpiry || new Date(seatRecord.lockExpiry) > now) {
          return res.status(409).json({
            success: false,
            message: `Seat ${seat} is locked by another customer.`,
          });
        }
      }
    }
  }

  // Mark all seats as booked
  for (const seat of seats) {
    const { tierKey, rawId } = parseSeat(seat, explicitTier);
    if (!show.tickets[tierKey]) show.tickets[tierKey] = {};
    show.tickets[tierKey][rawId] = {
      status: 'booked',
      lockedBy: userEmail,
      lockExpiry: null,
    };
  }

  show.markModified('tickets');
  await show.save();

  // Create Booking
  const bookingId = uuidv4();
  const detectedTier = explicitTier || parseSeat(seats[0]).tierKey;

  const booking = await Booking.create({
    bookingId,
    userEmail: userEmail.toLowerCase(),
    showId: show.showId,
    movieId: show.movieId,
    theatreName: show.theatreName,
    selectedSeats: seats,
    totalAmount: Number(totalAmount),
    paymentStatus: 'Completed',
    tier: detectedTier.charAt(0).toUpperCase() + detectedTier.slice(1),
  });

  const populated = await Booking.findById(booking._id).populate(
    'movieId',
    'movieName posterUrl releaseDate language duration'
  );

  // Trigger Brevo confirmation email
  if (userEmail) {
    emailService
      .sendBookingConfirmationEmail(userEmail, {
        bookingId: booking.bookingId,
        movieName: (populated && populated.movieId && populated.movieId.movieName) || show.theatreName || 'Movie Ticket',
        theatreName: show.theatreName,
        showDate: show.showDate,
        showTime: show.showTime,
        seats,
        totalAmount: Number(totalAmount),
        tier: detectedTier.charAt(0).toUpperCase() + detectedTier.slice(1),
        paymentMethod: 'Online Payment',
      })
      .catch((err) => console.error('[Brevo Booking Confirm Email Error]:', err.message));
  }

  res.status(201).json({
    success: true,
    message: 'Booking confirmed successfully! Enjoy your movie.',
    data: populated || booking,
    booking: populated || booking,
  });
};

// @desc    Get all bookings for a user
// @route   GET /api/bookings/user/:email
// @access  Private (User)
const getUserBookings = async (req, res) => {
  const email = (req.params.email || (req.user && req.user.email) || '').toLowerCase();

  const bookings = await Booking.find({ userEmail: email })
    .populate('movieId', 'movieName posterUrl releaseDate language duration')
    .sort({ createdAt: -1 });

  const enriched = bookings.map((b) => {
    const obj = b.toObject();
    obj.status = b.paymentStatus;
    obj.movieName = (b.movieId && b.movieId.movieName) || b.movieName || 'Movie Ticket';
    obj.seats = b.selectedSeats;
    return obj;
  });

  res.status(200).json({ success: true, data: enriched });
};

// @desc    Get all platform bookings (Admin)
// @route   GET /api/bookings OR GET /api/bookings/all
// @access  Admin
const getAllBookings = async (req, res) => {
  const bookings = await Booking.find()
    .populate('movieId', 'movieName posterUrl releaseDate language')
    .sort({ createdAt: -1 });

  const enriched = bookings.map((b) => {
    const obj = b.toObject();
    obj.status = b.paymentStatus;
    obj.movieName = (b.movieId && b.movieId.movieName) || b.movieName || 'Movie Ticket';
    obj.seats = b.selectedSeats;
    return obj;
  });

  res.status(200).json({ success: true, data: enriched });
};

// @desc    Cancel a booking and release seats
// @route   PUT /api/bookings/cancel/:bookingId
// @access  Private (User / Admin)
const cancelBooking = async (req, res) => {
  const { bookingId } = req.params;

  const booking = await Booking.findOne({
    $or: [{ bookingId }, { _id: mongoose.Types.ObjectId.isValid(bookingId) ? bookingId : null }],
  });

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found.' });
  }

  if (booking.paymentStatus === 'Cancelled') {
    return res.status(400).json({ success: false, message: 'Booking is already cancelled.' });
  }

  // Release seats in show back to available
  const show = await findShowByIdOrShowId(booking.showId);
  if (show && show.tickets) {
    for (const seat of booking.selectedSeats) {
      const { tierKey, rawId } = parseSeat(seat, booking.tier);
      if (show.tickets[tierKey] && show.tickets[tierKey][rawId]) {
        show.tickets[tierKey][rawId] = {
          status: 'available',
          lockedBy: null,
          lockExpiry: null,
        };
      }
    }
    show.markModified('tickets');
    await show.save();
  }

  booking.paymentStatus = 'Cancelled';
  await booking.save();

  // Trigger Brevo cancellation status update email
  if (booking.userEmail) {
    emailService
      .sendBookingStatusUpdateEmail(booking.userEmail, {
        bookingId: booking.bookingId || booking._id,
        movieName: booking.movieName,
        theatreName: booking.theatreName,
        status: 'Cancelled',
        reason: 'Requested by user',
        refundAmount: booking.totalAmount,
      })
      .catch((err) => console.error('[Brevo Cancel Email Error]:', err.message));
  }

  res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully.',
    data: booking,
  });
};

// @desc    Release locked seats
// @route   POST /api/bookings/release
// @access  Private (User)
const releaseLock = async (req, res) => {
  const { showId, lockId, userEmail, tier } = req.body;
  const seats = req.body.selectedSeats || req.body.seats || [];

  let show = null;
  if (showId) {
    show = await findShowByIdOrShowId(showId);
  } else if (lockId && lockId.includes('_')) {
    const parts = lockId.split('_');
    show = await findShowByIdOrShowId(parts[0]);
  }

  if (show && show.tickets) {
    const email = userEmail || (req.user && req.user.email);
    const now = new Date();

    if (seats.length > 0) {
      for (const seat of seats) {
        const { tierKey, rawId } = parseSeat(seat, tier);
        if (show.tickets[tierKey] && show.tickets[tierKey][rawId]) {
          const rec = show.tickets[tierKey][rawId];
          if (rec.status === 'locked' && (!email || rec.lockedBy === email)) {
            show.tickets[tierKey][rawId] = { status: 'available', lockedBy: null, lockExpiry: null };
          }
        }
      }
    } else if (email) {
      // Release all seats locked by this email
      ['balcony', 'middle', 'lower'].forEach((t) => {
        if (show.tickets[t]) {
          Object.keys(show.tickets[t]).forEach((rawId) => {
            const rec = show.tickets[t][rawId];
            if (rec && rec.status === 'locked' && rec.lockedBy === email) {
              show.tickets[t][rawId] = { status: 'available', lockedBy: null, lockExpiry: null };
            }
          });
        }
      });
    }

    show.markModified('tickets');
    await show.save();
  }

  res.status(200).json({ success: true, message: 'Seats released successfully.' });
};

module.exports = {
  lockSeats,
  confirmBooking,
  getUserBookings,
  getAllBookings,
  cancelBooking,
  releaseLock,
};
