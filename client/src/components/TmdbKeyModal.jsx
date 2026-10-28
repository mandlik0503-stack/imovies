import React, { useState } from 'react'
import { X, Key, Check, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react'
import { getApiKey, setApiKey } from '../api/tmdb'
import { toast } from 'react-toastify'

const TmdbKeyModal = ({ isOpen, onClose, onKeyUpdated }) => {
  const [apiKeyInput, setApiKeyInput] = useState(getApiKey())
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  if (!isOpen) return null

  const handleSave = () => {
    if (!apiKeyInput.trim()) {
      toast.error('Please enter a valid TMDB API key')
      return
    }
    setApiKey(apiKeyInput.trim())
    toast.success('TMDB API Key updated successfully!')
    if (onKeyUpdated) onKeyUpdated()
    onClose()
  }

  const handleResetDefault = () => {
    setApiKey('')
    setApiKeyInput(getApiKey())
    toast.info('Reset to default TMDB API key')
    if (onKeyUpdated) onKeyUpdated()
  }

  const handleTestKey = async () => {
    if (!apiKeyInput.trim()) return
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/popular?api_key=${apiKeyInput.trim()}&page=1`
      )
      if (res.ok) {
        setTestResult({ success: true, message: 'Valid API Key! Connection successful.' })
      } else {
        setTestResult({
          success: false,
          message: `TMDB rejected key (Status ${res.status}). Check credentials.`,
        })
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Network check failed or offline. Fallback mode is active.',
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#1a242f] border border-[#253241] rounded-2xl p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#253241]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00a8e1]/10 border border-[#00a8e1]/20 flex items-center justify-center">
              <Key className="w-5 h-5 text-[#00a8e1]" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">TMDB API Configuration</h3>
              <p className="text-xs text-[#8197a4]">The Movie Database (v3) Integration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#253241] hover:bg-[#00a8e1] text-[#c0cdd5] hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-[#8197a4] leading-relaxed">
          iMovies fetches live trending cinema, high-resolution backdrops, trailers, and cast from TMDB. You can supply your own API key or use the built-in demo key.
        </p>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#c0cdd5] mb-2">
            API Key (v3 auth)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="e.g. 4e44d9029b1270a757cddc766a1bcb63"
              className="flex-1 bg-[#0f171e] border border-[#253241] text-white placeholder-[#8197a4] focus:border-[#00a8e1] focus:outline-none rounded-lg px-3 py-2 text-sm font-mono"
            />
            <button
              onClick={handleTestKey}
              disabled={testing}
              className="px-3 py-2 bg-[#253241] hover:bg-[#2e3e50] text-[#00a8e1] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Test'}
            </button>
          </div>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              testResult.success
                ? 'bg-green-950/40 border border-green-500/30 text-green-300'
                : 'bg-yellow-950/40 border border-yellow-500/30 text-yellow-300'
            }`}
          >
            {testResult.success ? (
              <Check className="w-4 h-4 text-green-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-[#8197a4] pt-1">
          <a
            href="https://www.themoviedb.org/settings/api"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#00a8e1] hover:underline"
          >
            Get a free TMDB Key <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={handleResetDefault}
            className="text-[#8197a4] hover:text-white underline"
          >
            Reset to Default
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#253241]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#253241] hover:bg-[#2e3e50] text-[#c0cdd5] text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-[#00a8e1] hover:bg-[#0891c9] text-white text-sm font-semibold transition-all shadow-md shadow-[#00a8e1]/20"
          >
            Save & Apply
          </button>
        </div>
      </div>
    </div>
  )
}

export default TmdbKeyModal
