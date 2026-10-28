import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Ticket, Search, ChevronDown, X, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import API from '../../api/axios'
import Navbar from '../../components/Navbar'
import LoadingSpinner from '../../components/LoadingSpinner'

const STATUS_OPTIONS = ['All', 'Completed', 'Cancelled', 'Pending']

const AdminBookingsPage = () => {
  const navigate = useNavigate()

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true)
        const res = await API.get('/bookings/all')
        setBookings(res.data || [])
      } catch {
        toast.error('Failed to load bookings')
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [])

  const filteredBookings = bookings
    .filter((b) => {
      const matchStatus = statusFilter === 'All' || b.status === statusFilter
      const matchSearch = !searchQuery ||
        b.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.movieName || b.movie?.movieName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        b._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.bookingId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.razorpayPaymentId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.razorpayOrderId || '').toLowerCase().includes(searchQuery.toLowerCase())
      return matchStatus && matchSearch
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      if (sortBy === 'amount_high') return (b.totalAmount || 0) - (a.totalAmount || 0)
      if (sortBy === 'amount_low') return (a.totalAmount || 0) - (b.totalAmount || 0)
      return 0
    })

  const totalRevenue = filteredBookings
    .filter((b) => b.status !== 'Cancelled')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0)

  if (loading) return <LoadingSpinner message="Loading all bookings..." />

  return (
    <div className="min-h-screen bg-[#0f171e]">
      <Navbar />

      <div className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="text-[#8197a4] hover:text-white transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Ticket className="w-6 h-6 text-[#00a8e1]" />
              All Bookings
            </h1>
            <p className="text-[#8197a4] text-sm mt-0.5">
              {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} · Revenue: ₹{totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email, movie, or booking ID..."
              className="w-full bg-[#1a242f] border border-[#253241] text-white placeholder-[#8197a4] focus:border-[#00a8e1] focus:outline-none rounded-lg px-4 py-2.5 pl-9 text-sm transition-colors duration-200"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8197a4]" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8197a4] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#1a242f] border border-[#253241] text-white focus:border-[#00a8e1] focus:outline-none rounded-lg px-4 py-2.5 text-sm pr-8 appearance-none transition-colors duration-200"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8197a4] pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#1a242f] border border-[#253241] text-white focus:border-[#00a8e1] focus:outline-none rounded-lg px-4 py-2.5 text-sm pr-8 appearance-none transition-colors duration-200"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount_high">Amount: High → Low</option>
              <option value="amount_low">Amount: Low → High</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8197a4] pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-20 bg-[#1a242f] rounded-2xl border border-[#253241]">
            <Ticket className="w-14 h-14 text-[#253241] mx-auto mb-4" />
            <p className="text-white text-xl font-bold mb-2">No Bookings Found</p>
            <p className="text-[#8197a4]">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="bg-[#1a242f] border border-[#253241] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#253241] bg-[#253241]/30">
                    {['Booking ID', 'User Email', 'Movie', 'Theatre', 'Show Date', 'Show Time', 'Seats', 'Amount', 'Payment Ref', 'Status'].map((h) => (
                      <th key={h} className="px-4 py-3.5 text-left text-[#8197a4] text-xs uppercase tracking-wider font-semibold whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#253241]">
                  {filteredBookings.map((booking) => {
                    const movieName = booking.movieName || booking.movie?.movieName || '—'
                    const theatreName = booking.theatreName || booking.show?.theatreName || '—'
                    const showDate = booking.showDate || booking.show?.showDate
                    const showTime = booking.showTime || booking.show?.showTime || '—'
                    const seats = booking.seats || booking.bookedSeats || []
                    const status = booking.status || 'Completed'

                    return (
                      <tr key={booking._id} className="hover:bg-[#253241]/20 transition-colors duration-150">
                        <td className="px-4 py-3 text-[#00a8e1] font-mono text-xs whitespace-nowrap">
                          {booking._id?.slice(-8).toUpperCase()}
                        </td>
                        <td className="px-4 py-3 text-[#c0cdd5] text-sm max-w-[150px]">
                          <span className="truncate block" title={booking.userEmail}>{booking.userEmail}</span>
                        </td>
                        <td className="px-4 py-3 text-white text-sm font-medium max-w-[130px]">
                          <span className="truncate block" title={movieName}>{movieName}</span>
                        </td>
                        <td className="px-4 py-3 text-[#c0cdd5] text-sm max-w-[130px]">
                          <span className="truncate block" title={theatreName}>{theatreName}</span>
                        </td>
                        <td className="px-4 py-3 text-[#8197a4] text-xs whitespace-nowrap">
                          {showDate ? new Date(showDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                        </td>
                        <td className="px-4 py-3 text-[#8197a4] text-xs whitespace-nowrap">
                          {showTime}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {seats.slice(0, 3).map((s) => (
                              <span key={s} className="bg-[#253241] text-[#00a8e1] font-mono text-[10px] px-1.5 py-0.5 rounded">
                                {s}
                              </span>
                            ))}
                            {seats.length > 3 && (
                              <span className="text-[#8197a4] text-[10px]">+{seats.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#00a8e1] font-bold text-sm whitespace-nowrap">
                          ₹{booking.totalAmount || 0}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {booking.razorpayPaymentId ? (
                            <span
                              className="inline-block bg-[#00a8e1]/10 text-[#00a8e1] border border-[#00a8e1]/30 font-mono text-[11px] px-2 py-0.5 rounded max-w-[110px] truncate"
                              title={`Razorpay Payment: ${booking.razorpayPaymentId}\nOrder: ${booking.razorpayOrderId || 'N/A'}`}
                            >
                              {booking.razorpayPaymentId}
                            </span>
                          ) : (
                            <span className="text-[#8197a4] text-xs font-mono">{booking.paymentMethod || 'Manual'}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap ${
                            status === 'Completed' ? 'bg-green-500/20 text-green-400'
                            : status === 'Cancelled' ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            <div className="px-4 py-3 border-t border-[#253241] flex items-center justify-between text-sm text-[#8197a4]">
              <span>Showing {filteredBookings.length} of {bookings.length} bookings</span>
              <span>Total Revenue: <span className="text-[#00a8e1] font-bold">₹{totalRevenue.toLocaleString()}</span></span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminBookingsPage
