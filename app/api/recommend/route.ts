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

    // 1. Get AI recommendations from Groq
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
            Recommend exactly 3 real, well-known books based on the user's description.
            Return ONLY valid JSON — no markdown, no explanation, no extra text:
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
        max_tokens: 700,
      }),
    })

    if (!groqResponse.ok) {
      const errText = await groqResponse.text()
      console.error("Groq API Error:", errText)
      return NextResponse.json({ error: "AI service error" }, { status: 500 })
    }

    const groqData = await groqResponse.json()
    let content = groqData.choices[0]?.message?.content || ""
    content = content.replace(/```json|```/g, "").trim()

    let recommendations: any[] = []
    try {
      recommendations = JSON.parse(content)
    } catch (parseErr) {
      console.error("JSON Parse Error:", parseErr, "\nRaw content:", content)
      return NextResponse.json({ error: "Failed to parse AI response." }, { status: 500 })
    }

    // 2. Enrich each book with covers — tries 3 sources in order:
    //    Google Books → Open Library → Unsplash themed fallback
    const googleApiKey = process.env.GOOGLE_BOOKS_API_KEY

    const enriched = await Promise.all(
      recommendations.map(async (rec: any) => {
        let coverUrl: string | null = null
        let pageCount = rec.pageCount || 300
        let infoLink = `https://books.google.com/books?q=${encodeURIComponent(rec.title + ' ' + rec.author)}`

        // --- Source 1: Google Books ---
        try {
          const searchQuery = `intitle:${rec.title} inauthor:${rec.author}`
          const googleRes = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=1&printType=books&langRestrict=en${googleApiKey ? `&key=${googleApiKey}` : ''}`
          )
          if (googleRes.ok) {
            const googleData = await googleRes.json()
            const volume = googleData.items?.[0]?.volumeInfo
            const rawCover =
              volume?.imageLinks?.extraLarge ||
              volume?.imageLinks?.large ||
              volume?.imageLinks?.medium ||
              volume?.imageLinks?.thumbnail ||
              null

            if (rawCover) {
              coverUrl = rawCover
                .replace('http:', 'https:')
                .replace('zoom=1', 'zoom=3')
                .replace('&edge=curl', '')
            }
            if (volume?.pageCount) pageCount = volume.pageCount
            if (volume?.infoLink) infoLink = volume.infoLink
          }
        } catch (err) {
          console.error(`Google Books failed for "${rec.title}":`, err)
        }

        // --- Source 2: Open Library (no API key, covers ~90% of books) ---
        if (!coverUrl) {
          try {
            const olRes = await fetch(
              `https://openlibrary.org/search.json?title=${encodeURIComponent(rec.title)}&author=${encodeURIComponent(rec.author)}&limit=1&fields=cover_i`
            )
            if (olRes.ok) {
              const olData = await olRes.json()
              const coverId = olData.docs?.[0]?.cover_i
              if (coverId) {
                coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
              }
            }
          } catch (err) {
            console.error(`Open Library failed for "${rec.title}":`, err)
          }
        }

        // --- Source 3: Unsplash book-themed fallback (always works) ---
        if (!coverUrl) {
          // Pick from a curated set of warm cozy book photos
          const fallbacks = [
            'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400&h=600',
            'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400&h=600',
            'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&q=80&w=400&h=600',
          ]
          coverUrl = fallbacks[Math.floor(Math.random() * fallbacks.length)]
        }

        return { ...rec, coverUrl, pageCount, infoLink }
      })
    )

    return NextResponse.json({ recommendations: enriched })

  } catch (error: any) {
    console.error("Recommendation Route Error:", error)
    return NextResponse.json(
      { error: "Failed to get recommendations. Please try again." },
      { status: 500 }
    )
  }
}