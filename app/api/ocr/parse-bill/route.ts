import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { parseBillImage } from '@/lib/actions/documents'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { imageBase64, extractedText } = await request.json()

    if (!imageBase64 || !extractedText) {
      return NextResponse.json(
        { error: 'Missing imageBase64 or extractedText' },
        { status: 400 }
      )
    }

    // Validate image size (max 10MB)
    const imageSizeBytes = (imageBase64.length * 3) / 4
    const maxSizeBytes = 10 * 1024 * 1024 // 10MB
    if (imageSizeBytes > maxSizeBytes) {
      return NextResponse.json(
        { error: 'Image too large (max 10MB)' },
        { status: 413 }
      )
    }

    // Call the server action to parse the bill
    const result = await parseBillImage(imageBase64, extractedText)

    return NextResponse.json(result)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to process bill' },
      { status: 500 }
    )
  }
}
