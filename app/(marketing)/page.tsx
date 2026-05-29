'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Book,
  Bookmark,
  Sparkles,
  Users,
  Star,
  Layers,
  ArrowRight,
  Coffee,
  Heart,
  HelpCircle,
  TrendingUp,
  Gift
} from 'lucide-react'

export default function LandingPage() {
  const scrollFadeIn: any = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  }

  const benefits = [
    {
      icon: Bookmark,
      title: 'Curate Your Shelf',
      description: 'Ditch basic lists. Catalog your physical and digital books on gorgeous customizable virtual shelves.',
      color: 'bg-primary-pink/30 text-warm-brown'
    },
    {
      icon: Users,
      title: 'Community Lending',
      description: 'Lend and borrow physical books locally with vetted bibliophiles in a warm trust network.',
      color: 'bg-sage/30 text-warm-brown'
    },
    {
      icon: Star,
      title: 'Authentic Reviews',
      description: 'Read and write soulful reviews without toxic algorithms. Real opinions from real book lovers.',
      color: 'bg-butter/60 text-warm-brown'
    },
    {
      icon: Layers,
      title: 'Monthly Book Clubs',
      description: 'Join virtual or local thematic reading clubs with curated guides, discussion cues, and warm chats.',
      color: 'bg-coral/30 text-warm-brown'
    }
  ]

  const perks = [
    {
      title: 'AI Book Recommender',
      tagline: 'Your Personalized Literary Assistant',
      description: 'Tell our bespoke AI assistant your exact reading mood, favorite settings, and current cravings, and watch it recommend your next beautiful read.',
      color: 'bg-primary-pink',
      textColor: 'text-black',
      delay: 0.1
    },
    {
      title: 'Community Shelf Share',
      tagline: 'Step Inside Other Library Rooms',
      description: 'Browse the physical shelves of neighbors, request quick book swaps, or recommend a hidden gem to a fellow community reader.',
      color: 'bg-sage',
      textColor: 'text-black',
      delay: 0.2
    },
    {
      title: 'Bespoke Reading Stats',
      tagline: 'Celebrate Your Literary Journey',
      description: 'Visualize your yearly pages read, dominant genres, emotional arcs, and average cup of tea consumed during sessions in a cozy interactive log.',
      color: 'bg-butter',
      textColor: 'text-black',
      delay: 0.3
    },
    {
      title: 'Monthly Cozy Exchange',
      tagline: 'Send a Story, Receive a Smile',
      description: 'Participate in our popular seasonal book exchanges where members send carefully wrapped books with custom bookmarks and little personal notes.',
      color: 'bg-coral',
      textColor: 'text-black',
      delay: 0.4
    }
  ]

  const steps = [
    {
      number: '01',
      title: 'Sign Up & Brew Tea',
      description: 'Create your cozy free profile in seconds. Pour your favorite warm drink and set your reading preferences.',
      icon: Coffee
    },
    {
      number: '02',
      title: 'Catalog Your Library',
      description: 'Import or log the books on your physical shelves. Show off your gorgeous virtual reading room.',
      icon: Book
    },
    {
      number: '03',
      title: 'Find New Obsessions',
      description: 'Use cozy algorithmic tags or AI guidance to pinpoint the next story that will capture your heart.',
      icon: Sparkles
    },
    {
      number: '04',
      title: 'Lend & Gather',
      description: 'Swap books locally, post authentic reviews, and gather in slow-paced virtual fireside discussions.',
      icon: Users
    }
  ]

  return (
    <div className="relative min-h-screen bg-cream overflow-x-hidden selection:bg-primary-pink selection:text-warm-brown">
      
      {/* Dynamic Background Blurs */}
      <div className="absolute top-40 left-0 w-80 h-80 rounded-full bg-primary-pink/20 blur-3xl -z-10" />
      <div className="absolute top-1/3 right-0 w-96 h-96 rounded-full bg-butter/30 blur-3xl -z-10" />
      <div className="absolute bottom-40 left-10 w-96 h-96 rounded-full bg-sage/20 blur-3xl -z-10" />

      {/* HERO SECTION */}
      <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-24 md:py-32 flex flex-col items-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={scrollFadeIn}
          className="w-full max-w-4xl text-center space-y-8 p-8 md:p-12 rounded-[2rem] border-4 border-double border-warm-brown/30 bg-white/40 backdrop-blur-sm relative"
        >
          {/* Elegant Ornate Corner Accents */}
          <div className="absolute top-4 left-4 h-6 w-6 border-t-2 border-l-2 border-warm-brown/40" />
          <div className="absolute top-4 right-4 h-6 w-6 border-t-2 border-r-2 border-warm-brown/40" />
          <div className="absolute bottom-4 left-4 h-6 w-6 border-b-2 border-l-2 border-warm-brown/40" />
          <div className="absolute bottom-4 right-4 h-6 w-6 border-b-2 border-r-2 border-warm-brown/40" />

          {/* Star Ornament */}
          <div className="inline-flex items-center justify-center gap-1 bg-white/80 border border-sage/30 px-4 py-1.5 rounded-full text-xs font-bold text-warm-brown tracking-widest shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-coral sparkle-icon" />
            <span>THE COZY REVOLUTION</span>
          </div>

          {/* Title and Subtitle */}
          <div className="space-y-3">
            <h1 className="font-playfair text-5xl md:text-7xl font-extrabold tracking-tight text-warm-brown leading-none">
              THE BOOK CLUB
            </h1>
            <p className="font-playfair text-xl md:text-3xl font-light italic text-coral tracking-wide">
              Reimagined
            </p>
          </div>

          {/* Tagline */}
          <p className="mx-auto max-w-2xl font-inter text-base md:text-lg text-navy/85 leading-relaxed font-medium">
            Where stories connect us. Catalog your physical library, share authentic reviews, exchange real books locally, and find your next reading obsession.
          </p>

          {/* Call to Action Button */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <Link
                href="/login"
                className="btn-cozy bg-coral text-cream hover:bg-navy font-bold text-base px-8 py-4 shadow-lg flex items-center gap-2"
              >
                <span>Join the Club — It's Free</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
          </div>

          {/* Side Ornament */}
          <div className="pt-4 text-xs text-navy/40 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <span className="h-px w-8 bg-warm-brown/20" />
            <span>No ads • No algorithms • Just books</span>
            <span className="h-px w-8 bg-warm-brown/20" />
          </div>
        </motion.div>

        {/* Small book outline svg container */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-8 flex justify-center text-warm-brown/40"
        >
          <div className="relative p-4 bg-white/20 rounded-full border border-sage/10 shadow-sm animate-pulse">
            <Book className="h-8 w-8 text-warm-brown/50" />
          </div>
        </motion.div>
      </section>

      {/* WHY JOIN US SECTION */}
      <section id="why-join" className="mx-auto max-w-7xl px-6 py-20 scroll-mt-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={scrollFadeIn}
          className="text-center space-y-4 mb-16"
        >
          <h2 className="font-playfair text-3xl md:text-5xl font-bold tracking-tight text-warm-brown">
            Why you'll feel right at home
          </h2>
          <p className="text-navy/70 max-w-xl mx-auto text-sm md:text-base font-semibold">
            We've built a gentle, slow-paced visual sanctuary designed purely to support your love for reading.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="card-cozy flex flex-col justify-between h-full bg-white/70 backdrop-blur-sm"
              >
                <div className="space-y-4">
                  <div className={`inline-flex p-3 rounded-2xl ${benefit.color} shadow-sm`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-playfair text-xl font-bold text-warm-brown leading-tight">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-navy/70 leading-relaxed font-medium">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* MEMBERSHIP PERKS SECTION */}
      <section id="membership-perks" className="bg-white/30 border-y border-sage/10 py-24 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scrollFadeIn}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="font-playfair text-3xl md:text-5xl font-bold tracking-tight text-warm-brown">
              Membership Perks
            </h2>
            <p className="text-navy/70 max-w-xl mx-auto text-sm md:text-base font-semibold">
              Delightful features created to make tracking and sharing books a purely magical experience.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {perks.map((perk, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: perk.delay }}
                whileHover={{ y: -6 }}
                className={`card-cozy ${perk.color} ${perk.textColor} border border-warm-brown/10 p-8 flex flex-col justify-between min-h-[260px]`}
              >
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                    {perk.tagline}
                  </span>
                  <h3 className="font-playfair text-2xl md:text-3xl font-extrabold">
                    {perk.title}
                  </h3>
                  <p className="text-sm font-medium leading-relaxed opacity-90">
                    {perk.description}
                  </p>
                </div>
                <div className="pt-4 flex justify-end">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 border border-white/20 shadow-inner">
                    <Sparkles className="h-5 w-5 animate-pulse" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* "YOUR NEXT GREAT READ AWAITS" BANNER */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl bg-warm-brown text-cream p-10 md:p-16 text-center space-y-6 overflow-hidden shadow-xl"
        >
          {/* Subtle Background elements */}
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary-pink/10 blur-xl" />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-butter/10 blur-xl" />

          <div className="relative z-10 space-y-4">
            <h2 className="font-playfair text-3xl md:text-5xl font-extrabold tracking-tight text-cream">
              Your Next Great Read Awaits
            </h2>
            <p className="mx-auto max-w-xl text-sm md:text-base text-cream/80 font-medium">
              Dive deep into community-recommended literature, curate a beautiful reading room, and share authentic conversations.
            </p>
            <div className="pt-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
                <Link
                  href="/login"
                  className="btn-cozy bg-cream text-warm-brown hover:bg-primary-pink font-bold px-8 py-3.5 shadow-md"
                >
                  Sign up now
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-20 scroll-mt-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={scrollFadeIn}
          className="text-center space-y-4 mb-16"
        >
          <h2 className="font-playfair text-3xl md:text-5xl font-bold tracking-tight text-warm-brown">
            How It Works
          </h2>
          <p className="text-navy/70 max-w-xl mx-auto text-sm md:text-base font-semibold">
            Joining our sanctuary is as easy as turning a page.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative card-cozy bg-white/60 p-6 flex flex-col justify-between h-full border border-sage/10 text-center"
              >
                {/* Number Badge */}
                <div className="absolute top-4 left-4 font-playfair text-3xl font-black text-coral/30">
                  {step.number}
                </div>

                <div className="space-y-4 pt-6">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-pink/30 text-warm-brown shadow-sm">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-playfair text-lg font-bold text-warm-brown">
                    {step.title}
                  </h3>
                  <p className="text-xs text-navy/70 leading-relaxed font-semibold">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* FINAL CTA / WELCOME BOX SECTION */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={scrollFadeIn}
          className="card-cozy bg-white border border-sage/30 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
        >
          {/* Ornate Gold Border Accent */}
          <div className="absolute inset-2 border border-warm-brown/5 rounded-[1.25rem] pointer-events-none" />

          {/* Polaroid image placeholder on left */}
          <div className="w-full md:w-1/2 flex justify-center">
            <motion.div
              whileHover={{ rotate: 1 }}
              className="bg-cream border border-sage/30 p-3 pb-8 rounded-lg shadow-md max-w-[280px] w-full transform -rotate-2"
            >
              <div className="aspect-[4/3] w-full bg-primary-pink/40 rounded flex items-center justify-center text-warm-brown relative overflow-hidden">
                <Gift className="h-12 w-12 text-coral animate-bounce" />
                <div className="absolute inset-0 bg-gradient-to-t from-warm-brown/10 to-transparent" />
              </div>
              <p className="text-center font-playfair text-sm italic font-bold text-warm-brown mt-4 tracking-wider">
                The Welcome Box Awaits
              </p>
            </motion.div>
          </div>

          {/* Content on right */}
          <div className="w-full md:w-1/2 space-y-5 text-center md:text-left relative z-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-coral uppercase tracking-widest bg-coral/10 px-3 py-1 rounded-full">
              <Gift className="h-3.5 w-3.5" />
              <span>Cozy Member Welcome Kit</span>
            </span>
            <h2 className="font-playfair text-3xl font-extrabold text-warm-brown leading-tight">
              Your Welcome Box is Waiting...
            </h2>
            <p className="text-sm text-navy/70 leading-relaxed font-semibold">
              Every new reader receives a physical welcome package containing custom hand-pressed letterpress bookmarks, organic calming reading teas, and stickers for your bookshelf.
            </p>
            <div className="pt-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block w-full md:w-auto">
                <Link
                  href="/login"
                  className="btn-cozy bg-warm-brown text-cream hover:bg-navy font-bold text-sm px-8 py-3.5 shadow w-full md:w-auto text-center"
                >
                  Join the Club
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Decorative Floating Footer Quote */}
      <div className="py-6 text-center text-xs font-bold text-warm-brown/30 uppercase tracking-widest border-t border-sage/10">
        THE BOOK CLUB REIMAGINED • EST. 2026
      </div>

    </div>
  )
}
