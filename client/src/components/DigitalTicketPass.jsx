import React, { useRef } from 'react'
import {
  Ticket, Calendar, Clock, MapPin, CheckCircle, ShieldCheck,
  Printer, Share2, Film, Sparkles, Copy, Download
} from 'lucide-react'
import { toast } from 'react-toastify'

/**
 * Format date string into human-friendly format (e.g., "Wed, 28 Oct 2026")
 */
const formatDate = (dateVal) => {
  if (!dateVal) return 'Today'
  try {
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return String(dateVal)
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return String(dateVal)
  }
}

/**
 * Format booking timestamp into readable string
 */
const formatTimestamp = (dateVal) => {
  try {
    const d = dateVal ? new Date(dateVal) : new Date()
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'Confirmed'
  }
}

/**
 * Group seat identifiers by row (e.g., "Row A - Seats 1, 2" or "Row H - Seats 4, 5")
 */
const groupSeatsByRow = (seats = []) => {
  if (!Array.isArray(seats) || seats.length === 0) return []
  const grouped = {}
  seats.forEach((seat) => {
    const s = String(seat).trim()
    const row = s.charAt(0).toUpperCase()
    const num = s.slice(1)
    if (!grouped[row]) grouped[row] = []
    grouped[row].push(num)
  })

  return Object.entries(grouped).map(([row, nums]) => ({
    row,
    display: `Row ${row} · Seat${nums.length > 1 ? 's' : ''} ${nums.join(', ')}`,
    count: nums.length,
  }))
}

