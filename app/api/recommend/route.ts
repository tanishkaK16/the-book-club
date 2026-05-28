import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()

    if (!prompt || prompt.trim().length < 5) {
      return NextResponse.json(
        { error: "Please describe the book you're looking for." },
        { status: 400 }
      )
    }

    // 1. Get recommendations from Groq
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are a helpful book recommendation expert. 
            Recommend exactly 3 real books. Return ONLY valid JSON:
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
      }),
    })

    if (!groqResponse.ok) {
      return NextResponse.json({ error: "AI service error" }, { status: 500 })
    }

    const groqData = await groqResponse.json()
    let content = groqData.choices[0]?.message?.content || ""
    content = content.replace(/```json|```/g, "").trim()

    const recommendations = JSON.parse(content)

    // 2. Try to get covers from Google Books
    const enriched = await Promise.all(
      recommendations.map(async (rec: any) => {
        try {
          const searchQuery = `${rec.title} ${rec.author}`
          const googleRes = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=1&key=${process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY}`
          )

          if (!googleRes.ok) throw new Error("Google Books failed")

          const googleData = await googleRes.json()
          const book = googleData.items?.[0]

          return {
            ...rec,
            cover: book?.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
            pageCount: book?.volumeInfo?.pageCount || null
          }
        } catch {
          // Fallback cover (high quality Unsplash)
          return {
            ...rec,
            cover: `https://picsum.photos/id/${Math.floor(Math.random() * 50) + 1000}/300/400`,
            pageCount: null
          }
        }
      })
    )

    return NextResponse.json({ recommendations: enriched })

  } catch (error: any) {
    console.error("Recommendation Error:", error)
    return NextResponse.json(
      { error: "Failed to get recommendations." },
      { status: 500 }
    )
  }
}