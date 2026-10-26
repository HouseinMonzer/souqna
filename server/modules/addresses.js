const { prisma } = require('../lib/prisma')
const { createRouter } = require('../lib/router')
const { z, id } = require('../lib/validation')
const { conflict, notFound } = require('../lib/errors')
const { sanitizeText, sanitizeOrNull } = require('../lib/sanitize')
const { mapAddress } = require('../lib/mappers')
const { limiters } = require('../middleware/security')
const { requireUser } = require('../middleware/auth')

const { router, get, post, patch, delete: del } = createRouter({ tag: 'Addresses' })

const MAX_ADDRESSES = 10

const addressSchema = z.object({
  label: z.string().trim().max(40).optional().nullable(),
  fullName: z.string().trim().min(1).max(200),
  phone: z.string().trim().regex(/^\+?[\d\s()-]{6,30}$/, 'Enter a phone number'),
  line1: z.string().trim().min(1).max(300),
  line2: z.string().trim().max(300).optional().nullable(),
  city: z.string().trim().min(1).max(100),
  region: z.string().trim().max(100).optional().nullable(),
  country: z.string().trim().regex(/^[A-Z]{2}$/, 'Use a 2-letter country code').default('LB'),
  postalCode: z.string().trim().max(20).optional().nullable(),
  isDefault: z.boolean().optional(),
})

const REQUIRED_TEXT = ['fullName', 'phone', 'line1', 'city']
const OPTIONAL_TEXT = ['label', 'line2', 'region', 'postalCode']

function toData(input) {
  const data = {}
  for (const field of REQUIRED_TEXT) if (input[field] !== undefined) data[field] = sanitizeText(input[field])
  for (const field of OPTIONAL_TEXT) if (input[field] !== undefined) data[field] = sanitizeOrNull(input[field])
  if (input.country !== undefined) data.country = input.country
  return data
}

const byDefaultThenNewest = [{ isDefault: 'desc' }, { createdAt: 'desc' }]

get('/addresses', { summary: 'Your saved addresses', auth: true, middleware: requireUser }, async (req, res) => {
  const addresses = await prisma.address.findMany({ where: { userId: req.currentUser.id }, orderBy: byDefaultThenNewest })
  res.json({ data: addresses.map(mapAddress) })
})

post('/addresses', {
  summary: 'Save an address',
  auth: true,
  middleware: [limiters.write, ...requireUser],
  body: addressSchema,
}, async (req, res) => {
  const userId = req.currentUser.id
  const address = await prisma.$transaction(async tx => {
    const count = await tx.address.count({ where: { userId } })
    if (count >= MAX_ADDRESSES) throw conflict(`You can save up to ${MAX_ADDRESSES} addresses.`)
    const isDefault = req.body.isDefault === true || count === 0
    if (isDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } })
    return tx.address.create({ data: { ...toData(req.body), userId, isDefault } })
  })
  res.status(201).json({ data: mapAddress(address) })
})

patch('/addresses/:id', {
  summary: 'Update a saved address',
  auth: true,
  middleware: [limiters.write, ...requireUser],
  params: z.object({ id }),
  body: addressSchema.partial().extend({ country: addressSchema.shape.country.removeDefault().optional() }),
}, async (req, res) => {
  const userId = req.currentUser.id
  const existing = await prisma.address.findFirst({ where: { id: req.params.id, userId } })
  if (!existing) throw notFound('Address not found')
  const address = await prisma.$transaction(async tx => {
    if (req.body.isDefault === true) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } })
    return tx.address.update({
      where: { id: existing.id },
      data: { ...toData(req.body), ...(req.body.isDefault === true ? { isDefault: true } : {}) },
    })
  })
  res.json({ data: mapAddress(address) })
})

del('/addresses/:id', {
  summary: 'Delete a saved address',
  auth: true,
  middleware: [limiters.write, ...requireUser],
  params: z.object({ id }),
}, async (req, res) => {
  const userId = req.currentUser.id
  const existing = await prisma.address.findFirst({ where: { id: req.params.id, userId } })
  if (!existing) throw notFound('Address not found')
  await prisma.$transaction(async tx => {
    await tx.address.delete({ where: { id: existing.id } })
    if (existing.isDefault) {
      const next = await tx.address.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } })
      if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } })
    }
  })
  res.json({ data: true })
})

module.exports = { router }
