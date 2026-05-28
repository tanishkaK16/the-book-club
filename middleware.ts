import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase keys are not set up or are placeholders, allow direct preview access
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseUrl === '') {
    return response
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Refresh session if expired - critical for Server Components
    const { data: { user } } = await supabase.auth.getUser()

    // Protect app routes from unauthenticated users
    const isAppRoute = request.nextUrl.pathname.startsWith('/feed') ||
                       request.nextUrl.pathname.startsWith('/shelf') ||
                       request.nextUrl.pathname.startsWith('/discover') ||
                       request.nextUrl.pathname.startsWith('/recommend') ||
                       request.nextUrl.pathname.startsWith('/exchange') ||
                       request.nextUrl.pathname.startsWith('/profile')

    const isAuthRoute = request.nextUrl.pathname.startsWith('/login')

    if (isAppRoute && !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (isAuthRoute && user) {
      return NextResponse.redirect(new URL('/feed', request.url))
    }
  } catch (error) {
    // Graceful fallback: allow access if auth fails to initialize due to configuration
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
