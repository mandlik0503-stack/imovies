require('dotenv').config();
const mongoose = require('mongoose');
const Show = require('./models/showModel');
const Theatre = require('./models/theatreModel');
const connectDB = require('./config/db');
const { getShowsByMovieId, getShowById, findShowByIdOrShowId } = require('./controllers/showController');

const testShowFlow = async () => {
  console.log('====================================================');
  console.log('🧪 Testing Dynamic Show Generation & Booking Lookup');
  console.log('====================================================');

  await connectDB();

  const testMovieId = '872585'; // Oppenheimer TMDB ID

  // Test 1: getShowsByMovieId
  console.log('\n[1/3] Testing getShowsByMovieId for TMDB movie ID:', testMovieId);
  const mockReq = { params: { movieId: testMovieId } };
  let responseData = null;
  const mockRes = {
    status: (code) => ({
      json: (data) => {
        responseData = { code, data };
        return data;
      },
    }),
  };

  await getShowsByMovieId(mockReq, mockRes);
  const returnedShows = responseData?.data?.data || [];
  console.log(`✓ Retrieved ${returnedShows.length} shows generated across venues for next 7 days.`);

  if (returnedShows.length === 0) {
    throw new Error('Failed to retrieve or generate shows');
  }

  // Pick a show from Day 2 (e.g. Oct 29 or 30), Theatre 2 ("PVR Director's Cut Ambience Mall")
  const targetShow = returnedShows.find(
    (s) => s.theatreName.includes("Director's Cut") || s.showTime === '08:30 PM'
  ) || returnedShows[5];

  console.log('Target Show Picked:', {
    showId: targetShow.showId,
    theatreName: targetShow.theatreName,
    showDate: targetShow.showDate,
    showTime: targetShow.showTime,
  });

  // Test 2: getShowById
  console.log('\n[2/3] Testing getShowById with showId:', targetShow.showId);
  let singleShowData = null;
  const mockResSingle = {
    status: (code) => ({
      json: (data) => {
        singleShowData = { code, data };
        return data;
      },
    }),
  };
  await getShowById({ params: { id: targetShow.showId }, query: {} }, mockResSingle);

  console.log('✓ Found Show in DB:', {
    code: singleShowData.code,
    theatre: singleShowData.data?.data?.theatreName,
    date: singleShowData.data?.data?.showDate,
    time: singleShowData.data?.data?.showTime,
    balconySeatsCount: Object.keys(singleShowData.data?.data?.tickets?.balcony || {}).length,
  });

  if (singleShowData.data?.data?.theatreName !== targetShow.theatreName) {
    throw new Error('Show theatreName does not match!');
  }

  // Test 3: findShowByIdOrShowId with legacy slug or custom slot
  console.log('\n[3/3] Testing findShowByIdOrShowId with custom slug...');
  const customSlug = `tmdb_${testMovieId}_2_1_3`;
  const resolvedShow = await findShowByIdOrShowId(customSlug, {
    movieId: testMovieId,
    theatreName: "PVR Director's Cut Ambience Mall",
    showTime: '08:30 PM',
  });

  console.log('✓ Resolved / Auto-provisioned Show from custom slug:', {
    showId: resolvedShow.showId,
    theatre: resolvedShow.theatreName,
    date: resolvedShow.showDate,
    time: resolvedShow.showTime,
  });

  console.log('\n====================================================');
  console.log('🎉 ALL SHOW LOOKUP & PROVISIONING TESTS PASSED!');
  console.log('====================================================\n');
  process.exit(0);
};

testShowFlow().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
