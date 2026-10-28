import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  Ticket, Calendar, Clock, MapPin, CreditCard,
  X, Download, CheckCircle, XCircle, Film
} from 'lucide-react'
import API from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import LoadingSpinner from '../components/LoadingSpinner'
import Footer from '../components/Footer'
import DigitalTicketPass from '../components/DigitalTicketPass'

const StatusBadge = ({ status }) => {
  const config = {
    Completed: { color: 'bg-green-500/20 text-green-400 border-green-500/40', icon: CheckCircle },
    Cancelled: { color: 'bg-red-500/20 text-red-400 border-red-500/40', icon: XCircle },
    Pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40', icon: Clock },
  }[status] || { color: 'bg-gray-500/20 text-gray-400 border-gray-500/40', icon: Clock }

  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  )
}

const BookingsPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)
  const [activePassBooking, setActivePassBooking] = useState(null)

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.email) return
      try {
        setLoading(true)
        const res = await API.get(`/bookings/user/${user.email}`)
        setBookings(res.data || [])
      } catch {
        toast.error('Failed to load your bookings')
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [user])

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return
    setCancellingId(bookingId)
    try {
      await API.put(`/bookings/cancel/${bookingId}`)
      setBookings((prev) =>
        prev.map((b) => b._id === bookingId ? { ...b, status: 'Cancelled' } : b)
      )
      toast.success('Booking cancelled successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking')
    } finally {
      setCancellingId(null)
    }
  }

  const isFutureShow = (booking) => {
    try {
      const showDate = new Date(booking.showDate || booking.show?.showDate)
      return showDate > new Date()
    } catch {
      return false
    }
  }

  if (loading) return <LoadingSpinner message="Loading your bookings..." />

  return (
    <div className="min-h-screen bg-[#0f171e]">
      <Navbar />

      <div className="pt-24 pb-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Ticket className="w-8 h-8 text-[#00a8e1]" />
            My Bookings
          </h1>
          <p className="text-[#8197a4] mt-1">
            {bookings.length > 0
              ? `${bookings.length} booking${bookings.length !== 1 ? 's' : ''} found`
              : 'No bookings yet'}
          </p>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-24 bg-[#1a242f] rounded-2xl border border-[#253241]">
            <Ticket className="w-16 h-16 text-[#253241] mx-auto mb-4" />
            <h3 className="text-white text-xl font-bold mb-2">No Bookings Yet</h3>
            <p className="text-[#8197a4] mb-6">Start exploring movies and book your first ticket!</p>
            <button
              onClick={() => navigate('/home')}
              className="bg-[#00a8e1] hover:bg-[#0891c9] text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200"
            >
              Browse Movies
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const canCancel = booking.status === 'Completed' && isFutureShow(booking)
              const showDate = booking.showDate || booking.show?.showDate
              const showTime = booking.showTime || booking.show?.showTime
              const movieName = booking.movieName || booking.movie?.movieName || 'Unknown Movie'
              const theatreName = booking.theatreName || booking.show?.theatreName || 'Unknown Theatre'
              const seats = booking.seats || booking.bookedSeats || []
              const totalAmount = booking.totalAmount || 0
              const status = booking.status || 'Completed'

              return (
                <div
                  key={booking._id}
                  className="bg-[#1a242f] border border-[#253241] rounded-2xl overflow-hidden shadow-lg print-ticket"
                >
                  {/* Ticket header bar */}
                  <div className="bg-gradient-to-r from-[#00a8e1] to-[#0891c9] px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Film className="w-5 h-5 text-white" />
                      <span className="text-white font-black text-lg">iMovies</span>
                    </div>
                    <StatusBadge status={status} />
                  </div>

                  <div className="p-6">
                    {/* Movie name */}
                    <h2 className="text-white font-bold text-xl mb-4">{movieName}</h2>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                      {theatreName && (
                        <div>
                          <div className="flex items-center gap-1.5 text-[#8197a4] text-xs uppercase tracking-wider mb-1">
                            <MapPin className="w-3 h-3" /> Theatre
                          </div>
                          <p className="text-[#c0cdd5] text-sm font-medium">{theatreName}</p>
                        </div>
                      )}
                      {showDate && (
                        <div>
                          <div className="flex items-center gap-1.5 text-[#8197a4] text-xs uppercase tracking-wider mb-1">
                            <Calendar className="w-3 h-3" /> Date
                          </div>
                          <p className="text-[#c0cdd5] text-sm font-medium">
                            {new Date(showDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      )}
                      {showTime && (
                        <div>
                          <div className="flex items-center gap-1.5 text-[#8197a4] text-xs uppercase tracking-wider mb-1">
                            <Clock className="w-3 h-3" /> Time
                          </div>
                          <p className="text-[#c0cdd5] text-sm font-medium">{showTime}</p>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 text-[#8197a4] text-xs uppercase tracking-wider mb-1">
                          <CreditCard className="w-3 h-3" /> Amount
                        </div>
                        <p className="text-[#00a8e1] text-sm font-bold">₹{totalAmount}</p>
                      </div>
                    </div>

                    {/* Seats */}
                    {seats.length > 0 && (
                      <div className="mb-5">
                        <p className="text-[#8197a4] text-xs uppercase tracking-wider mb-2">Seats</p>
                        <div className="flex flex-wrap gap-2">
                          {seats.map((seat) => (
                            <span key={seat} className="bg-[#253241] text-[#00a8e1] font-mono text-xs px-2.5 py-1 rounded-lg">
                              {seat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Booking ID & Payment Details */}
                    <div className="border-t border-dashed border-[#253241] pt-4 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-6 flex-wrap">
                        <div>
                          <p className="text-[#8197a4] text-xs">Booking ID</p>
                          <p className="text-white font-mono text-sm font-bold">
                            {booking._id?.slice(-10).toUpperCase() || booking.bookingId?.slice(-10).toUpperCase() || 'N/A'}
                          </p>
                        </div>
                        {booking.razorpayPaymentId && (
                          <div>
                            <p className="text-[#8197a4] text-xs">Razorpay Payment ID</p>
                            <span className="inline-flex items-center gap-1 bg-[#00a8e1]/10 text-[#00a8e1] border border-[#00a8e1]/30 px-2 py-0.5 rounded text-xs font-mono font-medium">
                              {booking.razorpayPaymentId}
                            </span>
                          </div>
                        )}
                        {booking.paymentMethod && (
                          <div>
                            <p className="text-[#8197a4] text-xs">Method</p>
                            <p className="text-[#c0cdd5] text-xs font-medium">{booking.paymentMethod}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 no-print">
                        <button
                          onClick={() => setActivePassBooking(booking)}
                          className="flex items-center gap-1.5 bg-[#00a8e1]/10 hover:bg-[#00a8e1] text-[#00a8e1] hover:text-white border border-[#00a8e1]/30 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-sm"
                          aria-label="View Boarding Pass"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          View Boarding Pass
                        </button>
                        <button
                          onClick={() => window.print()}
                          className="flex items-center gap-2 text-[#00a8e1] hover:text-[#0891c9] text-sm transition-colors duration-200"
                          aria-label="Download/Print ticket"
                        >
                          <Download className="w-4 h-4" />
                          Print
                        </button>
                        {canCancel && (
                          <button
                            onClick={() => handleCancel(booking._id)}
                            disabled={cancellingId === booking._id}
                            className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition-colors duration-200 disabled:opacity-50"
                            aria-label="Cancel booking"
                          >
                            {cancellingId === booking._id ? (
                              <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Digital Boarding Pass Modal */}
      {activePassBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-3xl my-auto py-8">
            <button
              onClick={() => setActivePassBooking(null)}
              className="absolute top-0 right-0 sm:-top-3 sm:-right-3 z-10 w-9 h-9 rounded-full bg-[#1a242f] hover:bg-[#253241] border border-[#253241] text-white flex items-center justify-center transition-colors shadow-lg"
              aria-label="Close pass"
            >
              <X className="w-5 h-5" />
            </button>
            <DigitalTicketPass booking={activePassBooking} showActions={true} />
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default BookingsPage
