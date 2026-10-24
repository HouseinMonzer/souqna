const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const cookieParser = require('cookie-parser')
const env = require('../config/env')
const { HttpError } = require('../lib/errors')

const UPLOAD_ROUTES = new Set(['/api/upload', '/api/vendor/cover', '/api/vendor/logo', '/api/subscriptions'])

const limiter = (limit, message) => rateLimit({
  windowMs: 60_000,
  limit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message },
})

const limiters = {
  global: limiter(env.IS_PROD ? 120 : 240, 'Too many requests, please slow down.'),
  auth: limiter(8, 'Too many auth attempts. Please wait a minute.'),
  order: limiter(20, 'Too many orders submitted. Please slow down.'),
  upload: limiter(30, 'Upload rate limit exceeded.'),
  write: limiter(60, 'Too many requests, please slow down.'),
}

function applySecurity(app) {
  // Railway sits behind one proxy hop; needed for correct req.ip and rate limiting.
  app.set('trust proxy', 1)
  app.disable('x-powered-by')

  // The API only serves JSON, so it gets the strictest possible CSP. The SPA's
  // CSP lives in client/vercel.json.
  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
    hsts: env.IS_PROD ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  }))

  app.use(cors({
    origin: (origin, cb) => {
      // Same-origin requests, server-to-server calls and curl send no Origin.
      if (!origin) return cb(null, true)
      if (!env.CORS_ORIGINS) return env.IS_PROD ? cb(new HttpError(403, `Origin ${origin} not allowed`)) : cb(null, true)
      if (env.CORS_ORIGINS.includes(origin)) return cb(null, true)
      return cb(new HttpError(403, `Origin ${origin} not allowed`))
    },
    credentials: true,
    exposedHeaders: ['X-Request-Id'],
  }))

  // Small JSON bodies everywhere; only image upload routes accept large payloads.
  const jsonSmall = express.json({ limit: '100kb' })
  const jsonLarge = express.json({ limit: '8mb' })
  app.use((req, res, next) => (UPLOAD_ROUTES.has(req.path) ? jsonLarge : jsonSmall)(req, res, next))
  app.use(cookieParser())
  app.use(limiters.global)
}

module.exports = { applySecurity, limiters }
