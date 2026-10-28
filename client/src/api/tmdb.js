// ============================================================================
// iMovies — Official TMDB API (v3) Integration Service & Robust Fallback Engine
// ============================================================================

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

// Default fallback TMDB API v3 Key (can be overridden via .env or localStorage)
const DEFAULT_API_KEY =
  import.meta.env.VITE_TMDB_API_KEY || '4e44d9029b1270a757cddc766a1bcb63'

// Placeholder images
export const DEFAULT_POSTER =
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80'
export const DEFAULT_BACKDROP =
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80'
export const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'

// Get active API Key
export const getApiKey = () => {
  return localStorage.getItem('imovies_tmdb_key') || DEFAULT_API_KEY
}

export const setApiKey = (key) => {
  if (key) {
    localStorage.setItem('imovies_tmdb_key', key.trim())
  } else {
    localStorage.removeItem('imovies_tmdb_key')
  }
}

// Image URL builders
export const getPosterUrl = (posterPath, size = 'w500') => {
  if (!posterPath) return DEFAULT_POSTER
  if (posterPath.startsWith('http')) return posterPath
  return `${TMDB_IMAGE_BASE}/${size}${posterPath}`
}

export const getBackdropUrl = (backdropPath, size = 'original') => {
  if (!backdropPath) return DEFAULT_BACKDROP
  if (backdropPath.startsWith('http')) return backdropPath
  return `${TMDB_IMAGE_BASE}/${size}${backdropPath}`
}

export const getProfileUrl = (profilePath, size = 'w185') => {
  if (!profilePath) return DEFAULT_AVATAR
  if (profilePath.startsWith('http')) return profilePath
  return `${TMDB_IMAGE_BASE}/${size}${profilePath}`
}

// Official TMDB Genre Catalog
export const TMDB_GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
]

export const GENRE_MAP = TMDB_GENRES.reduce((acc, g) => {
  acc[g.id] = g.name
  return acc
}, {})

export const TMDB_LANGUAGES = [
  { code: 'all', name: 'All Languages' },
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'te', name: 'Telugu' },
  { code: 'ta', name: 'Tamil' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
]

const LANGUAGE_MAP = {
  en: 'English',
  hi: 'Hindi',
  te: 'Telugu',
  ta: 'Tamil',
  kn: 'Kannada',
  ml: 'Malayalam',
  ja: 'Japanese',
  ko: 'Korean',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
}

// Helper to extract best YouTube trailer key
export const extractTrailerKey = (videos) => {
  if (!videos || !videos.results || !videos.results.length) return null
  const officialTrailer = videos.results.find(
    (v) =>
      v.site === 'YouTube' &&
      v.type === 'Trailer' &&
      v.official &&
      v.key
  )
  if (officialTrailer) return officialTrailer.key
  const anyTrailer = videos.results.find(
    (v) => v.site === 'YouTube' && v.type === 'Trailer' && v.key
  )
  if (anyTrailer) return anyTrailer.key
  const anyVideo = videos.results.find((v) => v.site === 'YouTube' && v.key)
  return anyVideo ? anyVideo.key : null
}

export const getTrailerEmbedUrl = (trailerKey) => {
  if (!trailerKey) return null
  return `https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`
}

