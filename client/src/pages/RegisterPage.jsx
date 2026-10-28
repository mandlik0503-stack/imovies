import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Film, Mail, Lock, User, Eye, EyeOff, UserPlus, KeyRound, CheckCircle, RotateCw, ArrowRight } from 'lucide-react'
import { toast } from 'react-toastify'
import API from '../api/axios'
import { useAuth } from '../context/AuthContext'

const RegisterPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  // Step 1: Form, Step 2: OTP Verification
  const [step, setStep] = useState('form') // 'form' | 'otp'

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  // OTP state
  const [otp, setOtp] = useState('')
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(30)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    let timer
    if (step === 'otp' && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true)
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [step, resendCooldown])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const validate = () => {
    if (!form.username.trim()) { toast.error('Username is required'); return false }
    if (form.username.trim().length < 3) { toast.error('Username must be at least 3 characters'); return false }
    if (!form.email.trim()) { toast.error('Email is required'); return false }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error('Enter a valid email'); return false }
    if (!form.password) { toast.error('Password is required'); return false }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return false }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return false }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const res = await API.post('/user/register', {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      toast.info(res.data?.message || 'Verification code sent to your email!')
      setStep('otp')
      setResendCooldown(30)
      setCanResend(false)
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!otp.trim() || otp.trim().length !== 6) {
      toast.error('Please enter the 6-digit OTP code')
      return
    }

    setVerifyingOtp(true)
    try {
      const res = await API.post('/user/verify-email', {
        email: form.email.trim(),
        otp: otp.trim(),
      })
      toast.success(res.data?.message || 'Email verified successfully! Welcome to iMovies.')
      if (res.data?.token && res.data?.user) {
        login(res.data.user, res.data.token)
        navigate('/home')
      } else {
        navigate('/login')
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired OTP. Please try again.'
      toast.error(msg)
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handleResendOtp = async () => {
    if (!canResend) return
    try {
      await API.post('/user/resend-verification', { email: form.email.trim() })
      toast.success('A new 6-digit verification code has been emailed to you!')
      setResendCooldown(30)
      setCanResend(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code')
    }
  }

  const getPasswordStrength = () => {
    const p = form.password
    if (!p) return null
    if (p.length < 6) return { label: 'Too short', color: 'bg-red-500', width: 'w-1/4' }
    if (p.length < 8) return { label: 'Weak', color: 'bg-orange-500', width: 'w-2/4' }
    if (!/[A-Z]/.test(p) || !/[0-9]/.test(p)) return { label: 'Medium', color: 'bg-yellow-500', width: 'w-3/4' }
    return { label: 'Strong', color: 'bg-green-500', width: 'w-full' }
  }

  const strength = getPasswordStrength()

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
          <h1 className="text-2xl font-bold text-white">
            {step === 'form' ? 'Create your account' : 'Verify Email with OTP'}
          </h1>
          <p className="text-[#8197a4] text-sm mt-1">
            {step === 'form'
              ? 'Join millions of movie lovers'
              : `Code sent to ${form.email}`}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#1a242f] border border-[#253241] rounded-2xl p-8 shadow-2xl">
          {step === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-[#c0cdd5] mb-1.5">Username</label>
                <div className="relative">
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="johndoe"
                    autoComplete="username"
                    className="w-full bg-[#0f171e] border border-[#253241] text-white placeholder-[#8197a4] focus:border-[#00a8e1] focus:outline-none rounded-lg px-4 py-3 pl-10 text-sm transition-colors duration-200"
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8197a4]" />
                </div>
              </div>

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
                <label className="block text-sm font-medium text-[#c0cdd5] mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
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
                {strength && (
                  <div className="mt-2">
                    <div className="h-1 bg-[#253241] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                    </div>
                    <p className="text-xs text-[#8197a4] mt-1">{strength.label}</p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-[#c0cdd5] mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    className={`w-full bg-[#0f171e] border text-white placeholder-[#8197a4] focus:border-[#00a8e1] focus:outline-none rounded-lg px-4 py-3 pl-10 pr-10 text-sm transition-colors duration-200 ${
                      form.confirmPassword && form.password !== form.confirmPassword
                        ? 'border-red-500'
                        : 'border-[#253241]'
                    }`}
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8197a4]" />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8197a4] hover:text-white"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                )}
              </div>

              <div className="bg-[#253241]/50 border border-[#253241] rounded-lg p-3 text-xs text-[#8197a4]">
                🛡️ For your security, a <strong>6-digit OTP</strong> and verification link will be sent to your email to authenticate your account.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00a8e1] hover:bg-[#0891c9] disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending Verification Code...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Continue with Email Verification
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: OTP VERIFICATION WINDOW */
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 bg-[#00a8e1]/10 border border-[#00a8e1]/30 text-[#00a8e1] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-7 h-7" />
                </div>
                <h3 className="text-white text-lg font-bold">Enter Verification Code</h3>
                <p className="text-[#8197a4] text-xs mt-1">
                  We've sent a 6-digit code via Brevo to:
                </p>
                <div className="inline-flex items-center gap-1.5 bg-[#0f171e] text-[#00a8e1] font-mono text-xs px-3 py-1 rounded-full border border-[#253241] mt-2">
                  <span>{form.email}</span>
                  <button
                    type="button"
                    onClick={() => setStep('form')}
                    className="text-[#8197a4] hover:text-white underline ml-1 text-[11px]"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Monospace OTP Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8197a4] text-center mb-2">
                  6-Digit OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  autoFocus
                  className="w-full bg-[#0f171e] border-2 border-[#00a8e1]/50 text-white text-center font-mono text-3xl tracking-[0.4em] placeholder-[#8197a4] focus:border-[#00a8e1] focus:outline-none rounded-xl py-3.5 transition-colors duration-200"
                />
                <p className="text-xs text-[#8197a4] text-center mt-2">
                  Valid for 15 minutes. Check spam if not in your primary inbox.
                </p>
              </div>

              <button
                type="submit"
                disabled={verifyingOtp || otp.length !== 6}
                className="w-full bg-[#00a8e1] hover:bg-[#0891c9] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                {verifyingOtp ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating OTP...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Verify & Activate Account
                  </>
                )}
              </button>

              <div className="pt-3 border-t border-[#253241] flex items-center justify-between text-xs text-[#8197a4]">
                <span>Didn't get the code?</span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-[#00a8e1] hover:text-[#0891c9] font-medium flex items-center gap-1"
                  >
                    <RotateCw className="w-3 h-3" />
                    Resend Code
                  </button>
                ) : (
                  <span className="text-[#8197a4]">
                    Resend in <span className="text-[#00a8e1] font-mono font-bold">{resendCooldown}s</span>
                  </span>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Footer link */}
        <p className="text-center text-[#8197a4] text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#00a8e1] hover:text-[#0891c9] font-medium transition-colors duration-200">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
