export const runtime = "edge"


import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db/client'
import { hashPassword } from '@/lib/auth/password'
import { nanoid } from 'nanoid'
import { RegisterSchema } from '@/lib/validation/schemas'
import { sanitizeObject } from '@/lib/validation/sanitize'
import { strictRateLimit } from '@/lib/rate-limit'

// Generic error message
const REGISTRATION_ERROR_MESSAGE = 'Registration failed. Please try again.'

export async function POST(request: NextRequest) {
  // Apply strict rate limiting for auth endpoints
  const rateLimitResult = strictRateLimit(request)
  if (rateLimitResult) {
    return rateLimitResult
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Sanitize input
  const sanitizedBody = sanitizeObject(body)

  // Validate input (includes password complexity requirements)
  const validationResult = RegisterSchema.safeParse(sanitizedBody)
  if (!validationResult.success) {
    return NextResponse.json(
      {
        error: 'Invalid input',
        details: validationResult.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
      },
      { status: 400 }
    )
  }

  const { email, password, name, role } = validationResult.data

  const db = await getDB()

  // Check if user already exists (use generic error to prevent enumeration)
  const existing = await db
    .prepare('SELECT id FROM users WHERE email = ?')
    .bind(email.toLowerCase().trim())
    .first()

  if (existing) {
    return NextResponse.json(
      { error: REGISTRATION_ERROR_MESSAGE },
      { status: 400 }
    )
  }

  const id = nanoid()
  const passwordHash = await hashPassword(password)
  const now = new Date().toISOString()

  try {
    await db
      .prepare(`
        INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(id, email.toLowerCase().trim(), passwordHash, name.trim(), role, now, now)
      .run()
  } catch {
    return NextResponse.json(
      { error: REGISTRATION_ERROR_MESSAGE },
      { status: 500 }
    )
  }

  return NextResponse.json({
    id,
    email: email.toLowerCase().trim(),
    name: name.trim(),
    role
  })
}
