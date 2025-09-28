import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // In a real app, you'd clear HTTP-only cookies here
    // For now, we'll just return success (frontend handles localStorage cleanup)
    await authService.signOut()
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Sign out error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
