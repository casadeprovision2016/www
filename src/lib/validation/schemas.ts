import { z } from 'zod'

// Role enum for validation
export const RoleSchema = z.enum(['admin', 'leader', 'member'])

// Auth schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must not exceed 100 characters'),
  role: RoleSchema,
})

// Visitor schemas
export const VisitorInsertSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  visit_date: z.string().datetime().optional(),
  source: z.string().max(100).nullable().optional(),
  interested_in: z.array(z.string()).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  followed_up: z.boolean().optional(),
  follow_up_needed: z.boolean().optional(),
})

export const VisitorUpdateSchema = VisitorInsertSchema.partial()

// Member schemas
export const MemberInsertSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  address: z.string().max(200).nullable().optional(),
  birth_date: z.string().datetime().nullable().optional(),
  baptism_date: z.string().datetime().nullable().optional(),
  membership_date: z.string().datetime().nullable().optional(),
  status: z.enum(['active', 'inactive']).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
})

export const MemberUpdateSchema = MemberInsertSchema.partial()

// Event schemas
export const EventInsertSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).nullable().optional(),
  event_date: z.string().datetime(),
  end_date: z.string().datetime().nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  event_type: z.string().max(50).nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  status: z.enum(['scheduled', 'ongoing', 'completed', 'cancelled']).optional(),
  follow_up_needed: z.boolean().optional(),
  created_by: z.string().nullable().optional(),
})

export const EventUpdateSchema = EventInsertSchema.partial()

// Ministry schemas
export const MinistryInsertSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(1000).nullable().optional(),
  leader_id: z.string().nullable().optional(),
  meeting_schedule: z.string().max(200).nullable().optional(),
  status: z.enum(['active', 'inactive']).nullable().optional(),
})

export const MinistryUpdateSchema = MinistryInsertSchema.partial()

// Donation schemas
export const DonationInsertSchema = z.object({
  donor_name: z.string().min(1, 'Donor name is required').max(100),
  amount: z.number().positive('Amount must be positive'),
  donation_type: z.enum(['offering', 'tithe', 'special', 'other']).nullable().optional(),
  payment_method: z.enum(['cash', 'check', 'card', 'bank_transfer', 'other']).nullable().optional(),
  donation_date: z.string().datetime(),
  notes: z.string().max(2000).nullable().optional(),
  receipt_number: z.string().max(100).nullable().optional(),
  follow_up_needed: z.boolean().optional(),
})

export const DonationUpdateSchema = DonationInsertSchema.partial()

// Pastoral visit schemas
export const PastoralVisitInsertSchema = z.object({
  member_id: z.string().nullable().optional(),
  visitor_id: z.string().nullable().optional(),
  visit_date: z.string().datetime(),
  visit_type: z.enum(['home', 'hospital', 'phone', 'video', 'other']).nullable().optional(),
  pastor_id: z.string().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  follow_up_needed: z.boolean().optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled']).nullable().optional(),
})

export const PastoralVisitUpdateSchema = PastoralVisitInsertSchema.partial()

// Stream schemas
export const StreamInsertSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).nullable().optional(),
  stream_url: z.string().url('Invalid stream URL'),
  platform: z.enum(['youtube', 'facebook', 'twitch', 'zoom', 'other']).nullable().optional(),
  scheduled_date: z.string().datetime(),
  status: z.enum(['scheduled', 'live', 'ended', 'cancelled']).nullable().optional(),
  thumbnail_url: z.string().url().nullable().optional(),
  created_by: z.string().nullable().optional(),
})

export const StreamUpdateSchema = StreamInsertSchema.partial()

// ID param schema for route parameters
export const IdParamSchema = z.object({
  id: z.string().min(1),
})

export type LoginInput = z.infer<typeof LoginSchema>
export type RegisterInput = z.infer<typeof RegisterSchema>
export type VisitorInsertInput = z.infer<typeof VisitorInsertSchema>
export type VisitorUpdateInput = z.infer<typeof VisitorUpdateSchema>
export type MemberInsertInput = z.infer<typeof MemberInsertSchema>
export type MemberUpdateInput = z.infer<typeof MemberUpdateSchema>
