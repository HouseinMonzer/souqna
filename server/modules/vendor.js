const { prisma } = require('../lib/prisma')
const { createRouter } = require('../lib/router')
const { z, id, httpUrl, optionalHttpUrl, socialHandleOrUrl, imageDataUrl } = require('../lib/validation')
const { conflict, notFound, badRequest } = require('../lib/errors')
const { sanitizeText, sanitizeOrNull, slugify } = require('../lib/sanitize')
const { uploadDataUrl, deleteFiles } = require('../lib/storage')
const { mapProduct, mapVendor, mapProfile, mapCustomer } = require('../lib/mappers')
const { limiters } = require('../middleware/security')
const { requireUser, requireVendor, requireVendorAccount, requireVendorOrAdmin } = require('../middleware/auth')
const { productInclude } = require('./catalog')

const { router, get, post, put, patch, delete: del } = createRouter({ tag: 'Vendor' })

const vendorWithRelations = { vendorSummary: true, socialLinks: true, user: { include: { profile: true } } }

async function uniqueProductSlug(name, currentId) {
  const base = slugify(name) || `product-${Date.now()}`
  for (let counter = 1; ; counter += 1) {
    const slug = counter === 1 ? base : `${base}-${counter}`
    const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true } })
    if (!existing || existing.id === currentId) return slug
  }
}

async function resolveCategory({ category, categoryId }) {
  if (categoryId) return prisma.category.findUnique({ where: { id: categoryId } })
  if (category) {
    const slug = slugify(category)
    return prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name: sanitizeText(category), slug, isActive: true },
    })
  }
  return undefined
}

const imageUploadBody = z.object({ imageData: imageDataUrl })

post('/upload', {
  summary: 'Upload an image (active vendors and admins)',
  auth: true,
  middleware: [limiters.upload, ...requireVendorOrAdmin],
  body: imageUploadBody.extend({ folder: z.string().trim().max(40).regex(/^[a-z0-9_-]*$/i).optional() }),
}, async (req, res) => {
  const { url, key } = await uploadDataUrl(req.body.imageData, (req.body.folder || 'product').toLowerCase())
  res.json({ url, publicId: key })
})

post('/vendor/setup', {
  summary: 'Turn the signed-in account into a vendor',
  auth: true,
  middleware: [limiters.write, ...requireUser],
  body: z.object({
    storeName: z.string().trim().min(2).max(100),
    description: z.string().max(2000).optional().nullable(),
    category: z.string().trim().max(100).optional().nullable(),
    location: z.string().trim().max(200).optional().nullable(),
    phone: z.string().trim().max(50).optional().nullable(),
    website: optionalHttpUrl,
  }),
}, async (req, res) => {
  const user = req.currentUser
  const input = req.body
  if (user.vendor) throw conflict('Already a vendor')

  const settings = await prisma.siteSettings.findUnique({ where: { id: 'singleton' } })
  const updated = await prisma.$transaction(async tx => {
    await tx.vendor.create({
      data: {
        userId: user.id,
        storeName: sanitizeText(input.storeName),
        businessName: sanitizeText(input.storeName),
        slug: `${slugify(input.storeName)}-${user.id.slice(0, 6)}`,
        description: sanitizeOrNull(input.description),
        category: sanitizeOrNull(input.category),
        location: sanitizeOrNull(input.location),
        phone: sanitizeOrNull(input.phone),
        website: input.website || null,
        status: settings?.autoApproveVendors ? 'active' : 'pending',
      },
    })
    await tx.profile.update({ where: { userId: user.id }, data: { role: 'vendor' } })
    return tx.user.findUnique({
      where: { id: user.id },
      include: { profile: true, customer: true, vendor: { include: { vendorSummary: true, user: { include: { profile: true } } } } },
    })
  })

  res.status(201).json({
    user: {
      id: updated.id,
      email: updated.email,
      profile: mapProfile(updated.profile),
      vendor: mapVendor(updated.vendor),
      customer: mapCustomer(updated.customer),
    },
  })
})

get('/vendor/me', {
  summary: "The signed-in vendor's store and products",
  auth: true,
  middleware: requireVendorAccount,
}, async (req, res) => {
  const vendor = req.currentUser.vendor
  const products = await prisma.product.findMany({
    where: { vendorId: vendor.id, status: { not: 'deleted' } },
    include: productInclude,
    orderBy: { createdAt: 'desc' },
  })
  res.json({
    success: true,
    data: {
      ...mapVendor(vendor),
      listings_hidden: vendor.listingsHidden,
      name: vendor.storeName,
      category: vendor.category || vendor.mission || 'General',
      sales: vendor.totalSales,
      products: products.map(mapProduct),
      createdAt: vendor.joinedAt,
    },
  })
})

// Vendor-controllable fields only: approvalStatus, featured and the 'deleted'
// status are admin-only and never accepted here.
const productInputSchema = z.object({
  name: z.string().trim().min(2).max(200),
  description: z.string().max(5000).optional().nullable(),
  price: z.coerce.number().nonnegative().max(1_000_000).multipleOf(0.01),
  comparePrice: z.coerce.number().positive().max(1_000_000).multipleOf(0.01).optional().nullable(),
  category: z.string().trim().max(100).optional().nullable(),
  categoryId: id.optional().nullable(),
  stock: z.coerce.number().int().nonnegative().max(1_000_000).optional(),
  imageUrl: httpUrl.optional().nullable(),
  status: z.enum(['draft', 'active', 'inactive']).optional(),
})

