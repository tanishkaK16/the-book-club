'use client'

import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Navbar() {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-warm-brown/10 bg-primary-pink transition-all duration-300 py-3.5 px-6 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        
        {/* Logo in elegant Playfair Display */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warm-brown text-cream shadow transition-transform duration-300 group-hover:rotate-6">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="font-playfair text-xl font-extrabold tracking-tight text-warm-brown group-hover:text-navy transition-colors">
            THE BOOK CLUB
          </span>
        </Link>

        {/* Menu links with smooth scroll */}
        <nav className="hidden md:flex items-center gap-8 font-inter text-sm font-bold text-warm-brown/80">
          <button
            onClick={() => scrollToSection('why-join')}
            className="hover:text-warm-brown transition-colors cursor-pointer"
          >
            Discover
          </button>
          <button
            onClick={() => scrollToSection('membership-perks')}
            className="hover:text-warm-brown transition-colors cursor-pointer"
          >
            Community
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="hover:text-warm-brown transition-colors cursor-pointer"
          >
            How it Works
          </button>
        </nav>

        {/* Right side CTA buttons */}
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-bold text-warm-brown hover:text-navy transition-colors"
          >
            Log in
          </Link>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/login"
              className="btn-cozy btn-cozy-primary text-xs px-5 py-2.5 shadow font-bold tracking-wide"
            >
              Join Free
            </Link>
          </motion.div>
        </div>
      </div>
    </header>
  )
}
