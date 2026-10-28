import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Film, CheckCircle, XCircle, Mail, KeyRound, ArrowRight, RotateCw } from 'lucide-react'
import { toast } from 'react-toastify'
import API from '../api/axios'
import { useAuth } from '../context/AuthContext'

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()

  const urlToken = searchParams.get('token') || ''
  const urlEmail = searchParams.get('email') || ''

  const [email, setEmail] = useState(urlEmail)
  const [otp, setOtp] = useState('')
  const [status, setStatus] = useState('idle') // 'idle' | 'verifying' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('')
  const [resending, setResending] = useState(false)

  // Auto-verify if token is provided in URL
  useEffect(() => {
    if (urlToken) {
      handleAutoVerify(urlToken, urlEmail)
    }
  }, [urlToken, urlEmail])

  const handleAutoVerify = async (token, emailAddr) => {
    setStatus('verifying')
    try {
      const res = await API.post('/user/verify-email', {
        token,
        email: emailAddr || undefined,
      })
      setStatus('success')
      toast.success(res.data?.message || 'Email verified successfully!')
      if (res.data?.token && res.data?.user) {
        login(res.data.user, res.data.token)
        setTimeout(() => navigate('/home'), 1800)
      } else {
        setTimeout(() => navigate('/login'), 2000)
      }
    } catch (err) {
      setStatus('error')
      const msg = err.response?.data?.message || 'Verification link is invalid or has expired.'
      setErrorMessage(msg)
      toast.error(msg)
    }
  }

  const handleManualOtpSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }
    if (!otp.trim() || otp.trim().length !== 6) {
      toast.error('Please enter the 6-digit OTP code')
      return
    }

    setStatus('verifying')
    try {
      const res = await API.post('/user/verify-email', {
        email: email.trim(),
        otp: otp.trim(),
      })
      setStatus('success')
      toast.success(res.data?.message || 'Email verified successfully!')
      if (res.data?.token && res.data?.user) {
        login(res.data.user, res.data.token)
        setTimeout(() => navigate('/home'), 1500)
      } else {
        setTimeout(() => navigate('/login'), 1500)
      }
    } catch (err) {
      setStatus('error')
      const msg = err.response?.data?.message || 'Invalid or expired OTP. Please check and try again.'
      setErrorMessage(msg)
      toast.error(msg)
    }
  }

  const handleResend = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email first')
      return
    }
    setResending(true)
    try {
      const res = await API.post('/user/resend-verification', { email: email.trim() })
      toast.success(res.data?.message || 'A new 6-digit OTP has been sent to your email!')
      setStatus('idle')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend verification code')
    } finally {
      setResending(false)
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
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
            <Film className="w-8 h-8 text-[#00a8e1]" />
            <span className="text-2xl font-black text-white">i<span className="text-[#00a8e1]">Movies</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Email Authentication</h1>
          <p className="text-[#8197a4] text-sm mt-1">Activate your cinema reservation account</p>
        </div>

        {/* Card */}
        <div className="bg-[#1a242f] border border-[#253241] rounded-2xl p-8 shadow-2xl">
          {status === 'verifying' ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-[#00a8e1]/30 border-t-[#00a8e1] rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-white text-lg font-bold mb-2">Verifying Your Email...</h3>
              <p className="text-[#8197a4] text-sm">Please wait while we confirm your credentials.</p>
            </div>
          ) : status === 'success' ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-500/20 text-green-400 border border-green-500/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Account Verified! 🎉</h3>
              <p className="text-[#c0cdd5] text-sm mb-6">
                Your email has been authenticated. Redirecting you to iMovies...
              </p>
              <button
                onClick={() => navigate('/home')}
                className="w-full bg-[#00a8e1] hover:bg-[#0891c9] text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                Go to Home
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              {status === 'error' && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-red-400 font-semibold text-sm">Verification Failed</h4>
                    <p className="text-red-300 text-xs mt-0.5">{errorMessage}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleManualOtpSubmit} className="space-y-4">
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

                <div>
                  <label className="block text-sm font-medium text-[#c0cdd5] mb-1.5">
                    6-Digit One-Time Password (OTP)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full bg-[#0f171e] border border-[#253241] text-white text-center font-mono text-2xl tracking-[0.5em] placeholder-[#8197a4] focus:border-[#00a8e1] focus:outline-none rounded-lg py-3 transition-colors duration-200"
                    />
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8197a4]" />
                  </div>
                  <p className="text-xs text-[#8197a4] mt-1.5 text-center">
                    Check your inbox (or spam) for the Brevo email code.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#00a8e1] hover:bg-[#0891c9] text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 mt-2"
                >
                  Verify & Activate
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="pt-2 border-t border-[#253241] flex items-center justify-between text-xs text-[#8197a4]">
                  <span>Didn't receive the email?</span>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-[#00a8e1] hover:text-[#0891c9] font-medium flex items-center gap-1 disabled:opacity-50"
                  >
                    <RotateCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                    Resend Code
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <p className="text-center text-[#8197a4] text-sm mt-6">
          Back to{' '}
          <Link to="/login" className="text-[#00a8e1] hover:underline font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}

export default VerifyEmailPage
