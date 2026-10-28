import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Calendar, Plus, ArrowLeft, Film, Building2, Clock } from 'lucide-react'
import API from '../../api/axios'
import Navbar from '../../components/Navbar'
import LoadingSpinner from '../../components/LoadingSpinner'

const SHOW_TIMES = ['9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM', '9:00 PM']

const AddShowPage = () => {
  const navigate = useNavigate()

  const [movies, setMovies] = useState([])
  const [theatres, setTheatres] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    movieId: '',
    theatreName: '',
    showDate: '',
    showTime: '',
  })

  useEffect(() => {
    const load = async () => {
      try {
        setDataLoading(true)
        const [moviesRes, theatresRes] = await Promise.all([
          API.get('/movie'),
          API.get('/theatre'),
        ])
        setMovies(moviesRes.data || [])
        setTheatres(theatresRes.data || [])
      } catch {
        toast.error('Failed to load movies or theatres')
      } finally {
        setDataLoading(false)
      }
    }
    load()
  }, [])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const validate = () => {
    if (!form.movieId) { toast.error('Please select a movie'); return false }
    if (!form.theatreName) { toast.error('Please select a theatre'); return false }
    if (!form.showDate) { toast.error('Please select a show date'); return false }
    const selected = new Date(form.showDate)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    if (selected < today) { toast.error('Show date cannot be in the past'); return false }
    if (!form.showTime) { toast.error('Please select a show time'); return false }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const selectedMovie = movies.find((m) => m._id === form.movieId)
      const payload = {
        movieId: form.movieId,
        movieName: selectedMovie?.movieName,
        theatreName: form.theatreName,
        showDate: form.showDate,
        showTime: form.showTime,
      }
      await API.post('/shows', payload)
      toast.success('Show added successfully!')
      navigate('/admin')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add show')
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const selectedMovie = movies.find((m) => m._id === form.movieId)
  const selectedTheatre = theatres.find((t) => t.theatreName === form.theatreName)

  if (dataLoading) return <LoadingSpinner message="Loading data..." />

  return (
    <div className="min-h-screen bg-[#0f171e]">
      <Navbar />

      <div className="pt-24 pb-16 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="text-[#8197a4] hover:text-white transition-colors duration-200"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-[#00a8e1]" />
              Add New Show
            </h1>
            <p className="text-[#8197a4] text-sm mt-0.5">Schedule a movie show at a theatre</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Movie Select */}
          <div>
            <label className="block text-sm font-medium text-[#c0cdd5] mb-1.5">
              <span className="flex items-center gap-1.5"><Film className="w-4 h-4 text-[#00a8e1]" /> Select Movie *</span>
            </label>
            {movies.length === 0 ? (
              <div className="bg-[#1a242f] border border-[#253241] rounded-lg px-4 py-3 text-[#8197a4] text-sm">
                No movies available. <button type="button" onClick={() => navigate('/addmovie')} className="text-[#00a8e1] hover:underline">Add a movie first.</button>
              </div>
            ) : (
              <select
                name="movieId"
                value={form.movieId}
                onChange={handleChange}
                className="w-full bg-[#1a242f] border border-[#253241] text-white focus:border-[#00a8e1] focus:outline-none rounded-lg px-4 py-3 transition-colors duration-200"
              >
                <option value="">Choose a movie</option>
                {movies.map((m) => (
                  <option key={m._id} value={m._id}>{m.movieName}</option>
                ))}
              </select>
            )}
            {/* Movie preview */}
            {selectedMovie && (
              <div className="mt-3 flex items-center gap-3 p-3 bg-[#1a242f] border border-[#253241] rounded-xl">
                {selectedMovie.posterUrl && (
                  <img src={selectedMovie.posterUrl} alt={selectedMovie.movieName}
                    className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
                    onError={(e) => e.target.style.display = 'none'} />
                )}
                <div>
                  <p className="text-white font-semibold text-sm">{selectedMovie.movieName}</p>
                  <p className="text-[#8197a4] text-xs">{selectedMovie.language} · {selectedMovie.duration} min · {selectedMovie.certification}</p>
                </div>
              </div>
            )}
          </div>

          {/* Theatre Select */}
          <div>
            <label className="block text-sm font-medium text-[#c0cdd5] mb-1.5">
              <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-[#00a8e1]" /> Select Theatre *</span>
            </label>
            {theatres.length === 0 ? (
              <div className="bg-[#1a242f] border border-[#253241] rounded-lg px-4 py-3 text-[#8197a4] text-sm">
                No theatres available. <button type="button" onClick={() => navigate('/addtheatre')} className="text-[#00a8e1] hover:underline">Add a theatre first.</button>
              </div>
            ) : (
              <select
                name="theatreName"
                value={form.theatreName}
                onChange={handleChange}
                className="w-full bg-[#1a242f] border border-[#253241] text-white focus:border-[#00a8e1] focus:outline-none rounded-lg px-4 py-3 transition-colors duration-200"
              >
                <option value="">Choose a theatre</option>
                {theatres.map((t) => (
                  <option key={t._id || t.theatreName} value={t.theatreName}>
                    {t.theatreName} — {t.location}
                  </option>
                ))}
              </select>
            )}
            {/* Theatre preview */}
            {selectedTheatre && (
              <div className="mt-3 p-3 bg-[#1a242f] border border-[#253241] rounded-xl">
                <p className="text-white font-semibold text-sm">{selectedTheatre.theatreName}</p>
                <p className="text-[#8197a4] text-xs">{selectedTheatre.location}</p>
                <div className="flex gap-3 mt-1 text-xs text-[#8197a4]">
                  <span>Balcony: ₹{selectedTheatre.balconySeatPrice}</span>
                  <span>Middle: ₹{selectedTheatre.middleSeatPrice}</span>
                  <span>Lower: ₹{selectedTheatre.lowerSeatPrice}</span>
                </div>
              </div>
            )}
          </div>

          {/* Show Date */}
          <div>
            <label className="block text-sm font-medium text-[#c0cdd5] mb-1.5">Show Date *</label>
            <input
              type="date"
              name="showDate"
              value={form.showDate}
              onChange={handleChange}
              min={today}
              className="w-full bg-[#1a242f] border border-[#253241] text-white focus:border-[#00a8e1] focus:outline-none rounded-lg px-4 py-3 transition-colors duration-200 [color-scheme:dark]"
            />
          </div>

          {/* Show Time */}
          <div>
            <label className="block text-sm font-medium text-[#c0cdd5] mb-2">
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#00a8e1]" /> Show Time *</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {SHOW_TIMES.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, showTime: time }))}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                    form.showTime === time
                      ? 'bg-[#00a8e1] border-[#00a8e1] text-white shadow-lg shadow-[#00a8e1]/20'
                      : 'bg-[#1a242f] border-[#253241] text-[#8197a4] hover:border-[#00a8e1]/50 hover:text-white'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Summary preview */}
          {form.movieId && form.theatreName && form.showDate && form.showTime && (
            <div className="bg-[#1a242f] border border-[#00a8e1]/30 rounded-xl p-4">
              <p className="text-[#00a8e1] text-sm font-semibold mb-2">Show Preview</p>
              <div className="text-sm space-y-1 text-[#c0cdd5]">
                <p>🎬 <strong>{selectedMovie?.movieName}</strong></p>
                <p>🏛️ {form.theatreName}</p>
                <p>📅 {new Date(form.showDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p>🕐 {form.showTime}</p>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="flex-1 bg-[#1a242f] hover:bg-[#253241] border border-[#253241] text-[#c0cdd5] font-semibold px-6 py-3 rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-[#00a8e1] hover:bg-[#0891c9] disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Scheduling...</>
              ) : (
                <><Plus className="w-4 h-4" /> Schedule Show</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddShowPage
