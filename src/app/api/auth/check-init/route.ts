import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const userCount = await prisma.user.count()
    
    return NextResponse.json({
      initialized: userCount > 0,
      userCount,
    })
  } catch (error) {
    console.error('Check init error:', error)
    return NextResponse.json({ 
      initialized: false,
      userCount: 0,
      error: 'Database connection failed'
    }, { status: 500 })
  }
}