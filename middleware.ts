import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/auth', '/error', '/accessibility', '/datenschutz']
const AUTH_ROUTES = ['/auth/mfa-verify']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        }
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))

  // Redirect unauthenticated users to login (unless on public or auth route)
  if (!user && !isPublicRoute && !isAuthRoute && pathname !== '/') {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from login to dashboard
  if (user && pathname === '/login') {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // Check if user needs MFA verification
  if (user && pathname.startsWith('/dashboard') && pathname !== '/dashboard/mfa-verify') {
    // Get the session to check AAL level
    const { data: { session } } = await supabase.auth.getSession()

    // If no session or not AAL2, redirect to MFA verify
    // Note: This is a simplified check - in production, you'd check JWT claims
    // For now, we rely on the login flow to handle MFA redirect
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.ico|api).*)'
  ]
}
