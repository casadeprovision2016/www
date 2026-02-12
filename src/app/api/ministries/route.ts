export const runtime = "edge"


import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'
import { nanoid } from 'nanoid'
import { MinistryInsertSchema } from '@/lib/validation/schemas'
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
    .prepare('SELECT * FROM ministries ORDER BY name ASC')
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
  const validationResult = MinistryInsertSchema.safeParse(sanitizedBody)
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
      INSERT INTO ministries (
        id, name, description, leader_id, meeting_schedule, 
        status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      data.name?.trim(),
      data.description?.trim() || null,
      data.leader_id || null,
      data.meeting_schedule?.trim() || null,
      data.status || 'active',
      now,
      now
    )
    .run()

  return NextResponse.json({ id })
}
