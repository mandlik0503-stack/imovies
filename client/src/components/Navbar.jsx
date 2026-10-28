import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Film, Search, X, Menu, Bell, ChevronDown, Ticket, Heart,
  LayoutDashboard, LogOut, User, Key, Star, Calendar, Loader2
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { searchMovies } from '../api/tmdb'
import TmdbKeyModal from './TmdbKeyModal'

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [tmdbModalOpen, setTmdbModalOpen] = useState(false)

  const dropdownRef = useRef(null)
  const searchBoxRef = useRef(null)
  const searchInputRef = useRef(null)
  const debounceTimerRef = useRef(null)

  // Detect scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search auto-complete
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([])
      setIsSearching(false)
      setShowSuggestions(false)
      return
    }

    clearTimeout(debounceTimerRef.current)
    setIsSearching(true)

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchMovies(searchQuery)
        setSuggestions(results.slice(0, 5))
        setShowSuggestions(true)
      } catch (err) {
        setSuggestions([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(debounceTimerRef.current)
  }, [searchQuery])

  const handleLogout = () => {
    logout()
    setDropdownOpen(false)
    navigate('/')
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setShowSuggestions(false)
      navigate(`/home?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
    }
  }

  const handleSelectMovie = (movieId) => {
    setShowSuggestions(false)
    setSearchQuery('')
    navigate(`/moviedetails/${movieId}`)
  }

  const isLanding = location.pathname === '/'
  const navBg =
    scrolled || !isLanding
      ? 'bg-[#0f171e]/95 backdrop-blur-md border-b border-[#1a242f] shadow-lg'
      : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent'

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${navBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-6 flex-shrink-0">
              <Link to={isAuthenticated ? '/home' : '/'} className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-lg bg-[#00a8e1]/10 border border-[#00a8e1]/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Film className="w-5 h-5 text-[#00a8e1]" />
                </div>
                <span className="text-xl font-black text-white tracking-wide">
                  i<span className="text-[#00a8e1]">Movies</span>
                </span>
              </Link>

              {/* Navigation Links (Desktop) */}
              {isAuthenticated && (
                <div className="hidden lg:flex items-center gap-5 text-sm font-medium">
                  <Link
                    to="/home"
                    className={`transition-colors ${
                      location.pathname === '/home' ? 'text-[#00a8e1]' : 'text-[#c0cdd5] hover:text-white'
                    }`}
                  >
                    Home
                  </Link>
                  <Link
                    to="/watchlist"
                    className={`transition-colors ${
                      location.pathname === '/watchlist' ? 'text-[#00a8e1]' : 'text-[#c0cdd5] hover:text-white'
                    }`}
                  >
                    Watchlist
                  </Link>
                  <Link
                    to="/bookings"
                    className={`transition-colors ${
                      location.pathname === '/bookings' ? 'text-[#00a8e1]' : 'text-[#c0cdd5] hover:text-white'
                    }`}
                  >
                    My Tickets
                  </Link>
                </div>
              )}
            </div>

            {/* Center: Search Auto-complete (Desktop) */}
            {isAuthenticated && (
              <div className="hidden md:flex flex-1 max-w-md mx-6 relative" ref={searchBoxRef}>
                <form onSubmit={handleSearchSubmit} className="w-full relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search movies, actors, genres..."
                    className="w-full bg-[#1a242f]/90 border border-[#253241] text-white placeholder-[#8197a4] focus:border-[#00a8e1] focus:outline-none rounded-xl px-4 py-2 pl-10 pr-9 text-sm transition-all shadow-inner"
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8197a4]" />

                  {isSearching ? (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00a8e1] animate-spin" />
                  ) : searchQuery ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('')
                        setSuggestions([])
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8197a4] hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : null}
                </form>

                {/* Auto-complete Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a242f] border border-[#253241] rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                    <div className="p-2 border-b border-[#253241] bg-[#0f171e]/50 flex items-center justify-between text-xs text-[#8197a4]">
                      <span>TMDB Cinema Matches</span>
                      <span>Press Enter to view all</span>
                    </div>
                    <div className="divide-y divide-[#253241]">
                      {suggestions.map((m) => {
                        const mId = m.id || m._id
                        const year = m.releaseDate ? new Date(m.releaseDate).getFullYear() : null
                        return (
                          <div
                            key={mId}
                            onClick={() => handleSelectMovie(mId)}
                            className="flex items-center gap-3 p-2.5 hover:bg-[#253241] cursor-pointer transition-colors"
                          >
                            <img
                              src={m.posterUrl}
                              alt={m.movieName}
                              className="w-10 h-14 object-cover rounded bg-[#253241] shrink-0"
                              onError={(e) => {
                                e.target.style.display = 'none'
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-semibold truncate hover:text-[#00a8e1]">
                                {m.movieName}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-[#8197a4] mt-0.5">
                                {year && <span>{year}</span>}
                                {m.genres?.length > 0 && (
                                  <>
                                    <span>·</span>
                                    <span className="truncate">{m.genres[0]}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            {m.averageRating > 0 && (
                              <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded text-xs font-bold text-yellow-400 shrink-0">
                                <Star className="w-3 h-3 fill-yellow-400" />
                                {Number(m.averageRating).toFixed(1)}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Right side controls */}
            <div className="flex items-center gap-3">
              {/* TMDB API Key config button - Restricted to Admin users only */}
              {isAdmin && (
                <button
                  onClick={() => setTmdbModalOpen(true)}
                  title="TMDB API Configuration (Admin Only)"
                  className="hidden sm:flex items-center gap-1 text-xs bg-[#1a242f] hover:bg-[#253241] text-[#00a8e1] border border-[#253241] hover:border-[#00a8e1]/40 px-2.5 py-1.5 rounded-lg transition-all"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span className="font-semibold">TMDB API</span>
                </button>
              )}

              {/* Mobile search toggle */}
              {isAuthenticated && (
                <button
                  className="md:hidden text-[#8197a4] hover:text-white p-2"
                  onClick={() => setSearchOpen(!searchOpen)}
                  aria-label="Toggle search"
                >
                  {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                </button>
              )}

              {!isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    className="text-[#c0cdd5] hover:text-white text-sm font-medium transition-colors px-3 py-1.5"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="bg-[#00a8e1] hover:bg-[#0891c9] text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all shadow-md shadow-[#00a8e1]/20"
                  >
                    Create Account
                  </Link>
                </div>
              ) : isAdmin ? (
                <div className="flex items-center gap-3">
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 bg-[#00a8e1]/10 border border-[#00a8e1]/30 text-[#00a8e1] hover:bg-[#00a8e1] hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Admin Panel
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-[#8197a4] hover:text-red-400 p-1.5 rounded transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 bg-[#1a242f] hover:bg-[#253241] border border-[#253241] rounded-xl px-3 py-1.5 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#00a8e1] to-cyan-300 flex items-center justify-center text-black text-xs font-black">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="hidden sm:block text-xs font-semibold text-white max-w-[80px] truncate">
                      {user?.username || 'User'}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#8197a4] transition-transform duration-200 ${
                        dropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-[#1a242f] border border-[#253241] rounded-xl shadow-2xl py-1 z-50 animate-fade-in">
                      <div className="px-4 py-3 border-b border-[#253241]">
                        <p className="text-white text-sm font-bold truncate">{user?.username}</p>
                        <p className="text-[#8197a4] text-xs truncate">{user?.email}</p>
                      </div>
                      <Link
                        to="/bookings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#c0cdd5] hover:text-white hover:bg-[#253241] transition-colors"
                      >
                        <Ticket className="w-4 h-4 text-[#00a8e1]" />
                        My Bookings
                      </Link>
                      <Link
                        to="/watchlist"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#c0cdd5] hover:text-white hover:bg-[#253241] transition-colors"
                      >
                        <Heart className="w-4 h-4 text-red-400" />
                        My Watchlist
                      </Link>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setDropdownOpen(false)
                            setTmdbModalOpen(true)
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[#c0cdd5] hover:text-white hover:bg-[#253241] transition-colors"
                        >
                          <Key className="w-4 h-4 text-cyan-400" />
                          TMDB Key Settings
                        </button>
                      )}
                      <div className="border-t border-[#253241] mt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-[#253241] transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Input Drawer */}
        {searchOpen && (
          <div className="md:hidden px-4 pb-3 border-t border-[#1a242f] bg-[#0f171e]">
            <form onSubmit={handleSearchSubmit} className="relative mt-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search movies, genres..."
                className="w-full bg-[#1a242f] border border-[#253241] text-white placeholder-[#8197a4] focus:border-[#00a8e1] focus:outline-none rounded-xl px-4 py-2 pl-10 text-sm"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8197a4]" />
            </form>
          </div>
        )}
      </nav>

      {/* TMDB API Key Configuration Modal */}
      <TmdbKeyModal
        isOpen={tmdbModalOpen}
        onClose={() => setTmdbModalOpen(false)}
        onKeyUpdated={() => window.location.reload()}
      />
    </>
  )
}

export default Navbar
