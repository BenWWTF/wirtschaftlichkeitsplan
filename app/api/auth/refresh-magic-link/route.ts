import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/auth/refresh-magic-link
 *
 * Force generate a fresh magic link by invalidating the old one
 * Uses Supabase Admin API to clear old OTP sessions
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

    // First, get the user by email using admin API
    const listUsersResponse = await fetch(
      `${supabaseUrl}/auth/v1/admin/users`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!listUsersResponse.ok) {
      console.error('Failed to list users:', await listUsersResponse.text())
      return NextResponse.json(
        { error: 'Failed to find user' },
        { status: 500 }
      )
    }

    const usersData = await listUsersResponse.json()
    const user = usersData.users?.find((u: any) => u.email === email)

    if (!user) {
      // Return success anyway to avoid email enumeration attacks
      return NextResponse.json(
        { success: true, message: 'If this email exists, a fresh magic link has been sent' },
        { status: 200 }
      )
    }

    // Invalidate all sessions by signing out the user
    // This will force the next OTP request to generate a fresh one
    await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${user.id}/logout`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        }
      }
    ).catch(() => {
      // Ignore logout errors - we'll still proceed with OTP generation
    })

    // Now send a fresh OTP by calling the public signInWithOtp endpoint
    const otpResponse = await fetch(
      `${supabaseUrl}/auth/v1/otp`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
        },
        body: JSON.stringify({
          email,
          data: {
            email_redirect_to: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
          }
        })
      }
    )

    if (!otpResponse.ok) {
      const error = await otpResponse.text()
      console.error('Failed to send OTP:', error)
      return NextResponse.json(
        { error: 'Failed to send magic link' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Fresh magic link sent to your email' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in refresh-magic-link:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
