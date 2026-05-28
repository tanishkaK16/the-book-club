'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Search,
  Star,
  Plus,
  Trash2,
  BookOpen,
  Camera,
  X,
  Library,
  Coffee,
  Check,
  Edit,
  Hourglass,
  Minus,
  Award,
  Sparkles
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import confetti from 'canvas-confetti'


// Cozy fallback bookshelf books
const defaultShelfBooks = [
  {
    id: 'shelf-mock-1',
    book_title: 'The Midnight Library',
    book_author: 'Matt Haig',
    book_cover_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400',
    status: 'Read',
    rating: 5,
    is_mock: true
  },
  {
    id: 'shelf-mock-2',
    book_title: 'The Hobbit',
    book_author: 'J.R.R. Tolkien',
    book_cover_url: 'https://images.unsplash.com/photo-1618666012174-83b441c0bc76?auto=format&fit=crop&q=80&w=400',
    status: 'TBR',
    rating: null,
    is_mock: true
  },
  {
    id: 'shelf-mock-3',
    book_title: 'Normal People',
    book_author: 'Sally Rooney',
    book_cover_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400',
    status: 'Read',
    rating: 4,
    is_mock: true
  }
]

const moodList = ['Cozy', 'Slow-burn', 'Emotional', 'Thrilling', 'Hopeful', 'Dark', 'Spicy', 'Found Family', 'Wholesome', 'Atmospheric']

