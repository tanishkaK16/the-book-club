import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '600', '700', '800'],
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'The Book Club | Where stories connect us',
    template: '%s | The Book Club'
  },
  description: 'A cozy, beautiful, and interactive space for readers to share shelves, swap stories, and explore literature together.',
  keywords: ['books', 'reading circle', 'book tracker', 'book swap', 'book exchange', 'AI book recommendations', 'cozy reading room'],
  authors: [{ name: 'Antigravity & The Book Club Team' }],
  creator: 'The Book Club Community',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://the-book-club.vercel.app',
    title: 'The Book Club | Where stories connect us',
    description: 'A cozy, beautiful, and interactive space for readers to share shelves, swap stories, and explore literature together.',
    siteName: 'The Book Club',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=1200',
        width: 1200,
        height: 630,
        alt: 'The Book Club - Cozy Reading Sanctuary',
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Book Club | Where stories connect us',
    description: 'A cozy, beautiful, and interactive space for readers to share shelves, swap stories, and explore literature together.',
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=1200']
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col bg-cream text-navy selection:bg-primary-pink selection:text-warm-brown antialiased">
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
