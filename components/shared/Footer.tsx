import Link from 'next/link'
import { BookOpen, Heart, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="w-full border-t border-sage/20 bg-warm-brown text-cream/90 py-12 px-6 mt-auto">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cream text-warm-brown shadow">
            <BookOpen className="h-4 w-4" />
          </div>
          <span className="font-playfair text-lg font-bold tracking-tight text-cream">
            The Book <span className="text-primary-pink">Club</span>
          </span>
        </div>

        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-cream/70">
            © {new Date().getFullYear()} The Book Club. Built with{' '}
            <Heart className="inline-block h-4 w-4 text-coral fill-current mx-0.5" /> for readers around the world.
          </p>
          <p className="text-[10px] text-cream/55 font-bold uppercase tracking-widest">
            Crafted with passion & ❤️ by Antigravity
          </p>
        </div>

        <div className="flex gap-6 text-sm font-semibold text-cream/80">
          <Link href="/about" className="hover:text-primary-pink transition-colors">
            About
          </Link>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary-pink transition-colors flex items-center gap-1">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
            <span>GitHub</span>
          </a>
          <Link href="/contact" className="hover:text-primary-pink transition-colors flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" />
            <span>Contact</span>
          </Link>
        </div>
      </div>
    </footer>
  )
}
