require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const connectDB = require('./config/db');
const User = require('./models/userModel');
const Admin = require('./models/adminModel');
const Movie = require('./models/movieModel');
const Theatre = require('./models/theatreModel');
const Show = require('./models/showModel');
const Review = require('./models/reviewModel');

const generateSeatLayout = (rows, seatsPerRow) => {
  const layout = {};
  for (const row of rows) {
    for (let i = 1; i <= seatsPerRow; i++) {
      layout[`${row}${i}`] = { total: 1, available: 1 };
    }
  }
  return layout;
};

const buildTickets = (theatre) => {
  const tickets = { balcony: {}, middle: {}, lower: {} };
  ['balconySeats', 'middleSeats', 'lowerSeats'].forEach((key, idx) => {
    const tier = ['balcony', 'middle', 'lower'][idx];
    if (theatre[key]) {
      Object.keys(theatre[key]).forEach((seatId) => {
        tickets[tier][seatId] = {
          status: 'available',
          lockedBy: null,
          lockExpiry: null,
        };
      });
    }
  });
  return tickets;
};

const seedData = async () => {
  try {
    await connectDB();
    console.log('Clearing existing database collections...');

    await Promise.all([
      User.deleteMany({}),
      Admin.deleteMany({}),
      Movie.deleteMany({}),
      Theatre.deleteMany({}),
      Show.deleteMany({}),
      Review.deleteMany({}),
    ]);

    console.log('Seeding Admin & Users...');
    const admin = await Admin.create({
      username: 'admin',
      email: 'admin@imovies.com',
      password: 'admin123',
    });

    const user = await User.create({
      username: 'johndoe',
      email: 'john@example.com',
      password: 'password123',
      isVerified: true,
    });

    console.log('Seeding Movies...');
    const movies = await Movie.insertMany([
      {
        movieName: 'Interstellar: Beyond Time',
        description:
          'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
        genres: ['Sci-Fi', 'Adventure', 'Drama'],
        releaseDate: new Date('2024-11-07'),
        language: 'English',
        duration: '169 min',
        certification: 'UA',
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
      },
      {
        movieName: 'The Dark Knight: Legacy',
        description:
          'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
        genres: ['Action', 'Crime', 'Drama'],
        releaseDate: new Date('2024-07-18'),
        language: 'English',
        duration: '152 min',
        certification: 'A',
        posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
      },
      {
        movieName: 'Oppenheimer',
        description:
          'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
        genres: ['Biography', 'Drama', 'History'],
        releaseDate: new Date('2024-08-21'),
        language: 'English',
        duration: '180 min',
        certification: 'A',
        posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=1200&q=80',
      },
      {
        movieName: 'Dune: Part Two',
        description:
          'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
        genres: ['Action', 'Adventure', 'Sci-Fi'],
        releaseDate: new Date('2024-03-01'),
        language: 'English',
        duration: '166 min',
        certification: 'UA',
        posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      },
      {
        movieName: 'Cyberpunk Neo Tokyo',
        description:
          'In a neon-drenched metropolis, a rogue hacker and an android detective uncover a conspiracy that threatens the boundary between human consciousness and synthetic life.',
        genres: ['Sci-Fi', 'Action', 'Thriller'],
        releaseDate: new Date('2025-01-15'),
        language: 'English',
        duration: '135 min',
        certification: 'UA',
        posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
      },
      {
        movieName: 'Kantara: Legend Continued',
        description:
          'When greed paves the way for betrayal and scheming, a fierce young tribal man takes up the ancient divine mantle to defend his village from royal encroachers.',
        genres: ['Action', 'Adventure', 'Drama'],
        releaseDate: new Date('2024-10-12'),
        language: 'Kannada',
        duration: '148 min',
        certification: 'UA',
        posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
      },
    ]);

    console.log('Seeding Theatres...');
    const theatres = await Theatre.insertMany([
      {
        theatreName: 'PVR IMAX Phoenix MarketCity',
        location: 'Kurla West, Mumbai',
        balconySeatPrice: 450,
        middleSeatPrice: 320,
        lowerSeatPrice: 200,
        balconySeats: generateSeatLayout(['A', 'B', 'C'], 10),
        middleSeats: generateSeatLayout(['D', 'E', 'F', 'G'], 10),
        lowerSeats: generateSeatLayout(['H', 'I', 'J', 'K'], 10),
      },
      {
        theatreName: "PVR Director's Cut Ambience Mall",
        location: 'Vasant Kunj, New Delhi',
        balconySeatPrice: 550,
        middleSeatPrice: 380,
        lowerSeatPrice: 240,
        balconySeats: generateSeatLayout(['A', 'B', 'C'], 10),
        middleSeats: generateSeatLayout(['D', 'E', 'F', 'G'], 10),
        lowerSeats: generateSeatLayout(['H', 'I', 'J', 'K'], 10),
      },
      {
        theatreName: 'INOX Megaplex Forum Mall',
        location: 'Koramangala, Bengaluru',
        balconySeatPrice: 400,
        middleSeatPrice: 290,
        lowerSeatPrice: 180,
        balconySeats: generateSeatLayout(['A', 'B', 'C'], 10),
        middleSeats: generateSeatLayout(['D', 'E', 'F', 'G'], 10),
        lowerSeats: generateSeatLayout(['H', 'I', 'J', 'K'], 10),
      },
    ]);

    console.log('Seeding Shows for next 7 days...');
    const times = ['10:00 AM', '01:30 PM', '05:00 PM', '08:30 PM', '11:15 PM'];
    const showRecords = [];

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const showDate = new Date();
      showDate.setDate(showDate.getDate() + dayOffset);
      showDate.setHours(0, 0, 0, 0);

      theatres.forEach((theatre) => {
        movies.slice(0, 4).forEach((movie, mIdx) => {
          const selectedTime = times[(dayOffset + mIdx) % times.length];
          const tickets = buildTickets(theatre);

          // Randomly book a few seats to demonstrate color states in the seat map
          const balconyKeys = Object.keys(tickets.balcony);
          if (balconyKeys.length > 3) {
            tickets.balcony[balconyKeys[0]].status = 'booked';
            tickets.balcony[balconyKeys[1]].status = 'booked';
          }
          const middleKeys = Object.keys(tickets.middle);
          if (middleKeys.length > 5) {
            tickets.middle[middleKeys[2]].status = 'booked';
            tickets.middle[middleKeys[3]].status = 'booked';
          }

          showRecords.push({
            adminEmail: admin.email,
            showId: uuidv4(),
            movieId: movie._id,
            theatreName: theatre.theatreName,
            showDate,
            showTime: selectedTime,
            tickets,
          });
        });
      });
    }

    await Show.insertMany(showRecords);

    console.log('Seeding Reviews...');
    await Review.insertMany([
      {
        userEmail: user.email,
        movieId: movies[0]._id,
        rating: 5,
        reviewText:
          'Absolute masterpiece. Hans Zimmer score and Christopher Nolan visual storytelling will give you goosebumps on the big screen.',
      },
      {
        userEmail: user.email,
        movieId: movies[1]._id,
        rating: 5,
        reviewText:
          "Heath Ledger's performance is legendary. The pacing never lets up. Best superhero movie ever made.",
      },
    ]);

    console.log('\n========================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('========================================');
    console.log('👤 Regular User:');
    console.log('   Email:    john@example.com');
    console.log('   Password: password123');
    console.log('\n👑 Admin User:');
    console.log('   Email:    admin@imovies.com');
    console.log('   Password: admin123');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
