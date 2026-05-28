'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Search,
  Plus,
  BookOpen,
  MapPin,
  MessageSquare,
  User,
  Check,
  X,
  ChevronRight,
  Info,
  Calendar,
  AlertCircle,
  ThumbsUp,
  Tag,
  Briefcase,
  Sparkles,
  Users
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import confetti from 'canvas-confetti'


// Cozy fallback available listings
const mockLendListings = [
  {
    id: 'mock-lend-1',
    book_title: 'A Court of Thorns and Roses',
    book_author: 'Sarah J. Maas',
    book_cover_url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400',
    condition: 'Like New',
    city: 'Boston',
    notes: 'Absolutely loved this book! Looking to share the magic with a neighbor. Happy to lend for up to a month.',
    status: 'Available',
    profiles: {
      full_name: 'Clara Oswald',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120'
    },
    user_id: 'mock-user-1',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'mock-lend-2',
    book_title: 'The Alchemist',
    book_author: 'Paulo Coelho',
    book_cover_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400',
    condition: 'Good',
    city: 'San Francisco',
    notes: 'A quick, inspiring read. Has some highlighted passages and a cozy feel. Keep it as long as you need.',
    status: 'Available',
    profiles: {
      full_name: 'Arthur Dent',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'
    },
    user_id: 'mock-user-2',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString()
  }
]

