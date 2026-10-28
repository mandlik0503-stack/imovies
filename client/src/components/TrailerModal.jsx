import React, { useEffect } from 'react'
import { X, Film, AlertCircle } from 'lucide-react'

const TrailerModal = ({ isOpen, onClose, trailerKey, movieTitle }) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#1a242f] border border-[#253241] rounded-2xl overflow-hidden shadow-2xl transition-all transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#253241] bg-[#0f171e]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00a8e1]/10 border border-[#00a8e1]/20 flex items-center justify-center">
              <Film className="w-4 h-4 text-[#00a8e1]" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base sm:text-lg truncate max-w-md">
                {movieTitle || 'Official Trailer'}
              </h3>
              <span className="text-[11px] text-[#00a8e1] font-semibold uppercase tracking-wider">
                Official TMDB HD Trailer
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#253241] hover:bg-[#00a8e1] text-[#c0cdd5] hover:text-white flex items-center justify-center transition-all duration-200"
            aria-label="Close trailer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          {trailerKey ? (
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
              title={`${movieTitle} Official Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <div className="text-center p-8">
              <AlertCircle className="w-12 h-12 text-[#8197a4] mx-auto mb-3" />
              <p className="text-white font-semibold text-lg mb-1">Trailer Not Available</p>
              <p className="text-[#8197a4] text-sm max-w-sm">
                No official video trailer could be found on TMDB for this title.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TrailerModal
