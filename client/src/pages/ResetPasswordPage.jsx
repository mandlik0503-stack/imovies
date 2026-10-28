import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Film, Lock, Mail, KeyRound, Eye, EyeOff, CheckCircle, ArrowRight } from 'lucide-react'
import { toast } from 'react-toastify'
import API from '../api/axios'

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const urlToken = searchParams.get('token') || ''
  const urlEmail = searchParams.get('email') || ''

  const [email, setEmail] = useState(urlEmail)
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email.trim() && !urlToken) {
      toast.error('Email address is required')
      return
    }
    if (!urlToken && (!otp.trim() || otp.trim().length !== 6)) {
      toast.error('Please enter the 6-digit OTP from your email')
      return
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await API.post('/user/reset-password', {
        email: email.trim() || undefined,
        token: urlToken || undefined,
        otp: otp.trim() || undefined,
        newPassword,
      })
      setSuccess(true)
      toast.success(res.data?.message || 'Password reset successfully!')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      const msg = err.response?.data?.message || 'Password reset failed. Please verify your OTP/token and try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f171e] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[450px] h-[450px] rounded-full bg-[#00a8e1]/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
            <Film className="w-8 h-8 text-[#00a8e1]" />
            <span className="text-2xl font-black text-white">i<span className="text-[#00a8e1]">Movies</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Set New Password</h1>
          <p className="text-[#8197a4] text-sm mt-1">Create a secure password for your account</p>
        </div>

        <div className="bg-[#1a242f] border border-[#253241] rounded-2xl p-8 shadow-2xl">
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-500/20 text-green-400 border border-green-500/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Password Updated!</h3>
              <p className="text-[#c0cdd5] text-sm mb-6">
                Your password has been reset successfully. Redirecting you to sign in...
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-[#00a8e1] hover:bg-[#0891c9] text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                Sign In Now
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#c0cdd5] mb-1.5">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-[#0f171e] border border-[#253241] text-white placeholder-[#8197a4] focus:border-[#00a8e1] focus:outline-none rounded-lg px-4 py-3 pl-10 text-sm transition-colors duration-200"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8197a4]" />
                </div>
              </div>

              {!urlToken && (
                <div>
                  <label className="block text-sm font-medium text-[#c0cdd5] mb-1.5">
                    6-Digit Password Reset OTP
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full bg-[#0f171e] border border-[#253241] text-white text-center font-mono text-xl tracking-[0.4em] placeholder-[#8197a4] focus:border-[#00a8e1] focus:outline-none rounded-lg py-2.5 transition-colors duration-200"
                    />
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8197a4]" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#c0cdd5] mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full bg-[#0f171e] border border-[#253241] text-white placeholder-[#8197a4] focus:border-[#00a8e1] focus:outline-none rounded-lg px-4 py-3 pl-10 pr-10 text-sm transition-colors duration-200"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8197a4]" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8197a4] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#c0cdd5] mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full bg-[#0f171e] border border-[#253241] text-white placeholder-[#8197a4] focus:border-[#00a8e1] focus:outline-none rounded-lg px-4 py-3 pl-10 pr-10 text-sm transition-colors duration-200"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8197a4]" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00a8e1] hover:bg-[#0891c9] disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Reset Password
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[#8197a4] text-sm mt-6">
          Remembered your password?{' '}
          <Link to="/login" className="text-[#00a8e1] hover:underline font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}

export default ResetPasswordPage
