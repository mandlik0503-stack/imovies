const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Show = require('../models/showModel');
const Movie = require('../models/movieModel');
const Theatre = require('../models/theatreModel');

// Canonical default theatres if DB is unseeded
const CANONICAL_THEATRES = [
  {
    theatreName: 'PVR IMAX Phoenix MarketCity',
    location: 'Kurla West, Mumbai',
    balconySeatPrice: 450,
    middleSeatPrice: 320,
    lowerSeatPrice: 200,
  },
  {
    theatreName: "PVR Director's Cut Ambience Mall",
    location: 'Vasant Kunj, New Delhi',
    balconySeatPrice: 550,
    middleSeatPrice: 380,
    lowerSeatPrice: 240,
  },
  {
    theatreName: 'INOX Megaplex Forum Mall',
    location: 'Koramangala, Bengaluru',
    balconySeatPrice: 400,
    middleSeatPrice: 290,
    lowerSeatPrice: 180,
  },
];

const DEFAULT_TIMES = ['10:00 AM', '01:30 PM', '05:00 PM', '08:30 PM'];

// Helper: generate seat layout
const generateSeatLayout = (rows, seatsPerRow) => {
  const layout = {};
  for (const row of rows) {
    for (let i = 1; i <= seatsPerRow; i++) {
      layout[`${row}${i}`] = { total: 1, available: 1 };
    }
  }
  return layout;
};

// Helper: build tickets object from theatre seats
const buildTicketsFromTheatre = (theatre) => {
  const tickets = { balcony: {}, middle: {}, lower: {} };

  const populateTier = (tierName, source, fallbackRows) => {
    if (source && typeof source === 'object' && Object.keys(source).length > 0) {
      for (const seatId of Object.keys(source)) {
        tickets[tierName][seatId] = {
          status: 'available',
          lockedBy: null,
          lockExpiry: null,
        };
      }
    } else if (fallbackRows) {
      fallbackRows.forEach((row) => {
        for (let i = 1; i <= 10; i++) {
          tickets[tierName][`${row}${i}`] = {
            status: 'available',
            lockedBy: null,
            lockExpiry: null,
          };
        }
      });
    }
  };

  populateTier('lower', theatre?.lowerSeats, ['A', 'B', 'C']);
  populateTier('middle', theatre?.middleSeats, ['D', 'E', 'F', 'G']);
  populateTier('balcony', theatre?.balconySeats, ['H', 'I', 'J', 'K']);

  return tickets;
};

// Helper: provision a missing dynamic show on the fly
const findOrCreateDynamicShow = async (id, fallbackData = {}) => {
  if (!id) return null;

  // 1. Try direct find by ObjectId or showId
  if (mongoose.Types.ObjectId.isValid(id)) {
    const s = await Show.findById(id).populate('movieId');
    if (s) return s;
  }
  let s = await Show.findOne({ showId: id }).populate('movieId');
  if (s) return s;

  // 2. Resolve parameters from id slug or fallbackData
  let movieId = fallbackData.movieId;
  let theatreName = fallbackData.theatreName || fallbackData.theatre;
  let showDate = fallbackData.showDate || fallbackData.date;
  let showTime = fallbackData.showTime || fallbackData.time;

  // If slug is structured like tmdb_872585_1_2_3 or show_872585_d1_t2_s3
  if (typeof id === 'string') {
    const parts = id.split('_');
    if (parts.length >= 4) {
      if (!movieId) movieId = parts[1];

      const dayIdx = parseInt(parts[2].replace(/\D/g, ''), 10) || 0;
      const tIdx = parseInt(parts[3].replace(/\D/g, ''), 10) || 0;
      const timeIdx = parts[4] ? parseInt(parts[4].replace(/\D/g, ''), 10) || 0 : 0;

      if (!showDate) {
        const d = new Date();
        d.setDate(d.getDate() + dayIdx);
        d.setHours(0, 0, 0, 0);
        showDate = d;
      }

      if (!theatreName) {
        const tObj = CANONICAL_THEATRES[tIdx % CANONICAL_THEATRES.length];
        theatreName = tObj.theatreName;
      }

      if (!showTime) {
        showTime = DEFAULT_TIMES[timeIdx % DEFAULT_TIMES.length];
      }
    }
  }

  // Fallbacks if still not specified
  if (!movieId) movieId = 'tmdb_movie';
  if (!theatreName) theatreName = CANONICAL_THEATRES[0].theatreName;
  if (!showTime) showTime = '07:30 PM';
  if (!showDate) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    showDate = d;
  } else {
    showDate = new Date(showDate);
    if (isNaN(showDate.getTime())) {
      showDate = new Date();
      showDate.setHours(0, 0, 0, 0);
    }
  }

  // Check if a show with composite key already exists in DB
  const startOfDay = new Date(showDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  s = await Show.findOne({
    movieId: String(movieId),
    theatreName,
    showTime,
    showDate: { $gte: startOfDay, $lt: endOfDay },
  });
  if (s) return s;

  // Find or create theatre to build tickets
  let theatre = await Theatre.findOne({ theatreName });
  if (!theatre) {
    theatre = await Theatre.findOne();
    if (!theatre) {
      theatre = await Theatre.create({
        ...CANONICAL_THEATRES[0],
        lowerSeats: generateSeatLayout(['A', 'B', 'C'], 10),
        middleSeats: generateSeatLayout(['D', 'E', 'F', 'G'], 10),
        balconySeats: generateSeatLayout(['H', 'I', 'J', 'K'], 10),
      });
    }
  }

  const tickets = buildTicketsFromTheatre(theatre);

  // Create and persist show
  try {
    s = await Show.create({
      adminEmail: 'admin@imovies.com',
      showId: id,
      movieId: String(movieId),
      theatreName,
      showDate,
      showTime,
      tickets,
    });
    return s;
  } catch (err) {
    return await Show.findOne({ showId: id }) || await Show.findOne({
      movieId: String(movieId),
      theatreName,
      showTime,
      showDate: { $gte: startOfDay, $lt: endOfDay },
    });
  }
};

