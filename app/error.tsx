'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 bg-cream p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-coral/20 text-coral shadow-inner">
        <AlertTriangle className="h-8 w-8" />
      </div>
      
      <div className="max-w-md space-y-2">
        <h2 className="font-playfair text-2xl font-bold text-warm-brown">
          Oh dear, we've lost our bookmark
        </h2>
        <p className="text-sm text-navy/70 leading-relaxed">
          It seems we ran into an unexpected chapter error. Let's try reloading the page to find our spot.
        </p>
      </div>

      <button
        onClick={reset}
        className="btn-cozy btn-cozy-primary text-sm flex items-center gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        <span>Try Again</span>
      </button>
    </div>
  )
}
