import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Star, Calendar, Play } from 'lucide-react'
import { getPosterUrl } from '../api/tmdb'

const CERT_COLORS = {
  U: 'bg-green-600',
  UA: 'bg-yellow-600',
  A: 'bg-red-600',
  S: 'bg-purple-600',
}

const MovieCard = ({ movie, onWatchlistToggle, isFavorite = false }) => {
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)
  const [heartAnimated, setHeartAnimated] = useState(false)

  const {
    _id,
    id,
    movieName,
    title,
    posterUrl,
    poster_path,
    genres = [],
    releaseDate,
    release_date,
    certification,
    language,
    averageRating,
    vote_average,
  } = movie || {}

  const activeId = _id || id
  const displayTitle = movieName || title || 'Untitled'
  const displayRating = vote_average || averageRating
  const activePoster = posterUrl || (poster_path ? getPosterUrl(poster_path, 'w500') : null)
  const activeDate = releaseDate || release_date
  const year = activeDate ? new Date(activeDate).getFullYear() : null
  const certColor = CERT_COLORS[certification] || 'bg-gray-600'

  const handleHeartClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setHeartAnimated(true)
    setTimeout(() => setHeartAnimated(false), 300)
    onWatchlistToggle && onWatchlistToggle(movie)
  }

  const handleBookNow = (e) => {
    e.preventDefault()
    e.stopPropagation()
    navigate(`/movieshows/${activeId}`)
  }

  return (
    <div className="group relative bg-[#1a242f] rounded-xl overflow-hidden shadow-lg cursor-pointer flex-shrink-0 w-44 sm:w-48 md:w-52 transition-all duration-300 hover:shadow-2xl hover:shadow-[#00a8e1]/10 hover:-translate-y-1">
      <Link to={`/moviedetails/${activeId}`} className="block">
        {/* Poster Media Box */}
        <div className="relative overflow-hidden bg-[#253241]" style={{ aspectRatio: '2/3' }}>
          {activePoster && !imgError ? (
            <img
              src={activePoster}
              alt={displayTitle}
              loading="lazy"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#253241] to-[#1a242f] flex flex-col items-center justify-center p-3 text-center">
              <div className="w-10 h-10 rounded-full bg-[#00a8e1]/10 flex items-center justify-center mb-2">
                <Play className="w-5 h-5 text-[#00a8e1]" />
              </div>
              <p className="text-white text-xs font-semibold line-clamp-2">{displayTitle}</p>
            </div>
          )}

          {/* Gradient Overlay bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

          {/* Certification badge */}
          {certification && (
            <div
              className={`absolute top-2 left-2 ${certColor} text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow`}
            >
              {certification}
            </div>
          )}

          {/* Watchlist heart */}
          <button
            onClick={handleHeartClick}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:bg-[#00a8e1] hover:text-white ${
              heartAnimated ? 'scale-125' : 'scale-100'
            }`}
            aria-label={isFavorite ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            <Heart
              className={`w-4 h-4 transition-colors duration-200 ${
                isFavorite ? 'fill-red-500 text-red-500' : 'text-white'
              }`}
            />
          </button>

          {/* Rating badge */}
          {displayRating > 0 && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/75 backdrop-blur-md rounded-md px-2 py-0.5 border border-white/10">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-white text-xs font-bold">
                {Number(displayRating).toFixed(1)}
              </span>
            </div>
          )}

          {/* Hover overlay with quick Book Now CTA */}
          <div className="absolute inset-0 bg-[#0f171e]/75 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-3 gap-2">
            <span className="text-white text-xs font-semibold text-center line-clamp-2 mb-1">
              {displayTitle}
            </span>
            <button
              onClick={handleBookNow}
              className="w-full bg-[#00a8e1] hover:bg-[#0891c9] text-white text-xs font-bold py-2 px-3 rounded-lg transition-transform transform translate-y-2 group-hover:translate-y-0 shadow-md shadow-[#00a8e1]/30"
            >
              Book Tickets
            </button>
            <span className="text-[11px] text-[#8197a4] hover:text-[#00a8e1]">
              View Details →
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="text-white text-sm font-semibold truncate mb-1 group-hover:text-[#00a8e1] transition-colors duration-200">
            {displayTitle}
          </h3>
          <div className="flex items-center gap-1 flex-wrap mb-1.5">
            {genres.slice(0, 2).map((g) => (
              <span
                key={g}
                className="text-[10px] bg-[#253241] text-[#8197a4] px-1.5 py-0.5 rounded font-medium"
              >
                {g}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between text-[#8197a4] text-[11px]">
            {year ? (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#00a8e1]" />
                {year}
              </span>
            ) : (
              <span />
            )}
            {language && <span className="uppercase text-[10px] tracking-wider">{language}</span>}
          </div>
        </div>
      </Link>
    </div>
  )
}

export default MovieCard
