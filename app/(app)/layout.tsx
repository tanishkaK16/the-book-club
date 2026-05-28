'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  BookOpen,
  Library,
  Compass,
  Sparkles,
  RefreshCw,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  Coffee,
  MessageSquare
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'


export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<{
    id: string
    fullName: string
    avatarUrl: string | null
  } | null>(null)

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([])
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  // Fetch logged in user profile & notifications
  useEffect(() => {
    const fetchProfileAndNotifications = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, onboarded')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        if (!profile.onboarded) {
          router.push('/onboarding')
          return
        }
        setUserProfile({
          id: profile.id,
          fullName: profile.full_name || 'Reader',
          avatarUrl: profile.avatar_url,
        })
      } else {
        router.push('/onboarding')
      }

      // Load initial notifications
      try {
        const { data: notifs } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(10)
        
        if (notifs) {
          setNotifications(notifs)
        }
      } catch (err) {
        console.error('Error fetching notifications:', err)
      }
    }

    fetchProfileAndNotifications()

    // Setup background interval polling for a cozy, real-time feel
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: notifs } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(10)
        
        if (notifs) {
          setNotifications(notifs)
        }
      }
    }, 8000)

    return () => clearInterval(interval)
  }, [supabase, router])

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast.error('Unable to sign out.')
        return
      }
      toast.success('Signed out. Have a cozy day!')
      router.refresh()
      router.push('/')
    } catch (err) {
      toast.error('An error occurred during sign out.')
    }
  }

  // Mark single notification as read
  const handleMarkAsRead = async (id: string, redirectPath?: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
      
      setNotifications(notifications.map((n) => n.id === id ? { ...n, is_read: true } : n))
      setIsNotificationsOpen(false)
      
      if (redirectPath) {
        router.push(redirectPath)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (!userProfile) return
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userProfile.id)
      
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })))
      toast.success('All notifications marked as read!')
    } catch (err) {
      console.error(err)
    }
  }

  const menuItems = [
    { name: 'Feed', href: '/feed', icon: BookOpen },
    { name: 'My Shelf', href: '/shelf', icon: Library },
    { name: 'Discover', href: '/discover', icon: Compass },
    { name: 'AI Recommender', href: '/recommend', icon: Sparkles },
    { name: 'Book Exchange', href: '/exchange', icon: RefreshCw },
    { name: 'Inbox', href: '/messages', icon: MessageSquare },
    { name: 'Profile', href: userProfile ? `/profile/${userProfile.id}` : '/feed', icon: User },
    { name: 'About', href: '/about', icon: Coffee },
  ]

  return (
    <div className="min-h-screen bg-cream flex flex-col md:flex-row">
      
      {/* Mobile Top Header */}
      <header className="md:hidden w-full bg-primary-pink px-6 py-4 flex items-center justify-between border-b border-warm-brown/10 shadow-sm z-40">
        <Link href="/feed" className="flex items-center gap-2">
          <Coffee className="h-5 w-5 text-warm-brown" />
          <span className="font-playfair text-lg font-bold text-warm-brown">THE BOOK CLUB</span>
        </Link>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-warm-brown p-1"
        >
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-primary-pink border-r border-warm-brown/10 p-6 flex flex-col justify-between z-50 transition-transform duration-300 md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Ornate Corner Lines */}
        <div className="absolute top-2 left-2 h-4 w-4 border-t border-l border-warm-brown/20" />
        <div className="absolute top-2 right-2 h-4 w-4 border-t border-r border-warm-brown/20" />
        
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center justify-between">
            <Link href="/feed" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-warm-brown text-cream flex items-center justify-center shadow-sm">
                <Coffee className="h-4.5 w-4.5" />
              </div>
              <span className="font-playfair text-lg font-bold text-warm-brown tracking-tight">THE BOOK CLUB</span>
            </Link>
            <button className="md:hidden text-warm-brown" onClick={() => setIsSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200
                    ${isActive
                      ? 'bg-warm-brown text-cream shadow-md'
                      : 'text-warm-brown/85 hover:bg-butter/40 hover:text-warm-brown'
                    }
                  `}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer profile & logout */}
        <div className="border-t border-warm-brown/15 pt-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full border border-warm-brown/20 bg-cream flex items-center justify-center overflow-hidden">
              {userProfile?.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-5 w-5 text-warm-brown/40" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-warm-brown truncate">
                {userProfile?.fullName || 'Reader'}
              </p>
              <p className="text-[10px] text-warm-brown/65 font-bold uppercase tracking-wider">
                Active Member
              </p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-extrabold text-coral hover:bg-coral/10 transition-colors border border-transparent hover:border-coral/20 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        
        {/* Top Navbar */}
        <header className="hidden md:flex h-16 w-full bg-white/30 backdrop-blur-sm border-b border-sage/20 px-8 items-center justify-between z-35">
          <h2 className="font-playfair text-lg font-bold text-warm-brown flex items-center gap-2">
            {pathname === '/feed' && (
              <>
                <BookOpen className="h-4.5 w-4.5 text-coral" />
                <span>Reading Circle</span>
              </>
            )}
            {pathname === '/shelf' && (
              <>
                <Library className="h-4.5 w-4.5 text-coral" />
                <span>My Library Shelf</span>
              </>
            )}
            {pathname === '/discover' && (
              <>
                <Compass className="h-4.5 w-4.5 text-coral" />
                <span>Literature Discovery</span>
              </>
            )}
            {pathname === '/recommend' && (
              <>
                <Sparkles className="h-4.5 w-4.5 text-coral" />
                <span>AI Book Recommender</span>
              </>
            )}
            {pathname === '/exchange' && (
              <>
                <RefreshCw className="h-4.5 w-4.5 text-coral" />
                <span>Book Swap Exchange</span>
              </>
            )}
            {pathname.startsWith('/profile') && (
              <>
                <User className="h-4.5 w-4.5 text-coral" />
                <span>Member Profile</span>
              </>
            )}
            {pathname === '/about' && (
              <>
                <Coffee className="h-4.5 w-4.5 text-coral" />
                <span>About the Sanctuary</span>
              </>
            )}
          </h2>

          <div className="flex items-center gap-4">
            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="h-9 w-9 rounded-xl hover:bg-sage/10 text-navy/70 flex items-center justify-center border border-sage/10 transition-colors relative cursor-pointer"
              >
                <Bell className="h-4.5 w-4.5" />
                {notifications.some((n) => !n.is_read) && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-coral animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-sage/20 shadow-xl z-50 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-sage/10 pb-2">
                      <span className="text-[10px] font-black uppercase text-warm-brown">Sanctuary Alerts</span>
                      {notifications.some((n) => !n.is_read) && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-[9px] font-black text-coral hover:underline cursor-pointer"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <div className="text-center py-6 text-[10px] font-bold text-navy/40">
                          Your notification room is quiet...
                        </div>
                      ) : (
                        notifications.map((notif) => {
                          let redirectPath = '/feed'
                          if (notif.type === 'Borrow') redirectPath = '/exchange'
                          if (notif.type === 'Follow') redirectPath = `/profile/${notif.notifier_id}`

                          return (
                            <div
                              key={notif.id}
                              onClick={() => handleMarkAsRead(notif.id, redirectPath)}
                              className={`flex gap-3 p-2.5 rounded-xl transition-colors cursor-pointer text-left ${
                                notif.is_read ? 'hover:bg-cream/35' : 'bg-butter/10 hover:bg-butter/20 border-l-2 border-coral'
                              }`}
                            >
                              <div className="flex-shrink-0 mt-0.5 text-coral">
                                {notif.type === 'Like' && <span className="text-xs">❤️</span>}
                                {notif.type === 'Comment' && <span className="text-xs">💬</span>}
                                {notif.type === 'Borrow' && <span className="text-xs">🔄</span>}
                                {notif.type === 'Follow' && <span className="text-xs">👥</span>}
                              </div>
                              <div className="min-w-0 flex-1 leading-normal">
                                <p className="text-[10px] font-semibold text-navy/75 leading-tight">
                                  {notif.message}
                                </p>
                                <span className="text-[7.5px] font-bold text-navy/35 block pt-1">
                                  {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar circle */}
            <div className="h-8 w-8 rounded-full border border-sage/20 bg-cream overflow-hidden">
              {userProfile?.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-4.5 w-4.5 text-warm-brown/40" />
              )}
            </div>
          </div>
        </header>

        {/* Dynamic page content wrapper */}
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Tabs */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-sage/10 py-2.5 px-4 flex justify-around items-center z-45 shadow-lg rounded-t-3xl">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-1 transition-all ${
                isActive ? 'text-coral scale-110 animate-pulse' : 'text-warm-brown/70 hover:text-warm-brown'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[8px] font-bold tracking-tight">{item.name}</span>
            </Link>
          )
        })}
      </nav>

    </div>
  )
}
