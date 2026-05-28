'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Sparkles,
  BookOpen,
  Coffee,
  Bookmark,
  Plus,
  Compass,
  CornerDownLeft,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Check,
  Star
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import confetti from 'canvas-confetti'


// Cozy suggest prompt chips
const suggestionChips = [
  {
    label: '✨ Cozy Fantasy',
    prompt: 'A cozy fantasy with strong female lead and found family trope, under 400 pages'
  },
  {
    label: '🍂 Autumn Bookstore Romance',
    prompt: 'Slow-burn romance set in a bookstore during autumn with grumpy/sunshine dynamic'
  },
  {
    label: '🕯️ Dark & Mysterious',
    prompt: 'Dark thriller with unreliable narrator and plot twists'
  }
]

export default function RecommendPage() {
  const supabase = createClient()
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Recommendation states
  const [promptValue, setPromptValue] = useState('')
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [addedBooks, setAddedBooks] = useState<string[]>([])
  const [resolvingLink, setResolvingLink] = useState<Record<string, boolean>>({})

  // Load current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setCurrentUser(session.user)
      }
    }
    fetchUser()
  }, [supabase])

  // Call the custom AI api route
  const handleGetRecommendations = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!promptValue.trim()) {
      toast.error('Please describe what you are craving to read!')
      return
    }

    setLoading(true)
    setRecommendations([])
    setAddedBooks([])

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptValue })
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to fetch recommendations.')
        return
      }

      setRecommendations(data.recommendations)
      toast.success('Your personalized cozy matches have arrived! ✨')
    } catch (err) {
      toast.error('Could not connect to the recommendation assistant.')
    } finally {
      setLoading(false)
    }
  }

  // Quick Add recommendation book directly to Supabase Bookshelf
  const handleAddToShelf = async (book: any) => {
    if (!currentUser) {
      toast.error('Please log in or register to add books to your shelf!')
      return
    }

    try {
      const googleId = book.title.replace(/\s+/g, '-').toLowerCase()
      const payload = {
        user_id: currentUser.id,
        book_google_id: googleId,
        book_title: book.title,
        book_author: book.author,
        book_cover_url: book.coverUrl,
        status: 'TBR',
        rating: null
      }

      const { error } = await supabase
        .from('bookshelf')
        .insert(payload)

      if (error) {
        toast.error('This book is already on your shelf!')
        return
      }

      setAddedBooks([...addedBooks, book.title])
      toast.success(`Successfully added "${book.title}" to your library shelf!`)
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.8 }
      })
    } catch (err) {
      console.error('Error adding AI book to shelf:', err)
      toast.error('Unable to add book to library.')
    }
  }

  // Call backend shop router to fetch customized buy link
  const handleBuyClick = async (title: string, author: string) => {
    setResolvingLink(prev => ({ ...prev, [title]: true }))
    try {
      const res = await fetch('/api/buy-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, author })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.bestUrl) {
          window.open(data.bestUrl, '_blank', 'noopener,noreferrer')
          return
        }
      }

      // Safe Fallback link
      window.open(`https://www.amazon.in/s?k=${encodeURIComponent(title + ' ' + author)}`, '_blank')
    } catch (err) {
      console.error('Error fetching buy link:', err)
      window.open(`https://www.amazon.in/s?k=${encodeURIComponent(title + ' ' + author)}`, '_blank')
    } finally {
      setResolvingLink(prev => ({ ...prev, [title]: false }))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: 'easeOut' }}
      className="space-y-12 max-w-4xl mx-auto pb-16"
    >
      
      {/* Hero section */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coral/10 text-coral text-xs font-black uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5 animate-spin" />
          <span>AI Book Companion</span>
        </div>
        <h1 className="font-playfair text-3xl md:text-5xl font-extrabold text-warm-brown leading-tight">
          Find Your Next Read
        </h1>
        <p className="text-sm font-semibold text-navy/60 max-w-lg mx-auto leading-relaxed">
          Describe the exact atmosphere, specific tropes, or length you are craving, and our curator will craft the perfect literary match.
        </p>
      </div>

      {/* Main input card */}
      <div className="card-cozy bg-white/70 backdrop-blur-sm border border-sage/15 p-6 md:p-8 space-y-6">
        <form onSubmit={handleGetRecommendations} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-warm-brown block">Describe Your Craving</label>
            <div className="relative">
              <textarea
                rows={3}
                placeholder="What details are you looking for? (e.g. 'A cozy tea-shop fantasy with wholesome characters and zero stakes...')"
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-sage/30 bg-cream/15 focus:bg-white text-navy font-semibold text-sm transition-all focus:outline-none resize-none leading-relaxed"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* suggestion prompts chips */}
            <div className="flex flex-wrap gap-2">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPromptValue(chip.prompt)}
                  className="px-3 py-1.5 rounded-full bg-cream hover:bg-butter text-[10px] font-bold text-warm-brown transition-colors border border-warm-brown/10 cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-cozy btn-cozy-primary text-xs px-6 py-3.5 flex items-center justify-center gap-2 cursor-pointer w-full md:w-auto shadow"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Brewing Matches...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Get Recommendations</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* LOADING ANIMATED STATE */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 space-y-4"
          >
            {/* Spinning Cozy book effect */}
            <div className="relative h-14 w-14 bg-coral/10 rounded-full flex items-center justify-center text-coral shadow-inner">
              <BookOpen className="h-7 w-7 animate-pulse text-coral" />
              <div className="absolute inset-0 rounded-full border-2 border-coral/30 border-t-coral animate-spin" />
            </div>
            
            <div className="text-center space-y-1">
              <h4 className="font-playfair text-base font-black text-warm-brown">Consulting the virtual shelves...</h4>
              <p className="text-xs text-navy/45 font-bold">Scanning reviews and character summaries</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RESULTS DISPLAY PANEL */}
      <AnimatePresence>
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-2 border-b border-sage/10 pb-4">
              <Compass className="h-5 w-5 text-coral" />
              <h3 className="font-playfair text-xl font-bold text-warm-brown">
                Recommended Curations
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendations.map((book, idx) => {
                const alreadyAdded = addedBooks.includes(book.title)
                
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.15 }}
                    whileHover={{ y: -6, rotate: 1.0, scale: 1.015 }}
                    className="card-cozy bg-white border border-sage/15 p-5 flex flex-col justify-between gap-6 relative group overflow-hidden"
                  >
                    
                    {/* Visual indicators */}
                    <div className="space-y-4">
                      {/* Polaroid Cover Aspect ratio */}
                      <div className="w-full aspect-[2/3] rounded-xl overflow-hidden shadow border border-sage/10 relative transform transition-transform duration-300 group-hover:scale-[1.02]">
                        <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
                        
                        {/* Page count overlay badge */}
                        <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/60 text-white text-[9px] font-black uppercase">
                          {book.pageCount} pages
                        </span>
                      </div>

                      {/* Details */}
                      <div className="space-y-2">
                        <div className="min-w-0">
                          <span className="text-[9px] font-black uppercase text-coral tracking-wider">{book.year}</span>
                          <h4 className="font-playfair text-base font-black text-warm-brown leading-snug line-clamp-1">{book.title}</h4>
                          <p className="text-[10px] font-bold text-navy/55">by {book.author}</p>
                        </div>

                        {/* Tropes / genres list */}
                        <div className="flex flex-wrap gap-1">
                          {book.genres.map((g: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-primary-pink text-[8px] font-bold text-warm-brown border border-warm-brown/5">
                              {g}
                            </span>
                          ))}
                        </div>

                        {/* Matching statement reason */}
                        <p className="text-[11px] font-semibold text-navy/70 leading-relaxed pt-2 border-t border-sage/5">
                          {book.reason}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 border-t border-sage/5 pt-3">
                      <button
                        onClick={() => handleAddToShelf(book)}
                        disabled={alreadyAdded}
                        className={`w-full py-2.5 rounded-xl text-[10px] font-black text-center flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          alreadyAdded
                            ? 'bg-sage/15 text-sage border border-sage/20'
                            : 'bg-warm-brown hover:bg-warm-brown/95 text-cream shadow-sm'
                        }`}
                      >
                        {alreadyAdded ? (
                          <>
                            <Check className="h-3 w-3" />
                            <span>Pinned on Shelf</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3" />
                            <span>Add to My Shelf</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleBuyClick(book.title, book.author)}
                        disabled={resolvingLink[book.title]}
                        className="w-full py-2.5 rounded-xl bg-coral hover:bg-coral/95 text-cream text-[10px] font-black text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        {resolvingLink[book.title] ? (
                          <>
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            <span>Finding Best Deal...</span>
                          </>
                        ) : (
                          <>
                            <Coffee className="h-3 w-3" />
                            <span>Buy at Lowest Price</span>
                          </>
                        )}
                      </button>

                      <a
                        href={book.infoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 rounded-xl bg-white hover:bg-cream text-[10px] font-black text-center text-warm-brown border border-sage/20 hover:border-warm-brown/15 transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Read More</span>
                      </a>
                    </div>

                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}
