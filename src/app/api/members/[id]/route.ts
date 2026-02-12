import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'
import { MemberUpdateSchema, IdParamSchema } from '@/lib/validation/schemas'
import { sanitizeObject } from '@/lib/validation/sanitize'
import { apiRateLimit } from '@/lib/rate-limit'

export async function GET(
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
  const result = await db
    .prepare('SELECT * FROM members WHERE id = ?')
    .bind(id)
    .first()

  if (!result) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(result)
}

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
  const validationResult = MemberUpdateSchema.safeParse(sanitizedBody)
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

  if (data.full_name !== undefined) {
    updates.push('full_name = ?')
    values.push(data.full_name.trim())
  }
  if (data.email !== undefined) {
    updates.push('email = ?')
    values.push(data.email?.toLowerCase().trim() || null)
  }
  if (data.phone !== undefined) {
    updates.push('phone = ?')
    values.push(data.phone?.trim() || null)
  }
  if (data.address !== undefined) {
    updates.push('address = ?')
    values.push(data.address?.trim() || null)
  }
  if (data.birth_date !== undefined) {
    updates.push('birth_date = ?')
    values.push(data.birth_date)
  }
  if (data.baptism_date !== undefined) {
    updates.push('baptism_date = ?')
    values.push(data.baptism_date)
  }
  if (data.membership_date !== undefined) {
    updates.push('membership_date = ?')
    values.push(data.membership_date)
  }
  if (data.status !== undefined) {
    updates.push('status = ?')
    values.push(data.status)
  }
  if (data.notes !== undefined) {
    updates.push('notes = ?')
    values.push(data.notes?.trim() || null)
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  updates.push('updated_at = ?')
  values.push(new Date().toISOString())
  values.push(id)

  await db
    .prepare(`UPDATE members SET ${updates.join(', ')} WHERE id = ?`)
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

  await db.prepare('DELETE FROM members WHERE id = ?').bind(id).run()

  return NextResponse.json({ success: true })
}
