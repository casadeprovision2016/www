export const runtime = "edge"


import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'
import { nanoid } from 'nanoid'
import { StreamInsertSchema } from '@/lib/validation/schemas'
import { sanitizeObject } from '@/lib/validation/sanitize'
import { apiRateLimit } from '@/lib/rate-limit'

// Public endpoint - no auth required
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = apiRateLimit(request)
  if (rateLimitResult) {
    return rateLimitResult
  }

  const db = await getDB()
  const { results } = await db
    .prepare(`
      SELECT * FROM streams
      ORDER BY scheduled_date ASC
    `)
    .all()

  return NextResponse.json(results)
}

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = apiRateLimit(request)
  if (rateLimitResult) {
    return rateLimitResult
  }

  // Add auth check - requires admin/leader role
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
  const validationResult = StreamInsertSchema.safeParse(sanitizedBody)
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
      INSERT INTO streams (
        id, title, description, stream_url, platform, 
        scheduled_date, status, thumbnail_url, created_by, 
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      data.title?.trim(),
      data.description?.trim() || null,
      data.stream_url,
      data.platform || null,
      data.scheduled_date,
      data.status || 'scheduled',
      data.thumbnail_url || null,
      session.userId,
      now,
      now
    )
    .run()

  return NextResponse.json({ id })
}
