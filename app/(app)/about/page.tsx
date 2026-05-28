'use client'

import { motion } from 'framer-motion'
import { BookOpen, Coffee, Heart, Globe, Shield, Sparkles } from 'lucide-react'

export default function AboutPage() {
  const pledges = [
    {
      icon: Coffee,
      title: 'Slow Reading Philosophy',
      description: 'We prioritize fully digesting stories over speed-reading. A good chapter is meant to be savored alongside hot tea.'
    },
    {
      icon: Heart,
      title: 'Kind Interactions',
      description: 'Our review space is safe, inclusive, and encouraging. We appreciate diverse literary opinions and peaceful sharing.'
    },
    {
      icon: Shield,
      title: 'Swap Respect',
      description: 'Lending a book is an act of deep trust. We pledge to return neighbor volumes in pristine, loved condition.'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-12 max-w-4xl mx-auto pb-16"
    >
      {/* Ornate Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coral/10 text-coral text-xs font-black uppercase tracking-wider">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Our Story</span>
        </div>
        <h1 className="font-playfair text-4xl md:text-5xl font-extrabold text-warm-brown leading-tight">
          The Slow Reading Circle
        </h1>
        <p className="text-sm font-semibold text-navy/60 leading-relaxed">
          The Book Club was founded as a sanctuary away from screen fatigue and rapid-fire feeds. We believe books are conversations waiting to happen.
        </p>
      </div>

      {/* Main Philosophy Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white/60 p-6 md:p-8 rounded-3xl border border-sage/15">
        <div className="space-y-4">
          <h2 className="font-playfair text-2xl font-black text-warm-brown">
            A Sanctuary for Page Turners
          </h2>
          <p className="text-xs text-navy/70 leading-relaxed font-semibold">
            In a fast-moving digital age, The Book Club returns tactile, quiet charm to reading logs. Here, we build virtual wooden bookshelves that showcase book spines with physical pride, swap actual paper copies across neighbor fences, and consult our cozy AI companion when looking for seasonal book recommendations.
          </p>
          <p className="text-xs text-navy/70 leading-relaxed font-semibold">
            Whether you read one page a night before sleeping, or finish fantasy volumes in weekend sprints, your reading room is a sanctuary.
          </p>
        </div>

        {/* Polaroid Cozy Stack Graphic Mockup */}
        <div className="flex justify-center relative py-6">
          <motion.div 
            whileHover={{ rotate: -2, scale: 1.02 }}
            className="w-48 bg-white p-3 rounded-2xl shadow-lg border border-sage/10 transform rotate-3"
          >
            <img 
              src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400" 
              alt="Cozy library corner" 
              className="w-full h-48 object-cover rounded-xl"
            />
            <p className="font-playfair text-xs font-extrabold text-warm-brown text-center mt-3">
              ☕ Savor Every Page
            </p>
          </motion.div>
        </div>
      </div>

      {/* Community Pledge Cards */}
      <div className="space-y-6">
        <h3 className="font-playfair text-xl font-bold text-center text-warm-brown">
          Our Shared Community Covenants
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pledges.map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -6 }}
                className="card-cozy bg-white p-6 space-y-4 border border-sage/15 text-center flex flex-col items-center"
              >
                <div className="h-10 w-10 bg-coral/10 text-coral flex items-center justify-center rounded-xl">
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="font-playfair text-sm font-black text-warm-brown">{item.title}</h4>
                <p className="text-[10.5px] font-semibold text-navy/60 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Ornate End Marker */}
      <div className="flex flex-col items-center justify-center gap-3 pt-6 border-t border-sage/10">
        <Sparkles className="h-6 w-6 text-coral" />
        <span className="text-[10px] font-black uppercase tracking-widest text-warm-brown/70">
          Happy Reading, Friends
        </span>
      </div>

    </motion.div>
  )
}
