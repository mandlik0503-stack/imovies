import React from 'react'

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-[#0f171e]/90 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-[#253241]" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#00a8e1] animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-[#00a8e1]/50 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.6s' }} />
      </div>
      <p className="text-[#8197a4] text-sm font-medium tracking-wide">{message}</p>
    </div>
  )
}

export default LoadingSpinner
