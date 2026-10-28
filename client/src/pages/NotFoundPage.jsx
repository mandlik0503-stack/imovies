import React from 'react'
import { Link } from 'react-router-dom'
import { Film, Home, ArrowLeft } from 'lucide-react'

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-[#0f171e] text-white flex flex-col justify-center items-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Logo / Icon */}
        <div className="flex justify-center items-center gap-2 mb-2">
          <div className="w-12 h-12 rounded-xl bg-[#00a8e1]/10 border border-[#00a8e1]/20 flex items-center justify-center">
            <Film className="w-7 h-7 text-[#00a8e1]" />
          </div>
          <span className="text-3xl font-black tracking-tight text-white">
            i<span className="text-[#00a8e1]">Movies</span>
          </span>
        </div>

        {/* 404 Visual */}
        <div className="relative">
          <h1 className="text-9xl font-black text-[#1a242f] select-none tracking-widest">
            404
          </h1>
          <p className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white tracking-wider uppercase">
            Page Not Found
          </p>
        </div>

        <p className="text-[#8197a4] text-sm leading-relaxed">
          Looks like this scene didn't make the final cut. The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/home"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#00a8e1] hover:bg-[#0891c9] text-white font-semibold transition-all duration-200 shadow-lg shadow-[#00a8e1]/20"
          >
            <Home className="w-4 h-4" />
            Go to Home
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#1a242f] hover:bg-[#253241] border border-[#253241] text-[#c0cdd5] hover:text-white font-medium transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Landing
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
