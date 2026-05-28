'use client'

import { BookOpen } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-cream p-6">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-warm-brown text-cream shadow-lg animate-bounce">
        <BookOpen className="h-8 w-8 animate-pulse text-primary-pink" />
      </div>
      <p className="font-playfair text-lg font-bold text-warm-brown tracking-wide animate-pulse">
        Brewing warm tea and opening the pages...
      </p>
    </div>
  )
}
