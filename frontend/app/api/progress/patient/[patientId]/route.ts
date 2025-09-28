import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const { patientId } = params
    
    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      )
    }

    // Get progress for patient
    const progress = authService.getProgressByPatient(patientId)
    
    return NextResponse.json({ progress })
  } catch (error) {
    console.error('[API] Get patient progress error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
