'use client'

import { motion } from 'framer-motion'
import { Mail, MapPin, Coffee, HelpCircle, Heart } from 'lucide-react'

export default function ContactPage() {
  const contacts = [
    {
      icon: Mail,
      title: 'Send a Letter',
      value: 'hello@thebookclub.com',
      description: 'Reach our cozy community curatorship team for general inquiries or member support.'
    },
    {
      icon: HelpCircle,
      title: 'Help Sanctuary',
      value: 'support@thebookclub.com',
      description: 'Experiencing technical issues pinning volumes or synchronizing swap exchange details?'
    },
    {
      icon: MapPin,
      title: 'Our Reading Room',
      value: 'San Francisco, CA',
      description: 'The physical slow reading circle meetup and coffee sanctuary location.'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-12 max-w-4xl mx-auto pb-16"
    >
      {/* Header section */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coral/10 text-coral text-xs font-black uppercase tracking-wider">
          <Coffee className="h-3.5 w-3.5" />
          <span>Get in Touch</span>
        </div>
        <h1 className="font-playfair text-4xl font-extrabold text-warm-brown leading-tight">
          Letters to the Curators
        </h1>
        <p className="text-sm font-semibold text-navy/60 leading-relaxed">
          Have an idea for a thematic monthly pick? Want to start a local neighborhood exchange circle? Drop us a digital note.
        </p>
      </div>

      {/* Grid of contact options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {contacts.map((item, idx) => {
          const Icon = item.icon
          return (
            <motion.div
              key={idx}
              whileHover={{ y: -6 }}
              className="card-cozy bg-white p-6 space-y-4 border border-sage/15 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="h-10 w-10 bg-coral/10 text-coral flex items-center justify-center rounded-xl">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-playfair text-sm font-black text-warm-brown">{item.title}</h3>
                <p className="text-xs font-black text-coral break-all">{item.value}</p>
                <p className="text-[10.5px] font-semibold text-navy/60 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Cozy illustration contact box */}
      <div className="bg-white/60 border border-sage/15 p-6 md:p-8 rounded-3xl text-center space-y-4 max-w-lg mx-auto">
        <Heart className="h-6 w-6 text-coral mx-auto" />
        <h4 className="font-playfair text-lg font-bold text-warm-brown">A Warm, Safe Community</h4>
        <p className="text-xs text-navy/65 leading-relaxed font-semibold">
          The Book Club is built and run by volunteer bibliophiles. We read every message and usually reply within two cups of chamomile tea (typically 24–48 hours).
        </p>
      </div>

    </motion.div>
  )
}
