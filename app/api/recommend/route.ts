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

    // Step 1: Call Groq API
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
      console.error("Groq API Error:", errorText)
      return NextResponse.json(
        { error: "Failed to get recommendations from AI service." },
        { status: 500 }
      )
    }

    const groqData = await groqResponse.json()
    let content = groqData.choices?.[0]?.message?.content || ""
    content = content.replace(/```json|```/g, "").trim()

    let recommendations = []
    try {
      recommendations = JSON.parse(content)
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError)
      return NextResponse.json(
        { error: "Failed to parse AI response." },
        { status: 500 }
      )
    }

    // Step 2: Enrich with Google Books covers (with proper error handling)
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
            cover: book?.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:') ||
              "https://picsum.photos/id/1015/300/400",
            pageCount: book?.volumeInfo?.pageCount || 300
          }
        } catch (error) {
          // Fallback if Google Books fails
          return {
            ...rec,
            cover: "https://picsum.photos/id/1015/300/400",
            pageCount: 300
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