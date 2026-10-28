const express = require('express');
const router = express.Router();
const {
  lockSeats,
  confirmBooking,
  getUserBookings,
  getAllBookings,
  cancelBooking,
  releaseLock,
} = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// User protected routes
router.post('/lock', authMiddleware, lockSeats);
router.post('/confirm', authMiddleware, confirmBooking);
router.post('/release', authMiddleware, releaseLock);
router.get('/user/:email', authMiddleware, getUserBookings);
router.put('/cancel/:bookingId', authMiddleware, cancelBooking);

// Admin routes (supports both / and /all)
router.get('/all', authMiddleware, adminMiddleware, getAllBookings);
router.get('/', authMiddleware, adminMiddleware, getAllBookings);

module.exports = router;
