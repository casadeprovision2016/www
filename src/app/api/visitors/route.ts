import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'
import { nanoid } from 'nanoid'
import { VisitorInsertSchema } from '@/lib/validation/schemas'
import { sanitizeObject } from '@/lib/validation/sanitize'
import { apiRateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = apiRateLimit(request)
  if (rateLimitResult) {
    return rateLimitResult
  }

  const session = await getSession()
  if (!session || !['admin', 'leader'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await getDB()
  const { results } = await db
    .prepare('SELECT * FROM visitors ORDER BY visit_date DESC')
    .all()

  return NextResponse.json(results)
}

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = apiRateLimit(request)
  if (rateLimitResult) {
    return rateLimitResult
  }

  const session = await getSession()
  if (!session || !['admin', 'leader'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
  const validationResult = VisitorInsertSchema.safeParse(sanitizedBody)
  if (!validationResult.success) {
    return NextResponse.json(
      {
        error: 'Invalid input',
        details: validationResult.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
      },
      { status: 400 }
    )
  }

  const data = validationResult.data
  const db = await getDB()

  const id = nanoid()
  const now = new Date().toISOString()

  await db
    .prepare(`
      INSERT INTO visitors (
        id, full_name, email, phone, visit_date, source,
        interested_in, notes, followed_up, follow_up_needed,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      data.full_name?.trim(),
      data.email?.toLowerCase().trim() || null,
      data.phone?.trim() || null,
      data.visit_date,
      data.source?.trim() || null,
      data.interested_in ? JSON.stringify(data.interested_in) : null,
      data.notes?.trim() || null,
      data.followed_up ? 1 : 0,
      data.follow_up_needed ? 1 : 0,
      now,
      now
    )
    .run()

  return NextResponse.json({ id })
}
