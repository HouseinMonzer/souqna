const crypto = require('crypto')
const bcrypt = require('bcrypt')
const session = require('express-session')
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const FacebookStrategy = require('passport-facebook').Strategy
const env = require('../config/env')
const { prisma } = require('../lib/prisma')
const { createRouter } = require('../lib/router')
const { z } = require('../lib/validation')
const { HttpError } = require('../lib/errors')
const { mapAuthUser } = require('../lib/mappers')
const { sendVerificationEmail } = require('../lib/mailer')
const { limiters } = require('../middleware/security')
const { authUserInclude, setAuthCookie, clearAuthCookie, requireUser } = require('../middleware/auth')

const { router, get, post } = createRouter({ tag: 'Auth' })

const API_BASE = env.API_URL || `http://localhost:${env.PORT}`
const FRONTEND = env.CORS_ORIGINS?.[0] || 'http://localhost:5173'
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 12)

const email = z.string().trim().toLowerCase().email('Enter a valid email address')

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email,
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
})

const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required').max(128),
})

post('/auth/register', {
  summary: 'Create a customer account and send a verification email',
  middleware: [limiters.auth],
  body: registerSchema,
}, async (req, res) => {
  const input = req.body
  const conflictMessage = 'An account with this email already exists. Please sign in instead.'
  if (await prisma.user.findUnique({ where: { email: input.email } })) throw new HttpError(409, conflictMessage)

  const token = crypto.randomBytes(32).toString('hex')
  try {
    await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: await bcrypt.hash(input.password, 12),
        isVerified: false,
        emailVerificationToken: token,
        emailVerificationExpiry: new Date(Date.now() + VERIFICATION_TTL_MS),
        profile: { create: { fullName: input.name, role: 'customer' } },
        customer: { create: {} },
      },
    })
  } catch (error) {
    if (error?.code === 'P2002') throw new HttpError(409, conflictMessage)
    throw error
  }
  sendVerificationEmail(input.email, input.name, token)
  res.status(201).json({
    message: 'Account created! Please check your email to verify your account.',
    email: input.email,
    needsVerification: true,
  })
})

post('/auth/login', {
  summary: 'Sign in with email and password (sets the session cookie)',
  middleware: [limiters.auth],
  body: loginSchema,
}, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email }, include: authUserInclude })
  // Same message and comparable timing whether or not the account exists, so
  // the endpoint cannot be used to discover registered emails.
  const passwordValid = await bcrypt.compare(req.body.password, user?.passwordHash || DUMMY_PASSWORD_HASH)
  if (!user || !user.passwordHash || !passwordValid) throw new HttpError(401, 'Incorrect email or password.')

  if (!user.isVerified) {
    throw new HttpError(403, 'Please verify your email before signing in.', { needsVerification: true, email: user.email })
  }

  setAuthCookie(res, user)
  res.json({ user: mapAuthUser(user) })
})

get('/auth/me', { summary: 'Current user', auth: true, middleware: requireUser }, (req, res) => {
  res.json({ user: mapAuthUser(req.currentUser) })
})

post('/auth/logout', { summary: 'Clear the session cookie' }, (_req, res) => {
  clearAuthCookie(res)
  res.json({ message: 'Signed out successfully.' })
})

get('/auth/verify-email', {
  summary: 'Confirm an email address from the link sent at registration',
  query: z.object({ token: z.string().regex(/^[a-f0-9]{64}$/, 'Invalid verification link.') }),
}, async (req, res) => {
  const user = await prisma.user.findFirst({
    where: { emailVerificationToken: req.query.token, emailVerificationExpiry: { gt: new Date() } },
  })
  if (!user) throw new HttpError(400, 'Verification link is invalid or has expired.')

  const verified = await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, emailVerificationToken: null, emailVerificationExpiry: null },
    include: authUserInclude,
  })
  setAuthCookie(res, verified)
  res.json({ message: 'Email verified! Welcome to SouQna.', user: mapAuthUser(verified) })
})

post('/auth/resend-verification', {
  summary: 'Resend the verification email',
  middleware: [limiters.auth],
  body: z.object({ email }),
}, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email }, include: { profile: true } })
  // Always the same response so this cannot reveal whether an email exists.
  if (!user || user.isVerified) {
    return res.json({ message: 'If this email has a pending verification, a new email has been sent.' })
  }

  if (user.emailVerificationExpiry) {
    const issuedAt = user.emailVerificationExpiry.getTime() - VERIFICATION_TTL_MS
    const waitMs = 60_000 - (Date.now() - issuedAt)
    if (waitMs > 0) {
      const wait = Math.ceil(waitMs / 1000)
      throw new HttpError(429, `Please wait ${wait}s before requesting another email.`, { wait })
    }
  }

  const token = crypto.randomBytes(32).toString('hex')
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerificationToken: token, emailVerificationExpiry: new Date(Date.now() + VERIFICATION_TTL_MS) },
  })
  sendVerificationEmail(req.body.email, user.profile?.fullName || '', token)
  res.json({ message: 'Verification email sent. Please check your inbox.' })
})

