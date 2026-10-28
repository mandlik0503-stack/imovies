import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Info, Star, ChevronLeft, ChevronRight, Calendar, Video } from 'lucide-react'
import TrailerModal from './TrailerModal'

const HeroBanner = ({ movies = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [imgError, setImgError] = useState({})
  const [trailerModalOpen, setTrailerModalOpen] = useState(false)
  const navigate = useNavigate()

  const featured = movies.slice(0, 6)

  const goTo = useCallback(
    (index) => {
      if (isTransitioning) return
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex(index)
        setIsTransitioning(false)
      }, 300)
    },
    [isTransitioning]
  )

  const goNext = useCallback(() => {
    goTo((currentIndex + 1) % featured.length)
  }, [currentIndex, featured.length, goTo])

  const goPrev = useCallback(() => {
    goTo((currentIndex - 1 + featured.length) % featured.length)
  }, [currentIndex, featured.length, goTo])

  // Auto-rotate every 6 seconds
  useEffect(() => {
    if (featured.length <= 1 || trailerModalOpen) return
    const timer = setInterval(goNext, 6000)
    return () => clearInterval(timer)
  }, [goNext, featured.length, trailerModalOpen])

  if (!featured.length) {
    return (
      <div className="w-full h-[60vh] bg-gradient-to-br from-[#1a242f] to-[#0f171e] flex items-center justify-center">
        <p className="text-[#8197a4] text-lg">No featured movies available</p>
      </div>
    )
  }

  const movie = featured[currentIndex]
  const {
    _id,
    id,
    movieName,
    title,
    backdropUrl,
    posterUrl,
    genres = [],
    description,
    tagline,
    releaseDate,
    averageRating,
    vote_average,
    voteCount,
    certification,
    language,
    duration,
    trailerKey,
  } = movie || {}

  const activeId = _id || id
  const displayTitle = movieName || title
  const activeRating = vote_average || averageRating
  const bgImage = backdropUrl || posterUrl
  const hasBg = bgImage && !imgError[activeId]

  return (
    <>
      <div className="relative w-full overflow-hidden" style={{ height: 'min(88vh, 720px)' }}>
        {/* Background Backdrop */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {hasBg ? (
            <>
              <img
                src={bgImage}
                alt={displayTitle}
                onError={() => setImgError((p) => ({ ...p, [activeId]: true }))}
                className="w-full h-full object-cover object-center scale-100 transition-transform duration-1000 ease-out"
              />
              {/* Amazon Prime Multi-layer Gradients */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0f171e] via-[#0f171e]/75 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f171e] via-[#0f171e]/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#0f171e]/60 via-transparent to-transparent" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1a242f] via-[#0f171e] to-black">
              <div className="absolute inset-0 bg-gradient-to-r from-[#0f171e] via-[#0f171e]/60 to-transparent" />
            </div>
          )}
        </div>

        {/* Content Billboard */}
        <div
          className={`relative z-10 h-full flex items-center px-4 sm:px-8 lg:px-16 transition-opacity duration-300 ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="max-w-2xl pt-12 sm:pt-6">
            {/* Prime & TMDB Badge */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="bg-[#00a8e1] text-black text-[11px] font-black tracking-wider uppercase px-2 py-0.5 rounded shadow-sm">
                Prime Exclusive
              </span>
              {certification && (
                <span className="bg-[#1a242f]/90 border border-[#253241] text-[#00a8e1] text-xs font-semibold px-2 py-0.5 rounded">
                  {certification}
                </span>
              )}
              {language && (
                <span className="bg-[#1a242f]/80 text-[#c0cdd5] text-xs px-2 py-0.5 rounded border border-[#253241]">
                  {language}
                </span>
              )}
              {duration && (
                <span className="bg-[#1a242f]/80 text-[#c0cdd5] text-xs px-2 py-0.5 rounded border border-[#253241]">
                  {duration} min
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-2 drop-shadow-2xl">
              {displayTitle}
            </h1>

            {/* Tagline if present */}
            {tagline && (
              <p className="text-[#00a8e1] text-xs sm:text-sm font-medium italic mb-3">
                "{tagline}"
              </p>
            )}

            {/* Rating & Genres */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {activeRating > 0 && (
                <div className="flex items-center gap-1.5 bg-[#1a242f]/80 border border-[#253241] px-2.5 py-1 rounded-lg backdrop-blur-sm">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-yellow-400 font-bold text-sm">
                    {Number(activeRating).toFixed(1)}
                  </span>
                  <span className="text-[#8197a4] text-xs">/10 TMDB</span>
                </div>
              )}
              {genres.slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="text-[#c0cdd5] text-xs sm:text-sm bg-[#253241]/80 backdrop-blur-sm px-3 py-1 rounded-full border border-[#253241]"
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Release date */}
            {releaseDate && (
              <div className="flex items-center gap-2 mb-3 text-[#8197a4] text-xs sm:text-sm">
                <Calendar className="w-4 h-4 text-[#00a8e1]" />
                <span>
                  {new Date(releaseDate).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}

            {/* Overview */}
            {description && (
              <p className="text-[#c0cdd5] text-xs sm:text-sm leading-relaxed mb-6 max-w-xl line-clamp-3 sm:line-clamp-4">
                {description}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <button
                onClick={() => navigate(`/movieshows/${activeId}`)}
                className="flex items-center gap-2 bg-[#00a8e1] hover:bg-[#0891c9] text-white font-bold px-6 sm:px-8 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-[#00a8e1]/30 hover:scale-105"
              >
                <Play className="w-4 h-4 fill-white" />
                Book Tickets
              </button>

              <button
                onClick={() => setTrailerModalOpen(true)}
                className="flex items-center gap-2 bg-[#1a242f]/90 hover:bg-[#253241] backdrop-blur-sm text-white font-semibold px-5 py-3 rounded-xl border border-[#253241] hover:border-[#00a8e1]/50 transition-all duration-200"
              >
                <Video className="w-4 h-4 text-[#00a8e1]" />
                Watch Trailer
              </button>

              <button
                onClick={() => navigate(`/moviedetails/${activeId}`)}
                className="flex items-center gap-2 bg-transparent hover:bg-white/10 text-[#c0cdd5] hover:text-white font-medium px-4 py-3 rounded-xl transition-all duration-200"
              >
                <Info className="w-4 h-4" />
                Details
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Navigation Arrows */}
        {featured.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-[#00a8e1] hover:border-[#00a8e1] transition-all duration-200 shadow-xl"
              aria-label="Previous movie"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-[#00a8e1] hover:border-[#00a8e1] transition-all duration-200 shadow-xl"
              aria-label="Next movie"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Carousel Dots */}
        {featured.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {featured.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'bg-[#00a8e1] w-8 h-2'
                    : 'bg-white/40 hover:bg-white/70 w-2 h-2'
                }`}
              />
            ))}
          </div>
        )}

        {/* Gradient edge bottom blend */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0f171e] via-[#0f171e]/80 to-transparent pointer-events-none z-10" />
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={trailerModalOpen}
        onClose={() => setTrailerModalOpen(false)}
        trailerKey={trailerKey}
        movieTitle={displayTitle}
      />
    </>
  )
}

export default HeroBanner
