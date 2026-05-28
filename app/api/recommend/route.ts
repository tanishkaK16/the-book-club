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
            content: `You are a helpful book recommendation expert for "The Book Club".
            Recommend exactly 3 real, popular books based on the user's description.
            Return ONLY valid JSON in this exact format (no extra text):
            [
              {
                "title": "Book Title",
                "author": "Author Name",
                "year": 2023,
                "reason": "Short warm explanation why it matches (2-3 sentences)",
                "genres": ["Fantasy", "Romance"]
              }
            ]`
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 700,
      }),
    })

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text()
      console.error("Groq Error:", errorText)
      return NextResponse.json(
        { error: "Failed to get recommendations from AI." },
        { status: 500 }
      )
    }

    const groqData = await groqResponse.json()
    let content = groqData.choices?.[0]?.message?.content || ""
    content = content.replace(/```json|```/g, "").trim()

    let recommendations = []
    try {
      recommendations = JSON.parse(content)
    } catch (e) {
      return NextResponse.json(
        { error: "Failed to parse AI response." },
        { status: 500 }
      )
    }

    // 2. Enrich with Google Books covers
    const enrichedRecommendations = await Promise.all(
      recommendations.map(async (rec: any) => {
        try {
          const searchQuery = `${rec.title} ${rec.author}`
          const googleResponse = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=1&key=${process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY}`
          )

          if (!googleResponse.ok) {
            throw new Error("Google Books API failed")
          }

          const googleData = await googleResponse.json()
          const book = googleData.items?.[0]

          return {
            ...rec,
            cover: book?.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
            pageCount: book?.volumeInfo?.pageCount || null
          }
        } catch (error) {
          // Return without cover if Google Books fails
          return {
            ...rec,
            cover: null,
            pageCount: null
          }
        }
      })
    )

    return NextResponse.json({ recommendations: enrichedRecommendations })

  } catch (error: any) {
    console.error("Recommendation Route Error:", error)
    return NextResponse.json(
      { error: "Failed to get recommendations. Please try again." },
      { status: 500 }
    )
  }
}