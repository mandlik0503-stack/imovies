import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Heart, Trash2, Film } from 'lucide-react'
import API from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import MovieCard from '../components/MovieCard'
import LoadingSpinner from '../components/LoadingSpinner'
import Footer from '../components/Footer'

const WatchlistPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [watchlist, setWatchlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState(null)

  const fetchWatchlist = useCallback(async () => {
    if (!user?.email) return
    try {
      setLoading(true)
      const res = await API.get(`/user/watchlist/${user.email}`)
      setWatchlist(res.data?.watchlist || [])
    } catch {
      toast.error('Failed to load watchlist')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchWatchlist()
  }, [fetchWatchlist])

  const handleRemove = useCallback(async (movie) => {
    const movieId = movie._id || movie
    setRemovingId(movieId)
    try {
      await API.delete(`/user/watchlist/${user.email}/${movieId}`)
      setWatchlist((prev) => prev.filter((m) => (m._id || m) !== movieId))
      toast.success('Removed from watchlist')
    } catch {
      toast.error('Failed to remove from watchlist')
    } finally {
      setRemovingId(null)
    }
  }, [user])

  if (loading) return <LoadingSpinner message="Loading your watchlist..." />

  return (
    <div className="min-h-screen bg-[#0f171e]">
      <Navbar />

      <div className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Heart className="w-8 h-8 text-[#00a8e1]" />
            My Watchlist
          </h1>
          <p className="text-[#8197a4] mt-1">
            {watchlist.length > 0
              ? `${watchlist.length} movie${watchlist.length !== 1 ? 's' : ''} saved`
              : 'No movies saved yet'}
          </p>
        </div>

        {watchlist.length === 0 ? (
          <div className="text-center py-24 bg-[#1a242f] rounded-2xl border border-[#253241]">
            <div className="w-20 h-20 rounded-full bg-[#253241] flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-[#8197a4]" />
            </div>
            <h3 className="text-white text-xl font-bold mb-2">Your Watchlist is Empty</h3>
            <p className="text-[#8197a4] mb-6 max-w-md mx-auto">
              Add movies to your watchlist by clicking the heart icon on any movie card.
            </p>
            <button
              onClick={() => navigate('/home')}
              className="flex items-center gap-2 bg-[#00a8e1] hover:bg-[#0891c9] text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 mx-auto"
            >
              <Film className="w-4 h-4" />
              Browse Movies
            </button>
          </div>
        ) : (
          <>
            {/* Clear all */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => {
                  if (window.confirm('Remove all movies from watchlist?')) {
                    watchlist.forEach((m) => handleRemove(m))
                  }
                }}
                className="flex items-center gap-2 text-[#8197a4] hover:text-red-400 text-sm transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>

            {/* Movie grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {watchlist.map((movie) => {
                const movieId = movie._id || movie
                return (
                  <div key={movieId} className="relative">
                    <MovieCard
                      movie={typeof movie === 'object' ? movie : { _id: movie }}
                      isFavorite={true}
                      onWatchlistToggle={handleRemove}
                    />
                    {removingId === movieId && (
                      <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default WatchlistPage
