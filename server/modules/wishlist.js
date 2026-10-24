const { prisma } = require('../lib/prisma')
const { createRouter } = require('../lib/router')
const { z, id } = require('../lib/validation')
const { conflict } = require('../lib/errors')
const { mapProduct } = require('../lib/mappers')
const { limiters } = require('../middleware/security')
const { requireUser } = require('../middleware/auth')
const { publicProductWhere, productInclude, findPublicProduct } = require('./catalog')

const { router, get, post, delete: del } = createRouter({ tag: 'Wishlist' })

const MAX_WISHLIST_ITEMS = 200

get('/wishlist', { summary: 'Your saved products', auth: true, middleware: requireUser }, async (req, res) => {
  const items = await prisma.wishlistItem.findMany({
    where: { userId: req.currentUser.id, product: publicProductWhere },
    include: { product: { include: productInclude } },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ data: items.map(item => ({ ...mapProduct(item.product), added_at: item.createdAt })) })
})

post('/wishlist', {
  summary: 'Save a product',
  auth: true,
  middleware: [limiters.write, ...requireUser],
  body: z.object({ productId: id }),
}, async (req, res) => {
  const userId = req.currentUser.id
  const product = await findPublicProduct(req.body.productId)
  if (await prisma.wishlistItem.count({ where: { userId } }) >= MAX_WISHLIST_ITEMS) {
    throw conflict(`Your wishlist is limited to ${MAX_WISHLIST_ITEMS} items.`)
  }
  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId, productId: product.id } },
    update: {},
    create: { userId, productId: product.id },
  })
  res.status(201).json({ data: { product_id: product.id } })
})

del('/wishlist/:productId', {
  summary: 'Remove a saved product',
  auth: true,
  middleware: [limiters.write, ...requireUser],
  params: z.object({ productId: id }),
}, async (req, res) => {
  await prisma.wishlistItem.deleteMany({ where: { userId: req.currentUser.id, productId: req.params.productId } })
  res.json({ data: true })
})

module.exports = { router }
