const { prisma } = require('../lib/prisma')
const { createRouter } = require('../lib/router')
const { z, httpUrl, imageDataUrl } = require('../lib/validation')
const { uploadDataUrl } = require('../lib/storage')
const { mapSubscription } = require('../lib/mappers')
const { limiters } = require('../middleware/security')
const { requireVendorAccount } = require('../middleware/auth')

const { router, get, post } = createRouter({ tag: 'Subscriptions' })

const SUBSCRIPTION_PRICES = { monthly: '15.00', annual: '120.00' }
const PLAN_DAYS = { monthly: 30, annual: 365 }
const subscriptionInclude = { vendor: { select: { storeName: true, slug: true, logoUrl: true } } }

// True when the vendor still has another active plan that has not ended.
async function hasOtherActivePlan(db, vendorId, excludeId, now = new Date()) {
  const count = await db.vendorSubscription.count({
    where: { vendorId, status: 'active', id: { not: excludeId }, OR: [{ endDate: null }, { endDate: { gte: now } }] },
  })
  return count > 0
}

post('/subscriptions', {
  summary: 'Request a vendor subscription (pending admin approval)',
  auth: true,
  middleware: [limiters.upload, ...requireVendorAccount],
  body: z.object({
    plan: z.enum(['monthly', 'annual']),
    paymentMethod: z.enum(['wish_money', 'omt', 'cash_delivery', 'credit_card']),
    paymentProof: z.union([imageDataUrl, httpUrl]).optional().nullable(),
    shippingAddress: z.string().max(500).optional().nullable(),
  }),
}, async (req, res) => {
  const input = req.body
  const proofUrl = input.paymentProof?.startsWith('data:')
    ? (await uploadDataUrl(input.paymentProof, 'payment-proof')).url
    : input.paymentProof || null
  const sub = await prisma.vendorSubscription.create({
    data: {
      vendorId: req.currentUser.vendor.id,
      plan: input.plan,
      status: 'pending_payment',
      paymentMethod: input.paymentMethod,
      amount: SUBSCRIPTION_PRICES[input.plan],
      paymentProof: proofUrl,
    },
    include: subscriptionInclude,
  })
  res.status(201).json({ data: mapSubscription(sub) })
})

get('/subscriptions/my', { summary: 'Your latest subscription', auth: true, middleware: requireVendorAccount }, async (req, res) => {
  const sub = await prisma.vendorSubscription.findFirst({
    where: { vendorId: req.currentUser.vendor.id },
    orderBy: { createdAt: 'desc' },
    include: subscriptionInclude,
  })
  res.json({ data: mapSubscription(sub) })
})

module.exports = { router, PLAN_DAYS, subscriptionInclude, hasOtherActivePlan }