// Format TMDB movie to unified iMovies model
export const normalizeMovie = (m) => {
  if (!m) return null
  const idStr = String(m.id || m._id || '')

  // Map genres
  let genreNames = []
  if (Array.isArray(m.genres) && m.genres.length > 0) {
    genreNames = m.genres.map((g) => (typeof g === 'object' ? g.name : g))
  } else if (Array.isArray(m.genre_ids)) {
    genreNames = m.genre_ids.map((id) => GENRE_MAP[id] || id).filter(Boolean)
  }

  // Map trailer
  const trailerKey = m.trailerKey || extractTrailerKey(m.videos)

  // Map cast
  const castList = (m.credits?.cast || m.cast || []).slice(0, 10).map((c) => ({
    id: c.id,
    name: c.name || c.actorName,
    character: c.character || 'Cast',
    profileUrl: getProfileUrl(c.profile_path || c.profileUrl),
  }))

  const rating = Number(m.vote_average ?? m.averageRating ?? 0)
  const durationMinutes = m.runtime || parseInt(m.duration) || 120

  return {
    _id: idStr,
    id: m.id || m._id,
    movieName: m.title || m.movieName || m.original_title || 'Untitled Movie',
    title: m.title || m.movieName || m.original_title || 'Untitled Movie',
    description: m.overview || m.description || 'No overview available.',
    overview: m.overview || m.description || '',
    tagline: m.tagline || '',
    posterUrl: getPosterUrl(m.poster_path || m.posterUrl),
    poster_path: m.poster_path,
    backdropUrl: getBackdropUrl(m.backdrop_path || m.backdropUrl),
    backdrop_path: m.backdrop_path,
    releaseDate: m.release_date || m.releaseDate || '2024-01-01',
    release_date: m.release_date || m.releaseDate || '2024-01-01',
    genres: genreNames.length > 0 ? genreNames : ['Cinema'],
    language: LANGUAGE_MAP[m.original_language] || m.language || 'English',
    original_language: m.original_language || 'en',
    duration: `${durationMinutes}`,
    runtime: durationMinutes,
    averageRating: rating > 0 ? Number(rating.toFixed(1)) : 7.8,
    vote_average: rating > 0 ? Number(rating.toFixed(1)) : 7.8,
    voteCount: m.vote_count || m.voteCount || 1200,
    vote_count: m.vote_count || m.voteCount || 1200,
    certification: m.certification || (m.adult ? 'A' : 'UA'),
    trailerKey,
    trailerUrl: trailerKey ? getTrailerEmbedUrl(trailerKey) : null,
    cast: castList,
    budget: m.budget,
    revenue: m.revenue,
    status: m.status || 'Released',
    productionCompanies: m.production_companies || [],
  }
}

