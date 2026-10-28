import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Film, Ticket, Star, Shield, Zap, Monitor, ChevronRight } from 'lucide-react'
import Footer from '../components/Footer'

const FEATURES = [
  {
    icon: Zap,
    title: 'Instant Booking',
    desc: 'Book tickets in seconds with our lightning-fast booking system. No more waiting in queues.',
  },
  {
    icon: Monitor,
    title: 'Real-time Seat Selection',
    desc: 'See available seats in real-time with live updates. Pick your perfect spot before anyone else.',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    desc: 'Industry-grade encryption keeps your payment details safe. Book with confidence.',
  },
  {
    icon: Star,
    title: 'Reviews & Ratings',
    desc: 'Read authentic reviews from fellow movie lovers and share your own experiences.',
  },
]

const GENRES = ['Action', 'Drama', 'Comedy', 'Thriller', 'Sci-Fi', 'Romance', 'Horror', 'Animation']

const GENRE_COLORS = [
  'from-red-900/40 to-red-800/20 border-red-700/40 hover:border-red-500/60',
  'from-blue-900/40 to-blue-800/20 border-blue-700/40 hover:border-blue-500/60',
  'from-yellow-900/40 to-yellow-800/20 border-yellow-700/40 hover:border-yellow-500/60',
  'from-purple-900/40 to-purple-800/20 border-purple-700/40 hover:border-purple-500/60',
  'from-cyan-900/40 to-cyan-800/20 border-cyan-700/40 hover:border-cyan-500/60',
  'from-pink-900/40 to-pink-800/20 border-pink-700/40 hover:border-pink-500/60',
  'from-green-900/40 to-green-800/20 border-green-700/40 hover:border-green-500/60',
  'from-orange-900/40 to-orange-800/20 border-orange-700/40 hover:border-orange-500/60',
]

// Simple CSS particle component
const Particles = () => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 15 + 10,
    delay: Math.random() * 10,
    opacity: Math.random() * 0.5 + 0.1,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute bottom-0 rounded-full bg-[#00a8e1]"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animation: `floatUp ${p.duration}s ${p.delay}s linear infinite`,
          }}
        />
      ))}
    </div>
  )
}

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#0f171e]">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f171e] via-[#1a242f] to-[#0f171e]" />
        {/* Radial glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[600px] h-[600px] rounded-full bg-[#00a8e1]/5 blur-3xl" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[300px] h-[300px] rounded-full bg-[#00a8e1]/8 blur-2xl" />
        </div>

        {/* Particles */}
        <Particles />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#00a8e1 1px, transparent 1px), linear-gradient(90deg, #00a8e1 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Navbar placeholder space */}
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#00a8e1]/10 border border-[#00a8e1]/30 flex items-center justify-center pulse-glow">
              <Film className="w-8 h-8 text-[#00a8e1]" />
            </div>
            <span className="text-4xl font-black text-[#00a8e1] tracking-tight">iMovies</span>
          </div>

          {/* Tagline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-tight mb-6">
            Your Ultimate
            <span className="block text-[#00a8e1]">Movie Booking</span>
            Experience
          </h1>

          <p className="text-[#8197a4] text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Discover blockbusters, pick your perfect seats, and create unforgettable cinema memories — all in one place.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="flex items-center gap-2 bg-[#00a8e1] hover:bg-[#0891c9] text-white font-bold px-8 py-4 rounded-xl text-lg transition-all duration-200 shadow-lg hover:shadow-[#00a8e1]/40 hover:shadow-2xl hover:-translate-y-0.5"
            >
              <Ticket className="w-5 h-5" />
              Sign In & Book Now
            </Link>
            <Link
              to="/register"
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-[#00a8e1]/60 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all duration-200"
            >
              Create Free Account
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { label: 'Movies', value: '500+' },
              { label: 'Cities', value: '50+' },
              { label: 'Happy Users', value: '1M+' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-[#00a8e1]">{value}</div>
                <div className="text-[#8197a4] text-sm mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0f171e] to-transparent" />
      </section>

      {/* Featured Genre Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Browse by Genre</h2>
          <p className="text-[#8197a4] text-lg">Find movies that match your mood</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {GENRES.map((genre, i) => (
            <Link
              key={genre}
              to="/register"
              className={`bg-gradient-to-br ${GENRE_COLORS[i]} border rounded-xl p-6 text-center font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
            >
              {genre}
            </Link>
          ))}
        </div>
      </section>

      {/* Why iMovies section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Why Choose iMovies?</h2>
          <p className="text-[#8197a4] text-lg max-w-2xl mx-auto">
            We've reimagined the movie booking experience from the ground up.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-[#1a242f] border border-[#253241] rounded-2xl p-6 hover:border-[#00a8e1]/40 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#00a8e1]/10 border border-[#00a8e1]/20 flex items-center justify-center mb-4 group-hover:bg-[#00a8e1]/20 transition-colors duration-300">
                <Icon className="w-6 h-6 text-[#00a8e1]" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
              <p className="text-[#8197a4] text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center bg-gradient-to-br from-[#1a242f] to-[#253241] rounded-3xl p-12 border border-[#253241] relative overflow-hidden">
          <div className="absolute inset-0 bg-[#00a8e1]/3" />
          <div className="relative">
            <Film className="w-12 h-12 text-[#00a8e1] mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Experience Cinema?</h2>
            <p className="text-[#8197a4] mb-8">Join over 1 million users who book their movie tickets with iMovies.</p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-[#00a8e1] hover:bg-[#0891c9] text-white font-bold px-8 py-4 rounded-xl text-lg transition-all duration-200 hover:shadow-lg hover:shadow-[#00a8e1]/30"
            >
              Get Started for Free
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default LandingPage
