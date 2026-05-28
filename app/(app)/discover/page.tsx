'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Search,
  Star,
  TrendingUp,
  Compass,
  Bookmark,
  Coffee,
  Heart,
  ChevronRight,
  Sparkles,
  BookOpen,
  Plus,
  Check,
  User
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Hardcoded Monthly Book Club Picks for exquisite wow factors
const monthlyPicks = [
  {
    id: 'pick-1',
    title: 'The House in the Cerulean Sea',
    author: 'TJ Klune',
    coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=450',
    description: 'An enchanting, warm story about a quiet social worker sent to inspect a magical orphanage on a beautiful island.',
    quote: '"A cozy blanket of a book that celebrates differences, found family, and the power of love."',
    tag: 'May Pick'
  },
  {
    id: 'pick-2',
    title: 'Piranesi',
    author: 'Susanna Clarke',
    coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=450',
    description: 'A gorgeous, quiet mystery set in a vast house of infinite halls lined with statues and filled with an ocean tide.',
    quote: '"An atmospheric masterpiece that explores isolation, beauty, and peaceful wonder."',
    tag: 'April Pick'
  },
  {
    id: 'pick-3',
    title: 'A Psalm for the Wild-Built',
    author: 'Becky Chambers',
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=450',
    description: 'A cozy tea-monk meets a curious robot in a beautiful, green solar-punk world where they discuss purpose and rest.',
    quote: '"The absolute peak of cozy solar-punk. It feels like sipping hot tea under a shady maple."',
    tag: 'March Pick'
  }
]

