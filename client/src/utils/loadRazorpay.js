// ============================================================================
// iMovies — Razorpay Checkout SDK Script Dynamic Loader
// ============================================================================

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    // If already loaded in window
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true)
      return
    }

    const existingScript = document.getElementById('razorpay-checkout-script')
    if (existingScript) {
      existingScript.onload = () => resolve(true)
      existingScript.onerror = () => resolve(false)
      return
    }

    const script = document.createElement('script')
    script.id = 'razorpay-checkout-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => {
      resolve(true)
    }
    script.onerror = () => {
      console.error('[Razorpay] Failed to load Razorpay checkout.js script')
      resolve(false)
    }
    document.body.appendChild(script)
  })
}

export default loadRazorpayScript
