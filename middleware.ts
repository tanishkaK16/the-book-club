import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require authentication
const APP_ROUTES = ['/feed', '/shelf', '/discover', '/recommend', '/exchange', '/profile']

function isAppRoute(pathname: string): boolean {
  return APP_ROUTES.some((route) => pathname.startsWith(route))
}

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

    const pathname = request.nextUrl.pathname
    const isAuthRoute = pathname.startsWith('/login')

    if (isAppRoute(pathname) && !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (isAuthRoute && user) {
      return NextResponse.redirect(new URL('/feed', request.url))
    }
  } catch (error) {
    // On auth failure, protect app routes by redirecting to login.
    // Never silently allow unauthenticated access to protected routes.
    console.error('[middleware] Auth error — redirecting for safety:', error)
    if (isAppRoute(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