const DigitalTicketPass = ({
  booking,
  movie,
  theatre,
  showActions = true,
}) => {
  const ticketRef = useRef(null)

  if (!booking) return null

  // Extract fields with multiple fallback avenues
  const movieTitle =
    booking.movieName ||
    movie?.movieName ||
    movie?.title ||
    booking.movie?.movieName ||
    'Selected Cinema Feature'

  const posterUrl =
    booking.moviePoster ||
    movie?.posterUrl ||
    booking.movie?.posterUrl ||
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80'

  const theatreName =
    booking.theatreName ||
    theatre?.theatreName ||
    booking.show?.theatreName ||
    'PVR IMAX Phoenix MarketCity'

  const theatreLocation =
    theatre?.location ||
    booking.theatreLocation ||
    booking.location ||
    'Cinema Auditorium'

  const showDate =
    booking.showDate ||
    booking.show?.showDate ||
    new Date().toISOString()

  const showTime =
    booking.showTime ||
    booking.show?.showTime ||
    '07:30 PM'

  const seats =
    booking.selectedSeats ||
    booking.seats ||
    booking.bookedSeats ||
    []

  const totalAmount =
    booking.totalAmount != null
      ? booking.totalAmount
      : booking.amount != null
      ? booking.amount
      : 0

  const bookingId =
    booking.bookingId ||
    booking._id ||
    `IMV-${Date.now().toString().slice(-8)}`

  const displayBookingId = String(bookingId).slice(-10).toUpperCase()

  const paymentId =
    booking.razorpayPaymentId ||
    booking.paymentId ||
    `pay_sim_${String(bookingId).slice(-8)}`

  const tier =
    booking.tier ||
    (seats.length > 0 && ['A', 'B', 'C'].includes(String(seats[0]).charAt(0).toUpperCase())
      ? 'Lower (Front)'
      : seats.length > 0 && ['D', 'E', 'F', 'G'].includes(String(seats[0]).charAt(0).toUpperCase())
      ? 'Middle (Executive)'
      : 'Balcony (Premium)')

  const audiNumber = booking.audiNumber || 'Audi 02'
  const ticketToken = `IMV-${displayBookingId}-${seats.join('')}`
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    ticketToken
  )}`

  const handlePrint = () => {
    window.print()
  }

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(ticketToken)
      toast.success(`Booking Reference copied: ${ticketToken}`)
    } else {
      toast.info(`Booking Ref: ${ticketToken}`)
    }
  }

  const seatGroups = groupSeatsByRow(seats)

  return (
    <div className="w-full max-w-3xl mx-auto my-4 print:my-0">
      {/* ================================================================ */}
      {/* DIGITAL CINEMA BOARDING PASS CARD                                */}
      {/* ================================================================ */}
      <div
        ref={ticketRef}
        className="digital-ticket-pass bg-[#1a242f] border border-[#253241] rounded-3xl overflow-hidden shadow-2xl relative transition-all print:border-black print:shadow-none print:bg-white print:text-black"
      >
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#00a8e1] via-[#0891c9] to-[#0077a8] px-6 py-4 flex flex-wrap items-center justify-between text-black gap-2 print:bg-none print:border-b-2 print:border-black">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-black/15 flex items-center justify-center backdrop-blur-sm">
              <Film className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-black">iMovies</span>
                <span className="bg-black text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                  Cinema Pass
                </span>
              </div>
              <p className="text-[11px] font-semibold text-black/80">
                Official Digital Admission Ticket
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-black/15 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-black">
              <ShieldCheck className="w-4 h-4 text-emerald-950" />
              <span>CONFIRMED ENTRY</span>
            </div>
            <span className="bg-black/20 text-black text-[11px] font-bold px-2.5 py-1 rounded-full">
              Dolby Atmos 4K
            </span>
          </div>
        </div>

        {/* Pass Content: Main Ticket Body + Stub */}
        <div className="grid grid-cols-1 md:grid-cols-12 relative">
          {/* Main Info Section (Left: 8 cols) */}
          <div className="md:col-span-8 p-6 sm:p-7 space-y-6">
            {/* Movie Title & Poster Hero */}
            <div className="flex items-start gap-4">
              <img
                src={posterUrl}
                alt={movieTitle}
                className="w-16 h-24 sm:w-20 sm:h-28 object-cover rounded-xl border border-[#253241] shadow-lg flex-shrink-0 bg-[#0f171e] print:border-gray-300"
                onError={(e) => {
                  e.target.src =
                    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80'
                }}
              />
              <div className="flex-1 min-w-0">
                <span className="inline-block bg-[#00a8e1]/10 border border-[#00a8e1]/30 text-[#00a8e1] text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wide mb-1.5 print:text-black print:border-black">
                  Feature Presentation
                </span>
                <h2 className="text-white font-black text-xl sm:text-2xl leading-snug truncate print:text-black">
                  {movieTitle}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-[#8197a4] mt-1 print:text-gray-700">
                  <MapPin className="w-3.5 h-3.5 text-[#00a8e1] flex-shrink-0 print:text-black" />
                  <span className="truncate">{theatreName}</span>
                </div>
                <p className="text-[11px] text-[#8197a4] mt-0.5 print:text-gray-500">
                  {theatreLocation} · <strong className="text-white print:text-black">{audiNumber}</strong>
                </p>
              </div>
            </div>

            {/* Event Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0f171e]/70 border border-[#253241] rounded-2xl p-4 text-xs print:bg-gray-100 print:border-gray-300">
              <div>
                <p className="text-[#8197a4] uppercase font-bold text-[10px] tracking-wider flex items-center gap-1 print:text-gray-600">
                  <Calendar className="w-3 h-3 text-[#00a8e1] print:text-black" /> Date
                </p>
                <p className="text-white font-bold mt-1 text-sm print:text-black">
                  {formatDate(showDate)}
                </p>
              </div>

              <div>
                <p className="text-[#8197a4] uppercase font-bold text-[10px] tracking-wider flex items-center gap-1 print:text-gray-600">
                  <Clock className="w-3 h-3 text-[#00a8e1] print:text-black" /> Showtime
                </p>
                <p className="text-[#00a8e1] font-black mt-1 text-sm print:text-black">
                  {showTime}
                </p>
              </div>

              <div>
                <p className="text-[#8197a4] uppercase font-bold text-[10px] tracking-wider flex items-center gap-1 print:text-gray-600">
                  <Ticket className="w-3 h-3 text-[#00a8e1] print:text-black" /> Audi / Screen
                </p>
                <p className="text-white font-bold mt-1 text-sm print:text-black">
                  {audiNumber}
                </p>
              </div>

              <div>
                <p className="text-[#8197a4] uppercase font-bold text-[10px] tracking-wider flex items-center gap-1 print:text-gray-600">
                  <Sparkles className="w-3 h-3 text-[#00a8e1] print:text-black" /> Tier
                </p>
                <p className="text-emerald-400 font-bold mt-1 text-sm print:text-black">
                  {tier}
                </p>
              </div>
            </div>

            {/* Reserved Seats Breakdown */}
            <div className="bg-[#0f171e]/40 border border-[#253241] rounded-2xl p-4 print:bg-white print:border-gray-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8197a4] print:text-gray-700">
                  Reserved Seats ({seats.length} Ticket{seats.length !== 1 ? 's' : ''})
                </span>
                <span className="text-[11px] font-semibold text-[#00a8e1] print:text-black">
                  {tier}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {seatGroups.length > 0 ? (
                  seatGroups.map((group) => (
                    <div
                      key={group.row}
                      className="flex items-center gap-2 bg-[#253241] border border-[#00a8e1]/30 rounded-xl px-3 py-1.5 print:bg-gray-100 print:border-gray-400"
                    >
                      <span className="w-5 h-5 rounded-md bg-[#00a8e1] text-black font-black text-xs flex items-center justify-center">
                        {group.row}
                      </span>
                      <span className="text-white font-mono font-bold text-xs print:text-black">
                        {group.display}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-white font-mono font-bold text-xs">
                    {seats.join(', ') || 'General Admission'}
                  </span>
                )}
              </div>
            </div>

            {/* Transaction Audit Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px] text-[#8197a4] pt-1 border-t border-[#253241] print:border-gray-300 print:text-gray-600">
              <div>
                <span className="block text-[10px] uppercase font-bold text-[#8197a4]">
                  Booking Ref
                </span>
                <span className="text-white font-mono font-bold print:text-black">
                  {displayBookingId}
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-[#8197a4]">
                  Payment ID
                </span>
                <span className="text-[#00a8e1] font-mono truncate block print:text-black">
                  {paymentId}
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-[#8197a4]">
                  Total Paid
                </span>
                <span className="text-emerald-400 font-black text-sm print:text-black">
                  ₹{totalAmount}
                </span>
              </div>
            </div>
          </div>

          {/* Perforated Divider Lines & Circular Cutouts (Desktop: Vertical, Mobile: Horizontal) */}
          <div className="hidden md:block absolute top-0 bottom-0 left-[66.666%] -ml-px w-px border-r-2 border-dashed border-[#253241] pointer-events-none print:border-black">
            {/* Top Cutout */}
            <div className="absolute -top-3.5 -left-3 w-6 h-6 rounded-full bg-[#0f171e] border border-[#253241] print:hidden" />
            {/* Bottom Cutout */}
            <div className="absolute -bottom-3.5 -left-3 w-6 h-6 rounded-full bg-[#0f171e] border border-[#253241] print:hidden" />
          </div>

          {/* Mobile Horizontal Divider */}
          <div className="md:hidden relative w-full border-t-2 border-dashed border-[#253241] print:border-black">
            <div className="absolute -left-3.5 -top-3 w-6 h-6 rounded-full bg-[#0f171e] border border-[#253241] print:hidden" />
            <div className="absolute -right-3.5 -top-3 w-6 h-6 rounded-full bg-[#0f171e] border border-[#253241] print:hidden" />
          </div>

          {/* Ticket Stub Section (Right: 4 cols) */}
          <div className="md:col-span-4 bg-[#141d26] p-6 sm:p-7 flex flex-col items-center justify-between text-center border-l md:border-l-0 border-[#253241] print:bg-white print:border-none">
            <div className="w-full space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#00a8e1] block print:text-black">
                Entry Scanner Pass
              </span>

              {/* Dynamic QR Code */}
              <div className="relative mx-auto w-36 h-36 bg-white p-2.5 rounded-2xl shadow-xl flex items-center justify-center border-2 border-[#00a8e1]/40 print:border-black">
                <img
                  src={qrCodeUrl}
                  alt={`QR Code for ${ticketToken}`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback to geometric SVG QR representation
                    e.target.style.display = 'none'
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
                  <span className="bg-black/90 text-white text-[10px] font-mono px-2 py-1 rounded">
                    Scannable
                  </span>
                </div>
              </div>

              {/* Simulated Barcode */}
              <div className="w-full max-w-[200px] mx-auto pt-2">
                <div className="h-9 w-full flex items-center justify-between px-2 bg-white rounded-lg py-1">
                  {[4, 2, 6, 1, 3, 5, 2, 4, 1, 3, 6, 2, 1, 4, 3, 2, 5, 1, 4, 2, 3].map(
                    (w, idx) => (
                      <div
                        key={idx}
                        className="h-full bg-black"
                        style={{ width: `${Math.max(1, w * 1.5)}px` }}
                      />
                    )
                  )}
                </div>
                <p className="text-[10px] font-mono text-[#8197a4] tracking-widest mt-1 print:text-black">
                  {displayBookingId}
                </p>
              </div>

              <p className="text-[10px] text-[#8197a4] leading-relaxed px-2 print:text-gray-600">
                Scan this boarding pass at the cinema turnstile for instant contactless entry.
              </p>
            </div>

            <div className="w-full pt-4 border-t border-[#253241] mt-4 print:border-gray-300">
              <div className="text-[10px] text-[#8197a4] print:text-gray-500">
                <span>Issued: </span>
                <span className="text-white font-mono print:text-black">
                  {formatTimestamp(booking.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-5 no-print">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-[#00a8e1] hover:bg-[#0891c9] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-[#00a8e1]/20 transition-all duration-200"
          >
            <Printer className="w-4 h-4" />
            Print / Save Ticket (PDF)
          </button>

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 bg-[#1a242f] hover:bg-[#253241] text-[#c0cdd5] hover:text-white border border-[#253241] font-semibold text-xs px-4 py-2.5 rounded-xl transition-all"
          >
            <Copy className="w-4 h-4 text-[#00a8e1]" />
            Copy Ticket Ref
          </button>
        </div>
      )}
    </div>
  )
}

export default DigitalTicketPass
