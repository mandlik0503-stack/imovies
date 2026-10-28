import React, { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import MovieCard from './MovieCard'

const MovieCarousel = ({ title, movies = [], onWatchlistToggle, favorites = [] }) => {
  const scrollRef = useRef(null)

  const scroll = (direction) => {
    if (!scrollRef.current) return
    const amount = direction === 'left' ? -400 : 400
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' })
  }

  if (!movies.length) return null

  return (
    <div className="mb-10">
      {/* Section title */}
      <div className="flex items-center justify-between mb-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-[#00a8e1] rounded-full" />
          <h2 className="text-white text-xl font-bold">{title}</h2>
          <span className="text-[#8197a4] text-sm">{movies.length} movies</span>
        </div>
      </div>

      {/* Carousel container */}
      <div className="relative group/carousel">
        {/* Left scroll button */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#1a242f]/90 backdrop-blur-sm border border-[#253241] flex items-center justify-center text-white opacity-0 group-hover/carousel:opacity-100 transition-all duration-200 hover:bg-[#253241] hover:scale-110 shadow-lg"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          className="carousel-scroll flex gap-3 px-4 sm:px-6 lg:px-8"
        >
          {movies.map((movie) => (
            <MovieCard
              key={movie._id}
              movie={movie}
              onWatchlistToggle={onWatchlistToggle}
              isFavorite={favorites.includes(movie._id)}
            />
          ))}
        </div>

        {/* Right scroll button */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#1a242f]/90 backdrop-blur-sm border border-[#253241] flex items-center justify-center text-white opacity-0 group-hover/carousel:opacity-100 transition-all duration-200 hover:bg-[#253241] hover:scale-110 shadow-lg"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Left fade gradient */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#0f171e] to-transparent pointer-events-none z-[5]" />
        {/* Right fade gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0f171e] to-transparent pointer-events-none z-[5]" />
      </div>
    </div>
  )
}

export default MovieCarousel
