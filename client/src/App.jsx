import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import LoadingSpinner from './components/LoadingSpinner'

// Lazy-loaded pages
const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const HomePage = lazy(() => import('./pages/HomePage'))
const MovieDetailsPage = lazy(() => import('./pages/MovieDetailsPage'))
const MovieShowsPage = lazy(() => import('./pages/MovieShowsPage'))
const SeatSelectionPage = lazy(() => import('./pages/SeatSelectionPage'))
const BookingsPage = lazy(() => import('./pages/BookingsPage'))
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'))

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AddMoviePage = lazy(() => import('./pages/admin/AddMoviePage'))
const AddTheatrePage = lazy(() => import('./pages/admin/AddTheatrePage'))
const AddShowPage = lazy(() => import('./pages/admin/AddShowPage'))
const AdminBookingsPage = lazy(() => import('./pages/admin/AdminBookingsPage'))

// 404
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function App() {
  return (
    <div className="min-h-screen bg-[#0f171e] text-white font-sans antialiased selection:bg-[#00a8e1] selection:text-white">
      <Suspense fallback={<LoadingSpinner message="Loading iMovies..." />}>
        <Routes>
          {/* Public / Auth Views */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* User Protected Views */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/moviedetails/:movieId"
            element={
              <ProtectedRoute>
                <MovieDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/movieshows/:movieId"
            element={
              <ProtectedRoute>
                <MovieShowsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seatslug/:showId"
            element={
              <ProtectedRoute>
                <SeatSelectionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seats/:showId"
            element={
              <ProtectedRoute>
                <SeatSelectionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <BookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/watchlist"
            element={
              <ProtectedRoute>
                <WatchlistPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Views */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/addmovie"
            element={
              <AdminRoute>
                <AddMoviePage />
              </AdminRoute>
            }
          />
          <Route
            path="/addtheatre"
            element={
              <AdminRoute>
                <AddTheatrePage />
              </AdminRoute>
            }
          />
          <Route
            path="/addshow"
            element={
              <AdminRoute>
                <AddShowPage />
              </AdminRoute>
            }
          />
          <Route
            path="/adminbookings"
            element={
              <AdminRoute>
                <AdminBookingsPage />
              </AdminRoute>
            }
          />

          {/* 404 Catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>

      {/* Global Notifications with Amazon Prime dark aesthetic */}
      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastClassName="!bg-[#1a242f] !border !border-[#253241] !text-white !rounded-xl !shadow-xl font-sans"
        progressClassName="!bg-[#00a8e1]"
      />
    </div>
  )
}

export default App
