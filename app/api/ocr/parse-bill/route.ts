import { NextRequest, NextResponse } from 'next/server'
import { parseBillImage } from '@/lib/actions/documents'

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, extractedText } = await request.json()

    if (!imageBase64 || !extractedText) {
      return NextResponse.json(
        { error: 'Missing imageBase64 or extractedText' },
        { status: 400 }
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
