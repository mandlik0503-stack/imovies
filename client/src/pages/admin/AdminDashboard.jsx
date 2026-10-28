import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  Film, Building2, Ticket, DollarSign,
  Plus, TrendingUp, Users, Calendar, ChevronRight
} from 'lucide-react'
import API from '../../api/axios'
import Navbar from '../../components/Navbar'
import LoadingSpinner from '../../components/LoadingSpinner'

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className={`bg-[#1a242f] border border-[#253241] rounded-2xl p-6 flex items-start gap-4 hover:border-${color}/40 transition-all duration-200`}>
    <div className={`w-12 h-12 rounded-xl bg-${color}/10 flex items-center justify-center flex-shrink-0`}>
      <Icon className={`w-6 h-6 text-${color}`} />
    </div>
    <div>
      <p className="text-[#8197a4] text-sm">{label}</p>
      <p className="text-white font-black text-2xl mt-0.5">{value ?? '—'}</p>
    </div>
  </div>
)

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ movies: 0, theatres: 0, bookings: 0, revenue: 0 })
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [moviesRes, theatresRes, bookingsRes] = await Promise.allSettled([
          API.get('/movie'),
          API.get('/theatre'),
          API.get('/bookings/all'),
        ])

        const movies = moviesRes.status === 'fulfilled' ? (moviesRes.value.data || []) : []
        const theatres = theatresRes.status === 'fulfilled' ? (theatresRes.value.data || []) : []
        const bookings = bookingsRes.status === 'fulfilled' ? (bookingsRes.value.data || []) : []

        const revenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)

        setStats({
          movies: movies.length,
          theatres: theatres.length,
          bookings: bookings.length,
          revenue,
        })
        setRecentBookings(bookings.slice(0, 10))
      } catch {
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <LoadingSpinner message="Loading dashboard..." />

  const quickActions = [
    { label: 'Add Movie', href: '/addmovie', icon: Film, color: 'bg-purple-600 hover:bg-purple-700' },
    { label: 'Add Theatre', href: '/addtheatre', icon: Building2, color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Add Show', href: '/addshow', icon: Calendar, color: 'bg-green-600 hover:bg-green-700' },
    { label: 'All Bookings', href: '/adminbookings', icon: Ticket, color: 'bg-[#00a8e1] hover:bg-[#0891c9]' },
  ]

  return (
    <div className="min-h-screen bg-[#0f171e]">
      <Navbar />

      <div className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-white">Admin Dashboard</h1>
          <p className="text-[#8197a4] mt-1">Welcome back! Here's what's happening with iMovies.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <StatCard icon={Film} label="Total Movies" value={stats.movies} color="purple-400" />
          <StatCard icon={Building2} label="Theatres" value={stats.theatres} color="blue-400" />
          <StatCard icon={Ticket} label="Total Bookings" value={stats.bookings} color="[#00a8e1]" />
          <StatCard icon={DollarSign} label="Total Revenue" value={`₹${stats.revenue.toLocaleString()}`} color="green-400" />
        </div>

        {/* Quick Actions */}
        <div className="mb-10">
          <h2 className="text-white font-bold text-xl mb-5 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#00a8e1]" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickActions.map(({ label, href, icon: Icon, color }) => (
              <Link
                key={label}
                to={href}
                className={`${color} text-white font-semibold px-4 py-4 rounded-xl flex flex-col items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-sm text-center">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Bookings Table */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-bold text-xl flex items-center gap-2">
              <Users className="w-5 h-5 text-[#00a8e1]" />
              Recent Bookings
            </h2>
            <Link
              to="/adminbookings"
              className="flex items-center gap-1.5 text-[#00a8e1] hover:text-[#0891c9] text-sm transition-colors duration-200"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <div className="text-center py-16 bg-[#1a242f] rounded-2xl border border-[#253241]">
              <Ticket className="w-12 h-12 text-[#253241] mx-auto mb-3" />
              <p className="text-[#8197a4]">No bookings yet</p>
            </div>
          ) : (
            <div className="bg-[#1a242f] border border-[#253241] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#253241]">
                      {['Booking ID', 'User', 'Movie', 'Theatre', 'Date', 'Amount', 'Status'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[#8197a4] text-xs uppercase tracking-wider font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#253241]">
                    {recentBookings.map((booking) => (
                      <tr key={booking._id} className="hover:bg-[#253241]/30 transition-colors duration-150">
                        <td className="px-4 py-3 text-[#00a8e1] font-mono text-xs">
                          {booking._id?.slice(-8).toUpperCase()}
                        </td>
                        <td className="px-4 py-3 text-[#c0cdd5] text-sm max-w-[120px] truncate">
                          {booking.userEmail}
                        </td>
                        <td className="px-4 py-3 text-white text-sm font-medium max-w-[120px] truncate">
                          {booking.movieName || booking.movie?.movieName || '—'}
                        </td>
                        <td className="px-4 py-3 text-[#c0cdd5] text-sm max-w-[120px] truncate">
                          {booking.theatreName || booking.show?.theatreName || '—'}
                        </td>
                        <td className="px-4 py-3 text-[#8197a4] text-xs">
                          {booking.showDate
                            ? new Date(booking.showDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-[#00a8e1] font-semibold text-sm">
                          ₹{booking.totalAmount || 0}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            booking.status === 'Completed' ? 'bg-green-500/20 text-green-400'
                            : booking.status === 'Cancelled' ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {booking.status || 'Completed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
