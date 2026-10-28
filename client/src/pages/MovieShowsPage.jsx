import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { ArrowLeft, Clock, Calendar, MapPin, Play, Sparkles } from 'lucide-react'
import API from '../api/axios'
import Navbar from '../components/Navbar'
import LoadingSpinner from '../components/LoadingSpinner'
import Footer from '../components/Footer'
import { fetchMovieDetails } from '../api/tmdb'

const SHOW_TIMES = ['10:00 AM', '01:30 PM', '05:00 PM', '08:30 PM', '11:15 PM']

const MovieShowsPage = () => {
  const { movieId } = useParams()
  const navigate = useNavigate()

  const [movie, setMovie] = useState(null)
  const [shows, setShows] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedShow, setSelectedShow] = useState(null)
  const [imgError, setImgError] = useState(false)

  // Generate next 7 days in YYYY-MM-DD
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)

        // 1. Fetch movie info (from local DB or TMDB)
        let movieData = null
        try {
          const movieRes = await API.get(`/movie/${movieId}`)
          if (movieRes.data && movieRes.data.movieName) {
            movieData = movieRes.data
          }
        } catch {
          // Check TMDB fallback
        }

        if (!movieData) {
          movieData = await fetchMovieDetails(movieId)
        }
        setMovie(movieData)

        // 2. Fetch shows from backend (auto-provisions 7 days across theatres if not present)
        let allShows = []
        try {
          const showsRes = await API.get(`/shows/movie/${movieId}`)
          allShows = Array.isArray(showsRes.data) ? showsRes.data : []
        } catch (fetchErr) {
          console.warn('[MovieShows] Fetch error, creating local fallback:', fetchErr.message)
          allShows = []
        }

        // Offline / Network fallback if backend shows could not be retrieved
        if (allShows.length === 0) {
          let theatres = []
          try {
            const theatreRes = await API.get('/theatre')
            theatres = Array.isArray(theatreRes.data) ? theatreRes.data : []
          } catch {}

          if (theatres.length === 0) {
            theatres = [
              { theatreName: 'PVR IMAX Phoenix MarketCity', location: 'Kurla West, Mumbai' },
              { theatreName: "PVR Director's Cut Ambience Mall", location: 'Vasant Kunj, New Delhi' },
              { theatreName: 'INOX Megaplex Forum Mall', location: 'Koramangala, Bengaluru' },
            ]
          }

          const generated = []
          next7Days.forEach((dateStr, dayIdx) => {
            theatres.forEach((theatre, tIdx) => {
              SHOW_TIMES.slice(0, 4).forEach((time, timeIdx) => {
                generated.push({
                  showId: `show_${movieId}_d${dayIdx}_t${tIdx}_s${timeIdx}`,
                  movieId: String(movieId),
                  theatreName: theatre.theatreName,
                  location: theatre.location,
                  showDate: dateStr,
                  showTime: time,
                  theatre,
                })
              })
            })
          })
          allShows = generated
        }

        setShows(allShows)
        setSelectedDate(next7Days[0])
      } catch (err) {
        toast.error('Failed to load shows for this movie')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [movieId])

  // Filter shows for selected date
  const showsForDate = shows.filter((s) => {
    if (!s.showDate) return false
    const showDateStr = typeof s.showDate === 'string'
      ? s.showDate.split('T')[0]
      : new Date(s.showDate).toISOString().split('T')[0]
    return showDateStr === selectedDate
  })

  // Group by theatre
  const showsByTheatre = showsForDate.reduce((acc, show) => {
    const key = show.theatreName || 'Unknown Theatre'
    if (!acc[key]) acc[key] = { theatre: show, shows: [] }
    acc[key].shows.push(show)
    return acc
  }, {})

  const isDateToday = (dateStr) => {
    return dateStr === new Date().toISOString().split('T')[0]
  }

  // Real-Time Showtime Expiry Checker
  const isShowtimeExpired = (dateInput, timeStr, bufferMinutes = 0) => {
    if (!dateInput || !timeStr) return false
    try {
      let datePart = ''
      if (typeof dateInput === 'string') {
        datePart = dateInput.split('T')[0]
      } else if (dateInput instanceof Date && !isNaN(dateInput)) {
        const y = dateInput.getFullYear()
        const m = String(dateInput.getMonth() + 1).padStart(2, '0')
        const d = String(dateInput.getDate()).padStart(2, '0')
        datePart = `${y}-${m}-${d}`
      } else {
        return false
      }

      const trimmedTime = String(timeStr).trim()
      const match = trimmedTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i)
      if (!match) return false

      let hours = parseInt(match[1], 10)
      const minutes = parseInt(match[2], 10)
      const meridiem = match[4] ? match[4].toUpperCase() : null

      if (meridiem === 'PM' && hours < 12) hours += 12
      if (meridiem === 'AM' && hours === 12) hours = 0

      const [year, month, day] = datePart.split('-').map(Number)
      if (!year || !month || !day) return false

      const showDateObj = new Date(year, month - 1, day, hours, minutes, 0, 0)
      if (isNaN(showDateObj.getTime())) return false

      const now = new Date()
      const cutoff = new Date(now.getTime() - bufferMinutes * 60 * 1000)
      return showDateObj.getTime() <= cutoff.getTime()
    } catch {
      return false
    }
  }

  // Handle Dynamic Navigation with State & Query Parameters
  const handleSelectShowtime = (show) => {
    const showDateVal = show.showDate || selectedDate
    if (isShowtimeExpired(showDateVal, show.showTime, 0)) {
      toast.warning('This show has already started or ended. Please choose an upcoming showtime.')
      return
    }

    const targetShowId = show.showId || show._id
    const showDateStr = typeof show.showDate === 'string'
      ? show.showDate.split('T')[0]
      : new Date(show.showDate).toISOString().split('T')[0]

    setSelectedShow(show)

    const urlParams = new URLSearchParams({
      movieId: String(movieId),
      date: showDateStr || selectedDate,
      time: show.showTime,
      theatre: show.theatreName,
    }).toString()

    navigate(`/seatslug/${targetShowId}?${urlParams}`, {
      state: {
        showId: targetShowId,
        movieId: String(movieId),
        theatreId: show.theatre?._id || show.theatreId,
        theatreName: show.theatreName,
        theatreLocation: show.location || show.theatre?.location,
        showDate: showDateStr || selectedDate,
        showTime: show.showTime,
        movieTitle: movie?.movieName || movie?.title || 'Selected Movie',
        moviePoster: movie?.posterUrl,
        movie,
        theatre: show.theatre,
      },
    })
  }

  if (loading) return <LoadingSpinner message="Locating cinema showtimes..." />

  const displayTitle = movie?.movieName || movie?.title || 'Selected Movie'
  const displayPoster = movie?.posterUrl

  return (
    <div className="min-h-screen bg-[#0f171e]">
      <Navbar />

      <div className="pt-20 pb-16">
        {/* Movie mini banner */}
        {movie && (
          <div className="bg-[#1a242f] border-b border-[#253241]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center gap-5">
              <button
                onClick={() => navigate(`/moviedetails/${movieId}`)}
                className="w-9 h-9 rounded-xl bg-[#253241] hover:bg-[#00a8e1] text-[#8197a4] hover:text-white flex items-center justify-center transition-colors flex-shrink-0"
                aria-label="Back to movie details"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Poster */}
              <div className="w-14 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-[#253241] border border-[#253241]">
                {displayPoster && !imgError ? (
                  <img
                    src={displayPoster}
                    alt={displayTitle}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-6 h-6 text-[#00a8e1]" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-[#00a8e1]/10 border border-[#00a8e1]/30 text-[#00a8e1] text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                    Now Booking
                  </span>
                  {movie.certification && (
                    <span className="bg-[#253241] text-[#c0cdd5] px-2 py-0.5 rounded text-[10px] font-bold">
                      {movie.certification}
                    </span>
                  )}
                </div>
                <h1 className="text-white font-black text-xl sm:text-2xl">{displayTitle}</h1>
                <div className="flex items-center gap-3 text-[#8197a4] text-xs sm:text-sm mt-1 flex-wrap">
                  {movie.language && <span>{movie.language}</span>}
                  {movie.duration && <span>· {movie.duration} min</span>}
                  {movie.genres?.length > 0 && <span>· {movie.genres.slice(0, 2).join(', ')}</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          {/* Date Selector Tabs */}
          <div className="mb-8">
            <h2 className="text-white font-bold text-base sm:text-lg mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-[#00a8e1] rounded-full" />
              Select Date
            </h2>
            <div className="carousel-scroll flex gap-2 pb-2">
              {next7Days.map((date) => {
                const d = new Date(date)
                const isToday = isDateToday(date)
                const isSelected = selectedDate === date

                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`flex-shrink-0 flex flex-col items-center justify-center px-4 py-3 rounded-xl border transition-all duration-200 min-w-[76px] ${
                      isSelected
                        ? 'bg-[#00a8e1] border-[#00a8e1] text-white shadow-lg shadow-[#00a8e1]/30 scale-105'
                        : 'bg-[#1a242f] border-[#253241] text-[#c0cdd5] hover:border-[#00a8e1]/50 hover:text-white'
                    }`}
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-wider">
                      {isToday ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="text-lg font-black">{d.getDate()}</span>
                    <span className="text-[11px]">
                      {d.toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Shows Grouped By Theatre */}
          {Object.keys(showsByTheatre).length === 0 ? (
            <div className="text-center py-16 bg-[#1a242f] rounded-2xl border border-[#253241]">
              <Clock className="w-12 h-12 text-[#253241] mx-auto mb-3" />
              <h3 className="text-white text-lg font-bold mb-1">No Shows Scheduled</h3>
              <p className="text-[#8197a4] text-xs">
                Please pick another date from the tabs above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-white font-bold text-base sm:text-lg flex items-center gap-2">
                  <div className="w-1 h-5 bg-[#00a8e1] rounded-full" />
                  {Object.keys(showsByTheatre).length} Available Theatre
                  {Object.keys(showsByTheatre).length !== 1 ? 's' : ''}
                </h2>
                <span className="text-xs text-[#00a8e1] flex items-center gap-1 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" /> Fast-filling showtimes
                </span>
              </div>

              {Object.entries(showsByTheatre).map(([theatreName, { theatre, shows: theatreShows }]) => (
                <div
                  key={theatreName}
                  className="bg-[#1a242f] border border-[#253241] rounded-2xl p-6 hover:border-[#00a8e1]/30 transition-all duration-200 shadow-xl"
                >
                  {/* Theatre details */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
                    <div>
                      <h3 className="text-white font-bold text-lg">{theatreName}</h3>
                      {theatre?.location && (
                        <p className="text-[#8197a4] text-xs flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-[#00a8e1]" />
                          {theatre.location}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#8197a4]">
                      <span className="bg-[#253241] px-2 py-0.5 rounded text-[#c0cdd5]">M-Ticket</span>
                      <span className="bg-[#253241] px-2 py-0.5 rounded text-[#c0cdd5]">F&B Available</span>
                    </div>
                  </div>

                  {/* Showtime Pills */}
                  <div>
                    <p className="text-xs font-semibold text-[#8197a4] uppercase tracking-wider mb-2.5">
                      Available Showtimes
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {theatreShows.map((show) => {
                        const targetShowId = show.showId || show._id
                        const isChosen = selectedShow?.showId === targetShowId
                        const showDateVal = show.showDate || selectedDate
                        const expired = isShowtimeExpired(showDateVal, show.showTime, 0)

                        return (
                          <button
                            key={targetShowId}
                            disabled={expired}
                            onClick={() => !expired && handleSelectShowtime(show)}
                            title={
                              expired
                                ? 'This show has already started or ended. Online booking is closed.'
                                : `Select ${show.showTime} at ${theatreName}`
                            }
                            className={`group relative flex flex-col items-center border rounded-xl px-5 py-2.5 transition-all duration-200 shadow-md ${
                              expired
                                ? 'bg-[#151c24] border-[#253241] opacity-40 cursor-not-allowed select-none'
                                : isChosen
                                ? 'bg-[#00a8e1] border-[#00a8e1] scale-105'
                                : 'bg-[#0f171e] hover:bg-[#00a8e1] border-[#253241] hover:border-[#00a8e1] cursor-pointer'
                            }`}
                          >
                            <span
                              className={`font-bold text-sm tracking-wide ${
                                expired
                                  ? 'text-[#8197a4] line-through'
                                  : 'text-white group-hover:text-black'
                              }`}
                            >
                              {show.showTime}
                            </span>
                            <span
                              className={`text-[10px] font-semibold uppercase mt-0.5 ${
                                expired
                                  ? 'text-red-400 font-bold'
                                  : 'text-[#00a8e1] group-hover:text-black/80'
                              }`}
                            >
                              {expired ? 'Started / Expired' : 'Dolby Atmos 4K'}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default MovieShowsPage