// Generic fetcher with timeout and error capture
const tmdbFetch = async (endpoint, params = {}) => {
  const apiKey = getApiKey()
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`)
  url.searchParams.set('api_key', apiKey)

  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, String(v))
    }
  })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error(`TMDB HTTP error ${res.status}: ${res.statusText}`)
    }
    return await res.json()
  } catch (err) {
    clearTimeout(timeoutId)
    throw err
  }
}

// ============================================================================
// Core TMDB Endpoints
// ============================================================================

// 1. Fetch Trending Movies (GET /trending/movie/week)
export const fetchTrending = async (timeWindow = 'week') => {
  try {
    const data = await tmdbFetch(`/trending/movie/${timeWindow}`)
    return (data.results || []).map(normalizeMovie)
  } catch (err) {
    console.warn('[TMDB] Trending fetch failed, activating fallback dataset:', err.message)
    return FALLBACK_MOVIES.slice(0, 8).map(normalizeMovie)
  }
}

// 2. Fetch Now Showing (GET /movie/now_playing)
export const fetchNowPlaying = async (page = 1) => {
  try {
    const data = await tmdbFetch('/movie/now_playing', {
      language: 'en-US',
      page,
    })
    return (data.results || []).map(normalizeMovie)
  } catch (err) {
    console.warn('[TMDB] Now Playing fetch failed, using fallback:', err.message)
    return FALLBACK_MOVIES.filter((m) => new Date(m.release_date) <= new Date()).map(
      normalizeMovie
    )
  }
}

// 3. Fetch Top Rated Movies (GET /movie/top_rated)
export const fetchTopRated = async (page = 1) => {
  try {
    const data = await tmdbFetch('/movie/top_rated', {
      language: 'en-US',
      page,
    })
    return (data.results || []).map(normalizeMovie)
  } catch (err) {
    console.warn('[TMDB] Top Rated fetch failed, using fallback:', err.message)
    return FALLBACK_MOVIES.filter((m) => m.vote_average >= 8.4).map(normalizeMovie)
  }
}

// 4. Fetch Upcoming Movies (GET /movie/upcoming)
export const fetchUpcoming = async (page = 1) => {
  try {
    const data = await tmdbFetch('/movie/upcoming', {
      language: 'en-US',
      page,
    })
    return (data.results || []).map(normalizeMovie)
  } catch (err) {
    console.warn('[TMDB] Upcoming fetch failed, using fallback:', err.message)
    return FALLBACK_MOVIES.slice(3, 8).map(normalizeMovie)
  }
}

// 5. Fetch Movie Details & Cast & Videos (GET /movie/{movie_id}?append_to_response=credits,videos)
export const fetchMovieDetails = async (movieId) => {
  try {
    const data = await tmdbFetch(`/movie/${movieId}`, {
      append_to_response: 'credits,videos,reviews,similar',
    })
    return normalizeMovie(data)
  } catch (err) {
    console.warn(`[TMDB] Movie details failed for ${movieId}, finding fallback:`, err.message)
    const match = FALLBACK_MOVIES.find(
      (m) => String(m.id) === String(movieId) || String(m._id) === String(movieId)
    )
    if (match) return normalizeMovie(match)
    // Return structured fallback
    return normalizeMovie({
      ...FALLBACK_MOVIES[0],
      id: movieId,
      _id: movieId,
      title: 'Cinematic Blockbuster',
    })
  }
}

// 6. Search Movies (GET /search/movie?query={search_query})
export const searchMovies = async (query, page = 1) => {
  if (!query || !query.trim()) return []
  try {
    const data = await tmdbFetch('/search/movie', {
      query: query.trim(),
      include_adult: false,
      page,
    })
    return (data.results || []).map(normalizeMovie)
  } catch (err) {
    console.warn(`[TMDB] Search failed for "${query}", searching fallback:`, err.message)
    const q = query.toLowerCase()
    return FALLBACK_MOVIES.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.overview && m.overview.toLowerCase().includes(q))
    ).map(normalizeMovie)
  }
}

// 7. Discover / Filter by Genre, Language, Year (GET /discover/movie)
export const discoverMovies = async ({
  genreIds = [],
  language = '',
  year = '',
  sortBy = 'popularity.desc',
  page = 1,
} = {}) => {
  try {
    const params = {
      sort_by: sortBy,
      include_adult: false,
      page,
    }
    if (genreIds.length > 0) {
      params.with_genres = genreIds.join(',')
    }
    if (language && language !== 'all') {
      params.with_original_language = language
    }
    if (year) {
      params.primary_release_year = year
    }

    const data = await tmdbFetch('/discover/movie', params)
    return (data.results || []).map(normalizeMovie)
  } catch (err) {
    console.warn('[TMDB] Discover failed, filtering fallback dataset:', err.message)
    let res = [...FALLBACK_MOVIES]
    if (genreIds.length > 0) {
      res = res.filter((m) =>
        m.genre_ids?.some((gid) => genreIds.includes(gid))
      )
    }
    if (language && language !== 'all') {
      res = res.filter((m) => m.original_language === language)
    }
    if (year) {
      res = res.filter((m) => m.release_date?.startsWith(String(year)))
    }
    return res.map(normalizeMovie)
  }
}

// ============================================================================
// Comprehensive Offline & Network Fallback Dataset (Top TMDB Masterpieces)
// ============================================================================
export const FALLBACK_MOVIES = [
  {
    id: 693134,
    _id: '693134',
    title: 'Dune: Part Two',
    overview:
      'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.',
    tagline: 'Long live the fighters.',
    poster_path: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdrop_path: '/xOMo8BRK7PfcJv9JCnx7s520b2q.jpg',
    release_date: '2024-02-27',
    original_language: 'en',
    genre_ids: [878, 12],
    vote_average: 8.3,
    vote_count: 5420,
    runtime: 166,
    certification: 'UA',
    trailerKey: 'Way9Dexny3w',
    credits: {
      cast: [
        { id: 1190668, name: 'Timothée Chalamet', character: 'Paul Atreides', profile_path: '/BE2sdjpgsa2rNTFa66f7upkaOP.jpg' },
        { id: 505710, name: 'Zendaya', character: 'Chani', profile_path: '/r3A7evKLHR9ot7vlZQ9BPzee2Km.jpg' },
        { id: 934, name: 'Rebecca Ferguson', character: 'Lady Jessica', profile_path: '/lJloTOheuQSirSLXNA3jhHUSqqnst.jpg' },
        { id: 1373737, name: 'Florence Pugh', character: 'Princess Irulan', profile_path: '/750hbEb5P4tz84r0w1g0h8zF.jpg' },
        { id: 3894, name: 'Austin Butler', character: 'Feyd-Rautha Harkonnen', profile_path: '/b3BvWw05P69K5m7p920.jpg' },
      ],
    },
  },
  {
    id: 872585,
    _id: '872585',
    title: 'Oppenheimer',
    overview:
      'The story of J. Robert Oppenheimer’s role in the development of the atomic bomb during World War II, his complex legacy, and the intense post-war security hearing that tested his loyalty to his nation.',
    tagline: 'The world forever changes.',
    poster_path: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdrop_path: '/rLb2cw69zbPQEVuhpnj1a66E5SN.jpg',
    release_date: '2023-07-19',
    original_language: 'en',
    genre_ids: [18, 36],
    vote_average: 8.4,
    vote_count: 8900,
    runtime: 180,
    certification: 'A',
    trailerKey: 'uYPbbksJxIg',
    credits: {
      cast: [
        { id: 2037, name: 'Cillian Murphy', character: 'J. Robert Oppenheimer', profile_path: '/360QC5qvgIRtOC6vtn9u.jpg' },
        { id: 5081, name: 'Emily Blunt', character: 'Katherine Oppenheimer', profile_path: '/5P8pvhh5h6un5709v.jpg' },
        { id: 1892, name: 'Matt Damon', character: 'Leslie Groves', profile_path: '/elzaK6v22xN2.jpg' },
        { id: 3223, name: 'Robert Downey Jr.', character: 'Lewis Strauss', profile_path: '/5qHNjhtjMD4YWH3vi0.jpg' },
      ],
    },
  },
  {
    id: 157336,
    _id: '157336',
    title: 'Interstellar',
    overview:
      'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.',
    tagline: 'Mankind was born on Earth. It was never meant to die here.',
    poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdrop_path: '/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    release_date: '2014-11-05',
    original_language: 'en',
    genre_ids: [878, 18, 12],
    vote_average: 8.4,
    vote_count: 34500,
    runtime: 169,
    certification: 'UA',
    trailerKey: 'zSWdZVtXT7E',
    credits: {
      cast: [
        { id: 10297, name: 'Matthew McConaughey', character: 'Cooper', profile_path: '/eDAsz9QkF6nFpA.jpg' },
        { id: 1813, name: 'Anne Hathaway', character: 'Brand', profile_path: '/tLflrsv1fbpj.jpg' },
        { id: 83002, name: 'Jessica Chastain', character: 'Murph', profile_path: '/lodMz1.jpg' },
        { id: 3895, name: 'Michael Caine', character: 'Professor Brand', profile_path: '/klj9.jpg' },
      ],
    },
  },
  {
    id: 533535,
    _id: '533535',
    title: 'Deadpool & Wolverine',
    overview:
      'A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him. But when his homeworld faces an existential threat, Wade must reluctantly suit-up again with an even more reluctant Wolverine.',
    tagline: 'Come together.',
    poster_path: '/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    backdrop_path: '/yD3xP6j09qEwE2x232Z777.jpg',
    release_date: '2024-07-24',
    original_language: 'en',
    genre_ids: [28, 35, 878],
    vote_average: 7.9,
    vote_count: 4200,
    runtime: 128,
    certification: 'A',
    trailerKey: '73_1biulkYk',
    credits: {
      cast: [
        { id: 10859, name: 'Ryan Reynolds', character: 'Wade Wilson / Deadpool', profile_path: '/4AnGvC85834.jpg' },
        { id: 6968, name: 'Hugh Jackman', character: 'Logan / Wolverine', profile_path: '/444.jpg' },
        { id: 147614, name: 'Emma Corrin', character: 'Cassandra Nova', profile_path: '/333.jpg' },
      ],
    },
  },
  {
    id: 569094,
    _id: '569094',
    title: 'Spider-Man: Across the Spider-Verse',
    overview:
      'After reuniting with Gwen Stacy, Brooklyn’s full-time, friendly neighborhood Spider-Man is catapulted across the Multiverse, where he encounters the Spider Society, a team of Spider-People charged with protecting the Multiverse’s very existence.',
    tagline: 'It’s how you wear the mask that matters.',
    poster_path: '/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    backdrop_path: '/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
    release_date: '2023-05-31',
    original_language: 'en',
    genre_ids: [16, 28, 12, 878],
    vote_average: 8.4,
    vote_count: 6700,
    runtime: 140,
    certification: 'U',
    trailerKey: 'cqGjhVJWtEg',
    credits: {
      cast: [
        { id: 587506, name: 'Shameik Moore', character: 'Miles Morales (voice)', profile_path: '/345.jpg' },
        { id: 54693, name: 'Hailee Steinfeld', character: 'Gwen Stacy (voice)', profile_path: '/567.jpg' },
        { id: 2524, name: 'Oscar Isaac', character: 'Miguel O’Hara (voice)', profile_path: '/789.jpg' },
      ],
    },
  },
  {
    id: 155,
    _id: '155',
    title: 'The Dark Knight',
    overview:
      'Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets. The partnership proves to be effective, but they soon find themselves prey to a reign of chaos unleashed by a rising criminal mastermind known to the terrified citizens of Gotham as the Joker.',
    tagline: 'Welcome to a world without rules.',
    poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdrop_path: '/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg',
    release_date: '2008-07-16',
    original_language: 'en',
    genre_ids: [18, 28, 80, 53],
    vote_average: 8.5,
    vote_count: 32000,
    runtime: 152,
    certification: 'A',
    trailerKey: 'EXeTwQWrcwY',
    credits: {
      cast: [
        { id: 3894, name: 'Christian Bale', character: 'Bruce Wayne / Batman', profile_path: '/123.jpg' },
        { id: 1810, name: 'Heath Ledger', character: 'Joker', profile_path: '/234.jpg' },
        { id: 64, name: 'Gary Oldman', character: 'James Gordon', profile_path: '/345.jpg' },
        { id: 3895, name: 'Michael Caine', character: 'Alfred Pennyworth', profile_path: '/456.jpg' },
      ],
    },
  },
  {
    id: 76600,
    _id: '76600',
    title: 'Avatar: The Way of Water',
    overview:
      'Set more than a decade after the events of the first film, learn the story of the Sully family (Jake, Neytiri, and their kids), the trouble that follows them, the lengths they go to keep each other safe, the battles they fight to stay alive, and the tragedies they endure.',
    tagline: 'Return to Pandora.',
    poster_path: '/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
    backdrop_path: '/s16H6tpK2utvwDtzZ8Qy4qm5Emw.jpg',
    release_date: '2022-12-14',
    original_language: 'en',
    genre_ids: [878, 12, 28],
    vote_average: 7.7,
    vote_count: 11400,
    runtime: 192,
    certification: 'UA',
    trailerKey: 'd9MyW72ELq0',
    credits: {
      cast: [
        { id: 65731, name: 'Sam Worthington', character: 'Jake Sully', profile_path: '/abc.jpg' },
        { id: 8691, name: 'Zoe Saldaña', character: 'Neytiri', profile_path: '/def.jpg' },
        { id: 10205, name: 'Sigourney Weaver', character: 'Kiri', profile_path: '/ghi.jpg' },
      ],
    },
  },
  {
    id: 27205,
    _id: '27205',
    title: 'Inception',
    overview:
      'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: "inception", the implantation of another person\'s idea into a target\'s subconscious.',
    tagline: 'Your mind is the scene of the crime.',
    poster_path: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    backdrop_path: '/s3TBrRGB1jav7Z4argF7duvKdG2.jpg',
    release_date: '2010-07-15',
    original_language: 'en',
    genre_ids: [28, 878, 12],
    vote_average: 8.4,
    vote_count: 36000,
    runtime: 148,
    certification: 'UA',
    trailerKey: 'YoHD9XEInc0',
    credits: {
      cast: [
        { id: 6193, name: 'Leonardo DiCaprio', character: 'Dom Cobb', profile_path: '/jkl.jpg' },
        { id: 24045, name: 'Joseph Gordon-Levitt', character: 'Arthur', profile_path: '/mno.jpg' },
        { id: 27578, name: 'Elliot Page', character: 'Ariadne', profile_path: '/pqr.jpg' },
        { id: 2524, name: 'Tom Hardy', character: 'Eames', profile_path: '/stu.jpg' },
      ],
    },
  },
]
