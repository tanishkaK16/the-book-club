'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  User,
  MapPin,
  Calendar,
  BookOpen,
  Users,
  Star,
  Settings,
  Heart,
  MessageSquare,
  Edit3,
  X,
  Plus,
  Bookmark,
  Sparkles,
  Camera,
  Award,
  ChevronRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface PageProps {
  params: Promise<{ username: string }>
}

// Fallback profiles
const fallbackProfiles: { [key: string]: any } = {
  'clara': {
    id: 'mock-user-1',
    full_name: 'Clara Oswald',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    bio: 'Traveler of time and pages. Cozy fantasy nerd and full-time tea brewer.',
    genres: ['Fantasy', 'Romance', 'Found Family'],
    city: 'Boston',
    books_read: 24,
    followers: 142,
    following: 98,
    reviews_count: 5,
    is_mock: true
  },
  'arthur': {
    id: 'mock-user-2',
    full_name: 'Arthur Dent',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
    bio: 'Just trying to find a decent cup of tea. Sci-Fi enthusiast and occasional towel collector.',
    genres: ['Sci-Fi', 'Non-fiction', 'Atmospheric'],
    city: 'San Francisco',
    books_read: 12,
    followers: 89,
    following: 110,
    reviews_count: 2,
    is_mock: true
  }
}

const genresList = ['Fantasy', 'Romance', 'Mystery', 'Literary Fiction', 'Non-fiction', 'Sci-Fi', 'Thriller', 'Cozy', 'Slow-burn', 'Atmospheric']

