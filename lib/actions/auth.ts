'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { logError } from '@/lib/utils/logger'
import { LoginInput, SignUpInput } from '@/lib/validations'

export async function loginAction(input: LoginInput) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function signUpAction(input: SignUpInput) {
  const supabase = await createClient()

  // Sign up user
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        practice_name: input.practice_name
      }
    }
  })

  if (signUpError) {
    return { error: signUpError.message }
  }

  if (!authData.user) {
    return { error: 'Benutzer konnte nicht erstellt werden' }
  }

  // Create practice settings for the new user
  const { error: settingsError } = await supabase
    .from('practice_settings')
    .insert({
      user_id: authData.user.id,
      practice_name: input.practice_name,
      practice_type: 'mixed',
      monthly_fixed_costs: 8000,
      average_variable_cost_per_session: 20,
      expected_growth_rate: 5
    })

  if (settingsError) {
    logError('signUpAction', 'Error creating practice settings', settingsError, { userId: authData.user.id })
    // Don't block signup if settings creation fails
  }

  redirect('/dashboard')
}

export async function logoutAction() {
  const supabase = await createClient()

  await supabase.auth.signOut()

  redirect('/login')
}

export async function getUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    return null
  }

  return data.user
}

export async function sendMagicLink(email: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
    }
  })

  if (error) {
    return { error: error.message }
  }

  // Magic link has been sent (or would be sent with email provider)
  return { success: true, data }
}