// Helper: find show by showId (UUID), MongoDB _id, composite key, or auto-provision
const findShowByIdOrShowId = async (id, fallbackData = {}) => {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    const show = await Show.findById(id);
    if (show) return show;
  }
  let show = await Show.findOne({ showId: id });
  if (show) return show;

  // Try composite lookup if details are provided
  if (fallbackData && fallbackData.movieId && fallbackData.theatreName && fallbackData.showTime) {
    const startOfDay = fallbackData.showDate ? new Date(fallbackData.showDate) : new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    show = await Show.findOne({
      movieId: String(fallbackData.movieId),
      theatreName: fallbackData.theatreName,
      showTime: fallbackData.showTime,
      showDate: { $gte: startOfDay, $lt: endOfDay },
    });
    if (show) return show;
  }

  return await findOrCreateDynamicShow(id, fallbackData);
};

// @desc    Add a new show
// @route   POST /api/shows
// @access  Admin
const addShow = async (req, res) => {
  const adminEmail = (req.user && req.user.email) || req.body.adminEmail || 'admin@imovies.com';
  const { movieId, theatreName, showDate, showTime } = req.body;

  if (!movieId || !theatreName || !showDate || !showTime) {
    return res.status(400).json({
      success: false,
      message: 'Required fields: movieId, theatreName, showDate, showTime.',
    });
  }

  const theatre = await Theatre.findOne({ theatreName });
  if (!theatre) {
    return res.status(404).json({ success: false, message: 'Theatre not found with given name.' });
  }

  const showId = uuidv4();
  const tickets = buildTicketsFromTheatre(theatre);

  const show = await Show.create({
    adminEmail,
    showId,
    movieId: String(movieId),
    theatreName,
    showDate: new Date(showDate),
    showTime,
    tickets,
  });

  res.status(201).json({ success: true, message: 'Show created successfully.', data: show });
};

// @desc    Get all shows
// @route   GET /api/shows
// @access  Public
const getAllShows = async (req, res) => {
  const shows = await Show.find()
    .populate('movieId', 'movieName posterUrl releaseDate language duration')
    .sort({ showDate: 1, showTime: 1 });
  res.status(200).json({ success: true, data: shows });
};

// @desc    Get single show by UUID showId, MongoDB _id, or composite slug
// @route   GET /api/shows/:id
// @access  Public
const getShowById = async (req, res) => {
  const id = req.params.id;
  const show = await findShowByIdOrShowId(id, req.query);

  if (!show) {
    return res.status(404).json({ success: false, message: 'Show not found.' });
  }

  const showObj = show.toObject ? show.toObject() : show;
  const bookedSeats = [];
  const lockedSeats = [];
  const now = new Date();

  if (showObj.tickets) {
    ['balcony', 'middle', 'lower'].forEach((tier) => {
      const seats = showObj.tickets[tier];
      if (seats) {
        Object.entries(seats).forEach(([seatId, data]) => {
          if (!data) return;
          if (data.status === 'booked') {
            bookedSeats.push(seatId);
          } else if (data.status === 'locked') {
            if (!data.lockExpiry || new Date(data.lockExpiry) > now) {
              lockedSeats.push(seatId);
            }
          }
        });
      }
    });
  }

  showObj.bookedSeats = bookedSeats;
  showObj.lockedSeats = lockedSeats;

  // Attach theatre and pricing info for client
  const theatre = await Theatre.findOne({ theatreName: showObj.theatreName });
  if (theatre) {
    showObj.theatre = theatre;
    showObj.pricing = {
      balcony: theatre.balconySeatPrice,
      middle: theatre.middleSeatPrice,
      lower: theatre.lowerSeatPrice,
    };
  }

  res.status(200).json({ success: true, data: showObj });
};