function assertComparePrice(price, comparePrice) {
  if (comparePrice != null && price != null && comparePrice <= price) {
    throw badRequest('comparePrice: must be higher than the price')
  }
}

post('/vendor/products', {
  summary: 'Create a product',
  auth: true,
  middleware: [limiters.write, ...requireVendor],
  body: productInputSchema,
}, async (req, res) => {
  const vendor = req.currentUser.vendor
  const input = req.body
  assertComparePrice(input.price, input.comparePrice)
  const category = await resolveCategory(input)

  const product = await prisma.product.create({
    data: {
      vendorId: vendor.id,
      categoryId: category?.id || null,
      name: sanitizeText(input.name),
      slug: await uniqueProductSlug(input.name),
      description: sanitizeOrNull(input.description),
      shortDescription: sanitizeOrNull(input.description),
      price: input.price,
      comparePrice: input.comparePrice ?? null,
      stock: input.stock ?? 0,
      status: input.status || 'active',
      approvalStatus: 'approved',
      featured: false,
      productImages: input.imageUrl ? { create: { imageUrl: input.imageUrl, isPrimary: true } } : undefined,
    },
    include: productInclude,
  })
  res.status(201).json({ data: mapProduct(product) })
})

put('/vendor/products/:id', {
  summary: 'Update one of your products',
  auth: true,
  middleware: [limiters.write, ...requireVendor],
  params: z.object({ id }),
  body: productInputSchema.partial(),
}, async (req, res) => {
  const vendor = req.currentUser.vendor
  const input = req.body
  const existing = await prisma.product.findFirst({ where: { id: req.params.id, vendorId: vendor.id, status: { not: 'deleted' } } })
  if (!existing) throw notFound('Product not found')
  assertComparePrice(input.price ?? Number(existing.price), input.comparePrice)
  const category = await resolveCategory(input)

  const product = await prisma.product.update({
    where: { id: existing.id },
    data: {
      ...(input.name ? { name: sanitizeText(input.name), slug: await uniqueProductSlug(input.name, existing.id) } : {}),
      ...(input.description !== undefined ? {
        description: sanitizeOrNull(input.description),
        shortDescription: sanitizeOrNull(input.description),
      } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.comparePrice !== undefined ? { comparePrice: input.comparePrice } : {}),
      ...(input.stock !== undefined ? { stock: input.stock } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(category !== undefined ? { categoryId: category?.id || null } : {}),
    },
    include: productInclude,
  })
  res.json({ data: mapProduct(product) })
})

del('/vendor/products/:id', {
  summary: 'Delete one of your products (soft delete)',
  auth: true,
  middleware: [limiters.write, ...requireVendor],
  params: z.object({ id }),
}, async (req, res) => {
  const vendor = req.currentUser.vendor
  const product = await prisma.product.findFirst({
    where: { id: req.params.id, vendorId: vendor.id },
    include: { productImages: true },
  })
  if (!product) throw notFound('Product not found')

  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId: product.id } }),
    prisma.product.update({ where: { id: product.id }, data: { status: 'deleted' } }),
  ])
  await deleteFiles(product.productImages.map(img => img.publicId).filter(Boolean))
  res.json({ data: true })
})

const vendorProfileSchema = z.object({
  storeName: z.string().trim().min(2).max(100).optional(),
  description: z.string().max(2000).nullable().optional(),
  mission: z.string().max(500).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  website: optionalHttpUrl,
  whatsapp: z.string().trim().regex(/^\+?[\d\s()-]{0,30}$/, 'Enter a phone number').nullable().optional(),
  instagram: socialHandleOrUrl,
  facebook: socialHandleOrUrl,
  tiktok: socialHandleOrUrl,
  youtube: socialHandleOrUrl,
})

const TEXT_PROFILE_FIELDS = ['description', 'mission', 'location', 'address', 'phone', 'whatsapp', 'instagram', 'facebook', 'tiktok', 'youtube']

patch('/vendor/profile', {
  summary: 'Update your store profile',
  auth: true,
  middleware: [limiters.write, ...requireVendorAccount],
  body: vendorProfileSchema,
}, async (req, res) => {
  const input = req.body
  const data = {
    ...(input.storeName ? { storeName: sanitizeText(input.storeName) } : {}),
    ...(input.website !== undefined ? { website: input.website || null } : {}),
  }
  for (const field of TEXT_PROFILE_FIELDS) {
    if (input[field] !== undefined) data[field] = sanitizeOrNull(input[field])
  }
  const vendor = await prisma.vendor.update({
    where: { id: req.currentUser.vendor.id },
    data,
    include: vendorWithRelations,
  })
  res.json({ data: mapVendor(vendor) })
})

for (const kind of ['cover', 'logo']) {
  post(`/vendor/${kind}`, {
    summary: `Upload your store ${kind} image`,
    auth: true,
    middleware: [limiters.upload, ...requireVendorAccount],
    body: imageUploadBody,
  }, async (req, res) => {
    const previous = req.currentUser.vendor[`${kind}PublicId`]
    const { url, key } = await uploadDataUrl(req.body.imageData, `vendor-${kind}`)
    const vendor = await prisma.vendor.update({
      where: { id: req.currentUser.vendor.id },
      data: { [`${kind}Url`]: url, [`${kind}PublicId`]: key },
      include: vendorWithRelations,
    })
    if (previous) await deleteFiles([previous])
    res.json({ data: mapVendor(vendor), url })
  })
}

module.exports = { router }
