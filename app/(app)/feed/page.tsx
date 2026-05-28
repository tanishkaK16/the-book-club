'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Search,
  Star,
  Heart,
  MessageCircle,
  Plus,
  X,
  Sparkles,
  Camera,
  BookOpen,
  User,
  Check,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import confetti from 'canvas-confetti'


// Pre-defined cozy mood tags
const moodList = ['Cozy', 'Slow-burn', 'Emotional', 'Thrilling', 'Hopeful', 'Dark', 'Spicy', 'Found Family', 'Wholesome', 'Atmospheric']

// Static Fallback reviews for instant stunning landing UI
const staticMockReviews = [
  {
    id: 'mock-1',
    user_id: 'mock-user-1',
    book_title: 'Before the Coffee Gets Cold',
    book_author: 'Toshikazu Kawaguchi',
    book_cover_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400',
    rating: 5,
    loved: 'The atmospheric, slow-burn nature of the cafe and the beautiful time-travel rules. It felt like a warm hug.',
    fell_flat: 'Nothing at all! The pacing was perfect for a rainy afternoon read.',
    overall: 'A heartwarming reminder to appreciate the moments we have with the people we love before it is too late.',
    mood_tags: ['Cozy', 'Slow-burn', 'Wholesome', 'Atmospheric'],
    photo_urls: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600'],
    likes_count: 24,
    comments_count: 3,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(), // 2h ago
    liked_by_me: true,
    profiles: {
      full_name: 'Clara Oswald',
      avatar_url: null
    }
  },
  {
    id: 'mock-2',
    user_id: 'mock-user-2',
    book_title: 'The Secret History',
    book_author: 'Donna Tartt',
    book_cover_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400',
    rating: 4,
    loved: 'The dark academia aesthetic, gorgeous prose, and psychological tension that keeps you glued until the last sentence.',
    fell_flat: 'A bit slow in the middle sections, but the payoff is absolutely worth the build.',
    overall: 'An exquisite exploration of guilt, classism, and obsession. It stays with you for months.',
    mood_tags: ['Dark', 'Slow-burn', 'Atmospheric'],
    photo_urls: [],
    likes_count: 42,
    comments_count: 5,
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(), // 6h ago
    liked_by_me: false,
    profiles: {
      full_name: 'Julian Blackthorn',
      avatar_url: null
    }
  },
  {
    id: 'mock-3',
    user_id: 'mock-user-3',
    book_title: 'A Court of Thorns and Roses',
    book_author: 'Sarah J. Maas',
    book_cover_url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400',
    rating: 5,
    loved: 'The beautiful world-building of Prythian, the incredible high-stakes romance, and the sheer magical adventure!',
    fell_flat: 'The first few chapters felt slightly traditional, but once the spring court opens up it becomes spectacular.',
    overall: 'An addictive, thrilling fantasy romance that completely swept me off my feet. Ready for book two immediately!',
    mood_tags: ['Spicy', 'Thrilling', 'Found Family'],
    photo_urls: ['https://images.unsplash.com/photo-1518373714866-3f1478910eb0?auto=format&fit=crop&q=80&w=600'],
    likes_count: 89,
    comments_count: 12,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(), // 24h ago
    liked_by_me: false,
    profiles: {
      full_name: 'Feyre Archeron',
      avatar_url: null
    }
  }
]

