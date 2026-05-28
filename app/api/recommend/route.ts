import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export const runtime = 'edge'

const groq = new Groq({
  apiKey: process.env.OPENAI_API_KEY, // We are using your Groq key here
})

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()

    if (!prompt || prompt.trim().length < 5) {
      return NextResponse.json(
        { error: "Please describe what kind of book you're looking for." },
        { status: 400 }
      )
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a helpful, cozy book recommendation expert for "The Book Club".
          Recommend real, popular books based on the user's description.
          Return ONLY valid JSON in this exact format (no extra text):
          [
            {
              "title": "Book Title",
              "author": "Author Name",
              "year": 2023,
              "reason": "Short warm explanation why it matches (2-3 sentences)",
              "genres": ["Fantasy", "Romance"],
              "pageCount": 384
            }
          ]`
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 800,
    })

    let content = completion.choices[0]?.message?.content || ""
    content = content.replace(/```json|```/g, "").trim()

    const recommendations = JSON.parse(content)
    const googleApiKey = process.env.GOOGLE_BOOKS_API_KEY

    // Enrich each recommendation with Google Books API covers & links
    const enrichedRecommendations = await Promise.all(
      recommendations.map(async (book: any) => {
        let coverUrl = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400'
        let pageCount = book.pageCount || 350
        let infoLink = `https://books.google.com/books?q=${encodeURIComponent(book.title + ' ' + book.author)}`

        try {
          const searchUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(book.title + ' ' + book.author)}&maxResults=1${
            googleApiKey && !googleApiKey.includes('your-google') ? `&key=${googleApiKey}` : ''
          }`
          
          const booksRes = await fetch(searchUrl)
          if (booksRes.ok) {
            const booksData = await booksRes.json()
            if (booksData.items && booksData.items.length > 0) {
              const volumeInfo = booksData.items[0].volumeInfo
              coverUrl = volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || coverUrl
              pageCount = volumeInfo.pageCount || pageCount
              infoLink = volumeInfo.infoLink || infoLink
            }
          }
        } catch (err) {
          console.error(`Google Books Enrich Error for ${book.title}:`, err)
        }

        return {
          ...book,
          coverUrl,
          pageCount,
          infoLink
        }
      })
    )

    return NextResponse.json({ recommendations: enrichedRecommendations })

  } catch (error: any) {
    console.error("Groq AI Error:", error)
    return NextResponse.json(
      { error: "Sorry, we couldn't get recommendations right now. Please try again." },
      { status: 500 }
    )
  }
}