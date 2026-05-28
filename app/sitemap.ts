import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://the-book-club.vercel.app'
  const paths = ['', '/feed', '/shelf', '/discover', '/recommend', '/exchange', '/about']

  return paths.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' || path === '/feed' ? 'daily' : 'weekly',
    priority: path === '' ? 1.0 : 0.8,
  }))
}
