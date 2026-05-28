import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://the-book-club.vercel.app'
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/about', '/feed', '/discover'],
      disallow: ['/api/', '/onboarding', '/auth/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
