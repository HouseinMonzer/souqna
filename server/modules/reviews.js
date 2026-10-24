const { prisma } = require('../lib/prisma')
const { createRouter } = require('../lib/router')
const { z, id, pageQuery, paginate } = require('../lib/validation')
const { forbidden, notFound } = require('../lib/errors')
const { sanitizeOrNull } = require('../lib/sanitize')
const { mapReview } = require('../lib/mappers')
const { limiters } = require('../middleware/security')
const { requireUser } = require('../middleware/auth')
const { findPublicProduct } = require('./catalog')

const { router, get, post, delete: del } = createRouter({ tag: 'Reviews' })

const reviewInclude = { user: { include: { profile: true } } }

// Keeps the denormalised rating columns on Product and Vendor in sync.
async function recomputeRatings(tx, productId) {
  const product = await tx.product.findUnique({ where: { id: productId }, select: { vendorId: true } })
  const [productStats, vendorStats] = await Promise.all([
    tx.review.aggregate({ where: { productId }, _avg: { rating: true }, _count: true }),
    tx.review.aggregate({ where: { product: { vendorId: product.vendorId } }, _avg: { rating: true }, _count: true }),
  ])
  const round = value => Math.round((value || 0) * 100) / 100
  await tx.product.update({
    where: { id: productId },
    data: { rating: round(productStats._avg.rating), totalReviews: productStats._count },
  })
  await tx.vendor.update({
    where: { id: product.vendorId },
    data: { rating: round(vendorStats._avg.rating), totalReviews: vendorStats._count },
  })
}

get('/products/:productId/reviews', {
  summary: 'Reviews for a product with a rating breakdown',
  params: z.object({ productId: id }),
  query: z.object(pageQuery),
}, async (req, res) => {
  const product = await findPublicProduct(req.params.productId)
  const { take, skip, page, limit } = paginate(req.query, 10)
  const where = { productId: product.id }
  const [reviews, total, groups] = await Promise.all([
    prisma.review.findMany({ where, include: reviewInclude, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip, take }),
    prisma.review.count({ where }),
    prisma.review.groupBy({ by: ['rating'], where, _count: true }),
  ])
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const group of groups) breakdown[group.rating] = group._count
  res.json({
    data: reviews.map(mapReview),
    total,
    page,
    limit,
    summary: { average: product.rating, count: product.totalReviews, breakdown },
  })
})

post('/products/:productId/reviews', {
  summary: 'Create or update your review (verified purchases only)',
  auth: true,
  middleware: [limiters.write, ...requireUser],
  params: z.object({ productId: id }),
  body: z.object({
    rating: z.coerce.number().int().min(1).max(5),
    title: z.string().trim().max(120).optional().nullable(),
    body: z.string().trim().max(2000).optional().nullable(),
  }),
}, async (req, res) => {
  const user = req.currentUser
  const product = await findPublicProduct(req.params.productId)

  const purchase = await prisma.orderItem.findFirst({
    where: {
      productId: product.id,
      order: { customer: { userId: user.id } },
      OR: [{ vendorStatus: 'delivered' }, { order: { status: 'delivered' } }],
    },
    select: { id: true },
  })
  if (!purchase) throw forbidden('You can review products after they have been delivered to you.')

  const data = { rating: req.body.rating, title: sanitizeOrNull(req.body.title), body: sanitizeOrNull(req.body.body) }
  const { review, created } = await prisma.$transaction(async tx => {
    const existing = await tx.review.findUnique({ where: { productId_userId: { productId: product.id, userId: user.id } } })
    const saved = existing
      ? await tx.review.update({ where: { id: existing.id }, data, include: reviewInclude })
      : await tx.review.create({ data: { ...data, productId: product.id, userId: user.id }, include: reviewInclude })
    await recomputeRatings(tx, product.id)
    return { review: saved, created: !existing }
  })
  res.status(created ? 201 : 200).json({ data: mapReview(review) })
})

del('/reviews/:id', {
  summary: 'Delete your review (or any review, as admin)',
  auth: true,
  middleware: [limiters.write, ...requireUser],
  params: z.object({ id }),
}, async (req, res) => {
  const user = req.currentUser
  const review = await prisma.review.findUnique({ where: { id: req.params.id } })
  if (!review || (review.userId !== user.id && user.profile?.role !== 'admin')) throw notFound('Review not found')
  await prisma.$transaction(async tx => {
    await tx.review.delete({ where: { id: review.id } })
    await recomputeRatings(tx, review.productId)
  })
  res.json({ data: true })
})

module.exports = { router }
