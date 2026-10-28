import React, { useState } from 'react'
import { Star } from 'lucide-react'

const StarRating = ({ value = 0, onChange, readOnly = false, size = 'md' }) => {
  const [hovered, setHovered] = useState(0)

  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }[size] || 'w-6 h-6'

  const displayValue = hovered || value

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange && onChange(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          className={`transition-transform duration-150 ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} focus:outline-none`}
          aria-label={`Rate ${star} out of 5`}
        >
          <Star
            className={`${sizeClass} transition-colors duration-150 ${
              star <= displayValue
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-transparent text-[#253241]'
            }`}
          />
        </button>
      ))}
      {!readOnly && value > 0 && (
        <span className="text-[#8197a4] text-sm ml-1">{value}/5</span>
      )}
      {readOnly && value > 0 && (
        <span className="text-[#8197a4] text-sm ml-1">{Number(value).toFixed(1)}</span>
      )}
    </div>
  )
}

export default StarRating