export default function ProfilePage({ params }: PageProps) {
  const router = useRouter()
  const supabase = createClient()
  const { username } = use(params)

  const [currentUser, setCurrentUser] = useState<any>(null)
  
  // Profile states
  const [profile, setProfile] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [shelfBooks, setShelfBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Follow states
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editGenres, setEditGenres] = useState<string[]>([])
  const [editAvatarUrl, setEditAvatarUrl] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [submittingEdit, setSubmittingEdit] = useState(false)

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'reviews' | 'shelf'>('reviews')

  useEffect(() => {
    const fetchProfileAndData = async () => {
      setLoading(true)

      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setCurrentUser(session.user)
      }

      // 1. Try fetching live profile from Supabase by full_name or id
      try {
        let dbProfile = null
        
        // If username is a UUID (user ID)
        const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(username)
        
        if (isUUID) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', username)
            .single()
          dbProfile = data
        } else {
          // Try searching by name slug
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .ilike('full_name', username.replace('-', ' '))
            .limit(1)
          
          if (data && data.length > 0) {
            dbProfile = data[0]
          }
        }

        // If not found in DB, try using fallback profiles
        if (!dbProfile) {
          const cleaned = username.toLowerCase()
          if (fallbackProfiles[cleaned]) {
            dbProfile = fallbackProfiles[cleaned]
          } else if (session && session.user.id === username) {
            // Self profile backup
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            dbProfile = data
          } else {
            // Default empty profile
            dbProfile = {
              id: username,
              full_name: username.replace('-', ' '),
              avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
              bio: 'A quiet reader joining the Slow Reading Circle.',
              genres: ['Cozy'],
              city: 'Somewhere',
              books_read: 0,
              followers: 0,
              following: 0,
              reviews_count: 0
            }
          }
        }

        setProfile(dbProfile)
        setEditName(dbProfile.full_name || '')
        setEditBio(dbProfile.bio || '')
        setEditCity(dbProfile.city || '')
        setEditGenres(dbProfile.genres || [])
        setEditAvatarUrl(dbProfile.avatar_url || '')

        // 2. Fetch follow status and follower counts
        if (dbProfile && !dbProfile.is_mock) {
          // Fetch followers count
          const { count: followers } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', dbProfile.id)
          
          setFollowersCount(followers || 0)

          // Check if current user is following this profile
          if (session && session.user.id !== dbProfile.id) {
            const { data: followRow } = await supabase
              .from('follows')
              .select('*')
              .eq('follower_id', session.user.id)
              .eq('following_id', dbProfile.id)
              .maybeSingle()

            setIsFollowing(!!followRow)
          }
        } else {
          setFollowersCount(dbProfile.followers || 0)
        }

        // 3. Fetch reviews posted by this user
        if (dbProfile && !dbProfile.is_mock) {
          const { data: userReviews } = await supabase
            .from('reviews')
            .select('*')
            .eq('user_id', dbProfile.id)
            .order('created_at', { ascending: false })

          if (userReviews) {
            setReviews(userReviews)
          }

          // Fetch shelf preview
          const { data: shelf } = await supabase
            .from('bookshelf')
            .select('*')
            .eq('user_id', dbProfile.id)
            .limit(8)
          
          if (shelf) {
            setShelfBooks(shelf)
          }
        } else {
          // Mock reviews & shelf preview
          setReviews([])
          setShelfBooks([])
        }

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfileAndData()
  }, [username, supabase])

  // Follow / Unfollow toggle (Optimistic)
  const handleFollowToggle = async () => {
    if (!currentUser) {
      toast.error('Please log in to follow other readers!')
      router.push('/login')
      return
    }

    const previousFollowState = isFollowing
    const previousFollowersCount = followersCount

    // Optimistic UI updates
    setIsFollowing(!isFollowing)
    setFollowersCount(isFollowing ? followersCount - 1 : followersCount + 1)

    try {
      if (profile.is_mock) {
        toast.success(`You are now following ${profile.full_name}!`)
        return
      }

      if (previousFollowState) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', profile.id)

        if (error) throw error
        toast.success(`Stopped following ${profile.full_name}`)
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: currentUser.id, following_id: profile.id })

        if (error) throw error
        toast.success(`You followed ${profile.full_name}! ✨`)
      }
    } catch (err) {
      // Revert states
      setIsFollowing(previousFollowState)
      setFollowersCount(previousFollowersCount)
      toast.error('Could not complete following sync request.')
    }
  }

  // Handle avatar local file upload & conversion to Base64
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Cozy photo is too large! Please choose an image smaller than 2MB.')
      return
    }

    setUploadingAvatar(true)
    const reader = new FileReader()
    reader.onloadend = () => {
      setEditAvatarUrl(reader.result as string)
      setUploadingAvatar(false)
      toast.success('Your profile picture preview has been updated! ✨')
    }
    reader.readAsDataURL(file)
  }

  // Update profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || currentUser.id !== profile.id) return

    setSubmittingEdit(true)
    try {
      const payload = {
        full_name: editName,
        bio: editBio,
        city: editCity,
        genres: editGenres,
        avatar_url: editAvatarUrl,
        onboarded: true,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', currentUser.id)

      if (error) {
        toast.error('Failed to save profile.')
        return
      }

      toast.success('Your cozy profile details have been saved!')
      setProfile({ ...profile, ...payload })
      setIsEditModalOpen(false)
    } catch (err) {
      toast.error('An unexpected error occurred.')
    } finally {
      setSubmittingEdit(false)
    }
  }

  // Genre selection toggles
  const toggleGenreSelection = (genre: string) => {
    if (editGenres.includes(genre)) {
      setEditGenres(editGenres.filter((g) => g !== genre))
    } else {
      setEditGenres([...editGenres, genre])
    }
  }

  if (loading) {
    return (
      <div className="space-y-10 max-w-5xl mx-auto pb-16 animate-pulse">
        {/* Skeleton Header Banner */}
        <div className="card-cozy bg-white/60 p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-center justify-between">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="h-24 w-24 rounded-full bg-sage/15" />
            <div className="space-y-3">
              <div className="h-8 w-48 bg-warm-brown/10 rounded-xl" />
              <div className="h-4 w-32 bg-navy/10 rounded-lg" />
              <div className="h-3 w-64 bg-sage/5 rounded-lg" />
            </div>
          </div>
          <div className="h-10 w-28 bg-sage/15 rounded-xl" />
        </div>

        {/* Skeleton Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-cozy bg-cream/10 p-4 text-center space-y-2">
              <div className="h-4 w-12 bg-warm-brown/10 mx-auto rounded" />
              <div className="h-3 w-20 bg-navy/10 mx-auto rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-16 space-y-4 max-w-sm mx-auto">
        <h2 className="font-playfair text-xl font-bold text-warm-brown">Reader Room Not Found</h2>
        <p className="text-xs text-navy/60 leading-relaxed">The reading sanctuary you are searching for is quiet or has dissolved.</p>
        <button onClick={() => router.push('/feed')} className="btn-cozy btn-cozy-outline text-xs px-5 py-2">Back to Circle Feed</button>
      </div>
    )
  }

  const isOwnProfile = currentUser && currentUser.id === profile.id

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: 'easeOut' }}
      className="space-y-10 max-w-5xl mx-auto pb-16"
    >
      
      {/* 1. Profile Banner & Card details */}
      <div className="card-cozy bg-white/70 border border-sage/15 p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-center justify-between relative overflow-hidden">
        
        {/* Soft corner border details */}
        <div className="absolute top-2 left-2 h-4 w-4 border-t border-l border-warm-brown/20" />
        <div className="absolute top-2 right-2 h-4 w-4 border-t border-r border-warm-brown/20" />

        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          {/* Large Avatar */}
          <div className="relative h-24 w-24 md:h-28 md:w-28 rounded-full overflow-hidden border-2 border-coral shadow">
            <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
          </div>

          <div className="space-y-3 min-w-0">
            <div>
              <h1 className="font-playfair text-2xl md:text-3xl font-extrabold text-warm-brown flex items-center justify-center md:justify-start gap-2">
                <span>{profile.full_name}</span>
                {profile.is_mock && <Award className="h-5 w-5 text-coral animate-pulse" />}
              </h1>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-[10px] font-bold text-navy/55 pt-1.5">
                {profile.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-coral" />
                    <span>{profile.city}</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-sage" />
                  <span>Reader since 2026</span>
                </span>
              </div>
            </div>

            {/* Bio */}
            <p className="text-xs text-navy/65 max-w-md leading-relaxed font-semibold italic">
              "{profile.bio || 'This reader has not penned a biography bio yet.'}"
            </p>

            {/* Genres Chips */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-1">
              {profile.genres?.map((g: string, i: number) => (
                <span key={i} className="px-2.5 py-0.5 rounded-full bg-primary-pink text-[8px] font-black text-warm-brown uppercase tracking-wider">
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action button panel */}
        <div className="flex flex-col items-center justify-center gap-4">
          {isOwnProfile ? (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="btn-cozy btn-cozy-outline text-xs px-5 py-3.5 flex items-center justify-center gap-2 cursor-pointer shadow-sm w-full"
            >
              <Settings className="h-4 w-4" />
              <span>Edit Reading Room</span>
            </button>
          ) : (
            <div className="flex gap-2 w-full">
              <button
                onClick={handleFollowToggle}
                className={`btn-cozy text-xs px-4 py-3.5 flex items-center justify-center gap-2 cursor-pointer shadow flex-1 transition-all ${
                  isFollowing
                    ? 'bg-sage text-cream border border-sage'
                    : 'bg-warm-brown hover:bg-warm-brown/95 text-cream'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>{isFollowing ? 'Following' : 'Follow'}</span>
              </button>
              
              <button
                onClick={() => router.push(`/messages?user=${profile.id}`)}
                className="btn-cozy btn-cozy-outline text-xs px-4 py-3.5 flex items-center justify-center gap-2 cursor-pointer shadow-sm flex-1 bg-white hover:bg-cream/45 text-warm-brown border border-warm-brown/15 transition-all"
              >
                <MessageSquare className="h-4 w-4 text-coral" />
                <span>Message</span>
              </button>
            </div>
          )}

          {/* Stats quick overview metrics */}
          <div className="grid grid-cols-4 gap-4 border-t border-sage/5 pt-4 text-center w-full min-w-[240px]">
            <div>
              <span className="block text-sm font-black text-warm-brown">{profile.books_read || shelfBooks.length}</span>
              <span className="text-[7.5px] font-black uppercase text-navy/40">Readings</span>
            </div>
            <div>
              <span className="block text-sm font-black text-warm-brown">{followersCount}</span>
              <span className="text-[7.5px] font-black uppercase text-navy/40">Followers</span>
            </div>
            <div>
              <span className="block text-sm font-black text-warm-brown">{profile.following || 0}</span>
              <span className="text-[7.5px] font-black uppercase text-navy/40">Following</span>
            </div>
            <div>
              <span className="block text-sm font-black text-warm-brown">{reviews.length}</span>
              <span className="text-[7.5px] font-black uppercase text-navy/40">Reviews</span>
            </div>
          </div>
        </div>

      </div>

      {/* Tab Selectors */}
      <div className="flex items-center gap-2 bg-white/40 p-1.5 rounded-2xl border border-sage/20 max-w-xs">
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'reviews'
              ? 'bg-warm-brown text-cream shadow-sm'
              : 'text-warm-brown/70 hover:bg-butter/25 hover:text-warm-brown'
          }`}
        >
          <Edit3 className="h-3.5 w-3.5" />
          <span>Reviews Posted</span>
        </button>
        <button
          onClick={() => setActiveTab('shelf')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'shelf'
              ? 'bg-warm-brown text-cream shadow-sm'
              : 'text-warm-brown/70 hover:bg-butter/25 hover:text-warm-brown'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Shelf Spines</span>
        </button>
      </div>

      {/* VIEW SECTION */}
      <div className="space-y-6">
        
        {/* TAB 1: REVIEWS POSTED */}
        {activeTab === 'reviews' && (
          reviews.length === 0 ? (
            <div className="bg-white/40 border border-dashed border-sage/25 p-12 rounded-3xl text-center text-xs font-bold text-navy/40">
              No review summaries posted yet in this reading room.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((rev) => (
                <motion.div
                  key={rev.id}
                  whileHover={{ y: -5, scale: 1.015 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="card-cozy bg-white border border-sage/15 p-5 space-y-4 relative group"
                >
                  <div className="flex gap-4">
                    <img src={rev.book_cover_url} alt={rev.book_title} className="h-16 w-11 object-cover rounded shadow-sm" />
                    
                    <div className="min-w-0 space-y-1">
                      <h4 className="font-playfair text-xs font-black text-warm-brown truncate leading-tight">{rev.book_title}</h4>
                      <p className="text-[9px] font-bold text-navy/40 truncate">by {rev.book_author}</p>
                      
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

                  <p className="text-[10px] font-semibold text-navy/65 leading-relaxed italic bg-cream/15 p-3 rounded-2xl">
                    "{rev.loved}"
                  </p>

                  <div className="flex items-center justify-between border-t border-sage/5 pt-2.5 text-[8.5px] font-bold text-navy/40">
                    <span>{new Date(rev.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-2">
                      <span className="flex items-center gap-0.5 text-coral">
                        <Heart className="h-2.5 w-2.5 fill-coral" />
                        <span>{rev.likes_count}</span>
                      </span>
                      <span className="flex items-center gap-0.5 text-sage">
                        <MessageSquare className="h-2.5 w-2.5 fill-sage/10" />
                        <span>{rev.comments_count}</span>
                      </span>
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}

        {/* TAB 2: SHELF PREVIEW */}
        {activeTab === 'shelf' && (
          shelfBooks.length === 0 ? (
            <div className="bg-white/40 border border-dashed border-sage/25 p-12 rounded-3xl text-center text-xs font-bold text-navy/40">
              No volumes pinned to virtual bookshelf shelves yet.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {shelfBooks.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ y: -6, rotate: 1.2 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="group relative flex flex-col items-center gap-2 text-center cursor-pointer"
                  >
                    <div className="w-full aspect-[2/3] rounded-xl overflow-hidden shadow border border-sage/10 relative transform transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-lg bg-cream/35">
                      <img src={item.book_cover_url} alt={item.book_title} className="h-full w-full object-cover" />
                      
                      <span className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider ${
                        item.status === 'Read' ? 'bg-sage text-white' : 'bg-butter text-warm-brown border'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="w-full px-1 min-w-0">
                      <h5 className="font-playfair text-[9.5px] font-black text-warm-brown truncate leading-tight">{item.book_title}</h5>
                      <p className="text-[8px] font-bold text-navy/40 truncate">by {item.book_author}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {isOwnProfile && (
                <button
                  onClick={() => router.push('/shelf')}
                  className="btn-cozy btn-cozy-outline text-[10px] px-4 py-2 mt-4 flex items-center gap-1 mx-auto"
                >
                  <span>Go to My Full Library Shelf</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>
          )
        )}

      </div>

      {/* MODAL: EDIT PROFILE */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card-cozy bg-white max-w-xl w-full p-8 space-y-6 relative max-h-[85vh] overflow-y-auto"
            >
              {/* Close */}
              <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 text-navy/40 hover:text-navy cursor-pointer">
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 border-b border-sage/10 pb-4">
                <Settings className="h-5 w-5 text-coral" />
                <h2 className="font-playfair text-xl font-bold text-warm-brown">
                  Edit Room Profile
                </h2>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Profile Picture */}
                <div className="flex flex-col items-center justify-center space-y-2 border-b border-sage/10 pb-4">
                  <span className="text-[10px] font-black uppercase text-warm-brown block">Profile Room Picture</span>
                  <div className="relative group h-24 w-24 rounded-full overflow-hidden bg-cream border border-sage/20 shadow-inner flex items-center justify-center cursor-pointer">
                    {editAvatarUrl ? (
                      <img src={editAvatarUrl} alt="Avatar Preview" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <User className="h-10 w-10 text-navy/20" />
                    )}
                    
                    {/* Hover camera overlay */}
                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-black uppercase tracking-wider transition-opacity cursor-pointer">
                      <Camera className="h-4 w-4 mb-1" />
                      Change
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {uploadingAvatar && (
                    <span className="text-[9px] text-coral font-bold animate-pulse">Reading photo bytes...</span>
                  )}
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-warm-brown">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-sage/30 bg-cream/15 focus:bg-white text-navy font-semibold text-xs focus:outline-none"
                  />
                </div>

                {/* City */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-warm-brown">Neighborhood City</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-sage/30 bg-cream/15 focus:bg-white text-navy font-semibold text-xs focus:outline-none"
                  />
                </div>

                {/* Bio */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-warm-brown block">Biography Message</label>
                  <textarea
                    rows={3}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-sage/30 bg-cream/15 focus:bg-white text-navy font-semibold text-xs focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Favorite genres selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-warm-brown block">Favorite Genres (Chips)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {genresList.map((g) => {
                      const isSel = editGenres.includes(g)
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => toggleGenreSelection(g)}
                          className={`px-3 py-1.5 rounded-full text-[9px] font-bold border transition-colors cursor-pointer ${
                            isSel ? 'bg-warm-brown text-cream border-warm-brown shadow-sm' : 'bg-white text-navy/70 border-sage/20'
                          }`}
                        >
                          {g}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="btn-cozy btn-cozy-primary w-full py-4 text-xs font-bold shadow-sm"
                >
                  {submittingEdit ? 'Saving details...' : 'Save Sanctuary Settings'}
                </button>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}
