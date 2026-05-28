'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { 
  Send, 
  MessageSquare, 
  Search, 
  User, 
  ChevronLeft,
  Loader2,
  BookOpen
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Wrapped in Suspense block to support next.js search parameters queries
function MessagesDashboardContent() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const targetUserId = searchParams.get('user')

  // Auth User
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  // Conversations list (Inbox)
  const [conversations, setConversations] = useState<any[]>([])
  const [loadingInbox, setLoadingInbox] = useState(true)
  const [inboxSearchQuery, setInboxSearchQuery] = useState('')

  // Active Chat states
  const [activeUser, setActiveUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loadingChat, setLoadingChat] = useState(false)
  const [messageInput, setMessageInput] = useState('')
  const [sending, setSending] = useState(false)

  // Mobile layouts view toggle
  const [mobileShowChat, setMobileShowChat] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1. Authenticate user
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please sign in to read your inbox messages!')
        router.push('/login')
      } else {
        setCurrentUser(session.user)
      }
    }
    checkUser()
  }, [supabase, router])

  // 2. Fetch Inbox Conversations list
  const fetchInbox = async (userId: string) => {
    try {
      // Fetch messages where user is sender or receiver
      const { data: rawMessages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (!rawMessages || rawMessages.length === 0) {
        setConversations([])
        setLoadingInbox(false)
        return
      }

      // Group messages by counterpart user ID
      const counterpartIds = new Set<string>()
      const latestMessageMap = new Map<string, any>()

      rawMessages.forEach((msg) => {
        const counterpartId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id
        counterpartIds.add(counterpartId)
        if (!latestMessageMap.has(counterpartId)) {
          latestMessageMap.set(counterpartId, msg)
        }
      });

      // Fetch counterpart profiles
      const { data: profiles, error: profileErr } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', Array.from(counterpartIds))

      if (profileErr) throw profileErr

      // Map conversations array
      const mappedConversations = (profiles || []).map((prof) => {
        const latestMsg = latestMessageMap.get(prof.id)
        return {
          profile: prof,
          latestMessage: latestMsg?.content || '',
          isRead: latestMsg?.is_read || false,
          senderId: latestMsg?.sender_id || '',
          time: latestMsg ? new Date(latestMsg.created_at) : new Date()
        }
      }).sort((a, b) => b.time.getTime() - a.time.getTime())

      setConversations(mappedConversations)
    } catch (err) {
      console.error('Error loading inbox:', err)
      toast.error('Failed to load active inbox chats.')
    } finally {
      setLoadingInbox(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      fetchInbox(currentUser.id)
    }
  }, [currentUser])

  // 3. Handle Active Chat loading when targetUserId changes or selected in list
  const loadChatDetails = async (counterpartId: string) => {
    if (!currentUser) return
    setLoadingChat(true)
    try {
      // 1. Fetch counterpart profile securely (supporting both UUID and username slug)
      const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(counterpartId)
      
      let profileQuery = supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
      
      if (isUUID) {
        profileQuery = profileQuery.eq('id', counterpartId)
      } else {
        profileQuery = profileQuery.ilike('full_name', counterpartId.replace('-', ' '))
      }

      const { data: profile, error: profErr } = await profileQuery.maybeSingle()

      if (profErr || !profile) {
        throw profErr || new Error('Neighbor profile not found in database.')
      }
      
      setActiveUser(profile)
      const counterpartUuid = profile.id

      // 2. Fetch direct messages history securely using set-intersection
      const { data: chatMsgs, error: chatErr } = await supabase
        .from('messages')
        .select('*')
        .in('sender_id', [currentUser.id, counterpartUuid])
        .in('receiver_id', [currentUser.id, counterpartUuid])
        .order('created_at', { ascending: true })

      if (chatErr) throw chatErr
      setMessages(chatMsgs || [])

      // 3. Mark received messages as read
      const unreadIds = (chatMsgs || [])
        .filter((m) => m.receiver_id === currentUser.id && !m.is_read)
        .map((m) => m.id)

      if (unreadIds.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadIds)
        
        // Refresh local inbox counts
        fetchInbox(currentUser.id)
      }

      setMobileShowChat(true)
    } catch (err) {
      console.error('Error loading conversation details:', err)
      toast.error('Could not load chat history.')
    } finally {
      setLoadingChat(false)
    }
  }

  useEffect(() => {
    if (targetUserId && currentUser) {
      loadChatDetails(targetUserId)
    }
  }, [targetUserId, currentUser])

  // 4. Scroll to base of messages timeline
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 5. Supabase Real-time listener for instant dynamic inbox / messages zipping
  useEffect(() => {
    if (!currentUser) return

    const channel = supabase
      .channel(`realtime-messages-${currentUser.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const newMsg = payload.new

          // Verify if message concerns current user session
          if (newMsg.sender_id === currentUser.id || newMsg.receiver_id === currentUser.id) {
            // A. If active chat matches counterpart sender/receiver, update timeline
            const counterpartId = activeUser?.id
            const matchesActive = 
              (newMsg.sender_id === currentUser.id && newMsg.receiver_id === counterpartId) ||
              (newMsg.sender_id === counterpartId && newMsg.receiver_id === currentUser.id)

            if (matchesActive) {
              setMessages((prev) => {
                 if (prev.some((m) => m.id === newMsg.id)) return prev
                 return [...prev, newMsg]
               })
              
              // Mark as read immediately if user is receiver
              if (newMsg.receiver_id === currentUser.id) {
                await supabase
                  .from('messages')
                  .update({ is_read: true })
                  .eq('id', newMsg.id)
              }
            }

            // B. Refresh Inbox conversation cards list
            fetchInbox(currentUser.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser, activeUser, supabase])

  // 6. Send direct Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !currentUser || !activeUser || sending) return

    setSending(true)
    const contentToSend = messageInput.trim()
    setMessageInput('')

    // A. Optimistic UI update for instant feedback on the messaging canvas
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      sender_id: currentUser.id,
      receiver_id: activeUser.id,
      content: contentToSend,
      is_read: false,
      created_at: new Date().toISOString()
    }
    setMessages((prev) => [...prev, optimisticMsg])

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          receiver_id: activeUser.id,
          content: contentToSend
        })
        .select()

      if (error) throw error

      // B. Swap out optimistic message with the database message once successfully written
      if (data && data.length > 0) {
        setMessages((prev) => 
          prev.map((m) => m.id === optimisticMsg.id ? data[0] : m)
        )
      }

      // C. Instantly trigger inbox list reload to show latest text preview
      fetchInbox(currentUser.id)
    } catch (err) {
      console.error('Error sending message:', err)
      toast.error('Failed to deliver message.')
      // Remove the failed message from timeline
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id))
      setMessageInput(contentToSend) // Restore user typed value
    } finally {
      setSending(false)
    }
  }

  // Helper date formatter
  const formatMsgTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Filter inbox list based on Search query
  const filteredInbox = conversations.filter((c) => {
    const nameMatch = c.profile.full_name?.toLowerCase().includes(inboxSearchQuery.toLowerCase())
    return nameMatch
  })

  return (
    <div className="min-h-[calc(100vh-80px)] bg-cream py-6 px-4 md:px-8">
      <div className="mx-auto max-w-5xl bg-white border border-sage/15 rounded-3xl overflow-hidden shadow-xl grid grid-cols-1 md:grid-cols-3 min-h-[620px] max-h-[750px]">
        
        {/* Inbox conversation lists Column */}
        <div className={`border-r border-sage/10 flex flex-col h-full ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-sage/10 bg-cream/25">
            <h2 className="font-playfair text-xl font-bold text-warm-brown flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-coral" />
              Neighborhood Inbox
            </h2>
            <div className="relative mt-3">
              <input
                type="text"
                placeholder="Search active rooms..."
                value={inboxSearchQuery}
                onChange={(e) => setInboxSearchQuery(e.target.value)}
                className="w-full text-xs bg-cream/40 pl-8 pr-4 py-2.5 rounded-xl border border-sage/10 focus:outline-none focus:border-coral text-warm-brown"
              />
              <Search className="absolute left-2.5 top-3 h-3.5 w-3.5 text-navy/30" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingInbox ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-6 w-6 text-coral animate-spin" />
              </div>
            ) : filteredInbox.length === 0 ? (
              <div className="text-center py-12 px-4 text-navy/40">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-coral/30" />
                <p className="text-xs">No active chats. Head to profiles or exchange cards to connect with neighbors!</p>
              </div>
            ) : (
              filteredInbox.map((chat) => {
                const isActive = activeUser?.id === chat.profile.id
                const isUnread = !chat.isRead && chat.senderId !== currentUser?.id
                return (
                  <button
                    key={chat.profile.id}
                    onClick={() => {
                      router.push(`/messages?user=${chat.profile.id}`)
                      loadChatDetails(chat.profile.id)
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl cursor-pointer text-left transition-all ${
                      isActive ? 'bg-cream/70 shadow-sm border border-sage/10' : 'hover:bg-cream/25 border border-transparent'
                    }`}
                  >
                    <div className="relative h-10 w-10 rounded-full overflow-hidden bg-cream border border-sage/15 flex-shrink-0">
                      {chat.profile.avatar_url ? (
                        <img src={chat.profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-navy/20 m-2.5" />
                      )}
                      {isUnread && (
                        <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-coral border-2 border-white animate-pulse" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className="text-xs font-bold text-warm-brown truncate leading-none">
                          {chat.profile.full_name || 'Cozy Neighbor'}
                        </h4>
                        <span className="text-[9px] text-navy/40 flex-shrink-0">
                          {chat.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className={`text-[10px] truncate ${isUnread ? 'text-warm-brown font-bold' : 'text-navy/50'}`}>
                        {chat.latestMessage}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Messaging panel Column */}
        <div className={`col-span-1 md:col-span-2 flex flex-col h-full ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
          {loadingChat ? (
            <div className="flex-1 flex flex-col justify-center items-center">
              <Loader2 className="h-8 w-8 text-coral animate-spin mb-2" />
              <p className="text-xs text-navy/40">Opening your reading room conversation...</p>
            </div>
          ) : activeUser ? (
            <div className="flex flex-col h-full min-h-[620px] max-h-[750px]">
              
              {/* Active Conversation header */}
              <div className="p-4 border-b border-sage/10 bg-cream/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setMobileShowChat(false)}
                    className="md:hidden p-1.5 rounded-lg hover:bg-cream text-navy/70 mr-1"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-cream border border-sage/15">
                    {activeUser.avatar_url ? (
                      <img src={activeUser.avatar_url} alt="Counterpart Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-navy/20 m-2.5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-warm-brown leading-tight">
                      {activeUser.full_name || 'Reader Friend'}
                    </h3>
                    <span className="text-[10px] text-navy/40 font-semibold">
                      @{activeUser.full_name ? activeUser.full_name.toLowerCase().replace(/\s+/g, '') : 'cozyneighbor'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message timeline list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FDF6E3]/20">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center p-6 text-navy/40">
                    <MessageSquare className="h-8 w-8 text-coral/20 mb-2" />
                    <p className="text-xs">Your reading room discussion begins here.</p>
                    <p className="text-[10px] mt-1">Send a friendly greeting to start swapping thoughts or books!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === currentUser?.id
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm border text-xs leading-relaxed ${
                            isMe
                              ? 'bg-warm-brown text-cream border-warm-brown/10 rounded-tr-none'
                              : 'bg-white text-warm-brown border-sage/10 rounded-tl-none'
                          }`}
                        >
                          <p>{msg.content}</p>
                          <span
                            className={`block text-[8px] text-right mt-1.5 font-semibold ${
                              isMe ? 'text-cream/50' : 'text-navy/30'
                            }`}
                          >
                            {formatMsgTime(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Messaging Input send bar */}
              <form 
                onSubmit={handleSendMessage}
                className="p-4 border-t border-sage/10 bg-cream/25 flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Type a friendly message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 text-xs bg-white px-4 py-3 rounded-2xl border border-sage/15 focus:outline-none focus:border-coral text-warm-brown shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || sending}
                  className="btn-cozy bg-coral hover:bg-coral/95 text-white p-3 rounded-2xl flex items-center justify-center shadow cursor-pointer disabled:opacity-50 transition-all active:scale-95"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>

            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-6 text-navy/40">
              <MessageSquare className="h-10 w-10 text-coral/20 mb-3" />
              <h3 className="font-playfair text-lg font-bold text-warm-brown mb-1">Your Inbox Dashboard</h3>
              <p className="text-xs max-w-sm">Select an active conversation thread from the sidebar panel, or open a reader's profile to start chatting.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default function MessagesDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex flex-col justify-center items-center">
        <Loader2 className="h-8 w-8 text-coral animate-spin mb-2" />
        <p className="text-xs text-navy/40">Loading messages inbox...</p>
      </div>
    }>
      <MessagesDashboardContent />
    </Suspense>
  )
}
