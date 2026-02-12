export const runtime = "edge"


import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'
import { PastoralVisitUpdateSchema, IdParamSchema } from '@/lib/validation/schemas'
import { sanitizeObject } from '@/lib/validation/sanitize'
import { apiRateLimit } from '@/lib/rate-limit'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Apply rate limiting
  const rateLimitResult = apiRateLimit(request)
  if (rateLimitResult) {
    return rateLimitResult
  }

  const session = await getSession()
  if (!session || !['admin', 'leader'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Validate ID parameter
  const idValidation = IdParamSchema.safeParse({ id })
  if (!idValidation.success) {
    return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
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
  const validationResult = PastoralVisitUpdateSchema.safeParse(sanitizedBody)
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

  const updates: string[] = []
  const values: unknown[] = []

  if (data.member_id !== undefined) {
    updates.push('member_id = ?')
    values.push(data.member_id || null)
  }
  if (data.visitor_id !== undefined) {
    updates.push('visitor_id = ?')
    values.push(data.visitor_id || null)
  }
  if (data.visit_date !== undefined) {
    updates.push('visit_date = ?')
    values.push(data.visit_date)
  }
  if (data.visit_type !== undefined) {
    updates.push('visit_type = ?')
    values.push(data.visit_type)
  }
  if (data.pastor_id !== undefined) {
    updates.push('pastor_id = ?')
    values.push(data.pastor_id || null)
  }
  if (data.notes !== undefined) {
    updates.push('notes = ?')
    values.push(data.notes?.trim() || null)
  }
  if (data.follow_up_needed !== undefined) {
    updates.push('follow_up_needed = ?')
    values.push(data.follow_up_needed ? 1 : 0)
  }
  if (data.status !== undefined) {
    updates.push('status = ?')
    values.push(data.status)
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  updates.push('updated_at = ?')
  values.push(new Date().toISOString())
  values.push(id)

  await db
    .prepare(`UPDATE pastoral_visits SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run()

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Apply rate limiting
  const rateLimitResult = apiRateLimit(request)
  if (rateLimitResult) {
    return rateLimitResult
  }

  const session = await getSession()
  if (!session || !['admin', 'leader'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Validate ID parameter
  const idValidation = IdParamSchema.safeParse({ id })
  if (!idValidation.success) {
    return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
  }

  const db = await getDB()

  await db.prepare('DELETE FROM pastoral_visits WHERE id = ?').bind(id).run()

  return NextResponse.json({ success: true })
}