// Pre-defined popular trending books (top 8)
const trendingBooksList = [
  { id: 'tr-1', title: 'Before the Coffee Gets Cold', author: 'Toshikazu Kawaguchi', coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400', genre: 'Fantasy', reviewsCount: 34, rating: 5 },
  { id: 'tr-2', title: 'The Midnight Library', author: 'Matt Haig', coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400', genre: 'Literary Fiction', reviewsCount: 28, rating: 4 },
  { id: 'tr-3', title: 'The Secret History', author: 'Donna Tartt', coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400', genre: 'Mystery', reviewsCount: 42, rating: 5 },
  { id: 'tr-4', title: 'A Court of Thorns and Roses', author: 'Sarah J. Maas', coverUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400', genre: 'Romance', reviewsCount: 89, rating: 5 },
  { id: 'tr-5', title: 'The Hobbit', author: 'J.R.R. Tolkien', coverUrl: 'https://images.unsplash.com/photo-1618666012174-83b441c0bc76?auto=format&fit=crop&q=80&w=400', genre: 'Fantasy', reviewsCount: 56, rating: 5 },
  { id: 'tr-6', title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', coverUrl: 'https://images.unsplash.com/photo-1518373714866-3f1478910eb0?auto=format&fit=crop&q=80&w=400', genre: 'Literary Fiction', reviewsCount: 61, rating: 4 },
  { id: 'tr-7', title: 'Verity', author: 'Colleen Hoover', coverUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400', genre: 'Thriller', reviewsCount: 78, rating: 4 },
  { id: 'tr-8', title: 'Dune', author: 'Frank Herbert', coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400', genre: 'Sci-Fi', reviewsCount: 52, rating: 5 }
]

// Fallback community reviews
const fallbackReviews = [
  { id: 'd-rev-1', book_title: 'The Great Gatsby', book_author: 'F. Scott Fitzgerald', user_name: 'Nick Carraway', excerpt: 'The prose is absolutely shimmering. Reading it feels like looking at green lights across the bay...', rating: 5, likes: 14, coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400' },
  { id: 'd-rev-2', book_title: 'Normal People', book_author: 'Sally Rooney', user_name: 'Marianne Sheridan', excerpt: 'Deeply emotional, slow-burn exploration of two individuals growing together and apart. It broke me in the best way.', rating: 4, likes: 23, coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400' }
]

const genresChipsList = ['All', 'Fantasy', 'Romance', 'Mystery', 'Literary Fiction', 'Non-fiction', 'Sci-Fi', 'Thriller']

export default function DiscoverPage() {
  const supabase = createClient()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [dbReviews, setDbReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Dynamic Google Books API state variables
  const [trendingBooks, setTrendingBooks] = useState<any[]>([])
  const [monthlyPicksList, setMonthlyPicksList] = useState<any[]>(monthlyPicks)
  const [loadingTrending, setLoadingTrending] = useState(true)

  // Personalized Curation state variables
  const [recommendedBooks, setRecommendedBooks] = useState<any[]>([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(true)
  const [addedBooks, setAddedBooks] = useState<string[]>([])

  // Interactive filters states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('All')

  // 1. Fetch latest DB reviews on mount
  useEffect(() => {
    const fetchLatestReviews = async () => {
      try {
        const { data: dbReviewsData, error } = await supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3)

        if (dbReviewsData && dbReviewsData.length > 0) {
          const userIds = Array.from(new Set(dbReviewsData.map((r: any) => r.user_id)))
          const { data: dbProfiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds)

          const mappedReviews = dbReviewsData.map((r: any) => ({
            ...r,
            profiles: dbProfiles?.find((p: any) => p.id === r.user_id) || {
              full_name: 'Cozy Reader',
              avatar_url: null
            }
          }))
          setDbReviews(mappedReviews)
        } else {
          setDbReviews([])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchLatestReviews()
  }, [supabase])

  // 1b. Load current user session
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setCurrentUser(session.user)
      } else {
        setCurrentUser(null)
      }
    }
    fetchUser()
  }, [supabase])

  // 1c. Fetch Personalized Recommendations dynamically based on User's Shelf Books
  useEffect(() => {
    const fetchPersonalizedRecommendations = async () => {
      setLoadingRecommendations(true)
      try {
        let userBooks: any[] = []
        if (currentUser) {
          const { data } = await supabase
            .from('bookshelf')
            .select('book_title, book_author, rating')
          if (data) userBooks = data
        }

        let promptText = ""
        if (userBooks.length > 0) {
          const bookList = userBooks
            .map((b) => `"${b.book_title}" by ${b.book_author}${b.rating ? ` (rated ${b.rating}/5)` : ''}`)
            .join(', ')
          promptText = `Based on my current shelf books: ${bookList}. Please analyze my cozy shelf history, genres, and favorites, and recommend exactly 6 real, highly tailored books that match my taste. Include short, heartwarming reasons (1-2 sentences) under "reason" justifying the selection.`
        } else {
          promptText = `Provide 6 cozy, high-quality contemporary and fantasy book recommendations that are popular and loved by readers. Include short, heartwarming reasons (1-2 sentences) under "reason".`
        }

        const res = await fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: promptText })
        })

        if (res.ok) {
          const data = await res.json()
          if (data.recommendations && data.recommendations.length > 0) {
            setRecommendedBooks(data.recommendations)
            return
          }
        }
      } catch (err) {
        console.error('Error fetching personalized recommendations:', err)
      } finally {
        setLoadingRecommendations(false)
      }
    }

    if (currentUser !== undefined) {
      fetchPersonalizedRecommendations()
    }
  }, [currentUser, supabase])

  // 1d. Add Recommended Book to Supabase Bookshelf
  const handleAddRecommendedToShelf = async (book: any) => {
    if (!currentUser) {
      toast.error('Please log in to add books to your shelf!')
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
      
      const confetti = (await import('canvas-confetti')).default
      confetti({
        particleCount: 80,
        spread: 50,
        origin: { y: 0.8 }
      })
    } catch (err) {
      console.error(err)
      toast.error('Unable to add book to library.')
    }
  }

  // 2. Fetch real high-res covers for Monthly curated picks
  useEffect(() => {
    const fetchRealCoversForCuratedPicks = async () => {
      try {
        const updatedPicks = await Promise.all(
          monthlyPicks.map(async (pick) => {
            try {
              const res = await fetch(`/api/books/search?q=intitle:${encodeURIComponent(pick.title)}&maxResults=1`)
              const data = await res.json()
              if (data && data.length > 0 && data[0].cover_url) {
                return {
                  ...pick,
                  coverUrl: data[0].cover_url
                }
              }
            } catch (err) {
              console.error(err)
            }
            return pick
          })
        )
        setMonthlyPicksList(updatedPicks)
      } catch (e) {
        console.error(e)
      }
    }
    fetchRealCoversForCuratedPicks()
  }, [])

  // 3. Fetch trending books dynamically based on selected genre chip
  useEffect(() => {
    const fetchTrendingByGenre = async () => {
      setLoadingTrending(true)
      try {
        const query = selectedGenre === 'All' ? 'subject:fiction' : `subject:${selectedGenre.toLowerCase()}`
        const res = await fetch(`/api/books/search?q=${encodeURIComponent(query)}&maxResults=16`)
        const data = await res.json()
        if (data && data.length > 0) {
          const formatted = data.map((item: any, i: number) => ({
            id: item.google_id || `tr-${i}-${selectedGenre}`,
            title: item.title,
            author: item.author || 'Unknown Author',
            coverUrl: item.cover_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400',
            genre: selectedGenre === 'All' ? (item.genres?.[0] || 'Fiction') : selectedGenre,
            reviewsCount: Math.floor(Math.random() * 85) + 10,
            rating: Math.floor(Math.random() * 2) + 4
          }))
          setTrendingBooks(formatted)
        } else {
          setTrendingBooks([])
        }
      } catch (err) {
        console.error('Error fetching trending books by genre:', err)
        setTrendingBooks([])
      } finally {
        setLoadingTrending(false)
      }
    }
    fetchTrendingByGenre()
  }, [selectedGenre])

  // Filter trending list based on Search bar value
  const filteredTrending = trendingBooks.filter((book) => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          book.author.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: 'easeOut' }}
      className="space-y-12 max-w-6xl mx-auto pb-16"
    >
      
      {/* Header and Search Container */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-sage/10 pb-6">
        <div className="space-y-1">
          <h1 className="font-playfair text-3xl md:text-5xl font-extrabold text-warm-brown flex items-center gap-3">
            <Compass className="h-8 w-8 text-coral animate-pulse" />
            <span>Discover Literature</span>
          </h1>
          <p className="text-sm font-semibold text-navy/60">
            Browse seasonal picks, follow trending titles, and filter cozy recommendations.
          </p>
        </div>

        {/* Global Search bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-navy/40" />
          <input
            type="text"
            placeholder="Search shelves..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-sage/30 bg-white/60 focus:bg-white text-navy font-semibold text-xs transition-all focus:outline-none"
          />
        </div>
      </div>

      {/* SECTION 1: MONTHLY BOOK CLUB PICKS */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-playfair text-2xl font-black text-warm-brown flex items-center gap-2">
            <Coffee className="h-5.5 w-5.5 text-coral" />
            <span>Monthly Book Club Picks</span>
          </h3>
          <span className="text-[10px] font-black uppercase tracking-wider text-coral bg-coral/10 px-3 py-1 rounded-full">
            Curated Circles
          </span>
        </div>

        {/* Cards layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {monthlyPicksList.map((pick) => (
            <motion.div
              key={pick.id}
              whileHover={{ y: -6, scale: 1.015 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="card-cozy bg-primary-pink/45 border border-warm-brown/15 p-6 flex flex-col justify-between gap-6 relative overflow-hidden group"
            >
              {/* Corner markings */}
              <div className="absolute top-2 left-2 h-4 w-4 border-t border-l border-warm-brown/20" />
              <div className="absolute top-2 right-2 h-4 w-4 border-t border-r border-warm-brown/20" />
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  {/* Polaroid cover aspect ratio */}
                  <div className="w-18 h-26 flex-shrink-0 bg-white p-1 rounded border border-warm-brown/10 shadow transform -rotate-1 group-hover:rotate-1 transition-transform">
                    <img src={pick.coverUrl} alt={pick.title} className="h-full w-full object-cover rounded-sm" />
                  </div>

                  <div className="min-w-0">
                    <span className="text-[9px] font-black uppercase tracking-widest text-coral">{pick.tag}</span>
                    <h4 className="font-playfair text-base font-black text-warm-brown leading-tight truncate">{pick.title}</h4>
                    <p className="text-[10px] font-bold text-navy/55">by {pick.author}</p>
                  </div>
                </div>

                <p className="text-[11px] font-semibold text-navy/70 leading-relaxed">
                  {pick.description}
                </p>
              </div>

              {/* Hand-written quote snippet */}
              <div className="border-t border-warm-brown/10 pt-3 italic text-[10.5px] font-bold text-warm-brown/85">
                {pick.quote}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* SECTION 2: RECOMMENDED FOR YOU (PERSONALIZED CURATIONS) */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-playfair text-2xl font-black text-warm-brown flex items-center gap-2">
              <Sparkles className="h-5.5 w-5.5 text-coral animate-spin" style={{ animationDuration: '6s' }} />
              <span>Recommended For You</span>
            </h3>
            <p className="text-[11px] font-bold text-navy/40 uppercase tracking-widest">
              {currentUser ? 'Highly Tailored Based on Your Shelf & History' : 'Bestsellers and Cozy Curations'}
            </p>
          </div>

          <span className="text-[10px] font-black uppercase tracking-wider text-coral bg-coral/10 px-3 py-1 rounded-full">
            AI Assistant
          </span>
        </div>

        {/* Recommended grid layout */}
        {loadingRecommendations ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card-cozy bg-white/50 border border-sage/10 p-5 animate-pulse space-y-4">
                <div className="w-full aspect-[4/3] bg-sage/10 rounded-xl" />
                <div className="h-4 w-3/4 bg-sage/10 rounded" />
                <div className="h-3 w-1/2 bg-sage/10 rounded" />
                <div className="h-10 bg-sage/10 rounded-xl" />
              </div>
            ))}
          </div>
        ) : recommendedBooks.length === 0 ? (
          <div className="text-center text-xs font-bold text-navy/40 py-8">
            Could not fetch recommended stories at this time...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedBooks.map((book, idx) => {
              const alreadyAdded = addedBooks.includes(book.title)
              return (
                <motion.div
                  key={idx}
                  whileHover={{ y: -6, scale: 1.015 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="card-cozy bg-white border border-sage/15 p-5 flex flex-col justify-between gap-6 relative overflow-hidden group"
                >
                  <div className="space-y-4">
                    {/* Polaroid Cover Aspect ratio */}
                    <div className="w-full aspect-[4/3] rounded-xl overflow-hidden shadow border border-sage/10 relative transform transition-transform duration-300 group-hover:scale-[1.02] bg-cream/30 flex items-center justify-center">
                      <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
                      {book.pageCount && (
                        <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/60 text-white text-[9px] font-black uppercase">
                          {book.pageCount} pages
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div>
                        {book.genres && book.genres.length > 0 && (
                          <span className="text-[9px] font-black uppercase text-coral tracking-wider">
                            {book.genres[0]}
                          </span>
                        )}
                        <h4 className="font-playfair text-base font-black text-warm-brown leading-snug line-clamp-1">
                          {book.title}
                        </h4>
                        <p className="text-[10px] font-bold text-navy/55">by {book.author}</p>
                      </div>

                      <p className="text-[11px] font-semibold text-navy/70 leading-relaxed pt-2 border-t border-sage/5">
                        {book.reason}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-sage/5">
                    <button
                      onClick={() => handleAddRecommendedToShelf(book)}
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
                          <span>Added to Shelf</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3" />
                          <span>Add to My Shelf</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: RECENTLY REVIEWED */}
      <div className="space-y-6 pt-4 border-t border-sage/10">
        <h3 className="font-playfair text-2xl font-black text-warm-brown flex items-center gap-2">
          <Sparkles className="h-5.5 w-5.5 text-coral sparkle-icon" />
          <span>Recently Reviewed</span>
        </h3>

        {/* Small reviews feed list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Supabase Reviews if loaded, combined with fallbacks */}
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card-cozy bg-white/60 animate-pulse h-36 w-full flex gap-4 p-5">
                <div className="h-16 w-11 bg-sage/15 rounded" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-28 bg-warm-brown/10 rounded" />
                  <div className="h-3 w-16 bg-navy/10 rounded" />
                  <div className="h-3 w-full bg-sage/5 rounded" />
                </div>
              </div>
            ))
          ) : (
            <>
              {/* Combine DB reviews and fallback reviews */}
              {[
                ...dbReviews.map((r) => ({
                  id: r.id,
                  book_title: r.book_title,
                  book_author: r.book_author,
                  user_name: r.profiles?.full_name || 'Reader',
                  excerpt: r.loved,
                  rating: r.rating,
                  likes: r.likes_count,
                  coverUrl: r.book_cover_url
                })),
                ...fallbackReviews
              ].slice(0, 3).map((rev) => (
                <motion.div
                  key={rev.id}
                  whileHover={{ y: -5, scale: 1.015 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="card-cozy bg-white/80 backdrop-blur-sm border border-sage/15 p-5 space-y-3 relative overflow-hidden group hover:border-coral/25"
                >
                  <div className="flex gap-3">
                    <img src={rev.coverUrl} alt={rev.book_title} className="h-16 w-11 object-cover rounded shadow-sm" />
                    
                    <div className="min-w-0 space-y-1">
                      <h4 className="font-playfair text-xs font-black text-warm-brown truncate leading-tight">{rev.book_title}</h4>
                      <p className="text-[9px] font-bold text-navy/45 truncate">by {rev.book_author}</p>
                      
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-2.5 w-2.5 ${i < rev.rating ? 'text-coral fill-coral' : 'text-sage/20'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] font-semibold text-navy/65 leading-relaxed italic line-clamp-2">
                    "{rev.excerpt}"
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-sage/5 pt-2.5 text-[9px] font-bold text-navy/40">
                    <span className="text-warm-brown">reviewed by {rev.user_name}</span>
                    <span className="flex items-center gap-0.5 text-coral">
                      <Heart className="h-2.5 w-2.5 fill-coral" />
                      <span>{rev.likes}</span>
                    </span>
                  </div>
                </motion.div>
              ))}
            </>
          )}

        </div>
      </div>

    </motion.div>
  )
}