// @desc    Get shows by movieId (Auto-provisions 7 days across theatres if none exist)
// @route   GET /api/shows/movie/:movieId
// @access  Public
const getShowsByMovieId = async (req, res) => {
  const movieId = String(req.params.movieId);
  let shows = await Show.find({ movieId })
    .populate('movieId', 'movieName posterUrl language duration')
    .sort({ showDate: 1, showTime: 1 });

  // If no shows exist for this movie in the database, provision real shows for next 7 days in MongoDB!
  if (!shows || shows.length === 0) {
    let theatres = await Theatre.find();
    if (!theatres || theatres.length === 0) {
      theatres = await Theatre.insertMany(
        CANONICAL_THEATRES.map((t) => ({
          ...t,
          lowerSeats: generateSeatLayout(['A', 'B', 'C'], 10),
          middleSeats: generateSeatLayout(['D', 'E', 'F', 'G'], 10),
          balconySeats: generateSeatLayout(['H', 'I', 'J', 'K'], 10),
        }))
      );
    }

    const newShows = [];
    const now = new Date();

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const showDate = new Date(now);
      showDate.setDate(showDate.getDate() + dayOffset);
      showDate.setHours(0, 0, 0, 0);

      theatres.forEach((theatre, tIdx) => {
        DEFAULT_TIMES.forEach((time, timeIdx) => {
          const tickets = buildTicketsFromTheatre(theatre);
          const showId = `show_${movieId}_d${dayOffset}_t${tIdx}_s${timeIdx}`;

          newShows.push({
            adminEmail: 'admin@imovies.com',
            showId,
            movieId,
            theatreName: theatre.theatreName,
            showDate,
            showTime: time,
            tickets,
          });
        });
      });
    }

    try {
      shows = await Show.insertMany(newShows);
    } catch (insertErr) {
      shows = await Show.find({ movieId }).sort({ showDate: 1, showTime: 1 });
    }
  }

  res.status(200).json({ success: true, data: shows });
};

// @desc    Delete a show
// @route   DELETE /api/shows/:id
// @access  Admin
const deleteShow = async (req, res) => {
  const id = req.params.id;
  let show = null;

  if (mongoose.Types.ObjectId.isValid(id)) {
    show = await Show.findByIdAndDelete(id);
  }
  if (!show) {
    show = await Show.findOneAndDelete({ showId: id });
  }

  if (!show) {
    return res.status(404).json({ success: false, message: 'Show not found.' });
  }

  res.status(200).json({ success: true, message: 'Show deleted successfully.' });
};

// @desc    Cleanup expired seat locks across all shows
// @route   POST /api/shows/cleanup-locks
// @access  Internal / Cron
const cleanupExpiredLocks = async (req, res) => {
  const now = new Date();
  const shows = await Show.find();

  let cleanedCount = 0;

  for (const show of shows) {
    let modified = false;
    for (const tier of ['balcony', 'middle', 'lower']) {
      if (show.tickets && show.tickets[tier]) {
        for (const [seatId, info] of Object.entries(show.tickets[tier])) {
          if (info.status === 'locked' && info.lockExpiry && new Date(info.lockExpiry) < now) {
            show.tickets[tier][seatId] = {
              status: 'available',
              lockedBy: null,
              lockExpiry: null,
            };
            modified = true;
            cleanedCount++;
          }
        }
      }
    }
    if (modified) {
      show.markModified('tickets');
      await show.save();
    }
  }

  res.status(200).json({
    success: true,
    message: `Cleaned up ${cleanedCount} expired seat lock(s).`,
  });
};

module.exports = {
  addShow,
  getAllShows,
  getShowById,
  getShowsByMovieId,
  deleteShow,
  cleanupExpiredLocks,
  findShowByIdOrShowId,
  findOrCreateDynamicShow,
  buildTicketsFromTheatre,
};
