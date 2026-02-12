import { z } from 'zod'

// Sanitization patterns
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /<object[^>]*>.*?<\/object>/gi,
  /<embed[^>]*>/gi,
  /<applet[^>]*>.*?<\/applet>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onclick, onload, etc.
  /<\s*img[^>]*onerror\s*=/gi,
]

// HTML entity encoding
export function encodeHtmlEntities(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// Remove potentially dangerous HTML/JS
export function sanitizeString(str: string): string {
  let sanitized = str

  // Remove script tags and other dangerous elements
  XSS_PATTERNS.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, '')
  })

  // Trim whitespace
  sanitized = sanitized.trim()

  return sanitized
}

// Sanitize object recursively
export function sanitizeObject<T>(obj: T): T {
  if (typeof obj === 'string') {
    return sanitizeString(obj) as unknown as T
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value)
    }
    return sanitized as T
  }

  return obj
}

// Zod transformer for sanitized strings
export const sanitizedString = (maxLength?: number) =>
  z
    .string()
    .transform((val) => sanitizeString(val))
    .refine((val) => {
      if (maxLength && val.length > maxLength) {
        return false
      }
      return true
    }, `String exceeds maximum length of ${maxLength} characters`)

// Validation helper that sanitizes and validates
export function validateAndSanitize<T>(schema: z.ZodType<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  // First sanitize the input
  const sanitized = sanitizeObject(data)

  // Then validate
  const result = schema.safeParse(sanitized)

  if (!result.success) {
    return { success: false, errors: result.error }
  }

  return { success: true, data: result.data }
}