// ─── OAuth ───────────────────────────────────────────────────────────────────

class OAuthLinkError extends Error {}

// Only links to an existing email account when the provider vouches that the
// email is verified. Otherwise anyone could create a provider account with a
// victim's address and take over their SouQna account.
async function resolveOAuthUser({ providerId, providerField, email, emailVerified, displayName, avatarUrl }) {
  const byProvider = await prisma.user.findUnique({ where: { [providerField]: providerId }, include: authUserInclude })
  if (byProvider) return byProvider

  if (email) {
    const byEmail = await prisma.user.findUnique({ where: { email } })
    if (byEmail) {
      if (!emailVerified) throw new OAuthLinkError('account_exists')
      return prisma.user.update({
        where: { id: byEmail.id },
        data: { [providerField]: providerId, isVerified: true },
        include: authUserInclude,
      })
    }
  }

  return prisma.user.create({
    data: {
      email: email || `${providerField}_${providerId}@oauth.local`,
      [providerField]: providerId,
      isVerified: true,
      profile: { create: { fullName: displayName, role: 'customer', avatarUrl } },
      customer: { create: {} },
    },
    include: authUserInclude,
  })
}

const verify = (providerField, isVerified) => async (_at, _rt, profile, done) => {
  try {
    const providerEmail = profile.emails?.[0]?.value?.toLowerCase() || null
    const user = await resolveOAuthUser({
      providerId: profile.id,
      providerField,
      email: providerEmail,
      emailVerified: isVerified(profile),
      displayName: profile.displayName || (providerEmail ? providerEmail.split('@')[0] : 'User'),
      avatarUrl: profile.photos?.[0]?.value || null,
    })
    done(null, user)
  } catch (err) {
    done(err)
  }
}

if (env.GOOGLE_CLIENT_ID) {
  passport.use(new GoogleStrategy({
    clientID: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${API_BASE}/api/auth/google/callback`,
    // Ties the callback to the browser session that started sign-in (prevents login CSRF).
    state: true,
  }, verify('googleId', p => p._json?.email_verified === true || p.emails?.[0]?.verified === true)))
}

if (env.FACEBOOK_APP_ID) {
  passport.use(new FacebookStrategy({
    clientID: env.FACEBOOK_APP_ID,
    clientSecret: env.FACEBOOK_APP_SECRET,
    callbackURL: `${API_BASE}/api/auth/facebook/callback`,
    profileFields: ['id', 'displayName', 'emails', 'photos'],
    state: true,
    // Facebook does not report whether the email is verified.
  }, verify('facebookId', () => false)))
}

passport.serializeUser((u, done) => done(null, u))
passport.deserializeUser((u, done) => done(null, u))

// The session only carries OAuth state during the provider round-trip, so it is
// mounted on the OAuth routes alone rather than on every API request.
const oauthSession = [
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: env.IS_PROD, sameSite: env.IS_PROD ? 'none' : 'lax', maxAge: 10 * 60 * 1000 },
  }),
  passport.initialize(),
  passport.session(),
]

const providers = {
  google: { configured: Boolean(env.GOOGLE_CLIENT_ID), scope: ['profile', 'email'] },
  facebook: { configured: Boolean(env.FACEBOOK_APP_ID), scope: ['email'] },
}

for (const [provider, { configured, scope }] of Object.entries(providers)) {
  get(`/auth/${provider}`, { summary: `Start ${provider} sign-in`, middleware: oauthSession }, (req, res, next) => {
    if (!configured) return res.redirect(`${FRONTEND}/login?error=${provider}_not_configured`)
    passport.authenticate(provider, { scope, session: true })(req, res, next)
  })

  get(`/auth/${provider}/callback`, { summary: `${provider} sign-in callback`, middleware: oauthSession }, (req, res, next) => {
    passport.authenticate(provider, { session: true }, (err, user) => {
      if (err instanceof OAuthLinkError) return res.redirect(`${FRONTEND}/login?error=${err.message}`)
      if (err || !user) return res.redirect(`${FRONTEND}/login?error=${provider}`)
      setAuthCookie(res, user)
      req.logout(() => {})
      res.redirect(`${FRONTEND}/auth/callback`)
    })(req, res, next)
  })
}

module.exports = { router }
