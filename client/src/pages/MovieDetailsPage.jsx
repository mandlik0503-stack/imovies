import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  Ticket, Heart, Star, Calendar, Clock, Globe, Shield,
  ArrowLeft, Send, Play, Video, DollarSign, Award, Users,
  CheckCircle2, Sparkles, Building2
} from 'lucide-react'
import API from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import LoadingSpinner from '../components/LoadingSpinner'
import StarRating from '../components/StarRating'
import TrailerModal from '../components/TrailerModal'
import Footer from '../components/Footer'
import { fetchMovieDetails, getBackdropUrl, getPosterUrl } from '../api/tmdb'

const CERT_COLORS = {
  U: 'bg-green-600',
  UA: 'bg-yellow-600',
  A: 'bg-red-600',
  S: 'bg-purple-600',
  'PG-13': 'bg-yellow-600',
  R: 'bg-red-600',
}

const formatCurrency = (amount) => {
  if (!amount || amount <= 0) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatRuntime = (minutes) => {
  if (!minutes) return '—'
  const mins = parseInt(minutes, 10)
  if (isNaN(mins)) return minutes
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m (${mins} min)` : `${m} min`
}

const MovieDetailsPage = () => {
  const { movieId } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const [movie, setMovie] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [trailerModalOpen, setTrailerModalOpen] = useState(false)

  // 1. Fetch movie details from TMDB (with local DB fallback)
  const loadMovie = useCallback(async () => {
    try {
      // First attempt TMDB API
      const tmdbData = await fetchMovieDetails(movieId)
      if (tmdbData && tmdbData.movieName) {
        setMovie(tmdbData)
        return
      }

      // Fallback to local server API
      const res = await API.get(`/movie/${movieId}`)
      if (res.data) {
        setMovie(res.data)
      }
    } catch (err) {
      // Final attempt: check local DB
      try {
        const localRes = await API.get(`/movie/${movieId}`)
        setMovie(localRes.data)
      } catch {
        toast.error('Failed to load movie details')
      }
    }
  }, [movieId])

  // 2. Fetch user reviews from backend
  const fetchReviews = useCallback(async () => {
    try {
      const res = await API.get(`/review/movie/${movieId}`)
      const reviewData = Array.isArray(res.data) ? res.data : res.data?.reviews || []
      setReviews(reviewData)
      if (user?.email) {
        setHasReviewed(reviewData.some((r) => r.userEmail === user.email))
      }
    } catch {
      // Reviews might be empty
    }
  }, [movieId, user])

  // 3. Fetch user watchlist status
  const fetchFavoriteStatus = useCallback(async () => {
    if (!user?.email) return
    try {
      const res = await API.get(`/user/watchlist/${user.email}`)
      const list = res.data?.watchlist || res.data || []
      const ids = list.map((m) => String(m._id || m.id || m))
      setIsFavorite(ids.includes(String(movieId)))
    } catch {
      // Silent fail
    }
  }, [user, movieId])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.allSettled([loadMovie(), fetchReviews(), fetchFavoriteStatus()])
      setLoading(false)
    }
    init()
  }, [loadMovie, fetchReviews, fetchFavoriteStatus])

  // Toggle watchlist
  const handleWatchlistToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save movies to your watchlist')
      return
    }
    try {
      if (isFavorite) {
        await API.delete(`/user/watchlist/${user.email}/${movieId}`)
        setIsFavorite(false)
        toast.success('Removed from watchlist')
      } else {
        await API.post('/user/watchlist', {
          email: user.email,
          movieId,
          movieData: movie,
        })
        setIsFavorite(true)
        toast.success('Added to your watchlist!')
      }
    } catch {
      toast.error('Failed to update watchlist')
    }
  }

  // Submit review
  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!reviewRating) {
      toast.error('Please select a star rating')
      return
    }
    if (!reviewText.trim()) {
      toast.error('Please write a brief review')
      return
    }
    setSubmittingReview(true)
    try {
      await API.post('/review', {
        movieId,
        userEmail: user.email,
        username: user.username,
        rating: reviewRating,
        reviewText: reviewText.trim(),
        review: reviewText.trim(),
      })
      toast.success('Review posted successfully! ⭐')
      setReviewText('')
      setHasReviewed(true)
      fetchReviews()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) return <LoadingSpinner message="Loading movie details from TMDB..." />

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#0f171e] flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-[#1a242f] border border-[#253241] rounded-2xl p-8">
          <p className="text-white text-xl font-bold mb-2">Movie Not Found</p>
          <p className="text-[#8197a4] text-sm mb-6">
            The requested title could not be retrieved from the catalog.
          </p>
          <button
            onClick={() => navigate('/home')}
            className="px-6 py-2.5 bg-[#00a8e1] hover:bg-[#0891c9] text-white font-semibold rounded-xl text-sm transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const {
    _id,
    id,
    movieName,
    title,
    tagline,
    posterUrl,
    poster_path,
    backdropUrl,
    backdrop_path,
    genres = [],
    releaseDate,
    release_date,
    language,
    duration,
    runtime,
    certification,
    description,
    overview,
    averageRating,
    vote_average,
    voteCount,
    vote_count,
    cast = [],
    trailerKey,
    budget,
    revenue,
    status,
    productionCompanies = [],
  } = movie

  const displayTitle = movieName || title
  const displayOverview = description || overview
  const displayRating = vote_average || averageRating
  const displayVotes = vote_count || voteCount
  const activeBackdrop = backdropUrl || (backdrop_path ? getBackdropUrl(backdrop_path) : posterUrl)
  const activePoster = posterUrl || (poster_path ? getPosterUrl(poster_path) : null)
  const activeDate = releaseDate || release_date
  const activeRuntime = runtime || duration
  const certColor = CERT_COLORS[certification] || 'bg-[#253241]'

  return (
    <div className="min-h-screen bg-[#0f171e]">
      <Navbar />

      {/* Cinematic Backdrop Hero Section */}
      <div className="relative pt-16">
        <div className="relative overflow-hidden" style={{ minHeight: '520px' }}>
          {activeBackdrop && !imgError ? (
            <>
              <img
                src={activeBackdrop}
                alt={displayTitle}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover object-top filter brightness-90 scale-100"
                style={{ height: '540px' }}
              />
              {/* Multi-gradient Vignette */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0f171e] via-[#0f171e]/85 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f171e] via-[#0f171e]/40 to-transparent" />
            </>
          ) : (
            <div className="w-full h-[540px] bg-gradient-to-br from-[#1a242f] to-[#0f171e]" />
          )}

          {/* Hero Content Overlay */}
          <div className="absolute inset-0 flex items-end px-4 sm:px-8 lg:px-16 pb-10">
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-end w-full max-w-7xl mx-auto">
              {/* High-res Poster Box */}
              <div className="hidden sm:block flex-shrink-0 w-44 md:w-56 rounded-2xl overflow-hidden shadow-2xl border-2 border-[#253241] group">
                {activePoster ? (
                  <img
                    src={activePoster}
                    alt={displayTitle}
                    className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-[#253241] flex items-center justify-center">
                    <Play className="w-12 h-12 text-[#00a8e1]" />
                  </div>
                )}
              </div>

              {/* Title & Metadata */}
              <div className="flex-1 pb-1">
                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="bg-[#00a8e1] text-black text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow">
                    Prime Video
                  </span>
                  {certification && (
                    <span className={`${certColor} text-white text-xs font-bold px-2 py-0.5 rounded`}>
                      {certification}
                    </span>
                  )}
                  {language && (
                    <span className="bg-[#1a242f]/90 border border-[#253241] text-[#c0cdd5] text-xs font-medium px-2 py-0.5 rounded">
                      {language}
                    </span>
                  )}
                  <span className="bg-[#1a242f]/90 border border-[#253241] text-[#c0cdd5] text-xs font-medium px-2 py-0.5 rounded">
                    4K Ultra HD
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-2 leading-tight drop-shadow-2xl">
                  {displayTitle}
                </h1>

                {/* Tagline */}
                {tagline && (
                  <p className="text-[#00a8e1] text-sm sm:text-base italic font-medium mb-3">
                    "{tagline}"
                  </p>
                )}

                {/* Genres */}
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  {genres.map((g) => (
                    <span
                      key={g}
                      className="text-xs bg-[#1a242f]/80 backdrop-blur-md text-[#c0cdd5] px-3 py-1 rounded-full border border-[#253241] font-medium"
                    >
                      {g}
                    </span>
                  ))}
                </div>

                {/* Metadata Row */}
                <div className="flex items-center gap-4 sm:gap-6 flex-wrap text-xs sm:text-sm text-[#8197a4]">
                  {activeDate && (
                    <span className="flex items-center gap-1.5 text-white">
                      <Calendar className="w-4 h-4 text-[#00a8e1]" />
                      {new Date(activeDate).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}

                  {activeRuntime && (
                    <span className="flex items-center gap-1.5 text-white">
                      <Clock className="w-4 h-4 text-[#00a8e1]" />
                      {formatRuntime(activeRuntime)}
                    </span>
                  )}

                  {displayRating > 0 && (
                    <div className="flex items-center gap-1.5 bg-black/60 border border-yellow-400/30 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-yellow-400 font-black text-sm">
                        {Number(displayRating).toFixed(1)}
                      </span>
                      <span className="text-[#8197a4] text-xs">/10 TMDB</span>
                      {displayVotes > 0 && (
                        <span className="text-[#8197a4] text-xs">
                          ({Number(displayVotes).toLocaleString()} votes)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="bg-[#1a242f]/60 border-y border-[#253241] backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <button
                onClick={() => navigate(`/movieshows/${_id || id}`)}
                className="flex items-center gap-2 bg-[#00a8e1] hover:bg-[#0891c9] text-white font-bold px-6 sm:px-8 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-[#00a8e1]/30 hover:scale-105"
              >
                <Ticket className="w-5 h-5" />
                Book Tickets
              </button>

              <button
                onClick={() => setTrailerModalOpen(true)}
                className="flex items-center gap-2 bg-[#253241] hover:bg-[#2f4052] border border-[#253241] hover:border-[#00a8e1]/50 text-white font-semibold px-5 py-3 rounded-xl transition-all duration-200"
              >
                <Video className="w-5 h-5 text-[#00a8e1]" />
                Watch Trailer
              </button>

              <button
                onClick={handleWatchlistToggle}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold border transition-all duration-200 ${
                  isFavorite
                    ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30'
                    : 'bg-[#253241] border-[#253241] text-[#c0cdd5] hover:border-[#00a8e1]/50 hover:text-white'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                {isFavorite ? 'In Watchlist' : 'Add to Watchlist'}
              </button>
            </div>

            <button
              onClick={() => navigate('/home')}
              className="flex items-center gap-2 text-[#8197a4] hover:text-white text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Catalog
            </button>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left 2 Columns: Overview, Top Billed Cast, Reviews */}
            <div className="lg:col-span-2 space-y-10">
              {/* Synopsis */}
              {displayOverview && (
                <div>
                  <h2 className="text-white text-xl font-bold mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-[#00a8e1] rounded-full" />
                    Storyline
                  </h2>
                  <p className="text-[#c0cdd5] text-sm sm:text-base leading-relaxed">
                    {displayOverview}
                  </p>
                </div>
              )}

              {/* Top Billed Cast */}
              {cast.length > 0 && (
                <div>
                  <h2 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-[#00a8e1] rounded-full" />
                    Top Billed Cast
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {cast.slice(0, 8).map((actor) => (
                      <div
                        key={actor.id || actor.name}
                        className="bg-[#1a242f] border border-[#253241] rounded-xl p-3 flex items-center gap-3 hover:border-[#00a8e1]/40 transition-colors"
                      >
                        <img
                          src={actor.profileUrl}
                          alt={actor.name}
                          className="w-12 h-12 rounded-full object-cover bg-[#253241] shrink-0 border border-[#253241]"
                          onError={(e) => {
                            e.target.src =
                              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
                          }}
                        />
                        <div className="min-w-0">
                          <p className="text-white text-xs font-bold truncate">{actor.name}</p>
                          <p className="text-[#8197a4] text-[11px] truncate mt-0.5">
                            {actor.character}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Community Reviews & Feedback */}
              <div>
                <h2 className="text-white text-xl font-bold mb-5 flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-[#00a8e1] rounded-full" />
                  Viewer Reviews & Ratings
                  {reviews.length > 0 && (
                    <span className="text-[#8197a4] text-xs font-normal">
                      ({reviews.length} community review{reviews.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </h2>

                {/* Submit Review Card */}
                {isAuthenticated && !hasReviewed && (
                  <form
                    onSubmit={handleReviewSubmit}
                    className="bg-[#1a242f] border border-[#253241] rounded-2xl p-5 mb-6 shadow-xl"
                  >
                    <h3 className="text-white font-bold text-sm mb-3">Rate and Review this Title</h3>
                    <div className="mb-4">
                      <p className="text-[#8197a4] text-xs mb-1.5">Your Star Rating</p>
                      <StarRating value={reviewRating} onChange={setReviewRating} size="lg" />
                    </div>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your thoughts on the performances, cinematography, direction..."
                      rows={3}
                      className="w-full bg-[#0f171e] border border-[#253241] text-white placeholder-[#8197a4] focus:border-[#00a8e1] focus:outline-none rounded-xl p-3.5 text-xs sm:text-sm resize-none mb-3 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="flex items-center gap-2 bg-[#00a8e1] hover:bg-[#0891c9] disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-[#00a8e1]/20"
                    >
                      {submittingReview ? 'Posting...' : <><Send className="w-4 h-4" /> Post Review</>}
                    </button>
                  </form>
                )}

                {hasReviewed && (
                  <div className="bg-green-950/30 border border-green-500/30 rounded-xl p-4 mb-6 text-green-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Thank you! Your feedback has been recorded for this film.
                  </div>
                )}

                {/* Reviews List */}
                {reviews.length === 0 ? (
                  <div className="text-center py-10 bg-[#1a242f] rounded-2xl border border-[#253241]">
                    <Star className="w-8 h-8 text-[#253241] mx-auto mb-2" />
                    <p className="text-[#8197a4] text-xs">
                      No community reviews yet. Be the first to share your rating!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((r, i) => (
                      <div
                        key={r._id || i}
                        className="bg-[#1a242f] border border-[#253241] rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#00a8e1]/20 border border-[#00a8e1]/40 flex items-center justify-center text-[#00a8e1] text-xs font-bold">
                              {(r.username || r.userEmail || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white font-bold text-xs">
                                {r.username || r.userEmail || 'Cinema Lover'}
                              </p>
                              {r.createdAt && (
                                <p className="text-[#8197a4] text-[10px]">
                                  {new Date(r.createdAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <StarRating value={r.rating} readOnly size="sm" />
                        </div>
                        {(r.reviewText || r.review) && (
                          <p className="text-[#c0cdd5] text-xs leading-relaxed mt-2 pl-10">
                            {r.reviewText || r.review}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Cinema Fact Sheet Card */}
            <div className="lg:col-span-1">
              <div className="bg-[#1a242f] border border-[#253241] rounded-2xl p-6 sticky top-24 shadow-2xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#253241]">
                  <h3 className="text-white font-bold text-base flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#00a8e1]" />
                    Movie Factsheet
                  </h3>
                  <span className="text-[11px] font-semibold text-[#00a8e1] uppercase">
                    TMDB Verified
                  </span>
                </div>

                <dl className="space-y-3.5 text-xs">
                  <div className="flex justify-between items-center py-1">
                    <dt className="text-[#8197a4]">Status</dt>
                    <dd className="text-white font-semibold">{status || 'Released'}</dd>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-[#253241]/60">
                    <dt className="text-[#8197a4]">Original Language</dt>
                    <dd className="text-white font-semibold uppercase">{language}</dd>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-[#253241]/60">
                    <dt className="text-[#8197a4]">Runtime</dt>
                    <dd className="text-white font-semibold">{formatRuntime(activeRuntime)}</dd>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-[#253241]/60">
                    <dt className="text-[#8197a4]">Release Date</dt>
                    <dd className="text-white font-semibold">
                      {activeDate
                        ? new Date(activeDate).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-[#253241]/60">
                    <dt className="text-[#8197a4]">Budget</dt>
                    <dd className="text-white font-semibold">{formatCurrency(budget)}</dd>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-[#253241]/60">
                    <dt className="text-[#8197a4]">Box Office Revenue</dt>
                    <dd className="text-[#00a8e1] font-bold">{formatCurrency(revenue)}</dd>
                  </div>
                </dl>

                {/* Production Companies */}
                {productionCompanies.length > 0 && (
                  <div className="pt-3 border-t border-[#253241]">
                    <p className="text-[#8197a4] text-xs font-semibold mb-2">Production</p>
                    <div className="flex flex-wrap gap-1.5">
                      {productionCompanies.map((c) => (
                        <span
                          key={c.id || c.name}
                          className="bg-[#253241] text-[#c0cdd5] text-[11px] px-2 py-0.5 rounded"
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Check Showtimes CTA Button */}
                <div className="pt-2">
                  <button
                    onClick={() => navigate(`/movieshows/${_id || id}`)}
                    className="w-full bg-[#00a8e1] hover:bg-[#0891c9] text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-[#00a8e1]/30 flex items-center justify-center gap-2"
                  >
                    <Ticket className="w-4 h-4" />
                    Select Theatres & Showtimes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={trailerModalOpen}
        onClose={() => setTrailerModalOpen(false)}
        trailerKey={trailerKey}
        movieTitle={displayTitle}
      />

      <Footer />
    </div>
  )
}

export default MovieDetailsPage
