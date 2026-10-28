import React, { useMemo } from 'react'
import { Clock, Info } from 'lucide-react'

const TIERS = ['Lower', 'Middle', 'Balcony']

const TIER_CONFIG = {
  Lower: { label: 'Lower (Front / Classic)', color: 'text-emerald-400', priceKey: 'lowerSeatPrice', rows: 3 },
  Middle: { label: 'Middle (Executive)', color: 'text-[#00a8e1]', priceKey: 'middleSeatPrice', rows: 4 },
  Balcony: { label: 'Balcony (Premium / Recliner)', color: 'text-purple-400', priceKey: 'balconySeatPrice', rows: 4 },
}

const formatTime = (seconds) => {
  if (!seconds || seconds <= 0) return '00:00'
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const SeatMap = ({
  show,
  theatre,
  selectedSeats = [],
  onSeatSelect,
  timeLeft = null,
}) => {
  // Build seat grid from theatre's seatLayout or tier seats if provided, else generate
  const seatLayout = useMemo(() => {
    if (!theatre) return {}

    // 1. If backend has lowerSeats/middleSeats/balconySeats objects
    const hasDbSeats = theatre.lowerSeats || theatre.middleSeats || theatre.balconySeats
    if (hasDbSeats) {
      return {
        Lower: theatre.lowerSeats ? Object.keys(theatre.lowerSeats) : [],
        Middle: theatre.middleSeats ? Object.keys(theatre.middleSeats) : [],
        Balcony: theatre.balconySeats ? Object.keys(theatre.balconySeats) : [],
      }
    }

    // 2. If theatre.seatLayout is provided
    if (theatre.seatLayout) return theatre.seatLayout

    // 3. Continuous tier layout progressing away from the projection screen:
    // Nearest to screen: Lower (rows A, B, C)
    // Mid-auditorium: Middle (rows D, E, F, G)
    // Furthest from screen: Balcony (rows H, I, J, K)
    const tierRows = {
      Lower: ['A', 'B', 'C'],
      Middle: ['D', 'E', 'F', 'G'],
      Balcony: ['H', 'I', 'J', 'K'],
    }
    const layout = {}
    const seatCols = 10
    TIERS.forEach((tier) => {
      layout[tier] = []
      const rows = tierRows[tier] || []
      rows.forEach((r) => {
        for (let c = 1; c <= seatCols; c++) {
          layout[tier].push(`${r}${c}`)
        }
      })
    })
    return layout
  }, [theatre])

  // Build set of booked and locked seats from show
  const { bookedSeats, lockedSeats } = useMemo(() => {
    const booked = new Set()
    const locked = new Set()
    const now = new Date()

    if (show?.bookedSeats) show.bookedSeats.forEach((s) => booked.add(s))
    if (show?.lockedSeats) {
      show.lockedSeats.forEach((entry) => {
        const id = typeof entry === 'string' ? entry : entry?.seatId
        if (id) locked.add(id)
      })
    }

    // Inspect show.tickets: { balcony: { A1: { status, lockExpiry } }, ... }
    if (show?.tickets) {
      Object.entries(show.tickets).forEach(([tierKey, seatsObj]) => {
        if (!seatsObj) return
        Object.entries(seatsObj).forEach(([seatId, data]) => {
          if (!data) return
          if (data.status === 'booked') {
            booked.add(seatId)
          } else if (data.status === 'locked') {
            if (!data.lockExpiry || new Date(data.lockExpiry) > now) {
              locked.add(seatId)
            }
          }
        })
      })
    }

    return { bookedSeats: booked, lockedSeats: locked }
  }, [show])

  const selectedSet = useMemo(() => new Set(selectedSeats), [selectedSeats])

  const getSeatState = (seatId) => {
    if (bookedSeats.has(seatId)) return 'booked'
    if (lockedSeats.has(seatId)) return 'locked'
    if (selectedSet.has(seatId)) return 'selected'
    return 'available'
  }

  const handleSeatClick = (seatId, tier) => {
    const state = getSeatState(seatId)
    if (state === 'booked' || state === 'locked') return
    onSeatSelect && onSeatSelect(seatId, tier)
  }

  // Calculate total
  const getPrice = (tier) => {
    if (!theatre) return 0
    return theatre[TIER_CONFIG[tier]?.priceKey] || 0
  }

  const totalAmount = selectedSeats.reduce((total, seatId) => {
    // Find which tier this seat belongs to
    for (const tier of TIERS) {
      if (seatLayout[tier]?.includes(seatId)) {
        return total + getPrice(tier)
      }
    }
    return total
  }, 0)

  // Group selected seats by tier
  const selectedByTier = useMemo(() => {
    const grouped = {}
    selectedSeats.forEach((seatId) => {
      for (const tier of TIERS) {
        if (seatLayout[tier]?.includes(seatId)) {
          if (!grouped[tier]) grouped[tier] = []
          grouped[tier].push(seatId)
          break
        }
      }
    })
    return grouped
  }, [selectedSeats, seatLayout])

  return (
    <div className="w-full">
      {/* Timer */}
      {timeLeft !== null && (
        <div className={`flex items-center gap-2 justify-center mb-6 px-4 py-2.5 rounded-lg ${timeLeft < 60 ? 'bg-red-900/30 border border-red-500/50' : 'bg-[#1a242f] border border-[#253241]'}`}>
          <Clock className={`w-4 h-4 ${timeLeft < 60 ? 'text-red-400' : 'text-[#00a8e1]'}`} />
          <span className={`font-mono text-sm font-bold ${timeLeft < 60 ? 'text-red-400' : 'text-white'}`}>
            {formatTime(timeLeft)}
          </span>
          <span className="text-[#8197a4] text-sm">remaining to complete booking</span>
        </div>
      )}

      {/* Screen indicator directly in front of lowest-priced tier */}
      <div className="text-center mb-8 relative">
        <div className="max-w-md mx-auto h-2.5 bg-gradient-to-r from-transparent via-[#00a8e1] to-transparent rounded-t-full shadow-[0_-6px_20px_rgba(0,168,225,0.4)] opacity-90 mb-2" />
        <div className="flex items-center justify-center gap-2">
          <div className="w-10 h-px bg-gradient-to-r from-transparent to-[#8197a4]/50" />
          <p className="text-[#8197a4] text-xs font-bold tracking-[0.25em] uppercase">
            Screen This Way
          </p>
          <div className="w-10 h-px bg-gradient-to-l from-transparent to-[#8197a4]/50" />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mb-8 flex-wrap">
        {[
          { label: 'Available', className: 'bg-[#253241] border border-[#00a8e1]/30' },
          { label: 'Selected', className: 'bg-[#00a8e1]' },
          { label: 'Locked', className: 'bg-yellow-500/50' },
          { label: 'Booked', className: 'bg-gray-600' },
        ].map(({ label, className }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-sm ${className}`} />
            <span className="text-[#8197a4] text-xs">{label}</span>
          </div>
        ))}
      </div>

      {/* Seat grid per tier */}
      <div className="space-y-8">
        {TIERS.map((tier) => {
          const seats = seatLayout[tier] || []
          if (!seats.length) return null
          const price = getPrice(tier)
          const config = TIER_CONFIG[tier]
          const seatsPerRow = 10

          // Group into rows
          const rows = []
          for (let i = 0; i < seats.length; i += seatsPerRow) {
            rows.push(seats.slice(i, i + seatsPerRow))
          }

          return (
            <div key={tier}>
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
                {price > 0 && (
                  <span className="text-[#8197a4] text-xs bg-[#253241] px-2 py-0.5 rounded">₹{price}</span>
                )}
                <div className="flex-1 h-px bg-[#253241]" />
              </div>
              <div className="space-y-2">
                {rows.map((row, rowIdx) => (
                  <div key={rowIdx} className="flex items-center gap-1.5 justify-center flex-wrap">
                    {/* Row label */}
                    <span className="text-[#8197a4] text-xs w-5 text-right shrink-0">
                      {row[0]?.charAt(0)}
                    </span>
                    {row.map((seatId) => {
                      const state = getSeatState(seatId)
                      return (
                        <button
                          key={seatId}
                          onClick={() => handleSeatClick(seatId, tier)}
                          disabled={state === 'booked' || state === 'locked'}
                          aria-label={`Seat ${seatId} - ${state}`}
                          title={`${seatId} (${state})`}
                          className={`w-7 h-7 rounded-sm text-[10px] font-medium transition-all duration-150 border focus:outline-none focus:ring-1 focus:ring-[#00a8e1] ${
                            state === 'booked'
                              ? 'bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed'
                              : state === 'locked'
                              ? 'bg-yellow-500/50 border-yellow-500/70 text-yellow-200 cursor-not-allowed'
                              : state === 'selected'
                              ? 'bg-[#00a8e1] border-[#00a8e1] text-white scale-110 shadow-lg shadow-[#00a8e1]/30'
                              : 'bg-[#253241] border-[#00a8e1]/20 text-[#8197a4] hover:bg-[#00a8e1]/20 hover:border-[#00a8e1]/50 hover:text-white cursor-pointer'
                          }`}
                        >
                          {seatId.slice(1)}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selection Summary */}
      {selectedSeats.length > 0 && (
        <div className="mt-8 bg-[#1a242f] border border-[#253241] rounded-xl p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-[#00a8e1]" />
            Selected Seats
          </h3>
          <div className="space-y-2 mb-4">
            {Object.entries(selectedByTier).map(([tier, seats]) => (
              <div key={tier} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={TIER_CONFIG[tier]?.color || 'text-white'}>{tier}</span>
                  <div className="flex gap-1 flex-wrap">
                    {seats.map((s) => (
                      <span key={s} className="bg-[#253241] text-[#00a8e1] text-xs px-1.5 py-0.5 rounded font-mono">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-[#c0cdd5]">
                  {seats.length} × ₹{getPrice(tier)} = ₹{seats.length * getPrice(tier)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-[#253241] pt-3 flex items-center justify-between">
            <span className="text-[#8197a4] text-sm">{selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''} selected</span>
            <span className="text-white font-bold text-lg">Total: ₹{totalAmount}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default SeatMap
