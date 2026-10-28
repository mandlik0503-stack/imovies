import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  Search, SlidersHorizontal, X, Sparkles, Filter,
  Flame, Clapperboard, Star, Calendar, RefreshCw, Check
} from 'lucide-react'
import API from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import HeroBanner from '../components/HeroBanner'
import MovieCarousel from '../components/MovieCarousel'
import MovieCard from '../components/MovieCard'
import LoadingSpinner from '../components/LoadingSpinner'
import Footer from '../components/Footer'
import {
  fetchTrending,
  fetchNowPlaying,
  fetchTopRated,
  fetchUpcoming,
  searchMovies,
  discoverMovies,
  TMDB_GENRES,
  TMDB_LANGUAGES,
} from '../api/tmdb'

const YEARS = ['All Years', '2026', '2025', '2024', '2023', '2022', '2021', '2020']
const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'primary_release_date.desc', label: 'Newest Release' },
]

const HomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()

  // Data states
  const [trendingMovies, setTrendingMovies] = useState([])
  const [nowPlayingMovies, setNowPlayingMovies] = useState([])
  const [topRatedMovies, setTopRatedMovies] = useState([])
  const [upcomingMovies, setUpcomingMovies] = useState([])
  const [filteredResults, setFilteredResults] = useState([])
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterLoading, setFilterLoading] = useState(false)

  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [selectedGenreIds, setSelectedGenreIds] = useState([])
  const [selectedLanguage, setSelectedLanguage] = useState('all')
  const [selectedYear, setSelectedYear] = useState('All Years')
  const [selectedSort, setSelectedSort] = useState('popularity.desc')
  const [showFilters, setShowFilters] = useState(false)

  // Fetch initial movie catalogs
  const loadInitialMovies = useCallback(async () => {
    try {
      setLoading(true)
      const [trending, nowPlaying, topRated, upcoming, localRes] = await Promise.allSettled([
        fetchTrending('week'),
        fetchNowPlaying(1),
        fetchTopRated(1),
        fetchUpcoming(1),
        API.get('/movie'),
      ])

      const trendingData = trending.status === 'fulfilled' ? trending.value : []
      const nowPlayingData = nowPlaying.status === 'fulfilled' ? nowPlaying.value : []
      const topRatedData = topRated.status === 'fulfilled' ? topRated.value : []
      const upcomingData = upcoming.status === 'fulfilled' ? upcoming.value : []

      // If local DB has extra custom movies, merge them
      const localData =
        localRes.status === 'fulfilled' && Array.isArray(localRes.value.data)
          ? localRes.value.data
          : []

      setTrendingMovies(trendingData)
      setNowPlayingMovies(nowPlayingData)
      setTopRatedMovies(topRatedData)
      setUpcomingMovies(upcomingData)
    } catch (err) {
      toast.error('Notice: Running in optimized cinema fallback mode.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInitialMovies()
  }, [loadInitialMovies])

  // Sync search param from URL
  useEffect(() => {
    const q = searchParams.get('search')
    if (q !== null && q !== searchQuery) {
      setSearchQuery(q)
    }
  }, [searchParams])

  // Fetch user's watchlist
  useEffect(() => {
    if (!user?.email) return
    const fetchFavorites = async () => {
      try {
        const res = await API.get(`/user/watchlist/${user.email}`)
        const list = res.data?.watchlist || res.data || []
        const ids = list.map((m) => String(m._id || m.id || m))
        setFavorites(ids)
      } catch {
        // Silent fail
      }
    }
    fetchFavorites()
  }, [user])

  // Toggle watchlist
  const handleWatchlistToggle = useCallback(
    async (movie) => {
      if (!user?.email) {
        toast.error('Please login to manage your watchlist')
        return
      }
      const mId = String(movie._id || movie.id)
      const isFav = favorites.includes(mId)
      try {
        if (isFav) {
          await API.delete(`/user/watchlist/${user.email}/${mId}`)
          setFavorites((prev) => prev.filter((id) => id !== mId))
          toast.success('Removed from watchlist')
        } else {
          await API.post(`/user/watchlist`, {
            email: user.email,
            movieId: mId,
            movieData: movie,
          })
          setFavorites((prev) => [...prev, mId])
          toast.success('Added to watchlist')
        }
      } catch {
        toast.error('Failed to update watchlist')
      }
    },
    [favorites, user]
  )

  // Multi-select genre toggle
  const toggleGenre = (genreId) => {
    setSelectedGenreIds((prev) =>
      prev.includes(genreId) ? prev.filter((id) => id !== genreId) : [...prev, genreId]
    )
  }

  // Active filters indicator
  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      selectedGenreIds.length > 0 ||
      selectedLanguage !== 'all' ||
      selectedYear !== 'All Years' ||
      selectedSort !== 'popularity.desc'
  )

  // Trigger search/discover when filters change
  useEffect(() => {
    if (!hasActiveFilters) {
      setFilteredResults([])
      return
    }

    const runFilters = async () => {
      setFilterLoading(true)
      try {
        if (searchQuery.trim()) {
          // TMDB Search query
          const results = await searchMovies(searchQuery)
          // Filter in-memory for secondary filters
          let final = results
          if (selectedGenreIds.length > 0) {
            final = final.filter((m) =>
              m.genres?.some((g) => {
                const matchedGenre = TMDB_GENRES.find((tg) => tg.name === g)
                return matchedGenre && selectedGenreIds.includes(matchedGenre.id)
              })
            )
          }
          if (selectedLanguage !== 'all') {
            final = final.filter((m) => m.original_language === selectedLanguage)
          }
          if (selectedYear !== 'All Years') {
            final = final.filter((m) => m.releaseDate?.startsWith(selectedYear))
          }
          setFilteredResults(final)
        } else {
          // TMDB Discover endpoint
          const yearParam = selectedYear !== 'All Years' ? selectedYear : ''
          const results = await discoverMovies({
            genreIds: selectedGenreIds,
            language: selectedLanguage !== 'all' ? selectedLanguage : '',
            year: yearParam,
            sortBy: selectedSort,
          })
          setFilteredResults(results)
        }
      } catch (err) {
        toast.error('Filter request failed')
      } finally {
        setFilterLoading(false)
      }
    }

    const timer = setTimeout(runFilters, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, selectedGenreIds, selectedLanguage, selectedYear, selectedSort, hasActiveFilters])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedGenreIds([])
    setSelectedLanguage('all')
    setSelectedYear('All Years')
    setSelectedSort('popularity.desc')
    setSearchParams({})
  }

  // Curated genre categories for carousels
  const actionMovies = useMemo(
    () =>
      [...trendingMovies, ...nowPlayingMovies].filter((m) =>
        m.genres?.some((g) => g === 'Action' || g === 'Adventure')
      ),
    [trendingMovies, nowPlayingMovies]
  )

  const sciFiMovies = useMemo(
    () =>
      [...trendingMovies, ...topRatedMovies].filter((m) =>
        m.genres?.some((g) => g === 'Sci-Fi' || g === 'Science Fiction')
      ),
    [trendingMovies, topRatedMovies]
  )

  if (loading) return <LoadingSpinner message="Fetching cinema from TMDB..." />

  return (
    <div className="min-h-screen bg-[#0f171e]">
      <Navbar />

      {/* Hero Showcase (Shows top trending movies when not in filtered mode) */}
      {!hasActiveFilters && trendingMovies.length > 0 && (
        <HeroBanner movies={trendingMovies} />
      )}

      {/* Main Content Area */}
      <main className={`${hasActiveFilters ? 'pt-24' : 'pt-6'}`}>
        {/* Dynamic Filter & Search Toolbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="bg-[#1a242f]/80 backdrop-blur-md border border-[#253241] rounded-2xl p-4 shadow-xl">
            {/* Top row: Search input + Filter toggle + Clear */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cinema across TMDB database..."
                  className="w-full bg-[#0f171e] border border-[#253241] text-white placeholder-[#8197a4] focus:border-[#00a8e1] focus:outline-none rounded-xl px-4 py-3 pl-10 text-sm transition-all"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8197a4]" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8197a4] hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                  showFilters || selectedGenreIds.length > 0 || selectedLanguage !== 'all'
                    ? 'bg-[#00a8e1] border-[#00a8e1] text-white shadow-md shadow-[#00a8e1]/20'
                    : 'bg-[#253241] border-[#253241] text-[#c0cdd5] hover:text-white hover:border-[#00a8e1]/50'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {selectedGenreIds.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center ml-1">
                    {selectedGenreIds.length}
                  </span>
                )}
              </button>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-900/50 text-xs font-semibold transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>

            {/* Expandable Filter Drawer */}
            {showFilters && (
              <div className="mt-5 pt-5 border-t border-[#253241] space-y-5 animate-fade-in">
                {/* Multi-Select Genre Chips */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold text-[#8197a4] uppercase tracking-wider">
                      Filter by Genre (Multi-select)
                    </span>
                    {selectedGenreIds.length > 0 && (
                      <button
                        onClick={() => setSelectedGenreIds([])}
                        className="text-xs text-[#00a8e1] hover:underline"
                      >
                        Deselect all
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TMDB_GENRES.map((g) => {
                      const isSelected = selectedGenreIds.includes(g.id)
                      return (
                        <button
                          key={g.id}
                          onClick={() => toggleGenre(g.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            isSelected
                              ? 'bg-[#00a8e1] text-white shadow-sm'
                              : 'bg-[#0f171e] text-[#8197a4] hover:text-white hover:bg-[#253241] border border-[#253241]'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          {g.name}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Dropdowns Row: Language, Year, Sort */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-[#8197a4] uppercase tracking-wider mb-1.5">
                      Language
                    </label>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="w-full bg-[#0f171e] border border-[#253241] text-white text-xs rounded-lg px-3 py-2.5 focus:border-[#00a8e1] focus:outline-none"
                    >
                      {TMDB_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#8197a4] uppercase tracking-wider mb-1.5">
                      Release Year
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full bg-[#0f171e] border border-[#253241] text-white text-xs rounded-lg px-3 py-2.5 focus:border-[#00a8e1] focus:outline-none"
                    >
                      {YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#8197a4] uppercase tracking-wider mb-1.5">
                      Sort By
                    </label>
                    <select
                      value={selectedSort}
                      onChange={(e) => setSelectedSort(e.target.value)}
                      className="w-full bg-[#0f171e] border border-[#253241] text-white text-xs rounded-lg px-3 py-2.5 focus:border-[#00a8e1] focus:outline-none"
                    >
                      {SORT_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================================================================ */}
        {/* VIEW 1: FILTERED RESULTS VIEW (When search or filters are active) */}
        {/* ================================================================ */}
        {hasActiveFilters ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#00a8e1]" />
                  {searchQuery ? `Results for "${searchQuery}"` : 'Filtered Cinema Discovery'}
                </h2>
                <p className="text-xs text-[#8197a4] mt-0.5">
                  Found {filteredResults.length} title{filteredResults.length !== 1 ? 's' : ''} matching criteria
                </p>
              </div>

              {filterLoading && (
                <div className="flex items-center gap-2 text-xs text-[#00a8e1]">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </div>
              )}
            </div>

            {filteredResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {filteredResults.map((movie) => (
                  <div key={movie._id || movie.id} className="flex justify-center">
                    <MovieCard
                      movie={movie}
                      onWatchlistToggle={handleWatchlistToggle}
                      isFavorite={favorites.includes(String(movie._id || movie.id))}
                    />
                  </div>
                ))}
              </div>
            ) : !filterLoading ? (
              <div className="text-center py-24 bg-[#1a242f]/50 border border-[#253241] rounded-2xl p-8 max-w-lg mx-auto">
                <Search className="w-12 h-12 text-[#253241] mx-auto mb-3" />
                <h3 className="text-white text-lg font-bold mb-1">No matching titles found</h3>
                <p className="text-[#8197a4] text-xs leading-relaxed mb-5">
                  We couldn't find any movies matching your current search or genre combinations.
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-[#00a8e1] hover:bg-[#0891c9] text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-[#00a8e1]/20"
                >
                  Reset All Filters
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          /* ================================================================ */
          /* VIEW 2: PRIME VIDEO CAROUSEL ROWS (Default Landing Showcase)     */
          /* ================================================================ */
          <div className="space-y-6">
            {/* Trending This Week */}
            {trendingMovies.length > 0 && (
              <MovieCarousel
                title="🔥 Trending This Week"
                movies={trendingMovies}
                onWatchlistToggle={handleWatchlistToggle}
                favorites={favorites}
              />
            )}

            {/* Now Playing in Theatres */}
            {nowPlayingMovies.length > 0 && (
              <MovieCarousel
                title="🎟️ Now Showing in Theatres"
                movies={nowPlayingMovies}
                onWatchlistToggle={handleWatchlistToggle}
                favorites={favorites}
              />
            )}

            {/* Top Rated Masterpieces */}
            {topRatedMovies.length > 0 && (
              <MovieCarousel
                title="⭐ Critically Acclaimed Masterpieces"
                movies={topRatedMovies}
                onWatchlistToggle={handleWatchlistToggle}
                favorites={favorites}
              />
            )}

            {/* Action Blockbusters */}
            {actionMovies.length > 0 && (
              <MovieCarousel
                title="💥 Action & Thriller Blockbusters"
                movies={actionMovies}
                onWatchlistToggle={handleWatchlistToggle}
                favorites={favorites}
              />
            )}

            {/* Sci-Fi & Adventure */}
            {sciFiMovies.length > 0 && (
              <MovieCarousel
                title="🚀 Sci-Fi, Mystery & Adventure"
                movies={sciFiMovies}
                onWatchlistToggle={handleWatchlistToggle}
                favorites={favorites}
              />
            )}

            {/* Upcoming Cinema */}
            {upcomingMovies.length > 0 && (
              <MovieCarousel
                title="🍿 Upcoming & Coming Soon"
                movies={upcomingMovies}
                onWatchlistToggle={handleWatchlistToggle}
                favorites={favorites}
              />
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default HomePage
