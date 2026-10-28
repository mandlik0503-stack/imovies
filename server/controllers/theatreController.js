const Theatre = require('../models/theatreModel');

// Helper: generate seat layout for a given set of rows with seatsPerRow seats each
// prefix is used for seat IDs (e.g. 'A', 'B', ...)
const generateSeatLayout = (rows, seatsPerRow) => {
  const layout = {};
  for (const row of rows) {
    for (let i = 1; i <= seatsPerRow; i++) {
      const seatId = `${row}${i}`;
      layout[seatId] = { total: 1, available: 1 };
    }
  }
  return layout;
};

// @desc    Add a new theatre with auto-generated seat layout
// @route   POST /api/theatre
// @access  Admin
const addTheatre = async (req, res) => {
  const { theatreName, location, balconySeatPrice, middleSeatPrice, lowerSeatPrice } = req.body;

  if (!theatreName || !location || balconySeatPrice == null || middleSeatPrice == null || lowerSeatPrice == null) {
    return res.status(400).json({
      success: false,
      message: 'Required fields: theatreName, location, balconySeatPrice, middleSeatPrice, lowerSeatPrice.',
    });
  }

  // Lower (Front nearest to screen): rows A-C, 10 seats each = 30 seats
  const lowerSeats = generateSeatLayout(['A', 'B', 'C'], 10);
  // Middle: rows D-G, 10 seats each = 40 seats
  const middleSeats = generateSeatLayout(['D', 'E', 'F', 'G'], 10);
  // Balcony (Premium furthest from screen): rows H-K, 10 seats each = 40 seats
  const balconySeats = generateSeatLayout(['H', 'I', 'J', 'K'], 10);

  const theatre = await Theatre.create({
    theatreName,
    location,
    balconySeatPrice,
    middleSeatPrice,
    lowerSeatPrice,
    balconySeats,
    middleSeats,
    lowerSeats,
  });

  res.status(201).json({ success: true, message: 'Theatre added successfully.', data: theatre });
};

// @desc    Get all theatres
// @route   GET /api/theatre
// @access  Public
const getAllTheatres = async (req, res) => {
  const theatres = await Theatre.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: theatres });
};

// @desc    Get single theatre by ID or Name
// @route   GET /api/theatre/:id
// @access  Public
const getTheatreById = async (req, res) => {
  const param = req.params.id;
  let theatre = null;

  if (param.match(/^[0-9a-fA-F]{24}$/)) {
    theatre = await Theatre.findById(param);
  }
  if (!theatre) {
    theatre = await Theatre.findOne({ theatreName: new RegExp(`^${param}$`, 'i') });
  }

  if (!theatre) {
    return res.status(404).json({ success: false, message: 'Theatre not found.' });
  }

  res.status(200).json({ success: true, data: theatre });
};

// @desc    Update theatre (pricing etc.)
// @route   PUT /api/theatre/:id
// @access  Admin
const updateTheatre = async (req, res) => {
  const theatre = await Theatre.findById(req.params.id);

  if (!theatre) {
    return res.status(404).json({ success: false, message: 'Theatre not found.' });
  }

  const updatedTheatre = await Theatre.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, message: 'Theatre updated successfully.', data: updatedTheatre });
};

// @desc    Delete a theatre
// @route   DELETE /api/theatre/:id
// @access  Admin
const deleteTheatre = async (req, res) => {
  const theatre = await Theatre.findById(req.params.id);

  if (!theatre) {
    return res.status(404).json({ success: false, message: 'Theatre not found.' });
  }

  await theatre.deleteOne();

  res.status(200).json({ success: true, message: 'Theatre deleted successfully.' });
};

module.exports = { addTheatre, getAllTheatres, getTheatreById, updateTheatre, deleteTheatre };
