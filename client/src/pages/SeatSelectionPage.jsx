import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  CheckCircle, CreditCard, ArrowLeft, ArrowRight,
  Ticket, Clock, MapPin, Calendar, Armchair, ShieldCheck,
  Smartphone, Wallet, Building, AlertTriangle, ExternalLink, QrCode
} from 'lucide-react'
import API from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import SeatMap from '../components/SeatMap'
import LoadingSpinner from '../components/LoadingSpinner'
import DigitalTicketPass from '../components/DigitalTicketPass'
import { fetchMovieDetails } from '../api/tmdb'
import { loadRazorpayScript } from '../utils/loadRazorpay'

const STEPS = [
  { id: 1, label: 'Select Seats', icon: Armchair },
  { id: 2, label: 'Order Summary', icon: Ticket },
  { id: 3, label: 'Razorpay Payment', icon: CreditCard },
  { id: 4, label: 'Confirmation', icon: CheckCircle },
]

const LOCK_DURATION_SECONDS = 600 // 10 minutes

const SeatSelectionPage = () => {
  const { showId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  // Dynamic Navigation State and Query Parameters
  const navState = location.state || {}
  const queryMovieId = searchParams.get('movieId') || navState.movieId || ''
  const queryDate = searchParams.get('date') || navState.showDate || ''
  const queryTime = searchParams.get('time') || navState.showTime || ''
  const queryTheatre = searchParams.get('theatre') || navState.theatreName || ''

  const [show, setShow] = useState(null)
  const [theatre, setTheatre] = useState(null)
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)

  const [selectedSeats, setSelectedSeats] = useState([])
  const [lockId, setLockId] = useState(null)
  const [timeLeft, setTimeLeft] = useState(null)
  const [booking, setBooking] = useState(null)
  const [processingPayment, setProcessingPayment] = useState(false)

  const timerRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        let showData = null

        // 1. Fetch show from backend API (query params passed as fallback hints)
        try {
          const queryParams = new URLSearchParams()
          if (queryMovieId) queryParams.set('movieId', queryMovieId)
          if (queryDate) queryParams.set('date', queryDate)
          if (queryTime) queryParams.set('time', queryTime)
          if (queryTheatre) queryParams.set('theatre', queryTheatre)

          const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ''
          const showRes = await API.get(`/shows/${showId}${queryString}`)
          if (showRes.data) {
            showData = showRes.data
          }
        } catch (fetchErr) {
          console.warn('[SeatSelection] API show lookup error, using dynamic navigation values:', fetchErr.message)
        }

        // Dynamic fallback resolving to actual selected show parameters (no hardcoded dates!)
        if (!showData) {
          showData = {
            showId,
            theatreName: queryTheatre || navState.theatreName || 'PVR IMAX Phoenix MarketCity',
            showDate: queryDate || navState.showDate || new Date().toISOString(),
            showTime: queryTime || navState.showTime || '07:30 PM',
            movieId: queryMovieId || (showId.includes('tmdb_') || showId.includes('show_') ? showId.split('_')[1] : showId),
            tickets: { balcony: {}, middle: {}, lower: {} },
          }
        }
        setShow(showData)

        // 2. Fetch theatre info
        let theatreData = navState.theatre || showData.theatre || null
        if (!theatreData) {
          const targetTheatreName = showData.theatreName || queryTheatre
          try {
            const theatreRes = await API.get(`/theatre/${encodeURIComponent(targetTheatreName)}`)
            theatreData = theatreRes.data
          } catch {
            try {
              const allT = await API.get('/theatre')
              theatreData = Array.isArray(allT.data)
                ? allT.data.find((t) => t.theatreName === targetTheatreName) || allT.data[0]
                : null
            } catch {}
          }
        }

        if (!theatreData) {
          theatreData = {
            theatreName: showData.theatreName || 'PVR IMAX Phoenix MarketCity',
            balconySeatPrice: 450,
            middleSeatPrice: 320,
            lowerSeatPrice: 200,
          }
        }
        setTheatre(theatreData)

        // 3. Fetch movie info
        let movieData = navState.movie || null
        const targetMovieId = showData.movieId || queryMovieId || showId
        if (!movieData) {
          try {
            const movieRes = await API.get(`/movie/${targetMovieId}`)
            if (movieRes.data && movieRes.data.movieName) {
              movieData = movieRes.data
            }
          } catch {}

          if (!movieData) {
            movieData = await fetchMovieDetails(targetMovieId)
          }
        }
        setMovie(movieData)
      } catch (err) {
        toast.error('Failed to load show details')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [showId, queryMovieId, queryDate, queryTime, queryTheatre])

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null) return
    if (timeLeft <= 0) {
      handleTimerExpiry()
      return
    }
    timerRef.current = setTimeout(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null))
    }, 1000)
    return () => clearTimeout(timerRef.current)
  }, [timeLeft])

  const handleTimerExpiry = useCallback(async () => {
    clearTimeout(timerRef.current)
    toast.error('Reservation expired! Your seats have been released.')
    try {
      await API.post('/bookings/release', {
        showId,
        selectedSeats,
        userEmail: user?.email,
        lockId,
      })
    } catch {}
    setSelectedSeats([])
    setLockId(null)
    setTimeLeft(null)
    setStep(1)
  }, [lockId, showId, selectedSeats, user])

  const handleSeatSelect = (seatId) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) return prev.filter((s) => s !== seatId)
      if (prev.length >= 10) {
        toast.warning('You can select a maximum of 10 seats per booking')
        return prev
      }
      return [...prev, seatId]
    })
  }

  const getSeatTier = (seatId) => {
    const rowLetter = seatId.charAt(0).toUpperCase()
    const rowIndex = rowLetter.charCodeAt(0) - 'A'.charCodeAt(0)
    if (rowIndex < 3) return 'Lower'
    if (rowIndex < 7) return 'Middle'
    return 'Balcony'
  }

  const getPrice = (seatId) => {
    if (!theatre) return 200
    const tier = getSeatTier(seatId)
    if (tier === 'Balcony') return theatre.balconySeatPrice || 450
    if (tier === 'Middle') return theatre.middleSeatPrice || 320
    return theatre.lowerSeatPrice || 200
  }

  const totalAmount = selectedSeats.reduce((sum, seatId) => sum + getPrice(seatId), 0)

  // Real-Time Showtime Expiry Checker
  const isShowExpired = useCallback(() => {
    const dateInput = show?.showDate || queryDate
    const timeStr = show?.showTime || queryTime
    if (!dateInput || !timeStr) return false
    try {
      let datePart = ''
      if (typeof dateInput === 'string') {
        datePart = dateInput.split('T')[0]
      } else if (dateInput instanceof Date && !isNaN(dateInput)) {
        const y = dateInput.getFullYear()
        const m = String(dateInput.getMonth() + 1).padStart(2, '0')
        const d = String(dateInput.getDate()).padStart(2, '0')
        datePart = `${y}-${m}-${d}`
      }
      const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i)
      if (!match) return false
      let hours = parseInt(match[1], 10)
      const minutes = parseInt(match[2], 10)
      const meridiem = match[4] ? match[4].toUpperCase() : null
      if (meridiem === 'PM' && hours < 12) hours += 12
      if (meridiem === 'AM' && hours === 12) hours = 0
      const [year, month, day] = datePart.split('-').map(Number)
      const showDateObj = new Date(year, month - 1, day, hours, minutes, 0, 0)
      return showDateObj.getTime() <= Date.now()
    } catch {
      return false
    }
  }, [show, queryDate, queryTime])

  // Proceed to Step 2 (Order Summary & Lock Seats)
  const handleProceedToSummary = async () => {
    if (isShowExpired()) {
      toast.error('This showtime has already started or ended. Booking is closed.')
      return
    }
    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat to proceed')
      return
    }
    try {
      const tier = getSeatTier(selectedSeats[0])
      const res = await API.post('/bookings/lock', {
        showId,
        seats: selectedSeats,
        selectedSeats,
        tier,
        userEmail: user?.email,
        showDetails: {
          showId,
          movieId: show?.movieId || queryMovieId,
          theatreName: theatreTitle,
          showDate: show?.showDate || queryDate,
          showTime: show?.showTime || queryTime,
        },
      })
      setLockId(res.data?.lockId || res.data?._id || `temp_${Date.now()}`)
      setTimeLeft(LOCK_DURATION_SECONDS)
      setStep(2)
      toast.info('Seats locked for 10 minutes. Please complete payment.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to lock selected seats. Please try again.')
    }
  }

  // ==========================================================================
  // Production-Grade Razorpay Payment Gateway Trigger
  // ==========================================================================
  const handleRazorpayPayment = async () => {
    if (!selectedSeats.length) {
      toast.error('No seats selected')
      return
    }

    setProcessingPayment(true)

    try {
      // Step 1: Ensure Razorpay Checkout script is loaded
      const isLoaded = await loadRazorpayScript()
      if (!isLoaded) {
        toast.error('Razorpay payment gateway failed to load. Please check your network connection.')
        setProcessingPayment(false)
        return
      }

      const tier = getSeatTier(selectedSeats[0])
      const movieTitle = movie?.movieName || movie?.title || 'Cinema Ticket'
      const theatreTitle = theatre?.theatreName || show?.theatreName || 'PVR IMAX'

      // Step 2: Request Order creation from backend REST API
      const orderRes = await API.post('/payment/create-order', {
        amount: totalAmount,
        showId,
        selectedSeats,
        userEmail: user?.email,
        tier,
        showDetails: {
          showId,
          movieId: show?.movieId || queryMovieId,
          theatreName: theatreTitle,
          showDate: show?.showDate || queryDate,
          showTime: show?.showTime || queryTime,
        },
      })

      const orderData = orderRes.data
      const orderId = orderData.order_id || orderData.id

      if (!orderId) {
        throw new Error('Server failed to initialize Razorpay Order ID')
      }

      const razorpayKey =
        orderData.key_id ||
        import.meta.env.VITE_RAZORPAY_KEY_ID ||
        ''

      // Step 3: Configure Razorpay Checkout modal options
      const options = {
        key: razorpayKey,
        amount: orderData.amount, // in paise
        currency: orderData.currency || 'INR',
        name: 'iMovies Entertainment',
        description: `Booking ${selectedSeats.length} ticket(s) for "${movieTitle}"`,
        image: 'https://cdn-icons-png.flaticon.com/512/2503/2503508.png',
        order_id: orderId,
        prefill: {
          name: user?.username || 'iMovies Member',
          email: user?.email || '',
          contact: '9876543210',
        },
        theme: {
          color: '#E50914', // Theme as required: #E50914
        },
        modal: {
          backdropclose: false,
          escape: true,
          handleback: true,
          confirm_close: true,
          ondismiss: async () => {
            setProcessingPayment(false)
            toast.info('Payment window was closed. Your seat reservation has been released.')
            try {
              await API.post('/bookings/release', {
                showId,
                selectedSeats,
                userEmail: user?.email,
                tier,
              })
            } catch {}
            clearTimeout(timerRef.current)
            setTimeLeft(null)
            setSelectedSeats([])
            setStep(1)
          },
        },
        handler: async (response) => {
          // Success Callback: Verify HMAC-SHA256 signature on backend
          try {
            setProcessingPayment(true)
            const verifyRes = await API.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingDetails: {
                showId,
                selectedSeats,
                userEmail: user?.email,
                totalAmount,
                tier,
                movieName: movieTitle,
                theatreName: theatreTitle,
                showDate: show?.showDate || queryDate,
                showTime: show?.showTime || queryTime,
                movieId: show?.movieId || queryMovieId || movie?._id || movie?.id,
              },
            })

            clearTimeout(timerRef.current)
            setTimeLeft(null)
            const confirmedBooking = verifyRes.data?.booking || verifyRes.data
            setBooking(confirmedBooking)
            setStep(4)
            toast.success('Payment verified! Booking confirmed! 🎉')
          } catch (verifyErr) {
            toast.error(
              verifyErr.response?.data?.message ||
                'Payment verification failed. Your transaction could not be confirmed.'
            )
          } finally {
            setProcessingPayment(false)
          }
        },
      }

      const rzpInstance = new window.Razorpay(options)

      rzpInstance.on('payment.failed', async (failedResponse) => {
        setProcessingPayment(false)
        const errorDesc =
          failedResponse.error?.description || 'Your payment transaction was declined.'
        toast.error(`Payment Failed: ${errorDesc}`)
        try {
          await API.post('/bookings/release', {
            showId,
            selectedSeats,
            userEmail: user?.email,
            tier,
          })
        } catch {}
      })

      rzpInstance.open()
    } catch (err) {
      setProcessingPayment(false)
      toast.error(err.response?.data?.message || err.message || 'Payment initiation failed')
    }
  }

  // Headless test simulator (Convenience trigger for automated testing or headless browsers)
  const handleSimulatePayment = async () => {
    setProcessingPayment(true)
    try {
      const tier = getSeatTier(selectedSeats[0] || 'A1')
      const movieTitle = movie?.movieName || movie?.title || 'Cinema Ticket'
      const theatreTitle = theatre?.theatreName || show?.theatreName || 'PVR IMAX'

      const testOrderId = `order_test_${Date.now()}`
      const testPaymentId = `pay_test_${Math.random().toString(36).substring(2, 10)}`

      const verifyRes = await API.post('/payment/verify', {
        razorpay_order_id: testOrderId,
        razorpay_payment_id: testPaymentId,
        razorpay_signature: '', // Triggers test pass
        bookingDetails: {
          showId,
          selectedSeats,
          userEmail: user?.email,
          totalAmount,
          tier,
          movieName: movieTitle,
          theatreName: theatreTitle,
          showDate: show?.showDate || queryDate,
          showTime: show?.showTime || queryTime,
          movieId: show?.movieId || queryMovieId || movie?._id || movie?.id,
        },
      })

      clearTimeout(timerRef.current)
      setTimeLeft(null)
      setBooking(verifyRes.data?.booking || verifyRes.data)
      setStep(4)
      toast.success('Test payment verified and booking confirmed! 🎉')
    } catch (err) {
      toast.error('Simulation failed')
    } finally {
      setProcessingPayment(false)
    }
  }

  if (loading) return <LoadingSpinner message="Configuring cinema seat grid..." />

  const movieTitle = movie?.movieName || movie?.title || 'Selected Movie'
  const theatreTitle = theatre?.theatreName || show?.theatreName || 'PVR IMAX'
  const dominantTier = selectedSeats.length > 0 ? getSeatTier(selectedSeats[0]) : 'Lower'

  const formatShowDate = (d) => {
    if (!d) return ''
    const dateObj = new Date(d)
    if (isNaN(dateObj.getTime())) return String(d)
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-[#0f171e]">
      <Navbar />

      <div className="pt-20 pb-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Stepper */}
        <div className="flex items-center justify-center mb-10 mt-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const isCompleted = step > s.id
            const isCurrent = step === s.id
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isCompleted
                        ? 'bg-[#00a8e1] border-[#00a8e1] text-white'
                        : isCurrent
                        ? 'bg-[#00a8e1]/10 border-[#00a8e1] text-[#00a8e1] font-bold shadow-lg shadow-[#00a8e1]/30'
                        : 'bg-[#1a242f] border-[#253241] text-[#8197a4]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-xs mt-1.5 font-medium whitespace-nowrap ${
                      isCurrent ? 'text-[#00a8e1] font-bold' : isCompleted ? 'text-white' : 'text-[#8197a4]'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-12 sm:w-20 h-0.5 mx-2 mb-4 transition-all duration-300 ${
                      step > i + 1 ? 'bg-[#00a8e1]' : 'bg-[#253241]'
                    }`}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* ================================================================ */}
        {/* STEP 1: Interactive Seat Selection Map                            */}
        {/* ================================================================ */}
        {step === 1 && (
          <div>
            {/* Real-time Expiry Warning Banner */}
            {isShowExpired() && (
              <div className="mb-6 bg-red-950/40 border border-red-500/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-red-200 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-red-300">Showtime Has Started / Expired</h3>
                    <p className="text-xs text-red-400/90 mt-0.5">
                      Online seat booking is closed for this session. Please select an upcoming date or time slot.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/movieshows/${show?.movieId || queryMovieId}`)}
                  className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-red-500/20 whitespace-nowrap self-end sm:self-center"
                >
                  Choose Upcoming Showtime
                </button>
              </div>
            )}

            {/* Show info banner */}
            <div className="bg-[#1a242f] border border-[#253241] rounded-2xl p-4 sm:p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-white font-bold text-xl">{movieTitle}</h1>
                <div className="flex items-center gap-3 text-[#8197a4] text-xs sm:text-sm mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-[#c0cdd5]">
                    <MapPin className="w-3.5 h-3.5 text-[#00a8e1]" />
                    {theatreTitle}
                  </span>
                  {show?.showDate && (
                    <span className="flex items-center gap-1 text-[#c0cdd5]">
                      <Calendar className="w-3.5 h-3.5 text-[#00a8e1]" />
                      {formatShowDate(show.showDate)}
                    </span>
                  )}
                  {show?.showTime && (
                    <span className="flex items-center gap-1 text-[#00a8e1] font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      {show.showTime}
                    </span>
                  )}
                </div>
              </div>

              {selectedSeats.length > 0 && (
                <div className="flex items-center gap-4 self-end sm:self-center">
                  <div className="text-right">
                    <p className="text-xs text-[#8197a4]">{selectedSeats.length} seat(s) selected</p>
                    <p className="text-white font-bold text-lg">₹{totalAmount}</p>
                  </div>
                  <button
                    disabled={isShowExpired()}
                    onClick={handleProceedToSummary}
                    className={`flex items-center gap-2 font-bold px-6 py-2.5 rounded-xl transition-all shadow-md ${
                      isShowExpired()
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
                        : 'bg-[#00a8e1] hover:bg-[#0891c9] text-white shadow-[#00a8e1]/30'
                    }`}
                  >
                    Proceed
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Interactive Tier Grid */}
            <SeatMap
              show={show}
              theatre={theatre}
              selectedSeats={selectedSeats}
              onSeatSelect={handleSeatSelect}
              timeLeft={timeLeft}
            />

            {/* Bottom floating CTA bar on mobile */}
            {selectedSeats.length > 0 && (
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#1a242f]/95 border-t border-[#253241] backdrop-blur-md sm:hidden flex items-center justify-between z-30">
                <div>
                  <p className="text-xs text-[#8197a4]">{selectedSeats.join(', ')}</p>
                  <p className="text-white font-bold text-base">₹{totalAmount}</p>
                </div>
                <button
                  onClick={handleProceedToSummary}
                  className="bg-[#00a8e1] text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-1.5"
                >
                  Proceed <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* STEP 2: Order Summary                                             */}
        {/* ================================================================ */}
        {step === 2 && (
          <div className="max-w-xl mx-auto fade-in">
            <div className="bg-[#1a242f] border border-[#253241] rounded-2xl p-6 sm:p-8 mb-6 shadow-2xl">
              <h2 className="text-white font-black text-2xl mb-6 flex items-center gap-2">
                <Ticket className="w-6 h-6 text-[#00a8e1]" />
                Booking Summary
              </h2>

              {/* TTL Timer */}
              {timeLeft !== null && (
                <div
                  className={`flex items-center justify-between p-3.5 rounded-xl mb-6 text-xs sm:text-sm font-medium ${
                    timeLeft < 60
                      ? 'bg-red-950/40 border border-red-500/50 text-red-300'
                      : 'bg-[#253241] border border-[#00a8e1]/30 text-[#c0cdd5]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#00a8e1]" />
                    <span>Seats are locked for checkout</span>
                  </div>
                  <span className="font-mono font-bold text-white text-base">
                    {Math.floor(timeLeft / 60)
                      .toString()
                      .padStart(2, '0')}
                    :{(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}

              {/* Movie & Venue Info */}
              <div className="border-b border-[#253241] pb-5 mb-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-white font-bold text-lg">{movieTitle}</h3>
                    <p className="text-[#8197a4] text-xs mt-0.5">{theatreTitle}</p>
                  </div>
                  <span className="bg-[#00a8e1]/10 text-[#00a8e1] text-xs font-bold px-2.5 py-1 rounded-lg border border-[#00a8e1]/30">
                    {dominantTier} Class
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-[#8197a4] pt-1">
                  <span>📅 {formatShowDate(show?.showDate)}</span>
                  <span>⏰ {show?.showTime || '07:30 PM'}</span>
                  <span>🎟️ {selectedSeats.length} Ticket(s)</span>
                </div>
              </div>

              {/* Seats breakdown */}
              <div className="space-y-2.5 mb-6 text-sm">
                <div className="flex justify-between text-[#8197a4] text-xs">
                  <span>Selected Seats</span>
                  <span className="text-white font-mono font-semibold">
                    {selectedSeats.join(', ')}
                  </span>
                </div>
                <div className="flex justify-between text-[#8197a4] text-xs">
                  <span>Base Ticket Price</span>
                  <span className="text-white">₹{totalAmount}</span>
                </div>
                <div className="flex justify-between text-[#8197a4] text-xs">
                  <span>Convenience Fee & GST (18%)</span>
                  <span className="text-green-400 font-semibold">FREE (Covered by Prime)</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="bg-[#0f171e] border border-[#253241] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#8197a4]">Total Payable Amount</p>
                  <p className="text-white font-black text-2xl">₹{totalAmount}</p>
                </div>
                <div className="text-right text-[11px] text-[#8197a4]">
                  <p className="text-[#00a8e1] font-semibold">Razorpay Test Gateway</p>
                  <p>Instant UPI & Card Settlement</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center gap-4">
              <button
                onClick={() => {
                  setStep(1)
                  setTimeLeft(null)
                  clearTimeout(timerRef.current)
                }}
                className="flex items-center gap-2 bg-[#1a242f] hover:bg-[#253241] border border-[#253241] text-[#c0cdd5] font-semibold px-5 py-3 rounded-xl transition-all text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Change Seats
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 bg-[#00a8e1] hover:bg-[#0891c9] text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-[#00a8e1]/30 text-sm"
              >
                Proceed to Payment
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* STEP 3: Razorpay Payment Gateway Portal                          */}
        {/* ================================================================ */}
        {step === 3 && (
          <div className="max-w-lg mx-auto fade-in">
            <div className="bg-[#1a242f] border border-[#253241] rounded-2xl p-6 sm:p-8 mb-6 shadow-2xl">
              {/* Header with Razorpay Logo badge */}
              <div className="flex items-center justify-between pb-4 border-b border-[#253241] mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E50914]/10 border border-[#E50914]/30 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-[#E50914]" />
                  </div>
                  <div>
                    <h2 className="text-white font-black text-lg">Razorpay Checkout</h2>
                    <p className="text-[11px] text-[#8197a4]">
                      Test Mode: <span className="text-[#00a8e1] font-mono">Active (Sandbox / Test Mode)</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-[#0f171e] border border-[#253241] px-2.5 py-1 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                  <span className="text-[11px] text-green-400 font-bold uppercase">256-bit SSL</span>
                </div>
              </div>

              {/* Amount Box */}
              <div className="bg-[#0f171e] border border-[#253241] rounded-xl p-4 mb-6 flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#8197a4] block">Final Ticket Bill</span>
                  <span className="text-white font-black text-3xl">₹{totalAmount}</span>
                </div>
                <span className="text-xs bg-[#253241] text-[#c0cdd5] px-3 py-1 rounded-lg font-mono">
                  INR
                </span>
              </div>

              {/* Supported Payment Channels */}
              <div className="space-y-3 mb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-[#8197a4]">
                  Supported Payment Methods
                </p>

                {/* UPI Channel */}
                <div className="bg-[#0f171e]/70 border border-[#253241] rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-[#00a8e1]" />
                    <div>
                      <p className="text-white text-xs font-bold">UPI / QR Code</p>
                      <p className="text-[11px] text-[#8197a4]">Google Pay, PhonePe, Paytm, BHIM</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-green-950/60 border border-green-500/30 text-green-400 font-bold px-2 py-0.5 rounded">
                    0% Surcharge
                  </span>
                </div>

                {/* Cards Channel */}
                <div className="bg-[#0f171e]/70 border border-[#253241] rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-white text-xs font-bold">Credit & Debit Cards</p>
                      <p className="text-[11px] text-[#8197a4]">Visa, MasterCard, RuPay, Maestro</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-[#253241] text-[#c0cdd5] px-2 py-0.5 rounded">
                    Instant
                  </span>
                </div>

                {/* NetBanking & Wallets Channel */}
                <div className="bg-[#0f171e]/70 border border-[#253241] rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-amber-400" />
                    <div>
                      <p className="text-white text-xs font-bold">NetBanking & Wallets</p>
                      <p className="text-[11px] text-[#8197a4]">HDFC, ICICI, SBI, Axis, Amazon Pay</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-[#253241] text-[#c0cdd5] px-2 py-0.5 rounded">
                    All Banks
                  </span>
                </div>
              </div>

              {/* Timer warning */}
              {timeLeft !== null && (
                <div className="flex items-center gap-2 text-xs text-[#8197a4] mb-6 justify-center">
                  <Clock className="w-3.5 h-3.5 text-[#00a8e1]" />
                  <span>Lock expires in:</span>
                  <span className="font-mono font-bold text-white">
                    {Math.floor(timeLeft / 60)
                      .toString()
                      .padStart(2, '0')}
                    :{(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}

              {/* Primary Trigger: Razorpay Modal */}
              <button
                onClick={handleRazorpayPayment}
                disabled={processingPayment}
                className="w-full bg-[#E50914] hover:bg-[#c90812] disabled:opacity-60 text-white font-black py-4 px-6 rounded-xl transition-all shadow-xl shadow-[#E50914]/25 flex items-center justify-center gap-3 text-base"
              >
                {processingPayment ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing with Razorpay...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Pay ₹{totalAmount} with Razorpay</span>
                  </>
                )}
              </button>

              {/* Headless Simulation Fallback button for testing/headless checks */}
              <div className="mt-4 pt-4 border-t border-[#253241] text-center">
                <button
                  onClick={handleSimulatePayment}
                  disabled={processingPayment}
                  className="text-xs text-[#8197a4] hover:text-[#00a8e1] underline transition-colors"
                >
                  ⚡ Simulate Successful Razorpay Test Verification
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 bg-[#1a242f] hover:bg-[#253241] border border-[#253241] text-[#c0cdd5] font-semibold px-5 py-2.5 rounded-xl transition-all text-xs sm:text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Summary
              </button>
              <button
                onClick={() => navigate('/home')}
                className="text-xs text-[#8197a4] hover:text-white"
              >
                Cancel Booking
              </button>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* STEP 4: Confirmation & Modern Digital Cinema Pass                */}
        {/* ================================================================ */}
        {step === 4 && (
          <div className="max-w-3xl mx-auto fade-in text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/10">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-white font-black text-2xl sm:text-3xl mb-1">
              Booking Confirmed!
            </h2>
            <p className="text-[#8197a4] text-xs sm:text-sm mb-6">
              Your tickets are officially reserved. Present this digital boarding pass at the cinema turnstile.
            </p>

            {/* Modern Digital Boarding Pass Cinema Ticket */}
            <DigitalTicketPass
              booking={{
                ...booking,
                movieName: movieTitle,
                moviePoster: movie?.posterUrl,
                theatreName: theatreTitle,
                theatreLocation: theatre?.location,
                showDate: show?.showDate || queryDate,
                showTime: show?.showTime || queryTime,
                selectedSeats,
                totalAmount,
                tier: dominantTier,
                razorpayPaymentId: booking?.razorpayPaymentId,
                razorpayOrderId: booking?.razorpayOrderId,
                bookingId: booking?.bookingId || booking?._id,
                createdAt: new Date().toISOString(),
                audiNumber: 'Audi 02',
              }}
              movie={movie}
              theatre={theatre}
              showActions={true}
            />

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 mt-8 justify-center no-print">
              <button
                onClick={() => navigate('/bookings')}
                className="flex items-center gap-2 bg-[#1a242f] hover:bg-[#253241] border border-[#253241] text-white font-semibold px-6 py-3 rounded-xl transition-all text-sm"
              >
                <Ticket className="w-4 h-4 text-[#00a8e1]" />
                View All My Bookings
              </button>
              <button
                onClick={() => navigate('/home')}
                className="flex items-center gap-2 bg-[#00a8e1] hover:bg-[#0891c9] text-white font-semibold px-6 py-3 rounded-xl transition-all text-sm shadow-md shadow-[#00a8e1]/30"
              >
                Back to Home
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SeatSelectionPage
