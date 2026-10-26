const { prisma } = require('../lib/prisma')
const { createRouter } = require('../lib/router')
const { z, id, slug, pageQuery, paginate, searchTerm } = require('../lib/validation')
const { notFound } = require('../lib/errors')
const { mapCategory, mapProduct, mapVendor } = require('../lib/mappers')

const { router, get } = createRouter({ tag: 'Catalog' })

// A product is publicly visible only when it is live, approved, and its vendor
// is active with listings not hidden by a lapsed subscription.
const publicProductWhere = {
  status: 'active',
  approvalStatus: 'approved',
  vendor: { status: 'active', listingsHidden: false },
}

const productInclude = { productImages: true, productVariants: true, vendor: true, category: true }
const vendorInclude = { vendorSummary: true, user: { include: { profile: true } } }

const SORTS = {
  newest: { createdAt: 'desc' },
  'price-asc': { price: 'asc' },
  'price-desc': { price: 'desc' },
  rating: { rating: 'desc' },
  popular: { totalSold: 'desc' },
}

// Substring match on indexed columns (pg_trgm GIN). Trigram matching works the
// same for Arabic and Latin text, where stemming-based full-text search would not.
const searchWhere = term => ({
  OR: [
    { name: { contains: term, mode: 'insensitive' } },
    { shortDescription: { contains: term, mode: 'insensitive' } },
    { vendor: { storeName: { contains: term, mode: 'insensitive' } } },
  ],
})

get('/categories', { summary: 'Active categories' }, async (_req, res) => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })
  res.json({ data: categories.map(mapCategory) })
})

get('/vendors', {
  summary: 'Active vendors (paginated)',
  query: z.object({ ...pageQuery, search: searchTerm }),
}, async (req, res) => {
  const { take, skip, page, limit } = paginate(req.query, 50)
  const where = {
    status: 'active',
    ...(req.query.search ? { storeName: { contains: req.query.search, mode: 'insensitive' } } : {}),
  }
  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({ where, include: vendorInclude, orderBy: [{ joinedAt: 'desc' }, { id: 'asc' }], skip, take }),
    prisma.vendor.count({ where }),
  ])
  res.json({ data: vendors.map(mapVendor), total, page, limit })
})

get('/vendors/slug/:slug', { summary: 'Vendor storefront by slug', params: z.object({ slug }) }, async (req, res) => {
  const vendor = await prisma.vendor.findUnique({
    where: { slug: req.params.slug },
    include: { ...vendorInclude, socialLinks: true },
  })
  if (!vendor || vendor.status !== 'active') return res.status(404).json({ data: null })
  res.json({ data: mapVendor(vendor) })
})

get('/vendors/user/:userId', { summary: 'Vendor by owner user id', params: z.object({ userId: id }) }, async (req, res) => {
  const vendor = await prisma.vendor.findUnique({ where: { userId: req.params.userId }, include: vendorInclude })
  res.json({ data: vendor?.status === 'active' ? mapVendor(vendor) : null })
})

get('/vendors/:id', { summary: 'Vendor by id', params: z.object({ id }) }, async (req, res) => {
  const vendor = await prisma.vendor.findUnique({ where: { id: req.params.id }, include: vendorInclude })
  res.json({ data: vendor?.status === 'active' ? mapVendor(vendor) : null })
})

get('/products/related', {
  summary: 'Products in the same category',
  query: z.object({
    categoryId: id.optional(),
    excludeId: id.optional(),
    limit: z.coerce.number().int().min(1).max(12).default(3),
  }),
}, async (req, res) => {
  const { categoryId, excludeId, limit } = req.query
  if (!categoryId) return res.json({ data: [] })
  const products = await prisma.product.findMany({
    where: { ...publicProductWhere, categoryId, ...(excludeId ? { id: { not: excludeId } } : {}) },
    include: productInclude,
    take: limit,
    orderBy: { createdAt: 'desc' },
  })
  res.json({ data: products.map(mapProduct) })
})