export default function ShelfPage() {
  const router = useRouter()
  const supabase = createClient()
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  // Shelf state
  const [shelfItems, setShelfItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'All' | 'Read' | 'TBR'>('All')
  const [readingGoal, setReadingGoal] = useState(12)

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [selectedReviewBook, setSelectedReviewBook] = useState<any>(null)

  // Search in Add Modal
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedBookForShelf, setSelectedBookForShelf] = useState<any>(null)
  const [addStatus, setAddStatus] = useState<'Read' | 'TBR'>('TBR')
  const [addRating, setAddRating] = useState<number | null>(null)
  const [submittingAdd, setSubmittingAdd] = useState(false)

  // Review Form details state
  const [formRating, setFormRating] = useState(5)
  const [formLoved, setFormLoved] = useState('')
  const [formFellFlat, setFormFellFlat] = useState('')
  const [formOverall, setFormOverall] = useState('')
  const [formMoods, setFormMoods] = useState<string[]>([])
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [submittingReview, setSubmittingReview] = useState(false)

  const debouncedSearchTimeout = useRef<any>(null)

  // Initial loads
  useEffect(() => {
    const fetchUserAndShelf = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setCurrentUser(session.user)
      }

      try {
        const { data: dbShelf, error } = await supabase
          .from('bookshelf')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error(error)
          setShelfItems([])
        } else if (dbShelf) {
          setShelfItems(dbShelf)
        } else {
          setShelfItems([])
        }
      } catch (err) {
        setShelfItems([])
      } finally {
        setLoading(false)
      }
    }
    fetchUserAndShelf()
  }, [supabase])

  // Google Books search debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchQuery(val)

    if (debouncedSearchTimeout.current) {
      clearTimeout(debouncedSearchTimeout.current)
    }

    if (!val.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    debouncedSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/books/search?q=${encodeURIComponent(val)}`)
        const data = await res.json()
        if (data.items) {
          const formatted = data.items.map((item: any) => ({
            id: item.id,
            title: item.volumeInfo.title,
            author: item.volumeInfo.authors ? item.volumeInfo.authors.join(', ') : 'Unknown Author',
            coverUrl: (item.volumeInfo.imageLinks?.thumbnail || '').replace('http:', 'https:') || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400'
          }))
          setSearchResults(formatted)
        } else {
          setSearchResults([])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setSearching(false)
      }
    }, 500)
  }

  // Add Book to Shelf
  const handleAddBookToShelf = async () => {
    if (!selectedBookForShelf) return
    if (!currentUser) {
      toast.error('Please sign in to add books to your shelf!')
      router.push('/login')
      return
    }

    setSubmittingAdd(true)
    try {
      const payload = {
        user_id: currentUser.id,
        book_google_id: selectedBookForShelf.id,
        book_title: selectedBookForShelf.title,
        book_author: selectedBookForShelf.author,
        book_cover_url: selectedBookForShelf.coverUrl,
        status: addStatus,
        rating: addStatus === 'Read' ? addRating : null
      }

      const { data, error } = await supabase
        .from('bookshelf')
        .insert(payload)
        .select('*')
        .single()

      if (error) {
        toast.error('This book is already on your shelf!')
        return
      }

      toast.success(`"${payload.book_title}" successfully added to your shelf!`)
      
      // Celebrate adding to shelf
      const activeBooksCount = shelfItems.filter((item) => !item.is_mock).length
      if (activeBooksCount === 0) {
        // First real book confetti shower!
        confetti({
          particleCount: 160,
          spread: 90,
          origin: { y: 0.6 }
        })
      } else {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 }
        })
      }

      setShelfItems([data, ...shelfItems])
      setIsAddModalOpen(false)
      setSelectedBookForShelf(null)
      setSearchQuery('')
      setSearchResults([])
      setAddRating(null)
    } catch (err) {
      toast.error('Could not add book to shelf.')
    } finally {
      setSubmittingAdd(false)
    }
  }

  // Remove Book from Shelf
  const handleRemoveFromShelf = async (id: string, title: string, isMock?: boolean) => {
    if (isMock) {
      setShelfItems(shelfItems.filter((item) => item.id !== id))
      toast.success(`Removed mock "${title}" from shelf!`)
      return
    }

    try {
      const { error } = await supabase
        .from('bookshelf')
        .delete()
        .eq('id', id)

      if (error) {
        toast.error('Unable to remove book.')
        return
      }

      toast.success(`Removed "${title}" from shelf!`)
      setShelfItems(shelfItems.filter((item) => item.id !== id))
    } catch (err) {
      toast.error('An unexpected error occurred.')
    }
  }

  // Open Review Posting modal for specific shelf book
  const handleOpenReviewModal = (book: any) => {
    setSelectedReviewBook(book)
    setFormRating(book.rating || 5)
    setFormLoved('')
    setFormFellFlat('')
    setFormOverall('')
    setFormMoods([])
    setSelectedPhotos([])
    setPhotoPreviews([])
    setIsReviewModalOpen(true)
  }

  // Photo Select trigger
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files).slice(0, 3 - selectedPhotos.length)
    setSelectedPhotos([...selectedPhotos, ...files])

    const previews = files.map((file) => URL.createObjectURL(file))
    setPhotoPreviews([...photoPreviews, ...previews])
  }

  // Toggle Mood Chip
  const toggleMoodTag = (mood: string) => {
    if (formMoods.includes(mood)) {
      setFormMoods(formMoods.filter((m) => m !== mood))
    } else {
      setFormMoods([...formMoods, mood])
    }
  }

  // Post Review from Shelf
  const handlePostReview = async () => {
    if (!formLoved.trim()) {
      toast.error('Please write what you loved about the book!')
      return
    }
    if (!currentUser) return

    setSubmittingReview(true)
    try {
      const uploadedUrls: string[] = []

      // Upload review photos if any
      if (selectedPhotos.length > 0) {
        for (const file of selectedPhotos) {
          const fileExt = file.name.split('.').pop()
          const filePath = `${currentUser.id}/${Math.random()}.${fileExt}`
          
          const { error: uploadError } = await supabase.storage
            .from('reviews')
            .upload(filePath, file)
          
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('reviews')
              .getPublicUrl(filePath)
            uploadedUrls.push(publicUrl)
          }
        }
      }

      // Write review
      const reviewPayload = {
        user_id: currentUser.id,
        book_google_id: selectedReviewBook.book_google_id || selectedReviewBook.id,
        book_title: selectedReviewBook.book_title,
        book_author: selectedReviewBook.book_author,
        book_cover_url: selectedReviewBook.book_cover_url,
        rating: formRating,
        loved: formLoved,
        fell_flat: formFellFlat,
        overall: formOverall,
        mood_tags: formMoods,
        photo_urls: uploadedUrls,
      }

      const { error } = await supabase
        .from('reviews')
        .insert(reviewPayload)

      if (error) {
        toast.error('Failed to post review.')
        return
      }

      // If bookshelf status is TBR, update it to Read since they just reviewed it!
      if (selectedReviewBook.status === 'TBR' && !selectedReviewBook.is_mock) {
        await supabase
          .from('bookshelf')
          .update({ status: 'Read', rating: formRating })
          .eq('id', selectedReviewBook.id)

        setShelfItems(shelfItems.map((item) => {
          if (item.id === selectedReviewBook.id) {
            return { ...item, status: 'Read', rating: formRating }
          }
          return item
        }))
      }

      toast.success('Your book review is live on the Feed!')
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      })
      setIsReviewModalOpen(false)
      setSelectedReviewBook(null)
    } catch (err) {
      toast.error('An unexpected error occurred.')
    } finally {
      setSubmittingReview(false)
    }
  }

  // Filter shelf items
  const filteredItems = shelfItems.filter((item) => {
    if (filterStatus === 'All') return true
    return item.status === filterStatus
  })

  // Dynamic Reading Progress & Habit statistics
  const readBooks = shelfItems.filter((item) => item.status === 'Read')
  const totalRead = readBooks.length
  const totalTbr = shelfItems.filter((item) => item.status === 'TBR').length
  const ratedBooks = readBooks.filter((item) => item.rating !== null)
  const averageRating = ratedBooks.length > 0 
    ? (ratedBooks.reduce((acc, curr) => acc + (curr.rating || 0), 0) / ratedBooks.length).toFixed(1)
    : '0.0'

  const spineColors = [
    'bg-coral/80 border-coral text-white',
    'bg-warm-brown/70 border-warm-brown/80 text-cream',
    'bg-sage/75 border-sage text-white',
    'bg-butter border-butter/80 text-navy',
    'bg-primary-pink/80 border-primary-pink text-white',
    'bg-indigo-300 border-indigo-400 text-white',
    'bg-amber-400/80 border-amber-500 text-white'
  ]

  if (loading) {
    return (
      <div className="space-y-10 max-w-6xl mx-auto pb-16 animate-pulse">
        {/* Skeleton Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-sage/10 pb-6">
          <div className="space-y-3">
            <div className="h-10 w-64 bg-sage/10 rounded-xl" />
            <div className="h-4 w-96 bg-sage/5 rounded-lg" />
          </div>
          <div className="h-12 w-40 bg-warm-brown/10 rounded-xl" />
        </div>

        {/* Skeleton Filters */}
        <div className="h-10 w-64 bg-sage/10 rounded-xl" />

        {/* Skeleton TacTile Shelf Row */}
        <div className="relative pt-6 pb-2 border-b-16 border-warm-brown/10 bg-cream/5 rounded-2xl px-6 flex flex-wrap gap-8 items-end justify-center md:justify-start">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center w-28 md:w-32 pb-2 space-y-3">
              <div className="w-24 h-36 md:w-28 md:h-40 rounded-xl bg-sage/15" />
              <div className="h-3 w-20 bg-warm-brown/10 rounded-md" />
              <div className="h-2 w-12 bg-navy/10 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: 'easeOut' }}
      className="space-y-10 max-w-6xl mx-auto pb-16"
    >
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-sage/10 pb-6">
        <div className="space-y-1">
          <h1 className="font-playfair text-3xl md:text-5xl font-extrabold text-warm-brown flex items-center gap-3">
            <Library className="h-8 w-8 text-coral animate-pulse" />
            <span>My Virtual Library</span>
          </h1>
          <p className="text-sm font-semibold text-navy/60">
            Sip chamomile tea and arrange your reading achievements and aspirational collections.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-cozy btn-cozy-primary text-xs px-5 py-3.5 flex items-center justify-center gap-2 shadow cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add Book to Shelf</span>
        </button>
      </div>

      {/* 📚 Reading Progress & Habit Tracker */}
      <div className="card-cozy bg-white/70 backdrop-blur-sm border border-sage/20 p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-playfair text-xl font-bold text-warm-brown flex items-center gap-2">
              <Award className="h-5.5 w-5.5 text-coral animate-bounce" />
              <span>Sanctuary Reading Progress</span>
            </h3>
            <p className="text-xs text-navy/60 font-semibold">
              Celebrate your calm reading ritual and track your yearly goal.
            </p>
          </div>

          {/* Goal Adjustment Controls */}
          <div className="flex items-center gap-3 bg-cream/30 border border-sage/15 px-3 py-1.5 rounded-2xl">
            <span className="text-[10px] font-black uppercase text-warm-brown">Yearly Goal:</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setReadingGoal(Math.max(1, readingGoal - 1))}
                className="h-6 w-6 rounded-lg bg-white border border-sage/20 flex items-center justify-center text-navy/70 hover:bg-coral hover:text-white transition-colors cursor-pointer"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-xs font-black text-warm-brown min-w-[20px] text-center">{readingGoal}</span>
              <button 
                onClick={() => setReadingGoal(readingGoal + 1)}
                className="h-6 w-6 rounded-lg bg-white border border-sage/20 flex items-center justify-center text-navy/70 hover:bg-coral hover:text-white transition-colors cursor-pointer"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="bg-cream/15 p-4 rounded-2xl border border-sage/10 text-center space-y-1">
            <span className="text-[9px] font-black uppercase text-warm-brown/65 tracking-wider">Books Read</span>
            <div className="font-playfair text-2xl font-black text-coral">{totalRead}</div>
          </div>
          <div className="bg-cream/15 p-4 rounded-2xl border border-sage/10 text-center space-y-1">
            <span className="text-[9px] font-black uppercase text-warm-brown/65 tracking-wider">Goal Progress</span>
            <div className="font-playfair text-2xl font-black text-warm-brown">
              {Math.min(100, Math.round((totalRead / readingGoal) * 100))}%
            </div>
          </div>
          <div className="bg-cream/15 p-4 rounded-2xl border border-sage/10 text-center space-y-1">
            <span className="text-[9px] font-black uppercase text-warm-brown/65 tracking-wider">Average Rating</span>
            <div className="font-playfair text-2xl font-black text-coral">{averageRating} ★</div>
          </div>
          <div className="bg-cream/15 p-4 rounded-2xl border border-sage/10 text-center space-y-1">
            <span className="text-[9px] font-black uppercase text-warm-brown/65 tracking-wider">Want To Read</span>
            <div className="font-playfair text-2xl font-black text-warm-brown">{totalTbr}</div>
          </div>
        </div>

        {/* 📚 Little tactile Bookshelf Spine Visual Progression */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-center text-[10px] font-black uppercase text-warm-brown/60 px-1">
            <span>Bookshelf Visual Progress</span>
            <span>{totalRead} / {readingGoal} Books</span>
          </div>

          <div className="relative w-full bg-cream/10 border-b-8 border-warm-brown/30 rounded-t-xl px-4 pt-12 pb-0 min-h-[96px] flex items-end gap-1.5 overflow-x-auto shadow-inner">
            {totalRead === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 space-y-1">
                <Coffee className="h-5 w-5 text-warm-brown/30" />
                <span className="text-[10px] font-bold text-navy/45">Your visual progress bookshelf is clean and waiting. Start reading to place spines here! ☕</span>
              </div>
            ) : (
              // Map each read book into a gorgeous custom colored, tactile spine on the shelf
              readBooks.map((item, index) => {
                const colorClass = spineColors[index % spineColors.length]
                // Vary heights slightly for a charming look
                const heightClass = index % 3 === 0 ? 'h-14' : index % 3 === 1 ? 'h-16' : 'h-15'
                // Vary angles slightly
                const rotateClass = index % 4 === 0 ? 'rotate-1' : index % 4 === 1 ? '-rotate-1' : index % 4 === 2 ? 'rotate-[2deg]' : '-rotate-[2deg]'
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: index * 0.05 }}
                    className={`w-6 border-t-2 border-x ${colorClass} ${heightClass} ${rotateClass} rounded-t-sm shadow-sm flex-shrink-0 flex items-center justify-center relative group cursor-help`}
                    title={`${item.book_title} by ${item.book_author}`}
                  >
                    {/* Golden decorative accent lines on spines */}
                    <div className="absolute top-2 left-0.5 right-0.5 h-0.5 bg-yellow-100/35" />
                    <div className="absolute bottom-2 left-0.5 right-0.5 h-0.5 bg-yellow-100/35" />
                    
                    {/* Tactile spine vertical text preview on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-warm-brown text-cream text-[8px] px-2 py-1 rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-35 mb-2">
                      <span className="font-bold">{item.book_title}</span>
                    </div>

                    {/* Tiny star indication on spine if rated */}
                    {item.rating && (
                      <span className="text-[7px] text-yellow-100/70 font-black">★</span>
                    )}
                  </motion.div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white/40 p-1.5 rounded-2xl border border-sage/20 max-w-sm">
        {(['All', 'Read', 'TBR'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              filterStatus === status
                ? 'bg-warm-brown text-cream shadow-sm'
                : 'text-warm-brown/70 hover:bg-butter/25 hover:text-warm-brown'
            }`}
          >
            {status === 'All' && 'All Spines'}
            {status === 'Read' && (
              <span className="flex items-center gap-1.5 justify-center">
                <BookOpen className="h-3.5 w-3.5 text-coral" />
                <span>Read</span>
              </span>
            )}
            {status === 'TBR' && (
              <span className="flex items-center gap-1.5 justify-center">
                <Hourglass className="h-3.5 w-3.5 text-coral" />
                <span>To Be Read</span>
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TacTile Bookshelf Visual System */}
      {filteredItems.length === 0 ? (
        <div className="card-cozy bg-white/60 p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="flex justify-center">
            <Library className="h-12 w-12 text-coral/45" />
          </div>
          <h3 className="font-playfair text-xl font-bold text-warm-brown">Your shelves are clear...</h3>
          <p className="text-xs text-navy/65 max-w-xs mx-auto leading-relaxed">
            Fill this peaceful sanctuary space with your favorite pages and read history logs.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-cozy btn-cozy-outline text-xs px-5 py-2.5 mt-2"
          >
            Search a Story
          </button>
        </div>
      ) : (
        <div className="space-y-16">
          {/* Bookshelf row design */}
          <div className="relative pt-6 pb-2 border-b-16 border-warm-brown/20 bg-cream/10 rounded-2xl px-6 flex flex-wrap gap-x-8 gap-y-12 items-end justify-center md:justify-start">
            
            {/* Shelf Wood-Grain styling shadow */}
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-warm-brown/25 rounded-b-2xl blur-[1px]" />
            
            <AnimatePresence>
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  whileHover={{ y: -8, rotate: 1.5 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="group relative flex flex-col items-center w-28 md:w-32 cursor-pointer pb-2"
                >
                  
                  {/* Status Badge */}
                  <span className={`absolute -top-4 z-20 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                    item.status === 'Read'
                      ? 'bg-sage text-white shadow-sm'
                      : 'bg-butter text-warm-brown shadow-sm border border-warm-brown/10'
                  }`}>
                    {item.status}
                  </span>

                  {/* tactile book cover tilt wrapper */}
                  <div className="w-24 h-36 md:w-28 md:h-40 rounded-xl overflow-hidden shadow-lg border border-sage/10 transition-all duration-300 transform group-hover:rotate-2 group-hover:-translate-y-3 group-hover:shadow-2xl relative bg-cream/45">
                    <img src={item.book_cover_url} alt={item.book_title} className="h-full w-full object-cover" />
                    
                    {/* Shadow overlay overlay */}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Wood ledge alignment placeholder */}
                  <div className="h-1.5 w-full bg-black/5 blur-[2px] mt-1 -mb-1" />

                  {/* Info Panel under shelf line */}
                  <div className="text-center mt-3 space-y-1 w-full px-1 min-w-0">
                    <h4 className="font-playfair text-xs font-black text-warm-brown leading-tight truncate">
                      {item.book_title}
                    </h4>
                    <p className="text-[10px] text-navy/55 font-bold truncate">
                      {item.book_author}
                    </p>

                    {/* Star Display */}
                    {item.status === 'Read' && item.rating && (
                      <div className="flex items-center justify-center gap-0.5 pt-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-2.5 w-2.5 ${
                              i < item.rating ? 'text-coral fill-coral' : 'text-sage/20'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* FLOATING ACTION OVERLAY CONTROLS */}
                  <div className="absolute inset-0 bg-black/65 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2.5 p-3 z-10 w-24 h-36 md:w-28 md:h-40">
                    <button
                      onClick={() => handleOpenReviewModal(item)}
                      className="w-full py-1.5 rounded-lg bg-cream text-warm-brown hover:bg-butter text-[9px] font-black text-center transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Edit className="h-2.5 w-2.5" />
                      <span>{item.status === 'Read' && item.rating ? 'Edit Review' : 'Write Review'}</span>
                    </button>
                    
                    <button
                      onClick={() => handleRemoveFromShelf(item.id, item.book_title, item.is_mock)}
                      className="w-full py-1.5 rounded-lg bg-coral/20 hover:bg-coral text-coral hover:text-cream text-[9px] font-black text-center transition-all border border-coral/30 cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                      <span>Remove</span>
                    </button>
                  </div>

                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD BOOK TO SHELF */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card-cozy bg-white max-w-xl w-full p-8 space-y-6 relative max-h-[85vh] overflow-y-auto"
            >
              {/* Close */}
              <button
                onClick={() => {
                  setIsAddModalOpen(false)
                  setSelectedBookForShelf(null)
                  setSearchResults([])
                }}
                className="absolute top-4 right-4 text-navy/40 hover:text-navy cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 border-b border-sage/10 pb-4">
                <Plus className="h-5 w-5 text-coral" />
                <h2 className="font-playfair text-xl font-bold text-warm-brown">
                  Add Book to Shelf
                </h2>
              </div>

              {/* Book Search selection block */}
              {!selectedBookForShelf ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-navy/40" />
                    <input
                      type="text"
                      placeholder="Search title, author, isbn..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-sage/30 bg-cream/20 focus:bg-white text-navy font-semibold text-sm transition-all focus:outline-none"
                    />
                  </div>

                  {searching && (
                    <div className="text-center text-xs text-navy/55 font-bold py-4">
                      Searching libraries...
                    </div>
                  )}

                  {/* List search items */}
                  <div className="space-y-2">
                    {searchResults.map((book) => (
                      <div
                        key={book.id}
                        onClick={() => setSelectedBookForShelf(book)}
                        className="flex items-center gap-4 p-3 rounded-2xl border border-sage/20 hover:border-coral/20 bg-cream/10 hover:bg-butter/20 transition-all cursor-pointer"
                      >
                        <img src={book.coverUrl} alt={book.title} className="h-14 w-10 object-cover rounded shadow" />
                        <div className="min-w-0">
                          <h4 className="font-playfair text-sm font-bold text-warm-brown truncate">{book.title}</h4>
                          <p className="text-xs text-navy/60 truncate">by {book.author}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Book status selection configurations */
                <div className="space-y-5">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-cream/30 border border-sage/10">
                    <img src={selectedBookForShelf.coverUrl} alt={selectedBookForShelf.title} className="h-12 w-9 object-cover rounded" />
                    <div className="min-w-0">
                      <h4 className="font-playfair text-xs font-bold text-warm-brown truncate">{selectedBookForShelf.title}</h4>
                      <p className="text-[10px] text-navy/60 truncate">by {selectedBookForShelf.author}</p>
                    </div>
                    <button onClick={() => setSelectedBookForShelf(null)} className="ml-auto text-[10px] font-bold text-coral hover:underline">Change</button>
                  </div>

                  {/* Status buttons */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-warm-brown block">Reading Status</label>
                    <div className="flex gap-4">
                      {(['Read', 'TBR'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setAddStatus(st)}
                          className={`flex-1 py-3 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
                            addStatus === st
                              ? 'bg-warm-brown text-cream border-warm-brown shadow-sm'
                              : 'bg-white text-navy/70 border-sage/20 hover:bg-butter/25'
                          }`}
                        >
                          {st === 'Read' ? '📖 Already Read' : '⏳ TBR (To Be Read)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rating stars if marked as already Read */}
                  {addStatus === 'Read' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-warm-brown block">Your Rating (Optional)</label>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setAddRating(i + 1)}
                            className="text-coral focus:outline-none cursor-pointer"
                          >
                            <Star className={`h-5 w-5 ${(addRating && i < addRating) ? 'fill-coral' : 'text-sage/30'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Complete actions */}
                  <button
                    onClick={handleAddBookToShelf}
                    disabled={submittingAdd}
                    className="btn-cozy btn-cozy-primary w-full py-4 text-xs font-bold"
                  >
                    {submittingAdd ? 'Adding to shelf...' : 'Pin on Shelf'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: WRITE REVIEW FOR SHELF BOOK */}
      <AnimatePresence>
        {isReviewModalOpen && selectedReviewBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card-cozy bg-white max-w-xl w-full p-8 space-y-6 relative max-h-[85vh] overflow-y-auto"
            >
              {/* Close */}
              <button onClick={() => setIsReviewModalOpen(false)} className="absolute top-4 right-4 text-navy/40 hover:text-navy cursor-pointer">
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 border-b border-sage/10 pb-4">
                <BookOpen className="h-5 w-5 text-coral" />
                <h2 className="font-playfair text-xl font-bold text-warm-brown">
                  Write Book Review
                </h2>
              </div>

              {/* Book Metadata strip */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-cream/30 border border-sage/10">
                <img src={selectedReviewBook.book_cover_url} alt={selectedReviewBook.book_title} className="h-10 w-8 object-cover rounded" />
                <div className="min-w-0">
                  <h4 className="font-playfair text-xs font-bold text-warm-brown truncate">{selectedReviewBook.book_title}</h4>
                  <p className="text-[10px] text-navy/60 truncate">by {selectedReviewBook.book_author}</p>
                </div>
              </div>

              {/* Review Ratings */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-warm-brown">Story rating</label>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormRating(i + 1)}
                      className="text-coral cursor-pointer"
                    >
                      <Star className={`h-5 w-5 ${i < formRating ? 'fill-coral' : 'text-sage/30'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Loved */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-warm-brown block">What I Loved (Required)</label>
                <textarea
                  rows={2}
                  placeholder="What details touched your heart?"
                  value={formLoved}
                  onChange={(e) => setFormLoved(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-sage/30 bg-cream/20 focus:bg-white text-navy font-semibold text-sm transition-all focus:outline-none resize-none"
                />
              </div>

              {/* Flat */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-warm-brown block">What Fell Flat (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="What could have been tweaked?"
                  value={formFellFlat}
                  onChange={(e) => setFormFellFlat(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-sage/30 bg-cream/20 focus:bg-white text-navy font-semibold text-sm transition-all focus:outline-none resize-none"
                />
              </div>

              {/* Mood Tags */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-warm-brown block">Story Mood Tags</label>
                <div className="flex flex-wrap gap-1">
                  {moodList.map((mood) => {
                    const isSel = formMoods.includes(mood)
                    return (
                      <button
                        key={mood}
                        type="button"
                        onClick={() => toggleMoodTag(mood)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                          isSel ? 'bg-warm-brown text-cream border-warm-brown' : 'bg-white text-navy/70 border-sage/20'
                        }`}
                      >
                        {mood}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Photo Uploads */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-warm-brown block">Photos (Max 3)</label>
                <div className="flex items-center gap-3">
                  <label className="h-16 w-16 bg-cream/20 border border-dashed border-sage/40 rounded-xl flex flex-col items-center justify-center text-navy/40 cursor-pointer">
                    <Camera className="h-5 w-5" />
                    <span className="text-[8px] font-bold mt-1">Add Photo</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
                  </label>
                  {photoPreviews.map((src, i) => (
                    <img key={i} src={src} alt="Preview" className="h-16 w-16 rounded-xl border object-cover" />
                  ))}
                </div>
              </div>

              {/* Publish button */}
              <button
                onClick={handlePostReview}
                disabled={submittingReview}
                className="btn-cozy btn-cozy-primary w-full py-4 text-xs font-bold"
              >
                {submittingReview ? 'Publishing story review...' : 'Publish Cozy Review'}
              </button>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}
