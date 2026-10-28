import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Film, Mail, Lock, Eye, EyeOff, LogIn, Shield, KeyRound, CheckCircle, RotateCw, X, ArrowRight } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'
import API from '../api/axios'

const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotStep, setForgotStep] = useState(1) // 1: Email, 2: OTP + New Password
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotOtp, setForgotOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotCooldown, setForgotCooldown] = useState(30)
  const [canResendForgot, setCanResendForgot] = useState(false)

  // Unverified Email Verification Modal State
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [verifyEmail, setVerifyEmail] = useState('')
  const [verifyOtp, setVerifyOtp] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)

  useEffect(() => {
    let timer
    if (showForgotModal && forgotStep === 2 && forgotCooldown > 0) {
      timer = setInterval(() => {
        setForgotCooldown((prev) => {
          if (prev <= 1) {
            setCanResendForgot(true)
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [showForgotModal, forgotStep, forgotCooldown])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const validate = () => {
    if (!form.email.trim()) { toast.error('Email is required'); return false }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error('Enter a valid email'); return false }
    if (!form.password) { toast.error('Password is required'); return false }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return false }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const endpoint = isAdmin ? '/user/adminlogin' : '/user/login'
      const res = await API.post(endpoint, { email: form.email.trim(), password: form.password })
      const { user, token } = res.data
      login(user, token)
      toast.success(`Welcome back, ${user.username || 'User'}!`)
      if (user.isAdmin) {
        navigate('/admin')
      } else {
        navigate('/home')
      }
    } catch (err) {
      const data = err.response?.data
      if (err.response?.status === 403 && data?.requiresVerification) {
        setVerifyEmail(data.email || form.email.trim())
        setShowVerifyModal(true)
        toast.info('Please verify your email with the 6-digit code sent to your inbox.')
      } else {
        const msg = data?.message || 'Login failed. Please check your credentials.'
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle Send Password Reset Code
  const handleSendResetCode = async (e) => {
    e.preventDefault()
    if (!forgotEmail.trim()) {
      toast.error('Please enter your email address')
      return
    }
    setForgotLoading(true)
    try {
      const res = await API.post('/user/forgot-password', { email: forgotEmail.trim() })
      toast.success(res.data?.message || 'Reset code sent to your email!')
      setForgotStep(2)
      setForgotCooldown(30)
      setCanResendForgot(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset code')
    } finally {
      setForgotLoading(false)
    }
  }

  // Handle Submit New Password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault()
    if (!forgotOtp.trim() || forgotOtp.trim().length !== 6) {
      toast.error('Please enter the 6-digit OTP code')
      return
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match')
      return
    }

    setForgotLoading(true)
    try {
      const res = await API.post('/user/reset-password', {
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        newPassword,
      })
      toast.success(res.data?.message || 'Password reset successfully! Please sign in.')
      setShowForgotModal(false)
      setForgotStep(1)
      setForm((prev) => ({ ...prev, email: forgotEmail.trim(), password: '' }))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password. Check your OTP.')
    } finally {
      setForgotLoading(false)
    }
  }

  // Handle Verify OTP from Login Intercept
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!verifyOtp.trim() || verifyOtp.trim().length !== 6) {
      toast.error('Please enter the 6-digit code')
      return
    }

    setVerifyLoading(true)
    try {
      const res = await API.post('/user/verify-email', {
        email: verifyEmail.trim(),
        otp: verifyOtp.trim(),
      })
      toast.success(res.data?.message || 'Email verified successfully!')
      if (res.data?.token && res.data?.user) {
        login(res.data.user, res.data.token)
        navigate('/home')
      } else {
        setShowVerifyModal(false)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired verification code')
    } finally {
      setVerifyLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f171e] flex items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[450px] h-[450px] rounded-full bg-[#00a8e1]/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <Film className="w-8 h-8 text-[#00a8e1]" />
            <span className="text-2xl font-black text-white">i<span className="text-[#00a8e1]">Movies</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-[#8197a4] text-sm mt-1">Sign in to continue booking</p>
        </div>

        {/* Card */}
        <div className="bg-[#1a242f] border border-[#253241] rounded-2xl p-8 shadow-2xl">
          {/* Admin / User toggle */}
          <div className="flex bg-[#0f171e] rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => setIsAdmin(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                !isAdmin ? 'bg-[#00a8e1] text-white shadow-md' : 'text-[#8197a4] hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              User Login
            </button>
            <button
              type="button"
              onClick={() => setIsAdmin(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                isAdmin ? 'bg-[#00a8e1] text-white shadow-md' : 'text-[#8197a4] hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              Admin Login
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#c0cdd5] mb-1.5">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full bg-[#0f171e] border border-[#253241] text-white placeholder-[#8197a4] focus:border-[#00a8e1] focus:outline-none rounded-lg px-4 py-3 pl-10 text-sm transition-colors duration-200"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8197a4]" />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[#c0cdd5]">Password</label>
                {!isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(form.email)
                      setShowForgotModal(true)
                      setForgotStep(1)
                    }}
                    className="text-xs text-[#00a8e1] hover:text-[#0891c9] transition-colors duration-150 font-medium"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-[#0f171e] border border-[#253241] text-white placeholder-[#8197a4] focus:border-[#00a8e1] focus:outline-none rounded-lg px-4 py-3 pl-10 pr-10 text-sm transition-colors duration-200"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8197a4]" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8197a4] hover:text-white transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00a8e1] hover:bg-[#0891c9] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  {isAdmin ? 'Admin Sign In' : 'Sign In'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-[#8197a4] text-sm mt-6">
          New to iMovies?{' '}
          <Link to="/register" className="text-[#00a8e1] hover:text-[#0891c9] font-medium transition-colors duration-200">
            Create an Account
          </Link>
        </p>
      </div>

      {/* ======================================================== */}
      {/* FORGOT PASSWORD MODAL (Brevo Email Link + 6-digit OTP)   */}
      {/* ======================================================== */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1a242f] border border-[#253241] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-[#8197a4] hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-[#00a8e1]/10 text-[#00a8e1] border border-[#00a8e1]/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Password Recovery</h2>
              <p className="text-[#8197a4] text-xs mt-1">
                {forgotStep === 1
                  ? 'Enter your email to receive a 6-digit OTP & reset link'
                  : `Enter the 6-digit OTP sent to ${forgotEmail}`}
              </p>
            </div>

            {forgotStep === 1 ? (
              <form onSubmit={handleSendResetCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8197a4] mb-1.5">
                    Account Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full bg-[#0f171e] border border-[#253241] text-white placeholder-[#8197a4] focus:border-[#00a8e1] focus:outline-none rounded-lg px-4 py-2.5 pl-10 text-sm"
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8197a4]" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-[#00a8e1] hover:bg-[#0891c9] disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  {forgotLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Send Reset Instructions
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8197a4] text-center mb-1">
                    6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    autoFocus
                    className="w-full bg-[#0f171e] border-2 border-[#00a8e1]/50 text-white text-center font-mono text-2xl tracking-[0.4em] rounded-lg py-2 focus:border-[#00a8e1] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8197a4] mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full bg-[#0f171e] border border-[#253241] text-white text-sm rounded-lg px-3 py-2 focus:border-[#00a8e1] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8197a4] mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-[#0f171e] border border-[#253241] text-white text-sm rounded-lg px-3 py-2 focus:border-[#00a8e1] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-[#00a8e1] hover:bg-[#0891c9] disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 mt-2"
                >
                  {forgotLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Save New Password
                    </>
                  )}
                </button>

                <div className="pt-2 flex items-center justify-between text-xs text-[#8197a4]">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="text-[#8197a4] hover:text-white"
                  >
                    ← Change Email
                  </button>
                  {canResendForgot ? (
                    <button
                      type="button"
                      onClick={handleSendResetCode}
                      className="text-[#00a8e1] hover:underline flex items-center gap-1"
                    >
                      <RotateCw className="w-3 h-3" /> Resend Code
                    </button>
                  ) : (
                    <span>Resend in {forgotCooldown}s</span>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* UNVERIFIED EMAIL OTP MODAL (Appears on 403 Unverified)   */}
      {/* ======================================================== */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1a242f] border border-[#253241] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowVerifyModal(false)}
              className="absolute top-4 right-4 text-[#8197a4] hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Email Verification Required</h2>
              <p className="text-[#8197a4] text-xs mt-1">
                Please enter the 6-digit code sent to <strong className="text-white">{verifyEmail}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={verifyOtp}
                  onChange={(e) => setVerifyOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  autoFocus
                  className="w-full bg-[#0f171e] border-2 border-[#00a8e1]/50 text-white text-center font-mono text-3xl tracking-[0.4em] rounded-xl py-3 focus:border-[#00a8e1] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={verifyLoading || verifyOtp.length !== 6}
                className="w-full bg-[#00a8e1] hover:bg-[#0891c9] disabled:opacity-50 text-white font-semibold py-3 rounded-lg text-sm flex items-center justify-center gap-2"
              >
                {verifyLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Verify & Continue
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default LoginPage
