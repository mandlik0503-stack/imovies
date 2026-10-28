import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Film, Plus, X, ArrowLeft, ImageIcon } from 'lucide-react'
import API from '../../api/axios'
import Navbar from '../../components/Navbar'

const GENRE_OPTIONS = [
  'Action', 'Drama', 'Comedy', 'Thriller', 'Sci-Fi', 'Romance',
  'Horror', 'Animation', 'Adventure', 'Fantasy', 'Crime', 'Biography',
  'Documentary', 'Musical', 'Mystery', 'War', 'Western',
]
const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Marathi']
const CERTIFICATION_OPTIONS = ['U', 'UA', 'A', 'S']

const AddMoviePage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    movieName: '',
    description: '',
    genres: [],
    releaseDate: '',
    language: '',
    duration: '',
    certification: '',
    posterUrl: '',
  })

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const toggleGenre = (genre) => {
    setForm((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre],
    }))
  }

  const validate = () => {
    if (!form.movieName.trim()) { toast.error('Movie name is required'); return false }
    if (!form.description.trim()) { toast.error('Description is required'); return false }
    if (form.genres.length === 0) { toast.error('Select at least one genre'); return false }
    if (!form.releaseDate) { toast.error('Release date is required'); return false }
    if (!form.language) { toast.error('Language is required'); return false }
    if (!form.duration || isNaN(Number(form.duration)) || Number(form.duration) <= 0) {
      toast.error('Enter a valid duration in minutes'); return false
    }
    if (!form.certification) { toast.error('Select a certification'); return false }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await API.post('/movie', {
        ...form,
        duration: Number(form.duration),
      })
      toast.success(`"${form.movieName}" added successfully!`)
      navigate('/admin')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add movie')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f171e]">
      <Navbar />

      <div className="pt-24 pb-16 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <Film className="w-6 h-6 text-[#00a8e1]" />
              Add New Movie
            </h1>
            <p className="text-[#8197a4] text-sm mt-0.5">Fill in the details to add a movie to the catalogue</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Movie Name */}
          <div>
            <label className="block text-sm font-medium text-[#c0cdd5] mb-1.5">Movie Name *</label>
            <input
              type="text"
              name="movieName"
              value={form.movieName}
              onChange={handleChange}
              placeholder="e.g. Interstellar"
              className="w-full bg-[#1a242f] border border-[#253241] text-white placeholder-[#8197a4] focus:border-[#00a8e1] focus:outline-none rounded-lg px-4 py-3 transition-colors duration-200"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#c0cdd5] mb-1.5">Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Write a brief synopsis..."
              rows={4}
              className="w-full bg-[#1a242f] border border-[#253241] text-white placeholder-[#8197a4] focus:border-[#00a8e1] focus:outline-none rounded-lg px-4 py-3 resize-none transition-colors duration-200"
            />
          </div>

          {/* Genres */}
          <div>
            <label className="block text-sm font-medium text-[#c0cdd5] mb-2">Genres * (select all that apply)</label>
            <div className="flex flex-wrap gap-2">
              {GENRE_OPTIONS.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border ${
                    form.genres.includes(genre)
                      ? 'bg-[#00a8e1] border-[#00a8e1] text-white'
                      : 'bg-[#1a242f] border-[#253241] text-[#8197a4] hover:text-white hover:border-[#00a8e1]/50'
                  }`}
                >
                  {form.genres.includes(genre) && <X className="w-3 h-3" />}
                  {genre}
                </button>
              ))}
            </div>
            {form.genres.length > 0 && (
              <p className="text-[#00a8e1] text-xs mt-2">Selected: {form.genres.join(', ')}</p>
            )}
          </div>

          {/* Row: Release Date + Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#c0cdd5] mb-1.5">Release Date *</label>
              <input
                type="date"
                name="releaseDate"
                value={form.releaseDate}
                onChange={handleChange}
                className="w-full bg-[#1a242f] border border-[#253241] text-white focus:border-[#00a8e1] focus:outline-none rounded-lg px-4 py-3 transition-colors duration-200 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#c0cdd5] mb-1.5">Language *</label>
              <select
                name="language"
                value={form.language}
                onChange={handleChange}
                className="w-full bg-[#1a242f] border border-[#253241] text-white focus:border-[#00a8e1] focus:outline-none rounded-lg px-4 py-3 transition-colors duration-200"
              >
                <option value="">Select language</option>
                {LANGUAGE_OPTIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row: Duration + Certification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#c0cdd5] mb-1.5">Duration (minutes) *</label>
              <input
                type="number"
                name="duration"
                value={form.duration}
                onChange={handleChange}
                placeholder="e.g. 148"
                min="1"
                className="w-full bg-[#1a242f] border border-[#253241] text-white placeholder-[#8197a4] focus:border-[#00a8e1] focus:outline-none rounded-lg px-4 py-3 transition-colors duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#c0cdd5] mb-1.5">Certification *</label>
              <div className="flex gap-2">
                {CERTIFICATION_OPTIONS.map((cert) => (
                  <button
                    key={cert}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, certification: cert }))}
                    className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all duration-200 border ${
                      form.certification === cert
                        ? 'bg-[#00a8e1] border-[#00a8e1] text-white'
                        : 'bg-[#1a242f] border-[#253241] text-[#8197a4] hover:border-[#00a8e1]/50 hover:text-white'
                    }`}
                  >
                    {cert}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Poster URL */}
          <div>
            <label className="block text-sm font-medium text-[#c0cdd5] mb-1.5">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" /> Poster URL (optional)
              </span>
            </label>
            <input
              type="url"
              name="posterUrl"
              value={form.posterUrl}
              onChange={handleChange}
              placeholder="https://example.com/poster.jpg"
              className="w-full bg-[#1a242f] border border-[#253241] text-white placeholder-[#8197a4] focus:border-[#00a8e1] focus:outline-none rounded-lg px-4 py-3 transition-colors duration-200"
            />
            {/* Poster preview */}
            {form.posterUrl && (
              <div className="mt-3 flex gap-3 items-start">
                <img
                  src={form.posterUrl}
                  alt="Poster preview"
                  className="w-20 h-28 object-cover rounded-lg border border-[#253241]"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
                <p className="text-[#8197a4] text-xs mt-1">Poster preview</p>
              </div>
            )}
          </div>

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
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Adding...</>
              ) : (
                <><Plus className="w-4 h-4" /> Add Movie</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddMoviePage
