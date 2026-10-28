import React from 'react'
import { Link } from 'react-router-dom'
import { Film, Twitter, Instagram, Facebook, Youtube, Mail } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#0f171e] border-t border-[#1a242f] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Film className="w-7 h-7 text-[#00a8e1]" />
              <span className="text-xl font-bold text-[#00a8e1] tracking-wide">iMovies</span>
            </Link>
            <p className="text-[#8197a4] text-sm leading-relaxed mb-4">
              Your ultimate destination for booking movie tickets. Experience cinema like never before.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" aria-label="Twitter" className="text-[#8197a4] hover:text-[#00a8e1] transition-colors duration-200">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Instagram" className="text-[#8197a4] hover:text-[#00a8e1] transition-colors duration-200">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Facebook" className="text-[#8197a4] hover:text-[#00a8e1] transition-colors duration-200">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Youtube" className="text-[#8197a4] hover:text-[#00a8e1] transition-colors duration-200">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Movies */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Movies</h3>
            <ul className="space-y-2">
              {['Now Showing', 'Coming Soon', 'Top Rated', 'Action', 'Drama', 'Comedy'].map((item) => (
                <li key={item}>
                  <Link to="/home" className="text-[#8197a4] hover:text-[#00a8e1] text-sm transition-colors duration-200">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { label: 'My Bookings', href: '/bookings' },
                { label: 'My Watchlist', href: '/watchlist' },
                { label: 'Sign In', href: '/login' },
                { label: 'Create Account', href: '/register' },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.href} className="text-[#8197a4] hover:text-[#00a8e1] text-sm transition-colors duration-200">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Support</h3>
            <ul className="space-y-2">
              {['Help Center', 'Cancellation Policy', 'Terms of Service', 'Privacy Policy', 'Cookie Policy'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-[#8197a4] hover:text-[#00a8e1] text-sm transition-colors duration-200">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center gap-2 text-[#8197a4] text-sm">
              <Mail className="w-4 h-4 text-[#00a8e1]" />
              <span>support@imovies.com</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-[#1a242f] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#8197a4] text-sm">
            © {currentYear} iMovies. All rights reserved. Built with ❤️ for cinema lovers.
          </p>
          <div className="flex items-center gap-4 text-[#8197a4] text-xs">
            <a href="#" className="hover:text-[#00a8e1] transition-colors duration-200">Privacy</a>
            <span>·</span>
            <a href="#" className="hover:text-[#00a8e1] transition-colors duration-200">Terms</a>
            <span>·</span>
            <a href="#" className="hover:text-[#00a8e1] transition-colors duration-200">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
