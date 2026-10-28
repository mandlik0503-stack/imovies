# 🎬 iMovies — Movie Ticket Booking Web Application

A fully responsive, production-ready movie ticket booking platform built with the sleek, dark **Amazon Prime Video** aesthetic.

![Amazon Prime Video Aesthetic](https://img.shields.io/badge/Aesthetic-Amazon%20Prime%20Video-00a8e1?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node%20%7C%20Express%20%7C%20MongoDB-green?style=for-the-badge)

---

## 🎨 Design System

| Element | Hex Code / Specification |
|---|---|
| **Primary Background** | `#0f171e` (Deep Prime Dark) |
| **Surface / Card Background** | `#1a242f` (Prime Surface) |
| **Elevated Card / Modal** | `#253241` (Prime Elevated) |
| **Accent / Highlight** | `#00a8e1` (Prime Cyan-Blue) |
| **Accent Hover** | `#0891c9` |
| **Muted Text** | `#8197a4` |
| **Secondary Text** | `#c0cdd5` |
| **Typography** | Inter, system-ui, sans-serif |

---

## ⚡ Key Features

- **Official TMDB (v3) Integration**: Real-time cinema streaming from The Movie Database API (`/trending`, `/now_playing`, `/top_rated`, `/upcoming`, `/search`, `/discover`).
- **Cinema Media Experience**: High-resolution posters (`w500`), ultra-wide hero backdrops (`original`), and integrated YouTube trailer modal player.
- **Real-Time Search Auto-Complete**: Live debounced search with instant thumbnail suggestions in the Prime navigation bar.
- **Multi-Select Filtering Drawer**: Filter dynamically by multiple genres, original languages, release years, and sort criteria.
- **Cast Avatars & Fact Sheet**: Top-billed cast avatars, character names, budget, box office revenue, and runtime on the Movie Details page.
- **Amazon Prime Aesthetic**: Horizontal carousels with smooth scroll, hero showcase banner with backdrop fade and auto-rotation, glassmorphic header, and dark card scaling on hover.
- **Interactive Tier-Based Seat Map (Reoriented Cinema Layout)**:
  - **Screen Placement**: "Screen This Way" curved cinema indicator directly faces the lowest-priced tier.
  - **Lower (Rows A–C)**: Front-row economy view nearest to screen (₹180–₹240).
  - **Middle (Rows D–G)**: Mid-auditorium standard comfort (₹290–₹380).
  - **Balcony (Rows H–K)**: Premium recliner luxury furthest from screen (₹400–₹550).
  - Dynamic seat states: **Available**, **Selected** (Cyan), **Locked** (Yellow), and **Booked** (Gray).
- **Real-Time Showtime Expiry & Booking Validation**:
  - Live client filtering disables past showtimes on today's schedule with a "Started / Expired" tag and tooltip.
  - Backend API validates `showDateTime <= currentTime` and rejects expired sessions with `400 Bad Request`.
- **Digital Boarding Pass Cinema Ticket**:
  - Modern perforated cinema entry pass featuring movie poster, theatre/audi screen, show date/time, seat breakdown grouped by row, dynamic scannable QR code & barcode, transaction IDs, and clean print/save PDF layout.
- **Real-Time Seat Locking with 10-Minute TTL**: Temporary seat hold during checkout prevents double bookings and auto-expires if not confirmed.
- **Production-Grade Razorpay Payment Gateway (Test Mode)**:
  - Official Razorpay Checkout v1 integration (`https://checkout.razorpay.com/v1/checkout.js`).
  - Supports **UPI (Google Pay, PhonePe, Paytm, BHIM, UPI QR)**, **Credit/Debit Cards (Visa, MasterCard, RuPay)**, **NetBanking**, and **Mobile Wallets**.
  - Secure HMAC SHA-256 signature verification on backend (`/api/payment/verify`).
  - Automatic seat unlock on modal dismiss or payment failure.
  - Generates verifiable digital movie tickets with printable layout and Razorpay Payment & Order IDs.
- **Brevo (Sendinblue) Transactional Email Service**:
  - **Mandatory Registration Email Authentication**: Unverified accounts are blocked from logging in. New registrations receive a 6-digit One-Time Password (OTP) and click-to-verify activation link.
  - **In-App OTP Verification Window**: Interactive monospace 6-digit input with automatic 30s resend cooldown.
  - **Working Password Recovery**: "Forgot Password?" button on login page triggers instant 6-digit OTP and reset link dispatch via Brevo.
  - **Automated Digital Ticket Emailing**: Confirmed ticket reservations (with movie poster details, showtimes, seats, amount, and Razorpay transaction IDs) are automatically emailed to customers upon checkout.
  - **Booking Status Update Notifications**: Instant email alerts for cancellations, refunds, or schedule updates.
- **Dual Authentication**: Dedicated customer & admin roles with JWT tokens and bcrypt password hashing.
- **Complete Booking Pipeline**: Seat selection → Order summary → Simulated payment card checkout → Digital printable ticket with QR/Booking ID.
- **Admin Dashboard**: Real-time revenue analytics, total bookings counter, and creation portals for Movies, Theatres, and Showtime scheduling.
- **Watchlist & Reviews**: Real-time movie favoriting and interactive 5-star customer reviews with community feedback.

---

## 📁 Repository Structure

```
imovies/
├── client/                     # React 18 + Vite Frontend
│   ├── public/
│   │   └── favicon.svg         # iMovies filmstrip icon
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js        # Axios instance with JWT interceptors
│   │   ├── components/         # Reusable UI Components
│   │   │   ├── Navbar.jsx      # Prime Video navigation bar
│   │   │   ├── HeroBanner.jsx  # Featured movie auto-rotating billboard
│   │   │   ├── MovieCard.jsx   # Hover-scale movie card with action overlay
│   │   │   ├── MovieCarousel.jsx# Horizontal touch/click carousel
│   │   │   ├── SeatMap.jsx     # Tier-based interactive seat layout
│   │   │   ├── StarRating.jsx  # Interactive rating component
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── AdminRoute.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── Footer.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx # React Context for User/Admin state
│   │   ├── pages/              # Application Pages
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── MovieDetailsPage.jsx
│   │   │   ├── MovieShowsPage.jsx
│   │   │   ├── SeatSelectionPage.jsx
│   │   │   ├── BookingsPage.jsx
│   │   │   ├── WatchlistPage.jsx
│   │   │   ├── NotFoundPage.jsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── AddMoviePage.jsx
│   │   │       ├── AddTheatrePage.jsx
│   │   │       ├── AddShowPage.jsx
│   │   │       └── AdminBookingsPage.jsx
│   │   ├── App.jsx             # React Router DOM configuration
│   │   ├── main.jsx            # React root mount
│   │   └── index.css           # Tailwind base + custom Prime scrollbars
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
└── server/                     # Express.js REST API
    ├── config/
    │   ├── db.js               # MongoDB connection
    │   └── emailConfig.js      # Brevo SMTP/API credentials validator
    ├── controllers/
    │   ├── authController.js   # JWT Auth, OTP verification & password recovery
    │   ├── movieController.js  # Catalog CRUD & search
    │   ├── theatreController.js# Venue setup & pricing
    │   ├── showController.js   # Showtime management
    │   ├── bookingController.js# Real-time seat lock & booking
    │   ├── paymentController.js# Razorpay orders & HMAC SHA256 signature verification
    │   ├── emailController.js  # Brevo test & resend triggers
    │   ├── favoriteController.js# Watchlist management
    │   └── reviewController.js # Ratings & reviews
    ├── services/
    │   └── emailService.js     # Brevo transactional email wrappers & templates
    ├── middleware/
    │   ├── authMiddleware.js   # JWT verification
    │   └── adminMiddleware.js  # Admin authorization guard
    ├── models/
    │   ├── userModel.js
    │   ├── adminModel.js
    │   ├── movieModel.js
    │   ├── theatreModel.js
    │   ├── showModel.js
    │   ├── bookingModel.js
    │   ├── favoriteModel.js
    │   └── reviewModel.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── movieRoutes.js
    │   ├── theatreRoutes.js
    │   ├── showRoutes.js
    │   ├── bookingRoutes.js
    │   ├── paymentRoutes.js
    │   ├── emailRoutes.js
    │   ├── favoriteRoutes.js
    │   └── reviewRoutes.js
    ├── seed.js                 # Sample data generator (Movies, Shows, Theatres)
    ├── test-email.js           # Brevo live email integration test suite
    ├── server.js               # Entry point
    ├── .env                    # Environment configuration
    └── package.json
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (running locally on `mongodb://localhost:27017` or MongoDB Atlas URI)

---

### 2. Backend Setup

```bash
cd server

# Install dependencies
npm install

# (Optional) Seed the database with sample movies, theatres, and shows
npm run seed

# Start server in development mode
npm run dev
# Or production mode
npm start
```

The REST API will run at **`http://localhost:5000`**.

---

### 3. Frontend Setup

In a new terminal:

```bash
cd client

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 🔑 Demo Login Credentials (from `npm run seed`)

### Regular Customer:
- **Email**: `john@example.com`
- **Password**: `password123`

### Platform Administrator:
- **Email**: `admin@imovies.com`
- **Password**: `admin123`
*(Admin toggle is available right on the login page!)*

---

## 🛠️ API Reference Summary

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new customer account (sends 6-digit OTP) |
| `POST` | `/api/auth/verify-email` | Public | Authenticate email with 6-digit OTP or link token |
| `POST` | `/api/auth/resend-verification` | Public | Resend fresh 6-digit OTP verification code |
| `POST` | `/api/auth/forgot-password` | Public | Dispatch password reset 6-digit OTP and recovery link |
| `POST` | `/api/auth/reset-password` | Public | Reset password using verified OTP or token |
| `POST` | `/api/auth/login` | Public | Login customer (requires verified email), returns JWT |
| `POST` | `/api/auth/admin/login` | Public | Login admin, returns admin JWT |
| `POST` | `/api/email/test` | Public | Trigger test verification, reset, or ticket emails |
| `POST` | `/api/email/resend-ticket` | Public | Resend digital ticket pass to customer email |
| `GET` | `/api/movie` | Public | Get all movies (supports `?genre=` and `?language=`) |
| `GET` | `/api/movie/:id` | Public | Get movie details by ID |
| `POST` | `/api/movie` | Admin | Add new movie to catalog |
| `GET` | `/api/theatre` | Public | Get all theatres |
| `POST` | `/api/theatre` | Admin | Add theatre with automated tier layout |
| `GET` | `/api/shows/movie/:movieId` | Public | Get available shows for a movie |
| `GET` | `/api/shows/:id` | Public | Get show details with seat status map |
| `POST` | `/api/shows` | Admin | Schedule a showtime |
| `POST` | `/api/bookings/lock` | User | Lock seats with 10-minute TTL |
| `POST` | `/api/bookings/confirm` | User | Confirm booking and mark seats booked |
| `POST` | `/api/bookings/release` | User | Manually release locked seats |
| `GET` | `/api/bookings/user/:email`| User | Retrieve customer booking history |
| `GET` | `/api/bookings/all` | Admin | View platform reservations & revenue |
| `PUT` | `/api/bookings/cancel/:id` | User | Cancel reservation & restore seats |
| `POST` | `/api/payment/create-order`| User | Initialize Razorpay Order with INR paise amount |
| `POST` | `/api/payment/verify` | User | Verify HMAC SHA256 signature and finalize booking |
| `GET` | `/api/favorite/:email` | User | Get customer watchlist |
| `POST` | `/api/favorite` | User | Add movie to watchlist |
| `DELETE`| `/api/favorite` | User | Remove movie from watchlist |
| `GET` | `/api/review/movie/:movieId`| Public | Fetch movie reviews & average rating |
| `POST` | `/api/review` | User | Post or update movie review |

---

## 💳 Razorpay Payment Gateway (Test Mode)

The application includes an end-to-end integration with the Razorpay API v1 in sandbox/test mode:

### Environment Keys:
- **`RAZORPAY_KEY_ID`**: Configured in `.env`
- **`RAZORPAY_KEY_SECRET`**: Configured in `.env`

### Payment Flow Architecture:
1. **Order Initiation**: Client requests `/api/payment/create-order` with the show ID, seat selection, and INR amount. Backend converts to paise and creates a signed Razorpay order.
2. **Checkout Modal**: The official `checkout.js` modal opens with theme color `#E50914`, prompting payment through:
   - **UPI**: Google Pay, PhonePe, Paytm, BHIM, QR code
   - **Cards**: Test Visa / MasterCard (use standard test card numbers like `4111 1111 1111 1111`, any future expiry, CVV `123`, OTP `123456`)
   - **NetBanking & Wallets**: Test banks with instant success simulator
3. **Cryptographic Verification**: On checkout completion, Razorpay client returns `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`. The backend validates the HMAC SHA-256 signature using `crypto.createHmac('sha256', RAZORPAY_KEY_SECRET)`.
4. **State Transition**: Upon successful signature matching, seats transition from `locked` to `booked`, booking status is marked `Completed`, and a digital ticket is generated.
5. **Auto-Cancellation Safety**: If the user dismisses the modal or payment fails, seats are instantly released back to the general booking pool.

---

## ✉️ Brevo (Sendinblue) Transactional Email Integration

iMovies features a complete transactional email service powered by the official `@getbrevo/brevo` SDK (with native HTTPS REST fallback and rate-limit retry):

### Configuration (`server/.env`):
```env
BREVO_API_KEY=your_brevo_api_key_here
SENDER_EMAIL=en24cs3010865@medicaps.ac.in
SENDER_NAME=iMovies
```

### Core Transactional Features:
1. **Mandatory Registration Authentication**:
   - New registrations are initially unverified (`isVerified: false`).
   - Brevo dispatches a dark-themed Amazon Prime styled verification email containing both a **6-digit OTP** and a direct activation link.
   - The user enters the 6 digits in the interactive in-app OTP window or clicks the email button to activate their account and receive their JWT session.
2. **Secure Password Recovery ("Forgot Password?")**:
   - Working button on the login screen opens the recovery dialog.
   - Dispatches a 6-digit OTP code and secure reset link valid for 15 minutes.
   - Allows instant password resetting upon OTP verification.
3. **Automated Cinema Ticket Dispatch**:
   - Upon successful payment verification (`/api/payment/verify`), the customer receives an HTML cinema pass containing the film name, venue, showtime, reserved seats, total amount (₹), Razorpay transaction ID, and booking reference.
4. **Booking Status Notifications**:
   - Automatic email notifications if a reservation is cancelled or rescheduled.

### Run Email Test Suite:
```bash
node server/test-email.js
```
