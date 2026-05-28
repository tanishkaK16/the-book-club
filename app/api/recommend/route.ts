import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()

    if (!prompt || prompt.trim().length < 5) {
      return NextResponse.json(
        { error: "Please describe the book you're looking for." },
        { status: 400 }
      )
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a helpful book recommendation expert. 
          Recommend exactly 3 real books. Return ONLY valid JSON in this format:
          [
            {
              "title": "Book Title",
              "author": "Author Name",
              "year": 2023,
              "reason": "Short warm explanation",
              "genres": ["Fantasy", "Romance"]
            }
          ]`
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 600,
    })

    let content = completion.choices[0]?.message?.content || ""
    content = content.replace(/```json|```/g, "").trim()

    const recommendations = JSON.parse(content)

    // Enrich with Google Books covers
    const enriched = await Promise.all(
      recommendations.map(async (rec: any) => {
        try {
          const res = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(rec.title + " " + rec.author)}&maxResults=1&key=${process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY}`
          )
          const data = await res.json()
          const book = data.items?.[0]

          return {
            ...rec,
            cover: book?.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:') ||
              "https://picsum.photos/id/1015/300/400",
            pageCount: book?.volumeInfo?.pageCount || 300
          }
        } catch {
          return {
            ...rec,
            cover: "https://picsum.photos/id/1015/300/400",
            pageCount: 300
          }
        }
      })
    )

    return NextResponse.json({ recommendations: enriched })

  } catch (error: any) {
    console.error("Recommendation Error:", error)
    return NextResponse.json(
      { error: "Failed to get recommendations. Please try again." },
      { status: 500 }
    )
  }
}