const { execFileSync } = require('node:child_process')
const path = require('node:path')

if (!process.env.TEST_DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL is not set. Run `eval "$(./scripts/test-db.sh start)"` first.')
}

// Each test file gets its own throwaway database, built by the real migration
// chain, so tests never touch existing data and the migrations are exercised
// on every run.
const ROOT = path.join(__dirname, '../..')
const database = `souqna_t_${process.pid}_${Date.now()}`
const dbScript = path.join(__dirname, 'db.js')
execFileSync(process.execPath, [dbScript, 'create', database], { env: process.env, stdio: 'inherit' })

const url = new URL(process.env.TEST_DATABASE_URL)
url.pathname = `/${database}`

process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = url.toString()
process.env.DIRECT_URL = url.toString()
process.env.JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-characters'
process.env.SESSION_SECRET = 'test-session-secret-that-is-at-least-32-chars'
process.env.CLIENT_ORIGIN = 'http://allowed.test'
delete process.env.UPLOADTHING_TOKEN

execFileSync('npx', ['prisma', 'migrate', 'deploy'], { cwd: ROOT, env: process.env, stdio: 'ignore' })

const jwt = require('jsonwebtoken')
const { app, prisma } = require('../app')

async function teardown() {
  await prisma.$disconnect()
  execFileSync(process.execPath, [dbScript, 'drop', database], { env: process.env, stdio: 'inherit' })
}

let counter = 0
const unique = prefix => `${prefix}-${process.pid}-${++counter}`

function cookieFor(user) {
  const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' })
  return `souqna_token=${token}`
}

async function createUser(role = 'customer', { vendorStatus = 'active' } = {}) {
  const email = `${unique(role)}@test.local`
  const user = await prisma.user.create({
    data: {
      email,
      isVerified: true,
      profile: { create: { fullName: `Test ${role}`, role } },
      customer: role === 'customer' ? { create: {} } : undefined,
      vendor: role === 'vendor'
        ? { create: { storeName: `Store ${counter}`, slug: unique('store'), status: vendorStatus } }
        : undefined,
    },
    include: { profile: true, customer: true, vendor: true },
  })
  return { user, cookie: cookieFor(user) }
}

async function createProduct(vendorId, overrides = {}) {
  return prisma.product.create({
    data: {
      vendorId,
      name: 'Test product',
      slug: unique('product'),
      price: 10,
      stock: 5,
      status: 'active',
      approvalStatus: 'approved',
      ...overrides,
    },
  })
}

module.exports = { app, prisma, createUser, createProduct, cookieFor, teardown }
