import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role, additionalData } = await request.json()
    
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Email, password, name, and role are required' },
        { status: 400 }
      )
    }

    if (!['healthcare_provider', 'patient'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be healthcare_provider or patient' },
        { status: 400 }
      )
    }

    const result = await authService.signUp(email, password, name, role, additionalData)
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 409 }
      )
    }

    return NextResponse.json({ user: result.user })
  } catch (error) {
    console.error('[API] Sign up error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