get('/products/vendor/:vendorId', {
  summary: "A vendor's public products (paginated)",
  params: z.object({ vendorId: id }),
  query: z.object(pageQuery),
}, async (req, res) => {
  const { take, skip, page, limit } = paginate(req.query, 50)
  const where = { ...publicProductWhere, vendorId: req.params.vendorId }
  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, include: productInclude, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip, take }),
    prisma.product.count({ where }),
  ])
  res.json({ data: products.map(mapProduct), total, page, limit })
})

const productListQuery = z.object({
  ...pageQuery,
  search: searchTerm,
  q: searchTerm,
  category: id.optional(),
  categorySlug: slug.optional(),
  vendor: id.optional(),
  featured: z.enum(['true', 'false']).optional(),
  inStock: z.enum(['true', 'false']).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sort: z.enum(Object.keys(SORTS)).optional().catch(undefined),
})

get('/products', { summary: 'Search and filter public products', query: productListQuery }, async (req, res) => {
  const q = req.query
  const { take, skip, page, limit } = paginate(q, 12)
  const term = q.search || q.q
  const where = {
    ...publicProductWhere,
    ...(q.category ? { categoryId: q.category } : {}),
    ...(q.categorySlug ? { category: { slug: q.categorySlug } } : {}),
    ...(q.vendor ? { vendorId: q.vendor } : {}),
    ...(q.featured === 'true' ? { featured: true } : {}),
    ...(q.inStock === 'true' ? { stock: { gt: 0 } } : {}),
    ...(q.minRating !== undefined ? { rating: { gte: q.minRating } } : {}),
    ...(q.minPrice !== undefined || q.maxPrice !== undefined ? {
      price: {
        ...(q.minPrice !== undefined ? { gte: q.minPrice } : {}),
        ...(q.maxPrice !== undefined ? { lte: q.maxPrice } : {}),
      },
    } : {}),
    ...(term ? searchWhere(term) : {}),
  }
  // The id tie-breaker keeps page boundaries stable when sort values repeat.
  const orderBy = [SORTS[q.sort] || SORTS.newest, { id: 'asc' }]

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, include: productInclude, skip, take, orderBy }),
    prisma.product.count({ where }),
  ])
  res.json({ data: products.map(mapProduct), total, page, limit })
})

get('/products/:slug', { summary: 'Public product by slug', params: z.object({ slug }) }, async (req, res) => {
  const product = await prisma.product.findFirst({
    where: { ...publicProductWhere, slug: req.params.slug },
    include: productInclude,
  })
  if (!product) return res.status(404).json({ data: null, message: 'Product not found' })
  res.json({ data: mapProduct(product) })
})

get('/search/suggest', {
  summary: 'Typeahead suggestions for products and vendors',
  query: z.object({ q: z.string().trim().min(2).max(100) }),
}, async (req, res) => {
  const term = req.query.q
  const [products, vendors] = await Promise.all([
    prisma.product.findMany({
      where: { ...publicProductWhere, name: { contains: term, mode: 'insensitive' } },
      select: { id: true, name: true, slug: true, price: true, productImages: { where: { isPrimary: true }, take: 1 } },
      orderBy: [{ totalSold: 'desc' }, { id: 'asc' }],
      take: 5,
    }),
    prisma.vendor.findMany({
      where: { status: 'active', storeName: { contains: term, mode: 'insensitive' } },
      select: { id: true, storeName: true, slug: true, logoUrl: true },
      orderBy: [{ totalSales: 'desc' }, { id: 'asc' }],
      take: 3,
    }),
  ])
  res.json({
    data: {
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        primary_image: p.productImages[0]?.imageUrl || null,
      })),
      vendors: vendors.map(v => ({ id: v.id, store_name: v.storeName, slug: v.slug, logo_url: v.logoUrl })),
    },
  })
})

// Throws 404 unless the product is publicly visible.
async function findPublicProduct(productId) {
  const product = await prisma.product.findFirst({ where: { ...publicProductWhere, id: productId } })
  if (!product) throw notFound('Product not found')
  return product
}

module.exports = { router, publicProductWhere, productInclude, findPublicProduct }
