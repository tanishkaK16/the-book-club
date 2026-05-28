'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Camera, Check, MapPin, Sparkles, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const genresList = [
  'Fantasy',
  'Romance',
  'Mystery',
  'Literary Fiction',
  'Non-fiction',
  'Sci-Fi',
  'Thriller',
  'Historical',
  'Horror',
  'Young Adult',
  'Biography',
  'Poetry',
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Verify auth session on load
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please sign in to complete onboarding.')
        router.push('/login')
        return
      }
      setUserId(session.user.id)
      setFullName(session.user.user_metadata?.full_name || '')

      // Check if user is already onboarded
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarded, full_name, avatar_url')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        if (profile.onboarded) {
          router.push('/feed')
        } else {
          if (profile.full_name) setFullName(profile.full_name)
          if (profile.avatar_url) setAvatarUrl(profile.avatar_url)
        }
      }
    }
    checkSession()
  }, [supabase, router])

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre))
    } else {
      setSelectedGenres([...selectedGenres, genre])
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !userId) return
    const file = e.target.files[0]
    setIsUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}/${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        toast.error('Failed to upload image. Please try again.')
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setAvatarUrl(publicUrl)
      toast.success('Profile picture uploaded successfully!')
    } catch (err) {
      toast.error('An error occurred during file upload.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCompleteSetup = async () => {
    if (!userId) return
    if (!fullName.trim()) {
      toast.error('Please enter your full name.')
      return
    }
    if (selectedGenres.length === 0) {
      toast.error('Please select at least one favorite genre.')
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: fullName,
          avatar_url: avatarUrl,
          bio: bio,
          genres: selectedGenres,
          city: city,
          onboarded: true,
          updated_at: new Date().toISOString(),
        })

      if (error) {
        toast.error(error.message || 'Failed to update profile.')
        return
      }

      toast.success('Your profile is fully configured! Welcome inside.')
      router.refresh()
      router.push('/feed')
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-cream flex items-center justify-center px-6 py-16">
      {/* Decorative Orbs */}
      <div className="absolute top-10 left-10 h-72 w-72 rounded-full bg-primary-pink/20 blur-3xl -z-10" />
      <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-butter/30 blur-3xl -z-10" />

      <div className="card-cozy w-full max-w-2xl bg-white/95 backdrop-blur shadow-xl border border-sage/20 p-8 md:p-12 space-y-10 relative">
        <div className="absolute inset-3 border border-warm-brown/5 rounded-[1.25rem] pointer-events-none" />

        {/* Welcome Header */}
        <div className="text-center space-y-3 relative z-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-coral uppercase tracking-widest bg-coral/10 px-3.5 py-1 rounded-full">
            <Sparkles className="h-3.5 w-3.5 sparkle-icon" />
            <span>Setup Your Corner</span>
          </span>
          <h2 className="font-playfair text-3xl md:text-4xl font-extrabold text-warm-brown">
            Make your profile cozy...
          </h2>
          <p className="text-sm text-navy/70 leading-relaxed max-w-md mx-auto">
            Let's add some finishing touches to your personal space. Tell us what kind of books fill your heart.
          </p>
        </div>

        {/* Form Elements */}
        <div className="space-y-8 relative z-10">
          
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-28 w-28 rounded-full border-4 border-white bg-cream flex items-center justify-center overflow-hidden shadow-md group">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-12 w-12 text-warm-brown/40" />
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-xs font-bold text-cream">
                  Uploading...
                </div>
              )}
            </div>
            <label className="btn-cozy btn-cozy-outline text-xs px-4 py-2 cursor-pointer flex items-center gap-1.5">
              <Camera className="h-3.5 w-3.5" />
              <span>{avatarUrl ? 'Change Picture' : 'Upload Picture'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploading} />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-warm-brown">
                Preferred Name
              </label>
              <input
                type="text"
                placeholder="Preferred name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-sage/30 bg-cream/20 focus:bg-white text-navy font-semibold text-sm transition-all focus:outline-none"
              />
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-warm-brown">
                City / Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/40" />
                <input
                  type="text"
                  placeholder="Paris, TX"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-sage/30 bg-cream/20 focus:bg-white text-navy font-semibold text-sm transition-all focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Bio Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-warm-brown">
              About You as a Reader
            </label>
            <textarea
              rows={3}
              placeholder="E.g., I read classic gothic romances under a warm blanket with a hot mug of chamomile tea..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-sage/30 bg-cream/20 focus:bg-white text-navy font-semibold text-sm transition-all focus:outline-none resize-none"
            />
          </div>

          {/* Genre Selection Chips */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-warm-brown block">
              Choose Favorite Genres (Select at least 1)
            </label>
            <div className="flex flex-wrap gap-2.5">
              {genresList.map((genre) => {
                const isSelected = selectedGenres.includes(genre)
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                      isSelected
                        ? 'bg-warm-brown text-cream border-warm-brown shadow-sm'
                        : 'bg-white/50 text-navy/70 border-sage/30 hover:bg-butter/30'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                    <span>{genre}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Complete Setup Action */}
          <div className="pt-4">
            <button
              type="button"
              onClick={handleCompleteSetup}
              disabled={isSaving}
              className="btn-cozy btn-cozy-primary w-full py-4 flex items-center justify-center gap-2 font-bold tracking-wide text-sm shadow-md"
            >
              <span>{isSaving ? 'Configuring your cozy corner...' : 'Complete Setup & Open the Doors'}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
