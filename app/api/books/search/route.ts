import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')

    if (!query || !query.trim()) {
      return NextResponse.json({ items: [] })
    }

    const apiKey = process.env.GOOGLE_BOOKS_API_KEY
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8${
      apiKey ? `&key=${apiKey}` : ''
    }`

    const res = await fetch(url)
    if (!res.ok) {
      console.error('Google Books API search proxy status error:', res.status)
      return NextResponse.json({ items: [] })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Proxy Book Search Error:', error)
    return NextResponse.json({ items: [] }, { status: 500 })
  }
}