export default function ExchangePage() {
  const router = useRouter()
  const supabase = createClient()

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userShelfBooks, setUserShelfBooks] = useState<any[]>([])

  // Tab State
  const [activeTab, setActiveTab] = useState<'browse' | 'lend'>('browse')

  // Listings state
  const [listings, setListings] = useState<any[]>([])
  const [userListings, setUserListings] = useState<any[]>([])
  const [borrowRequests, setBorrowRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [filterCondition, setFilterCondition] = useState('All')

  // Lend Form state
  const [selectedShelfBookId, setSelectedShelfBookId] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [customAuthor, setCustomAuthor] = useState('')
  const [customCoverUrl, setCustomCoverUrl] = useState('')
  const [listingCondition, setListingCondition] = useState<'New' | 'Like New' | 'Good' | 'Fair'>('Good')
  const [listingCity, setListingCity] = useState('')
  const [listingNotes, setListingNotes] = useState('')
  const [submittingLend, setSubmittingLend] = useState(false)

  // Borrow Request Modal State
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false)
  const [selectedListingForRequest, setSelectedListingForRequest] = useState<any>(null)
  const [borrowMessage, setBorrowMessage] = useState('Hi! I’d love to borrow this book. I can return it within 3 weeks.')
  const [submittingRequest, setSubmittingRequest] = useState(false)

  useEffect(() => {
    const fetchUserDataAndExchange = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setCurrentUser(session.user)

        // Fetch User profile to auto-fill city
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profile) {
          setUserProfile(profile)
          setListingCity(profile.city || '')
        }

        // Fetch user shelf books to pick for lending
        const { data: shelf } = await supabase
          .from('bookshelf')
          .select('*')
          .eq('user_id', session.user.id)
        
        if (shelf) {
          setUserShelfBooks(shelf)
        }
      }

      // Fetch all lend listings
      try {
        const { data: activeListings, error } = await supabase
          .from('lend_listings')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          setListings([])
        } else if (activeListings && activeListings.length > 0) {
          const userIds = Array.from(new Set(activeListings.map((l: any) => l.user_id)))
          const { data: dbProfiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds)

          const listingsWithProfiles = activeListings.map((l: any) => ({
            ...l,
            profiles: dbProfiles?.find((p: any) => p.id === l.user_id) || {
              full_name: 'Cozy Reader',
              avatar_url: null
            }
          }))

          setListings(listingsWithProfiles)
        } else {
          setListings([])
        }
      } catch (err) {
        setListings([])
      }

      // Fetch user's own listings if authenticated
      if (session) {
        try {
          const { data: myLends } = await supabase
            .from('lend_listings')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })

          if (myLends) {
            setUserListings(myLends)
          }

          // Fetch borrow requests relating to user's listings OR sent by user
          const { data: requests } = await supabase
            .from('borrow_requests')
            .select('*, borrower:profiles!borrower_id(full_name, avatar_url), listing:lend_listings(*)')
            .order('created_at', { ascending: false })

          if (requests) {
            setBorrowRequests(requests)
          }
        } catch (err) {
          console.error(err)
        }
      }

      setLoading(false)
    }

    fetchUserDataAndExchange()
  }, [supabase])

  // Post Lending Listing
  const handlePostListing = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) {
      toast.error('Please log in to lend books!')
      router.push('/login')
      return
    }

    let finalTitle = customTitle
    let finalAuthor = customAuthor
    let finalCoverUrl = customCoverUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400'

    // If picked from shelf
    if (selectedShelfBookId) {
      const matchingBook = userShelfBooks.find((b) => b.id === selectedShelfBookId)
      if (matchingBook) {
        finalTitle = matchingBook.book_title
        finalAuthor = matchingBook.book_author
        finalCoverUrl = matchingBook.book_cover_url
      }
    }

    if (!finalTitle.trim()) {
      toast.error('Please select or specify a book title!')
      return
    }
    if (!listingCity.trim()) {
      toast.error('Please specify a neighborhood city for swap!')
      return
    }

    setSubmittingLend(true)
    try {
      const payload = {
        user_id: currentUser.id,
        book_title: finalTitle,
        book_author: finalAuthor,
        book_cover_url: finalCoverUrl,
        condition: listingCondition,
        city: listingCity,
        notes: listingNotes,
        status: 'Available'
      }

      const { data, error } = await supabase
        .from('lend_listings')
        .insert(payload)
        .select('*')
        .single()

      if (error) {
        toast.error('Failed to publish listing.')
        return
      }

      // Fetch user profile separately
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', currentUser.id)
        .single()

      const mappedListing = {
        ...data,
        profiles: userProfile || {
          full_name: currentUser.user_metadata?.full_name || 'Reader',
          avatar_url: null
        }
      }

      toast.success(`"${payload.book_title}" is now available for swap!`)
      setListings([mappedListing, ...listings])
      setUserListings([mappedListing, ...userListings])
      
      // Clear form
      setSelectedShelfBookId('')
      setCustomTitle('')
      setCustomAuthor('')
      setCustomCoverUrl('')
      setListingNotes('')
      setActiveTab('browse')
    } catch (err) {
      toast.error('An unexpected error occurred.')
    } finally {
      setSubmittingLend(false)
    }
  }

  // Open Borrow Modal
  const handleOpenBorrowModal = (listing: any) => {
    if (!currentUser) {
      toast.error('Please sign in to request a borrow swap!')
      router.push('/login')
      return
    }
    if (listing.user_id === currentUser.id) {
      toast.error('You cannot borrow your own listed book!')
      return
    }
    setSelectedListingForRequest(listing)
    setBorrowMessage('Hi! I’d love to borrow this book. I can return it within 3 weeks.')
    setIsBorrowModalOpen(true)
  }

  // Send Borrow Request
  const handleSendBorrowRequest = async () => {
    if (!borrowMessage.trim()) {
      toast.error('Please write a quick note to the lender!')
      return
    }

    setSubmittingRequest(true)
    try {
      if (selectedListingForRequest.is_mock) {
        toast.success(`Mock request sent to ${selectedListingForRequest.profiles.full_name}!`)
        setIsBorrowModalOpen(false)
        setSelectedListingForRequest(null)
        return
      }

      const payload = {
        borrower_id: currentUser.id,
        listing_id: selectedListingForRequest.id,
        message: borrowMessage,
        status: 'Pending'
      }

      const { data, error } = await supabase
        .from('borrow_requests')
        .insert(payload)
        .select('*, borrower:profiles!borrower_id(full_name, avatar_url), listing:lend_listings(*)')
        .single()

      if (error) {
        toast.error('Unable to send request.')
        return
      }

      toast.success('Your borrow request has been sent! Lenders will reply shortly.')
      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.6 }
      })
      setBorrowRequests([data, ...borrowRequests])
      setIsBorrowModalOpen(false)
      setSelectedListingForRequest(null)
    } catch (err) {
      toast.error('An error occurred while sending requests.')
    } finally {
      setSubmittingRequest(false)
    }
  }

  // Handle Request Status update (Approve/Reject)
  const handleUpdateRequestStatus = async (reqId: string, newStatus: 'Approved' | 'Rejected', listingId: string) => {
    try {
      const { error } = await supabase
        .from('borrow_requests')
        .update({ status: newStatus })
        .eq('id', reqId)

      if (error) {
        toast.error('Could not update request status.')
        return
      }

      // If approved, mark listing as Borrowed
      if (newStatus === 'Approved') {
        await supabase
          .from('lend_listings')
          .update({ status: 'Borrowed' })
          .eq('id', listingId)

        setListings(listings.map((l) => (l.id === listingId ? { ...l, status: 'Borrowed' } : l)))
        setUserListings(userListings.map((l) => (l.id === listingId ? { ...l, status: 'Borrowed' } : l)))
      }

      setBorrowRequests(borrowRequests.map((r) => (r.id === reqId ? { ...r, status: newStatus } : r)))
      toast.success(`Request has been ${newStatus.toLowerCase()}!`)
    } catch (err) {
      toast.error('Could not complete action.')
    }
  }

  // Delete Listing
  const handleDeleteListing = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lend_listings')
        .delete()
        .eq('id', id)

      if (error) {
        toast.error('Failed to remove listing.')
        return
      }

      toast.success('Lend listing removed.')
      setListings(listings.filter((l) => l.id !== id))
      setUserListings(userListings.filter((l) => l.id !== id))
    } catch (err) {
      toast.error('An error occurred.')
    }
  }

  // Filters
  const filteredListings = listings.filter((l) => {
    const matchesSearch = l.book_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          l.book_author.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCity = !filterCity || l.city.toLowerCase().includes(filterCity.toLowerCase())
    const matchesCondition = filterCondition === 'All' || l.condition === filterCondition
    const isAvailable = l.status === 'Available'
    return matchesSearch && matchesCity && matchesCondition && isAvailable
  })

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
            <Users className="h-8 w-8 text-coral animate-pulse" />
            <span>Community Book Exchange</span>
          </h1>
          <p className="text-sm font-semibold text-navy/60">
            Share physical stories with neighboring bookworms, set borrow boundaries, and browse available reads.
          </p>
        </div>

        {/* Action Tabs selector */}
        <div className="flex items-center gap-2 bg-white/40 p-1.5 rounded-2xl border border-sage/20">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'browse'
                ? 'bg-warm-brown text-cream shadow-sm'
                : 'text-warm-brown/70 hover:bg-butter/25 hover:text-warm-brown'
            }`}
          >
            Browse Available Books
          </button>
          <button
            onClick={() => setActiveTab('lend')}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'lend'
                ? 'bg-warm-brown text-cream shadow-sm'
                : 'text-warm-brown/70 hover:bg-butter/25 hover:text-warm-brown'
            }`}
          >
            Lend a Book
          </button>
        </div>
      </div>

      {/* VIEW 1: BROWSE AVAILABLE SWAPS */}
      {activeTab === 'browse' && (
        <div className="space-y-8">
          
          {/* Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/60 p-4 rounded-2xl border border-sage/20 backdrop-blur-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/40" />
              <input
                type="text"
                placeholder="Search title, author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-sage/30 bg-white text-navy font-semibold text-xs focus:outline-none"
              />
            </div>
            
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/40" />
              <input
                type="text"
                placeholder="Search city/location..."
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-sage/30 bg-white text-navy font-semibold text-xs focus:outline-none"
              />
            </div>

            <div>
              <select
                value={filterCondition}
                onChange={(e) => setFilterCondition(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-sage/30 bg-white text-navy font-semibold text-xs focus:outline-none cursor-pointer"
              >
                <option value="All">All Conditions</option>
                <option value="New">New</option>
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>

            <div className="text-right flex items-center justify-end text-[10px] font-black text-navy/40">
              {filteredListings.length} swaps available in network
            </div>
          </div>

          {/* Listings Masonry Gallery */}
          {filteredListings.length === 0 ? (
            <div className="card-cozy bg-white/60 p-12 text-center max-w-lg mx-auto space-y-4">
              <div className="text-5xl">📍</div>
              <h3 className="font-playfair text-xl font-bold text-warm-brown">No swaps in your search parameters...</h3>
              <p className="text-xs text-navy/65 max-w-xs mx-auto leading-relaxed">
                Be the pioneer! Switch to the **Lend a Book** tab and share your first volume spine with neighbors.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredListings.map((listing) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -6, scale: 1.015 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  className="card-cozy bg-white border border-sage/15 p-5 flex flex-col justify-between gap-5 relative group hover:border-coral/25 transition-all"
                >
                  <div className="space-y-4">
                    
                    {/* Condition badge */}
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-butter text-warm-brown text-[8px] font-black uppercase border border-warm-brown/10 z-10 flex items-center gap-1">
                      <Sparkles className="h-2 w-2 text-coral" />
                      <span>{listing.condition}</span>
                    </span>

                    <div className="flex gap-4">
                      {/* Cover aspect ratio */}
                      <div className="w-18 h-26 rounded-lg overflow-hidden shadow-sm border border-sage/10 relative">
                        <img src={listing.book_cover_url} alt={listing.book_title} className="h-full w-full object-cover" />
                      </div>

                      <div className="min-w-0 space-y-1">
                        <h4 className="font-playfair text-xs font-black text-warm-brown truncate leading-tight group-hover:text-coral transition-colors">
                          {listing.book_title}
                        </h4>
                        <p className="text-[10px] font-bold text-navy/45 truncate">
                          by {listing.book_author}
                        </p>

                        <div className="flex items-center gap-1 text-[9px] font-black text-navy/60 pt-2">
                          <MapPin className="h-3 w-3 text-coral" />
                          <span>{listing.city}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] font-semibold text-navy/65 leading-relaxed bg-cream/15 p-2.5 rounded-xl italic">
                      "{listing.notes || 'No message left from owner.'}"
                    </p>
                  </div>

                  {/* Owner avatar & Request actions */}
                  <div className="flex items-center justify-between border-t border-sage/5 pt-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={listing.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
                        alt={listing.profiles?.full_name}
                        className="h-6 w-6 rounded-full object-cover border border-sage/20"
                      />
                      <div className="min-w-0 leading-none">
                        <h5 className="text-[8px] font-black text-warm-brown truncate">{listing.profiles?.full_name}</h5>
                        <span className="text-[6.5px] font-bold text-navy/40">Member 2026</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenBorrowModal(listing)}
                      className="btn-cozy btn-cozy-primary text-[9px] px-3.5 py-1.8 font-black shadow-sm cursor-pointer"
                    >
                      Request Borrow
                    </button>
                  </div>

                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: LEND A BOOK & ACTIVE LISTINGS PANEL */}
      {activeTab === 'lend' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1: Lending listing Form */}
          <div className="card-cozy bg-white/70 border border-sage/15 p-6 space-y-6 h-fit">
            <div className="flex items-center gap-2 border-b border-sage/10 pb-4">
              <Plus className="h-5 w-5 text-coral" />
              <h2 className="font-playfair text-base font-black text-warm-brown">
                Lend a New Story
              </h2>
            </div>

            <form onSubmit={handlePostListing} className="space-y-4">
              
              {/* Select from shelf */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-warm-brown block">Select from Shelf</label>
                {userShelfBooks.length > 0 ? (
                  <select
                    value={selectedShelfBookId}
                    onChange={(e) => {
                      setSelectedShelfBookId(e.target.value)
                      if (e.target.value !== '') {
                        setCustomTitle('')
                        setCustomAuthor('')
                        setCustomCoverUrl('')
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-sage/30 bg-white text-navy font-semibold text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Or enter custom details below --</option>
                    {userShelfBooks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.book_title} (by {b.book_author})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-[9px] text-navy/40 font-bold block bg-cream/20 p-2 rounded-lg italic">
                    Your shelf is empty! Enter book details manually below.
                  </span>
                )}
              </div>

              {/* Custom input fields */}
              {!selectedShelfBookId && (
                <div className="space-y-3 p-3 rounded-2xl bg-cream/20 border border-sage/10 space-y-2">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase text-navy/40 block">Book Title</label>
                    <input
                      type="text"
                      placeholder="e.g. The Alchemist"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-sage/20 bg-white text-navy font-semibold text-xs focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase text-navy/40 block">Book Author</label>
                    <input
                      type="text"
                      placeholder="e.g. Paulo Coelho"
                      value={customAuthor}
                      onChange={(e) => setCustomAuthor(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-sage/20 bg-white text-navy font-semibold text-xs focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase text-navy/40 block">Cover Image URL (Optional)</label>
                    <input
                      type="text"
                      placeholder="Paste cover URL..."
                      value={customCoverUrl}
                      onChange={(e) => setCustomCoverUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-sage/20 bg-white text-navy font-semibold text-xs focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Condition dropdown */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-warm-brown block">Book Condition</label>
                <select
                  value={listingCondition}
                  onChange={(e: any) => setListingCondition(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-sage/30 bg-white text-navy font-semibold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="New">New (Unread, absolute mint)</option>
                  <option value="Like New">Like New (Read once, flawless)</option>
                  <option value="Good">Good (Minor shelf wear)</option>
                  <option value="Fair">Fair (Very readable, well-loved)</option>
                </select>
              </div>

              {/* Neighborhood Location */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-warm-brown block">Lend Neighborhood (City)</label>
                <input
                  type="text"
                  placeholder="e.g. Boston"
                  value={listingCity}
                  onChange={(e) => setListingCity(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-sage/30 bg-white text-navy font-semibold text-xs focus:outline-none"
                />
              </div>

              {/* Message / boundary parameters */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-warm-brown block">Lender Notes & Guidelines</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Happy to lend for up to a month! Can drop off in city park center."
                  value={listingNotes}
                  onChange={(e) => setListingNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-sage/30 bg-white text-navy font-semibold text-xs focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={submittingLend}
                className="btn-cozy btn-cozy-primary w-full py-3.5 text-xs font-bold shadow-sm"
              >
                {submittingLend ? 'Publishing listing...' : 'Post Swap Listing'}
              </button>

            </form>
          </div>

          {/* Columns 2 & 3: User active listings & swap requests list */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Active listings manager */}
            <div className="space-y-4">
              <h3 className="font-playfair text-lg font-bold text-warm-brown">My Lending Catalog</h3>
              {userListings.length === 0 ? (
                <div className="bg-white/40 border border-dashed border-sage/20 p-6 rounded-2xl text-center text-xs font-bold text-navy/40">
                  You haven't listed any books for loan yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userListings.map((l) => (
                    <div
                      key={l.id}
                      className="flex gap-4 p-4 bg-white rounded-2xl border border-sage/15 relative overflow-hidden group"
                    >
                      <img src={l.book_cover_url} alt={l.book_title} className="h-16 w-11 object-cover rounded shadow-sm" />
                      
                      <div className="min-w-0 space-y-1.5">
                        <div>
                          <h4 className="font-playfair text-xs font-black text-warm-brown truncate leading-tight">{l.book_title}</h4>
                          <p className="text-[9px] font-bold text-navy/40 truncate">by {l.book_author}</p>
                        </div>

                        <div className="flex gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                            l.status === 'Available' ? 'bg-sage/15 text-sage' : 'bg-butter text-warm-brown'
                          }`}>
                            {l.status}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-cream text-warm-brown/60 text-[8px] font-black uppercase border">
                            {l.condition}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteListing(l.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg text-coral/45 hover:text-coral hover:bg-coral/5 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Swap requests manager inbox */}
            <div className="space-y-4 border-t border-sage/10 pt-6">
              <h3 className="font-playfair text-lg font-bold text-warm-brown">Exchange Swap Inbox</h3>
              {borrowRequests.length === 0 ? (
                <div className="bg-white/40 border border-dashed border-sage/20 p-6 rounded-2xl text-center text-xs font-bold text-navy/40">
                  No incoming or outgoing borrow requests recorded.
                </div>
              ) : (
                <div className="space-y-3">
                  {borrowRequests.map((req) => {
                    const isIncoming = req.listing?.user_id === currentUser?.id
                    
                    return (
                      <div
                        key={req.id}
                        className="card-cozy bg-white border border-sage/15 p-5 space-y-4 relative overflow-hidden"
                      >
                        {/* Heading */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-3">
                            {/* Visual indicator */}
                            <img src={req.listing?.book_cover_url} alt="Cover" className="h-12 w-8 object-cover rounded shadow-sm" />
                            <div className="min-w-0">
                              <span className={`text-[8px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${
                                isIncoming ? 'bg-coral/10 text-coral' : 'bg-navy/10 text-navy'
                              }`}>
                                {isIncoming ? '📥 Incoming Borrow request' : '📤 Outgoing Sent request'}
                              </span>
                              <h4 className="font-playfair text-xs font-black text-warm-brown truncate leading-tight pt-1">
                                {req.listing?.book_title}
                              </h4>
                            </div>
                          </div>

                          {/* Request Status */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            req.status === 'Pending' ? 'bg-butter text-warm-brown' :
                            req.status === 'Approved' ? 'bg-sage text-white shadow-sm' :
                            'bg-coral/20 text-coral'
                          }`}>
                            {req.status}
                          </span>
                        </div>

                        {/* Request content notes */}
                        <p className="text-[10px] font-semibold text-navy/70 leading-relaxed italic bg-cream/25 p-3 rounded-2xl">
                          "{req.message}"
                        </p>

                        {/* Interactive response controls for Lenders */}
                        {isIncoming && req.status === 'Pending' && (
                          <div className="flex items-center justify-between border-t border-sage/5 pt-3.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={req.borrower?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
                                alt="Borrower"
                                className="h-6 w-6 rounded-full object-cover border"
                              />
                              <div className="min-w-0 leading-none">
                                <h5 className="text-[8px] font-black text-warm-brown truncate">{req.borrower?.full_name}</h5>
                                <span className="text-[6.5px] font-bold text-navy/40">Neighborhood Swapper</span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateRequestStatus(req.id, 'Approved', req.listing_id)}
                                className="px-3.5 py-1.8 rounded-lg bg-sage hover:bg-sage/95 text-white text-[9.5px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                              >
                                <Check className="h-3 w-3" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleUpdateRequestStatus(req.id, 'Rejected', req.listing_id)}
                                className="px-3.5 py-1.8 rounded-lg bg-coral hover:bg-coral/95 text-cream text-[9.5px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                              >
                                <X className="h-3 w-3" />
                                <span>Decline</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* BORROW REQUEST CREATOR MODAL */}
      <AnimatePresence>
        {isBorrowModalOpen && selectedListingForRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card-cozy bg-white max-w-xl w-full p-8 space-y-6 relative max-h-[85vh] overflow-y-auto"
            >
              {/* Close */}
              <button onClick={() => {
                setIsBorrowModalOpen(false)
                setSelectedListingForRequest(null)
              }} className="absolute top-4 right-4 text-navy/40 hover:text-navy cursor-pointer">
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 border-b border-sage/10 pb-4">
                <MessageSquare className="h-5 w-5 text-coral" />
                <h2 className="font-playfair text-xl font-bold text-warm-brown">
                  Send Borrow Request
                </h2>
              </div>

              {/* Book Info row */}
              <div className="flex gap-4 p-3 rounded-2xl bg-cream/30 border border-sage/10">
                <img src={selectedListingForRequest.book_cover_url} alt="Cover" className="h-16 w-11 object-cover rounded shadow-sm" />
                
                <div className="min-w-0 space-y-1">
                  <h4 className="font-playfair text-xs font-black text-warm-brown truncate leading-tight pt-1">
                    {selectedListingForRequest.book_title}
                  </h4>
                  <p className="text-[10px] font-bold text-navy/45 truncate">by {selectedListingForRequest.book_author}</p>
                  
                  <div className="flex items-center gap-1 text-[8.5px] font-bold text-navy/60 pt-1">
                    <MapPin className="h-3 w-3 text-coral" />
                    <span>Lend location: **{selectedListingForRequest.city}**</span>
                  </div>
                </div>
              </div>

              {/* Message text area */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-warm-brown block">Write Message to Lender</label>
                <textarea
                  rows={3}
                  value={borrowMessage}
                  onChange={(e) => setBorrowMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-sage/30 bg-cream/15 focus:bg-white text-navy font-semibold text-sm transition-all focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Info panel */}
              <div className="p-3.5 rounded-2xl bg-butter/20 border border-butter/30 flex gap-2.5 text-warm-brown text-[11px] leading-relaxed font-semibold">
                <Info className="h-4.5 w-4.5 text-coral flex-shrink-0 mt-0.5" />
                <span>
                  By sending this request, you agree to coordinate a friendly hand-off and treat the lender's book with total respect.
                </span>
              </div>

              <button
                onClick={handleSendBorrowRequest}
                disabled={submittingRequest}
                className="btn-cozy btn-cozy-primary w-full py-4 text-xs font-bold"
              >
                {submittingRequest ? 'Sending request to neighbor...' : 'Send Borrow Request'}
              </button>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}
