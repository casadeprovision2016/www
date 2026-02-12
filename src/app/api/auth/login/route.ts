import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db/client'
import { verifyPassword } from '@/lib/auth/password'
import { createSession } from '@/lib/auth/session'
import { LoginSchema } from '@/lib/validation/schemas'
import { sanitizeObject } from '@/lib/validation/sanitize'
import { strictRateLimit } from '@/lib/rate-limit'

// Generic error message to prevent user enumeration
const AUTH_ERROR_MESSAGE = 'Invalid email or password'

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

  // Validate input
  const validationResult = LoginSchema.safeParse(sanitizedBody)
  if (!validationResult.success) {
    return NextResponse.json(
      {
        error: 'Invalid input',
        details: validationResult.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
      },
      { status: 400 }
    )
  }

  const { email, password } = validationResult.data

  const db = await getDB()

  const user = await db
    .prepare('SELECT id, email, name, role, password_hash FROM users WHERE email = ?')
    .bind(email.toLowerCase().trim())
    .first<{ id: string; email: string; name: string; role: 'admin' | 'leader' | 'member'; password_hash: string }>()

  if (!user) {
    return NextResponse.json({ error: AUTH_ERROR_MESSAGE }, { status: 401 })
  }

  const isValid = await verifyPassword(password, user.password_hash)

  if (!isValid) {
    return NextResponse.json({ error: AUTH_ERROR_MESSAGE }, { status: 401 })
  }

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  })
}
