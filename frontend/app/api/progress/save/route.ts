import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const progressData = await request.json()
    
    // Validate required fields
    if (!progressData.patientId || !progressData.providerId || !progressData.exerciseType) {
      return NextResponse.json(
        { error: 'Patient ID, provider ID, and exercise type are required' },
        { status: 400 }
      )
    }

    // Save progress using auth service
    const result = await authService.saveProgress(progressData)
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      progress: result.progress 
    })
  } catch (error) {
    console.error('[API] Save progress error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
