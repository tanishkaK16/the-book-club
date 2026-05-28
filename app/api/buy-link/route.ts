import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.OPENAI_API_KEY, // Reusing active Groq credential key
})

export async function POST(req: NextRequest) {
  try {
    const { title, author } = await req.json()

    if (!title) {
      return NextResponse.json(
        { error: 'Book title is required to generate search queries.' },
        { status: 400 }
      )
    }

    // Prepare a prompt for Groq to optimize search query strings and locate the best store
    const prompt = `You are a shopping expert for "The Book Club".
    We want to generate optimal purchase URLs for this book:
    Title: "${title}"
    Author: "${author || 'Unknown'}"

    Please analyze this book and formulate optimized search terms for Amazon and Flipkart.
    Return ONLY a valid JSON object in this exact format (no extra markdown block or explanation text):
    {
      "amazonQuery": "clean keywords for Amazon search",
      "flipkartQuery": "clean keywords for Flipkart search",
      "suggestedPlatform": "Amazon" or "Flipkart",
      "estimatedCheapestPrice": "e.g. $10 / ₹399"
    }`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an accurate, helpful shopping curator. Always return valid JSON only.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 300,
    })

    let content = completion.choices[0]?.message?.content || ''
    content = content.replace(/```json|```/g, '').trim()

    let parsedData
    try {
      parsedData = JSON.parse(content)
    } catch (parseErr) {
      // Fallback if parsing fails
      console.error('Failed to parse Groq response in buy-link:', content)
      const cleanTitle = title.replace(/[^a-zA-Z0-9\s]/g, '')
      parsedData = {
        amazonQuery: `${cleanTitle} ${author || ''} book`,
        flipkartQuery: `${cleanTitle} ${author || ''} book`,
        suggestedPlatform: 'Amazon',
        estimatedCheapestPrice: 'Check store'
      }
    }

    // Build functional store search links
    const amazonUrl = `https://www.amazon.in/s?k=${encodeURIComponent(parsedData.amazonQuery)}`
    const flipkartUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(parsedData.flipkartQuery)}`

    // Determine the primary buy link based on recommendation
    const bestUrl = parsedData.suggestedPlatform === 'Flipkart' ? flipkartUrl : amazonUrl

    return NextResponse.json({
      bestUrl,
      amazonUrl,
      flipkartUrl,
      suggestedPlatform: parsedData.suggestedPlatform,
      estimatedPrice: parsedData.estimatedCheapestPrice
    })

  } catch (error: any) {
    console.error('Buy link API Error:', error)
    
    // Safety Fallback URLs
    const fallbackTitle = 'book'
    return NextResponse.json({
      bestUrl: `https://www.amazon.in/s?k=${encodeURIComponent(fallbackTitle)}`,
      amazonUrl: `https://www.amazon.in/s?k=${encodeURIComponent(fallbackTitle)}`,
      flipkartUrl: `https://www.flipkart.com/search?q=${encodeURIComponent(fallbackTitle)}`,
      suggestedPlatform: 'Amazon',
      estimatedPrice: 'Check store'
    })
  }
}