export default function FeedPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [feedFilter, setFeedFilter] = useState<'all' | 'following'>('all')
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modals & Forms State
  const [isPostModalOpen, setIsPostModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<any>(null)

  // Step 1: Book Search
  const [bookSearchQuery, setBookSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchingBooks, setSearchingBooks] = useState(false)
  const [selectedBook, setSelectedBook] = useState<any>(null)
  
  // Step 2: Form fields
  const [postStep, setPostStep] = useState(1) // 1 = Search, 2 = Form Details
  const [formRating, setFormRating] = useState(5)
  const [formLoved, setFormLoved] = useState('')
  const [formFellFlat, setFormFellFlat] = useState('')
  const [formOverall, setFormOverall] = useState('')
  const [formMoods, setFormMoods] = useState<string[]>([])
  
  // Photo upload previews
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [submittingReview, setSubmittingReview] = useState(false)

  // Comment Box State in Detail Modal
  const [newCommentContent, setNewCommentContent] = useState('')
  const [commentsList, setCommentsList] = useState<any[]>([])
  const [loadingComments, setLoadingComments] = useState(false)

  // Search Debouncing
  const debouncedSearchTimeout = useRef<any>(null)

  // Load Feed Data
  useEffect(() => {
    const initFeed = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setCurrentUser(session.user)
      }
      
      try {
        let dbQuery = supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false })

        if (feedFilter === 'following' && session) {
          const { data: followings } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', session.user.id)

          const targetIds = followings ? followings.map((f) => f.following_id) : []
          if (targetIds.length > 0) {
            dbQuery = dbQuery.in('user_id', targetIds)
          } else {
            // Toggled following but following no one yet!
            setReviews([])
            setLoading(false)
            return
          }
        }

        // Fetch from Supabase
        const { data: dbReviews, error } = await dbQuery

        if (error) {
          console.error(error)
          setReviews([])
        } else if (dbReviews && dbReviews.length > 0) {
          // Fetch profiles separately
          const userIds = Array.from(new Set(dbReviews.map((r: any) => r.user_id)))
          const { data: dbProfiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds)

          // Map profiles to reviews
          const reviewsWithProfiles = dbReviews.map((r: any) => ({
            ...r,
            profiles: dbProfiles?.find((p: any) => p.id === r.user_id) || {
              full_name: 'Cozy Reader',
              avatar_url: null
            }
          }))

          // Check if I liked these reviews
          const reviewIds = reviewsWithProfiles.map((r) => r.id)
          let likedReviewIds: string[] = []
          
          if (session) {
            const { data: myLikes } = await supabase
              .from('likes')
              .select('review_id')
              .eq('user_id', session.user.id)
              .in('review_id', reviewIds)
            
            if (myLikes) {
              likedReviewIds = myLikes.map((l) => l.review_id)
            }
          }

          const formatted = reviewsWithProfiles.map((r) => ({
            ...r,
            liked_by_me: likedReviewIds.includes(r.id)
          }))
          
          setReviews(formatted)
        } else {
          setReviews([])
        }
      } catch (err) {
        setReviews([])
      } finally {
        setLoading(false)
      }
    }

    initFeed()
  }, [supabase, feedFilter])

  // Book search debouncing triggers Google Books API
  const handleBookSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setBookSearchQuery(val)

    if (debouncedSearchTimeout.current) {
      clearTimeout(debouncedSearchTimeout.current)
    }

    if (!val.trim()) {
      setSearchResults([])
      return
    }

    setSearchingBooks(true)
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
        setSearchingBooks(false)
      }
    }, 500)
  }

  // Toggling Likes with Optimistic UI updates
  const handleLikeToggle = async (reviewId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentUser) {
      toast.error('Please sign in to like reviews!')
      router.push('/login')
      return
    }

    const oldReviews = [...reviews]
    const oldSelectedReview = selectedReview ? { ...selectedReview } : null

    // Determine the target review from active list or selected details
    const targetReview = reviews.find((r) => r.id === reviewId) || (selectedReview?.id === reviewId ? selectedReview : null)
    if (!targetReview) return

    const isLiking = !targetReview.liked_by_me
    const newLikesCount = isLiking ? targetReview.likes_count + 1 : Math.max(0, targetReview.likes_count - 1)

    // 1. Update main reviews list state optimistically
    setReviews(reviews.map((r) => {
      if (r.id === reviewId) {
        return {
          ...r,
          liked_by_me: isLiking,
          likes_count: newLikesCount
        }
      }
      return r
    }))

    // 2. Update selected review modal details state if active
    if (selectedReview && selectedReview.id === reviewId) {
      setSelectedReview({
        ...selectedReview,
        liked_by_me: isLiking,
        likes_count: newLikesCount
      })
    }

    if (reviewId.startsWith('mock-')) {
      toast.success(isLiking ? 'Loved!' : 'Unliked!')
      return
    }

    try {
      if (!isLiking) {
        // Delete like from Supabase (since it was liked, and we are unliking)
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('review_id', reviewId)

        if (error) throw error
      } else {
        // Insert like into Supabase (since it wasn't liked, and we are liking)
        const { error } = await supabase
          .from('likes')
          .insert({ user_id: currentUser.id, review_id: reviewId })

        if (error) throw error
      }
    } catch (err) {
      console.error('Error toggling like in database:', err)
      // Revert optimistic updates
      setReviews(oldReviews)
      if (oldSelectedReview) {
        setSelectedReview(oldSelectedReview)
      }
      toast.error('Could not update like status.')
    }
  }

  // Photo Select handler
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

  // Handle Review Post Submission
  const handlePostReview = async () => {
    if (!selectedBook) {
      toast.error('Please select a book first.')
      return
    }
    if (!formLoved.trim()) {
      toast.error('Please fill in what you loved about the story.')
      return
    }
    if (!currentUser) {
      toast.error('You must be signed in to post.')
      router.push('/login')
      return
    }

    setSubmittingReview(true)
    try {
      const uploadedUrls: string[] = []

      // Upload review photos if exist
      if (selectedPhotos.length > 0) {
        setUploadingPhotos(true)
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
        setUploadingPhotos(false)
      }

      // Insert review
      const reviewPayload = {
        user_id: currentUser.id,
        book_google_id: selectedBook.id,
        book_title: selectedBook.title,
        book_author: selectedBook.author,
        book_cover_url: selectedBook.coverUrl,
        rating: formRating,
        loved: formLoved,
        fell_flat: formFellFlat,
        overall: formOverall,
        mood_tags: formMoods,
        photo_urls: uploadedUrls,
      }

      const { data: newReview, error } = await supabase
        .from('reviews')
        .insert(reviewPayload)
        .select('*')
        .single()

      if (error) {
        toast.error(error.message || 'Failed to post your review.')
        return
      }

      // Fetch user profile separately
      const { data: posterProfile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', currentUser.id)
        .single()

      const finalReview = {
        ...newReview,
        profiles: posterProfile || {
          full_name: currentUser.user_metadata?.full_name || 'Reader',
          avatar_url: null
        }
      }

      // Prepend optimistically to feed
      toast.success('Your beautiful review has been pinned to the feed!')
      confetti({
        particleCount: 130,
        spread: 85,
        origin: { y: 0.6 }
      })
      setReviews([
        { ...finalReview, liked_by_me: false },
        ...reviews
      ])

      // Reset Wizard Form
      setIsPostModalOpen(false)
      setSelectedBook(null)
      setBookSearchQuery('')
      setSearchResults([])
      setPostStep(1)
      setFormRating(5)
      setFormLoved('')
      setFormFellFlat('')
      setFormOverall('')
      setFormMoods([])
      setSelectedPhotos([])
      setPhotoPreviews([])

    } catch (err) {
      toast.error('An unexpected error occurred.')
    } finally {
      setSubmittingReview(false)
    }
  }

  // Open Detail Modal & Fetch Comments
  const handleOpenDetailModal = async (review: any) => {
    setSelectedReview(review)
    setIsDetailModalOpen(true)
    setNewCommentContent('')
    setCommentsList([])
    
    if (review.id.startsWith('mock-')) {
      // Mock static comments for mockup wows
      setCommentsList([
        { id: 'c1', content: 'Oh my! I completely agree with your thoughts on the slow pacing.', profiles: { full_name: 'Elizabeth Bennet' }, created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 'c2', content: 'Adding this title to my virtual reading shelf immediately!', profiles: { full_name: 'Mr. Darcy' }, created_at: new Date(Date.now() - 1800000).toISOString() }
      ])
      return
    }

    setLoadingComments(true)
    try {
      const { data: dbComments, error } = await supabase
        .from('comments')
        .select('*')
        .eq('review_id', review.id)
        .order('created_at', { ascending: true })

      if (dbComments) {
        const userIds = Array.from(new Set(dbComments.map((c: any) => c.user_id)))
        const { data: dbProfiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds)

        const commentsWithProfiles = dbComments.map((c: any) => ({
          ...c,
          profiles: dbProfiles?.find((p: any) => p.id === c.user_id) || {
            full_name: 'Cozy Reader',
            avatar_url: null
          }
        }))
        setCommentsList(commentsWithProfiles)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingComments(false)
    }
  }

  // Post Comment with Optimistic updates
  const handlePostComment = async () => {
    if (!newCommentContent.trim()) return
    if (!currentUser) {
      toast.error('Please sign in to join the conversation!')
      router.push('/login')
      return
    }

    const commentText = newCommentContent
    setNewCommentContent('')

    // Optimistic insert to commentsList
    const newMockComment = {
      id: `temp-${Date.now()}`,
      content: commentText,
      created_at: new Date().toISOString(),
      profiles: {
        full_name: currentUser.user_metadata?.full_name || 'Reader',
        avatar_url: null
      }
    }
    setCommentsList([...commentsList, newMockComment])

    // Update parent reviews comments_count optimistically
    setReviews(reviews.map((r) => {
      if (r.id === selectedReview.id) {
        return { ...r, comments_count: r.comments_count + 1 }
      }
      return r
    }))

    if (selectedReview.id.startsWith('mock-')) {
      toast.success('Comment posted to fallback!')
      return
    }

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          user_id: currentUser.id,
          review_id: selectedReview.id,
          content: commentText
        })

      if (error) {
        toast.error('Could not post comment.')
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Format Date helper
  const getRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hrs = Math.floor(mins / 60)
    const days = Math.floor(hrs / 24)

    if (mins < 60) return `${mins}m ago`
    if (hrs < 24) return `${hrs}h ago`
    return `${days}d ago`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: 'easeOut' }}
      className="space-y-8 max-w-7xl mx-auto pb-16"
    >
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-sage/10 pb-6">
        <div>
          <h1 className="font-playfair text-3xl md:text-5xl font-extrabold text-warm-brown">
            Slow Reading Circle
          </h1>
          <p className="text-sm font-semibold text-navy/60 mt-1">
            Browse authentic libraries and trade bookshelf stories with friends.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Feed Filter Panel */}
          {currentUser && (
            <div className="flex items-center gap-1 bg-white/40 p-1 rounded-xl border border-sage/20 text-[10px] font-bold">
              <button
                onClick={() => setFeedFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  feedFilter === 'all'
                    ? 'bg-warm-brown text-cream shadow-sm'
                    : 'text-warm-brown/70 hover:bg-butter/25'
                }`}
              >
                All Activities
              </button>
              <button
                onClick={() => setFeedFilter('following')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  feedFilter === 'following'
                    ? 'bg-warm-brown text-cream shadow-sm'
                    : 'text-warm-brown/70 hover:bg-butter/25'
                }`}
              >
                Following Only
              </button>
            </div>
          )}

          {/* Small stats summary */}
          <div className="flex items-center gap-3 bg-white/60 border border-sage/20 rounded-full px-5 py-2.5 shadow-sm text-xs font-bold text-warm-brown">
            <Clock className="h-4 w-4 text-coral animate-pulse" />
            <span>Active Book Circle Feed</span>
          </div>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading ? (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="card-cozy bg-white/70 animate-pulse h-80 mb-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-4 bg-sage/20 w-1/3 rounded-full" />
                <div className="h-6 bg-sage/20 w-2/3 rounded-full" />
                <div className="h-20 bg-sage/10 rounded-2xl" />
              </div>
              <div className="h-8 bg-sage/20 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        /* Real Masonry columns system for beautiful Pinterest-style heights */
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              onClick={() => handleOpenDetailModal(review)}
              whileHover={{ y: -6, rotate: 0.6, scale: 1.015 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="break-inside-avoid card-cozy bg-white/90 backdrop-blur-sm border border-sage/20 hover:border-coral/25 shadow-md flex flex-col gap-4 cursor-pointer overflow-hidden p-6 relative group inline-block w-full mb-6"
            >
              
              {/* Stars & Cover container */}
              <div className="flex gap-4 items-start">
                {/* Book Cover Image */}
                <div className="w-20 h-28 flex-shrink-0 bg-cream/40 rounded-xl overflow-hidden border border-sage/10 shadow relative">
                  <img
                    src={review.book_cover_url}
                    alt={review.book_title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Cover info metadata */}
                <div className="space-y-2 flex-grow min-w-0">
                  <h3 className="font-playfair text-base font-extrabold text-warm-brown leading-tight truncate">
                    {review.book_title}
                  </h3>
                  <p className="text-xs font-semibold text-navy/60 truncate">
                    by {review.book_author}
                  </p>
                  
                  {/* Yellow Warm Stars rating */}
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < review.rating ? 'text-coral fill-coral' : 'text-sage/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Review Excerpt */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-coral uppercase tracking-wider block">What I Loved</span>
                <p className="text-xs text-navy/70 leading-relaxed font-semibold line-clamp-3">
                  "{review.loved}"
                </p>
              </div>

              {/* Mood chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {review.mood_tags?.slice(0, 3).map((mood: string) => (
                  <span key={mood} className="px-2 py-0.5 bg-butter/40 text-warm-brown text-[9px] font-extrabold rounded-full border border-butter/40">
                    {mood}
                  </span>
                ))}
              </div>

              {/* Card Footer controls */}
              <div className="border-t border-sage/10 pt-4 flex items-center justify-between text-xs text-navy/50">
                {/* Member Profile */}
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/profile/${review.user_id}`)
                  }}
                  className="flex items-center gap-2 hover:underline cursor-pointer group/member"
                >
                  <div className="h-6 w-6 rounded-full border border-sage/20 bg-cream flex items-center justify-center overflow-hidden group-hover/member:border-coral/45 transition-colors">
                    {review.profiles?.avatar_url ? (
                      <img src={review.profiles.avatar_url} alt="User Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-3 w-3 text-warm-brown/40" />
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-warm-brown group-hover/member:text-coral transition-colors">
                    {review.profiles?.full_name || 'Reader'}
                  </span>
                </div>

                {/* Social count pills */}
                <div className="flex items-center gap-3 font-bold text-[10px]">
                  <button
                    onClick={(e) => handleLikeToggle(review.id, e)}
                    className={`flex items-center gap-1 transition-colors hover:text-coral ${
                      review.liked_by_me ? 'text-coral' : 'text-navy/40'
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${review.liked_by_me ? 'fill-coral' : ''}`} />
                    <span>{review.likes_count}</span>
                  </button>

                  <div className="flex items-center gap-1 text-navy/40">
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>{review.comments_count}</span>
                  </div>
                </div>
              </div>

              {/* Relative Date block */}
              <div className="absolute top-4 right-4 text-[9px] font-extrabold text-navy/30">
                {getRelativeTime(review.created_at)}
              </div>

            </motion.div>
          ))}
        </div>
      )}

      {/* FLOAT ACTION BUTTON FOR MODAL */}
      <motion.button
        onClick={() => setIsPostModalOpen(true)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-8 right-8 z-40 bg-coral text-cream hover:bg-warm-brown rounded-full h-14 w-14 flex items-center justify-center shadow-lg border border-coral/10 focus:outline-none cursor-pointer"
      >
        <Plus className="h-7 w-7" />
      </motion.button>

      {/* MODAL 1: NEW REVIEW WIZARD */}
      <AnimatePresence>
        {isPostModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card-cozy bg-white max-w-xl w-full p-8 space-y-6 relative max-h-[85vh] overflow-y-auto"
            >
              {/* Close button */}
              <button
                onClick={() => setIsPostModalOpen(false)}
                className="absolute top-4 right-4 text-navy/40 hover:text-navy cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 border-b border-sage/10 pb-4">
                <BookOpen className="h-5 w-5 text-coral" />
                <h2 className="font-playfair text-xl font-bold text-warm-brown">
                  {postStep === 1 ? 'Search & Choose Book' : 'Share Your Review'}
                </h2>
              </div>

              {/* STEP 1: BOOK SEARCH */}
              {postStep === 1 && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-navy/40" />
                    <input
                      type="text"
                      placeholder="Search title, author, series..."
                      value={bookSearchQuery}
                      onChange={handleBookSearchChange}
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-sage/30 bg-cream/20 focus:bg-white text-navy font-semibold text-sm transition-all focus:outline-none"
                    />
                  </div>

                  {searchingBooks && (
                    <div className="text-center text-xs text-navy/50 font-bold py-6">
                      Searching bookshelves...
                    </div>
                  )}

                  {/* Search results */}
                  <div className="space-y-2">
                    {searchResults.map((book) => (
                      <div
                        key={book.id}
                        onClick={() => {
                          setSelectedBook(book)
                          setPostStep(2)
                        }}
                        className="flex items-center gap-4 p-3 rounded-2xl border border-sage/20 hover:border-coral/20 bg-cream/10 hover:bg-butter/25 transition-all cursor-pointer"
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
              )}

              {/* STEP 2: REVIEW FORM DETAILS */}
              {postStep === 2 && selectedBook && (
                <div className="space-y-5">
                  {/* Selected Book strip */}
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-cream/30 border border-sage/10">
                    <img src={selectedBook.coverUrl} alt={selectedBook.title} className="h-10 w-8 object-cover rounded" />
                    <div className="min-w-0">
                      <h4 className="font-playfair text-xs font-bold text-warm-brown truncate">{selectedBook.title}</h4>
                      <p className="text-[10px] text-navy/60 truncate">by {selectedBook.author}</p>
                    </div>
                    <button
                      onClick={() => setPostStep(1)}
                      className="ml-auto text-[10px] font-bold text-coral hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  {/* Interactive rating stars */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-warm-brown">Interactive Rating</label>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setFormRating(i + 1)}
                          className="text-coral focus:outline-none cursor-pointer"
                        >
                          <Star className={`h-6 w-6 ${i < formRating ? 'fill-coral' : 'text-sage/30'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Textareas */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-warm-brown">What I Loved (Required)</label>
                    <textarea
                      rows={2}
                      placeholder="What elements stole your heart?"
                      value={formLoved}
                      onChange={(e) => setFormLoved(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-sage/30 bg-cream/20 focus:bg-white text-navy font-semibold text-sm transition-all focus:outline-none resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-warm-brown">What fell flat (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="What could have been better?"
                      value={formFellFlat}
                      onChange={(e) => setFormFellFlat(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-sage/30 bg-cream/20 focus:bg-white text-navy font-semibold text-sm transition-all focus:outline-none resize-none"
                    />
                  </div>

                  {/* Mood Tags */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-warm-brown block">Story Mood Tags</label>
                    <div className="flex flex-wrap gap-1.5">
                      {moodList.map((mood) => {
                        const isSel = formMoods.includes(mood)
                        return (
                          <button
                            key={mood}
                            type="button"
                            onClick={() => toggleMoodTag(mood)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                              isSel
                                ? 'bg-warm-brown text-cream border-warm-brown'
                                : 'bg-white text-navy/70 border-sage/20 hover:bg-butter/20'
                            }`}
                          >
                            {mood}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Photo upload */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-warm-brown block">Add Cozy Review Photos (Max 3)</label>
                    <div className="flex items-center gap-3">
                      <label className="h-16 w-16 bg-cream/30 border border-dashed border-sage/40 hover:border-coral/40 rounded-xl flex flex-col items-center justify-center text-navy/40 cursor-pointer transition-all">
                        <Camera className="h-5 w-5" />
                        <span className="text-[9px] font-extrabold mt-1">Upload</span>
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
                      </label>

                      {/* Photo Previews */}
                      {photoPreviews.map((src, i) => (
                        <div key={i} className="h-16 w-16 rounded-xl border border-sage/20 overflow-hidden relative shadow">
                          <img src={src} alt="Preview" className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 pt-2">
                    <button
                      onClick={() => setPostStep(1)}
                      className="btn-cozy btn-cozy-outline text-xs px-6 py-3.5"
                    >
                      Back
                    </button>
                    <button
                      onClick={handlePostReview}
                      disabled={submittingReview}
                      className="btn-cozy btn-cozy-primary text-xs py-3.5 flex-1 flex items-center justify-center gap-1.5"
                    >
                      <span>{submittingReview ? 'Publishing story...' : 'Publish Review'}</span>
                    </button>
                  </div>

                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: FULL REVIEW DETAILS */}
      <AnimatePresence>
        {isDetailModalOpen && selectedReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card-cozy bg-white max-w-3xl w-full p-8 space-y-6 relative max-h-[90vh] overflow-y-auto grid grid-cols-1 md:grid-cols-5 gap-6"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="absolute top-4 right-4 text-navy/40 hover:text-navy cursor-pointer z-10"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Left Column: Cover and Review Content */}
              <div className="md:col-span-3 space-y-5">
                <div className="flex gap-4">
                  <img src={selectedReview.book_cover_url} alt={selectedReview.book_title} className="h-28 w-20 object-cover rounded-xl shadow" />
                  <div className="min-w-0 space-y-1">
                    <h3 className="font-playfair text-xl font-extrabold text-warm-brown leading-tight">{selectedReview.book_title}</h3>
                    <p className="text-xs font-semibold text-navy/60">by {selectedReview.book_author}</p>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < selectedReview.rating ? 'text-coral fill-coral' : 'text-sage/30'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Review Text block */}
                <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-2">
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold text-coral uppercase tracking-wider block">What I Loved</span>
                    <p className="text-xs font-semibold text-navy/70 leading-relaxed bg-cream/15 p-3 rounded-2xl border border-sage/10">"{selectedReview.loved}"</p>
                  </div>
                  {selectedReview.fell_flat && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-extrabold text-coral uppercase tracking-wider block">What Fell Flat</span>
                      <p className="text-xs font-semibold text-navy/70 leading-relaxed bg-cream/15 p-3 rounded-2xl border border-sage/10">"{selectedReview.fell_flat}"</p>
                    </div>
                  )}
                </div>

                {/* Image gallery */}
                {selectedReview.photo_urls && selectedReview.photo_urls.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-extrabold text-navy/40 uppercase tracking-wider block">Review Photos</span>
                    <div className="flex gap-2">
                      {selectedReview.photo_urls.map((url: string, idx: number) => (
                        <img key={idx} src={url} alt="Review" className="h-20 w-20 object-cover rounded-xl border border-sage/10 shadow-sm" />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Comments & Community Socials */}
              <div className="md:col-span-2 flex flex-col justify-between h-[60vh] max-h-[500px] border-t md:border-t-0 md:border-l border-sage/10 pt-4 md:pt-0 md:pl-6 space-y-4">
                <div className="space-y-3 flex-1 flex flex-col min-h-0">
                  <span className="text-[9px] font-extrabold text-navy/40 uppercase tracking-wider block">Discussion Circle</span>

                  {/* Scrollable Comments */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {loadingComments ? (
                      <p className="text-[10px] text-navy/40 italic font-semibold">Reading conversations...</p>
                    ) : commentsList.length === 0 ? (
                      <p className="text-[10px] text-navy/40 italic font-semibold">Be the first to share a warm note...</p>
                    ) : (
                      commentsList.map((comm: any) => (
                        <div key={comm.id} className="p-3 bg-cream/20 rounded-2xl border border-sage/10 space-y-1">
                          <div className="flex justify-between items-center text-[9px] font-extrabold">
                            <span className="text-warm-brown">{comm.profiles?.full_name || 'Reader'}</span>
                            <span className="text-navy/35">{getRelativeTime(comm.created_at)}</span>
                          </div>
                          <p className="text-[11px] font-semibold text-navy/70 leading-relaxed">
                            {comm.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Input box and buttons */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Write a cozy comment..."
                      value={newCommentContent}
                      onChange={(e) => setNewCommentContent(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-sage/30 bg-cream/10 text-[11px] font-semibold focus:bg-white focus:outline-none transition-all"
                    />
                    <button
                      onClick={handlePostComment}
                      className="px-3 bg-warm-brown text-cream hover:bg-navy rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                    >
                      Post
                    </button>
                  </div>

                  {/* Social Like trigger inside details */}
                  <div className="flex justify-between items-center text-xs text-navy/45 border-t border-sage/10 pt-3">
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-sage" />
                      <span className="text-[10px] font-bold text-warm-brown">{selectedReview.profiles?.full_name || 'Reader'}</span>
                    </div>

                    <button
                      onClick={(e) => handleLikeToggle(selectedReview.id, e)}
                      className={`flex items-center gap-1 font-bold text-[10px] ${
                        selectedReview.liked_by_me ? 'text-coral' : 'text-navy/40'
                      }`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${selectedReview.liked_by_me ? 'fill-coral' : ''}`} />
                      <span>{selectedReview.likes_count}</span>
                    </button>
                  </div>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}
