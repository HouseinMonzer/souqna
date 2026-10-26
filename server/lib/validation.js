const { z } = require('zod')

const id = z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/, 'Invalid id')
const slug = z.string().trim().min(1).max(200).regex(/^[\p{L}\p{N}_-]+$/u, 'Invalid slug')

const httpUrl = z.string().trim().max(2048).url().refine(value => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}, 'URL must start with http:// or https://')

const optionalHttpUrl = httpUrl.nullable().optional().or(z.literal(''))

// Social fields accept either a handle (@name) or a full http(s) URL.
const socialHandleOrUrl = z.union([
  z.string().trim().regex(/^@?[\p{L}\p{N}._-]{1,100}$/u, 'Enter a handle or a full URL'),
  httpUrl,
]).nullable().optional().or(z.literal(''))

const imageDataUrl = z.string().max(8 * 1024 * 1024).regex(/^data:image\/[a-z0-9.+-]+;base64,/i, 'Expected an image data URL')

const MAX_PAGE_SIZE = 50

// Larger page sizes are clamped rather than rejected so older clients keep working.
const pageQuery = {
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).transform(n => Math.min(n, MAX_PAGE_SIZE)).optional(),
}

const paginate = ({ page, limit }, defaultLimit = 20) => {
  const take = limit ?? defaultLimit
  return { take, skip: (page - 1) * take, page, limit: take }
}

const searchTerm = z.string().trim().max(200).optional()

class ValidationError extends Error {
  constructor(error) {
    const first = error.issues[0]
    const field = first?.path?.length ? `${first.path.join('.')}: ` : ''
    super(first ? `${field}${first.message}` : 'Invalid request')
    this.status = 400
    this.errors = z.flattenError(error)
  }
}

// `?status=&search=` from forms means "no filter", not an invalid value.
const withoutEmpty = query => Object.fromEntries(Object.entries(query ?? {}).filter(([, v]) => v !== ''))

// Validates and replaces req.params / req.query / req.body with the parsed
// output. Express 4 allows reassigning req.query directly.
function validate({ params, query, body } = {}) {
  const schemas = { params, query, body }
  return (req, _res, next) => {
    for (const [key, schema] of Object.entries(schemas)) {
      if (!schema) continue
      const input = key === 'query' ? withoutEmpty(req.query) : (req[key] ?? {})
      const result = schema.safeParse(input)
      if (!result.success) return next(new ValidationError(result.error))
      req[key] = result.data
    }
    next()
  }
}

module.exports = {
  z,
  id,
  slug,
  httpUrl,
  optionalHttpUrl,
  socialHandleOrUrl,
  imageDataUrl,
  pageQuery,
  paginate,
  MAX_PAGE_SIZE,
  searchTerm,
  validate,
  ValidationError,
}
