const jwt = require('jsonwebtoken')
const env = require('../config/env')
const { prisma } = require('../lib/prisma')

const AUTH_COOKIE = 'souqna_token'
const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000

const authUserInclude = {
  profile: true,
  customer: true,
  vendor: { include: { vendorSummary: true, user: { include: { profile: true } } } },
}

// The SPA (Vercel) and API (Railway) are on different sites, so the cookie must
// be SameSite=None in production. Cross-site writes are blocked by the CORS
// allow-list instead.
const cookieOptions = {
  httpOnly: true,
  secure: env.IS_PROD,
  sameSite: env.IS_PROD ? 'none' : 'lax',
  path: '/',
}

function signAuthToken(user) {
  return jwt.sign({ userId: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN })
}

function setAuthCookie(res, user) {
  const token = signAuthToken(user)
  res.cookie(AUTH_COOKIE, token, { ...cookieOptions, maxAge: AUTH_COOKIE_MAX_AGE })
  return token
}

function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, cookieOptions)
}

function authRequired(req, res, next) {
  const cookieToken = req.cookies?.[AUTH_COOKIE]
  const [scheme, headerToken] = (req.headers.authorization || '').split(' ')
  const token = cookieToken || (scheme === 'Bearer' ? headerToken : null)

  if (!token) return res.status(401).json({ message: 'Please sign in to continue.' })

  try {
    req.auth = jwt.verify(token, env.JWT_SECRET)
    return next()
  } catch (error) {
    const message = error.name === 'TokenExpiredError'
      ? 'Your session has expired. Please sign in again.'
      : 'Your session is invalid. Please sign in again.'
    return res.status(401).json({ message })
  }
}

async function loadUser(req, res, next) {
  const user = req.auth?.userId
    ? await prisma.user.findUnique({ where: { id: req.auth.userId }, include: authUserInclude })
    : null
  if (!user) return res.status(401).json({ message: 'Unauthorized' })
  req.currentUser = user
  return next()
}

const requireUser = [authRequired, loadUser]

const requireAdmin = [...requireUser, (req, res, next) => (
  req.currentUser.profile?.role === 'admin' ? next() : res.status(403).json({ message: 'Admin access required' })
)]

// Any vendor account, whatever its approval status (profile edits, subscriptions).
const requireVendorAccount = [...requireUser, (req, res, next) => (
  req.currentUser.vendor ? next() : res.status(403).json({ message: 'Vendor account required.' })
)]

// An approved vendor (selling actions).
const requireVendor = [...requireVendorAccount, (req, res, next) => (
  req.currentUser.vendor.status === 'active' ? next() : res.status(403).json({ message: 'Your vendor account is not active.' })
)]

const requireVendorOrAdmin = [...requireUser, (req, res, next) => {
  const user = req.currentUser
  if (user.profile?.role === 'admin' || user.vendor?.status === 'active') return next()
  return res.status(403).json({ message: 'An active vendor account is required to upload images.' })
}]

module.exports = {
  AUTH_COOKIE,
  authUserInclude,
  setAuthCookie,
  clearAuthCookie,
  authRequired,
  requireUser,
  requireAdmin,
  requireVendor,
  requireVendorAccount,
  requireVendorOrAdmin,
}
