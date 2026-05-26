require('dotenv').config({ path: '.env.local' })
require('dotenv').config()

const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const { PrismaClient } = require('@prisma/client')
const { v2: cloudinary } = require('cloudinary')
const { z } = require('zod')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 4000
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN
const JWT_SECRET = process.env.JWT_SECRET || 'souqna-dev-jwt-secret-change-me'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
const authUserInclude = {
  profile: true,
  customer: true,
  vendor: { include: { vendorSummary: true, user: { include: { profile: true } } } },
}

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is not set. Using an insecure development fallback.')
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

app.use(cors({ origin: CLIENT_ORIGIN ? CLIENT_ORIGIN.split(',').map(origin => origin.trim()) : true, credentials: true }))
app.use(express.json({ limit: '8mb' }))
app.use(rateLimit({ windowMs: 60_000, limit: 240 }))

const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

// Make Express 4 handle async route errors automatically (like Express 5)
const Layer = require('express/lib/router/layer')
const origHandle = Layer.prototype.handle_request
Layer.prototype.handle_request = function(req, res, next) {
  const rv = origHandle.call(this, req, res, next)
  if (rv && typeof rv.then === 'function') rv.catch(next)
  return rv
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseBody(schema, req, res) {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid request body', errors: parsed.error.flatten() })
    return null
  }
  return parsed.data
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Please sign in to continue.' })
  }

  try {
    req.auth = jwt.verify(token, JWT_SECRET)
    return next()
  } catch (error) {
    const message = error.name === 'TokenExpiredError'
      ? 'Your session has expired. Please sign in again.'
      : 'Your session is invalid. Please sign in again.'
    return res.status(401).json({ message })
  }
}

async function getCurrentUser(req) {
  const userId = req.auth?.userId
  if (!userId) return null
  return prisma.user.findUnique({ where: { id: userId }, include: authUserInclude })

    // P2002 = unique constraint — another concurrent request already created this user
}

async function getAuthedUser(req, res) {
  const user = await getCurrentUser(req)
  if (!user) {
    res.status(401).json({ message: 'Unauthorized' })
    return null
  }
  return user
}

async function requireAdmin(req, res, next) {
  const user = await getAuthedUser(req, res)
  if (!user) return
  if (user.profile?.role !== 'admin') return res.status(403).json({ message: 'Admin access required' })
  req.currentUser = user
  return next()
}

function mapProfile(profile) {
  if (!profile) return null
  return {
    id: profile.id,
    role: profile.role,
    full_name: profile.fullName,
    avatar_url: profile.avatarUrl,
    phone: profile.phone,
    created_at: profile.createdAt,
    updated_at: profile.updatedAt,
  }
}

function mapCustomer(customer) {
  if (!customer) return null
  return {
    id: customer.id,
    user_id: customer.userId,
    created_at: customer.createdAt,
  }
}

function mapAuthUser(user) {
  return {
    id: user.id,
    email: user.email,
    profile: mapProfile(user.profile),
    vendor: mapVendor(user.vendor),
    customer: mapCustomer(user.customer),
  }
}

function signAuthToken(user) {
  return jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

function mapVendor(vendor) {
  if (!vendor) return null
  return {
    id: vendor.id,
    user_id: vendor.userId,
    store_name: vendor.storeName,
    business_name: vendor.businessName,
    slug: vendor.slug,
    logo_url: vendor.logoUrl,
    logo_public_id: vendor.logoPublicId,
    cover_url: vendor.coverUrl,
    cover_public_id: vendor.coverPublicId,
    description: vendor.description,
    mission: vendor.mission || vendor.category,
    location: vendor.location,
    address: vendor.address,
    email: vendor.email,
    phone: vendor.phone,
    website: vendor.website,
    whatsapp: vendor.whatsapp,
    instagram: vendor.instagram,
    facebook: vendor.facebook,
    tiktok: vendor.tiktok,
    youtube: vendor.youtube,
    verified: vendor.verified,
    status: vendor.status,
    rating: vendor.rating,
    total_reviews: vendor.totalReviews || vendor.vendorSummary?.reviews || 0,
    total_sales: vendor.totalSales,
    products_count: vendor.productsCount,
    joined_at: vendor.joinedAt,
    updated_at: vendor.updatedAt,
    profiles: vendor.user?.profile ? mapProfile(vendor.user.profile) : null,
    social_links: (vendor.socialLinks || []).map(sl => ({
      id: sl.id,
      vendor_id: sl.vendorId,
      platform: sl.platform,
      url: sl.url,
      created_at: sl.createdAt,
    })),
  }
}

function mapSubscription(sub) {
  if (!sub) return null
  return {
    id: sub.id,
    vendor_id: sub.vendorId,
    plan: sub.plan,
    status: sub.status,
    payment_method: sub.paymentMethod,
    amount: sub.amount,
    start_date: sub.startDate,
    end_date: sub.endDate,
    payment_proof: sub.paymentProof,
    admin_note: sub.adminNote,
    created_at: sub.createdAt,
    updated_at: sub.updatedAt,
    vendor: sub.vendor ? { store_name: sub.vendor.storeName, slug: sub.vendor.slug, logo_url: sub.vendor.logoUrl } : null,
  }
}

function mapCategory(category) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image_url: category.imageUrl,
    sort_order: category.sortOrder,
    is_active: category.isActive,
    created_at: category.createdAt,
  }
}

function mapProduct(product) {
  if (!product) return null
  const images = product.productImages || []
  const primaryImage = images.find(img => img.isPrimary) || images[0]
  return {
    id: product.id,
    vendor_id: product.vendorId,
    category_id: product.categoryId,
    name: product.name,
    slug: product.slug,
    short_description: product.shortDescription,
    description: product.description,
    price: product.price,
    compare_price: product.comparePrice,
    stock: product.stock,
    sku: product.sku,
    status: product.status,
    approval_status: product.approvalStatus,
    featured: product.featured,
    rating: product.rating,
    total_reviews: product.totalReviews,
    total_sold: product.totalSold,
    views: product.views,
    primary_image: primaryImage?.imageUrl || null,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
    product_images: images.map(img => ({
      id: img.id,
      product_id: img.productId,
      image_url: img.imageUrl,
      public_id: img.publicId,
      alt_text: img.altText,
      sort_order: img.sortOrder,
      is_primary: img.isPrimary,
      created_at: img.createdAt,
    })),
    product_variants: (product.productVariants || []).map(variant => ({
      id: variant.id,
      product_id: variant.productId,
      option_name: variant.optionName,
      option_value: variant.optionValue,
      price_adjustment: variant.priceAdjustment,
      stock: variant.stock,
      sku: variant.sku,
      created_at: variant.createdAt,
    })),
    vendors: product.vendor ? {
      id: product.vendor.id,
      store_name: product.vendor.storeName,
      slug: product.vendor.slug,
      logo_url: product.vendor.logoUrl,
      rating: product.vendor.rating,
      verified: product.vendor.verified,
      location: product.vendor.location,
    } : null,
    vendor: product.vendor ? {
      id: product.vendor.id,
      store_name: product.vendor.storeName,
      slug: product.vendor.slug,
      logo_url: product.vendor.logoUrl,
      rating: product.vendor.rating,
      verified: product.vendor.verified,
    } : null,
    categories: product.category ? mapCategory(product.category) : null,
    category: product.category ? mapCategory(product.category) : null,
  }
}

function mapOrder(order) {
  return {
    id: order.id,
    customer_id: order.customerId,
    order_number: order.orderNumber,
    status: order.status,
    subtotal: order.subtotal,
    shipping_cost: order.shippingCost,
    tax: order.tax,
    discount: order.discount,
    total: order.total,
    payment_status: order.paymentStatus,
    payment_method: order.paymentMethod,
    shipping_name: order.shippingName,
    shipping_address: order.shippingAddress,
    shipping_city: order.shippingCity,
    shipping_country: order.shippingCountry,
    shipping_phone: order.shippingPhone,
    tracking_number: order.trackingNumber,
    customer_note: order.customerNote,
    admin_note: order.adminNote,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
    order_items: (order.orderItems || []).map(item => ({
      id: item.id,
      order_id: item.orderId,
      product_id: item.productId,
      vendor_id: item.vendorId,
      variant_id: item.variantId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      product_name: item.productName,
      product_image: item.productImage,
      variant_info: item.variantInfo,
      vendor_status: item.vendorStatus,
      tracking_number: item.trackingNumber,
      created_at: item.createdAt,
      vendors: item.vendor ? mapVendor(item.vendor) : null,
      orders: item.order ? {
        order_number: item.order.orderNumber,
        status: item.order.status,
        created_at: item.order.createdAt,
        shipping_name: item.order.shippingName,
      } : null,
    })),
  }
}

async function uniqueProductSlug(name, currentId) {
  const base = slugify(name) || `product-${Date.now()}`
  let slug = base
  let counter = 2
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } })
    if (!existing || existing.id === currentId) return slug
    slug = `${base}-${counter}`
    counter += 1
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/upload', authRequired, async (req, res) => {
  const { imageData, folder } = req.body
  if (!imageData) return res.status(400).json({ message: 'No image data provided' })
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(503).json({ message: 'Image uploads not configured. Add CLOUDINARY_* variables to .env.local' })
  }
  const result = await cloudinary.uploader.upload(imageData, {
    folder: folder || 'souqna/products',
    resource_type: 'auto',
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  })
  res.json({ url: result.secure_url, publicId: result.public_id })
})

app.get('/api/categories', async (_req, res) => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })
  res.json({ data: categories.map(mapCategory) })
})

app.get('/api/vendors', async (req, res) => {
  const status = String(req.query.status || 'active')
  const vendors = await prisma.vendor.findMany({
    where: status ? { status } : undefined,
    include: { vendorSummary: true, user: { include: { profile: true } } },
    orderBy: { joinedAt: 'desc' },
  })
  res.json({ data: vendors.map(mapVendor) })
})

app.get('/api/vendors/slug/:slug', async (req, res) => {
  const vendor = await prisma.vendor.findUnique({
    where: { slug: req.params.slug },
    include: { vendorSummary: true, socialLinks: true, user: { include: { profile: true } } },
  })
  if (!vendor) return res.status(404).json({ data: null })
  res.json({ data: mapVendor(vendor) })
})

app.get('/api/vendors/user/:userId', async (req, res) => {
  const vendor = await prisma.vendor.findUnique({
    where: { userId: req.params.userId },
    include: { vendorSummary: true, user: { include: { profile: true } } },
  })
  res.json({ data: mapVendor(vendor) })
})

app.get('/api/vendors/:id', async (req, res) => {
  const vendor = await prisma.vendor.findUnique({
    where: { id: req.params.id },
    include: { vendorSummary: true, user: { include: { profile: true } } },
  })
  res.json({ data: mapVendor(vendor) })
})

app.get('/api/products/related', async (req, res) => {
  const categoryId = req.query.categoryId ? String(req.query.categoryId) : null
  if (!categoryId) return res.json({ data: [] })
  const products = await prisma.product.findMany({
    where: {
      categoryId,
      status: 'active',
      approvalStatus: 'approved',
      ...(req.query.excludeId ? { id: { not: String(req.query.excludeId) } } : {}),
    },
    include: { productImages: true, productVariants: true, vendor: true, category: true },
    take: Math.min(Number(req.query.limit) || 3, 12),
    orderBy: { createdAt: 'desc' },
  })
  res.json({ data: products.map(mapProduct) })
})

app.get('/api/products/vendor/:vendorId', async (req, res) => {
  const products = await prisma.product.findMany({
    where: { vendorId: req.params.vendorId, status: 'active', approvalStatus: 'approved' },
    include: { productImages: true, productVariants: true, vendor: true, category: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ data: products.map(mapProduct) })
})

app.get('/api/products', async (req, res) => {
  const take = Math.min(Number(req.query.limit) || 12, 100)
  const page = Math.max(Number(req.query.page) || 1, 1)
  const where = {
    status: 'active',
    approvalStatus: 'approved',
    ...(req.query.category ? { categoryId: String(req.query.category) } : {}),
    ...(req.query.featured === 'true' ? { featured: true } : {}),
    ...(req.query.minPrice ? { price: { gte: Number(req.query.minPrice) } } : {}),
    ...(req.query.maxPrice ? { price: { lte: Number(req.query.maxPrice) } } : {}),
    ...(req.query.search ? { name: { contains: String(req.query.search), mode: 'insensitive' } } : {}),
  }
  if (req.query.minPrice && req.query.maxPrice) {
    where.price = { gte: Number(req.query.minPrice), lte: Number(req.query.maxPrice) }
  }

  const sort = String(req.query.sort || '')
  const orderBy = sort === 'price-asc'
    ? { price: 'asc' }
    : sort === 'price-desc'
      ? { price: 'desc' }
      : sort === 'rating'
        ? { rating: 'desc' }
        : { createdAt: 'desc' }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { productImages: true, productVariants: true, vendor: true, category: true },
      skip: (page - 1) * take,
      take,
      orderBy,
    }),
    prisma.product.count({ where }),
  ])
  res.json({ data: products.map(mapProduct), total, page, limit: take })
})

app.get('/api/products/:slug', async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: { productImages: true, productVariants: true, vendor: true, category: true },
  })
  res.json({ data: mapProduct(product) })
})

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

app.post('/api/auth/register', wrap(async (req, res) => {
  const input = parseBody(registerSchema, req, res)
  if (!input) return

  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) {
    return res.status(409).json({ message: 'An account with this email already exists. Please sign in instead.' })
  }

  const passwordHash = await bcrypt.hash(input.password, 12)
  try {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        profile: { create: { fullName: input.name, role: 'customer' } },
        customer: { create: {} },
      },
      include: authUserInclude,
    })
    res.status(201).json({ token: signAuthToken(user), user: mapAuthUser(user) })
  } catch (error) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ message: 'An account with this email already exists. Please sign in instead.' })
    }
    throw error
  }
}))

app.post('/api/auth/login', wrap(async (req, res) => {
  const input = parseBody(loginSchema, req, res)
  if (!input) return

  const user = await prisma.user.findUnique({ where: { email: input.email }, include: authUserInclude })
  if (!user || !user.passwordHash) {
    return res.status(401).json({ message: 'No account found for this email address.' })
  }

  const passwordValid = await bcrypt.compare(input.password, user.passwordHash)
  if (!passwordValid) {
    return res.status(401).json({ message: 'The password you entered is incorrect.' })
  }

  res.json({ token: signAuthToken(user), user: mapAuthUser(user) })
}))

app.get('/api/auth/me', authRequired, wrap(async (req, res) => {
  const user = await getAuthedUser(req, res)
  if (!user) return
  res.json({ user: mapAuthUser(user) })
}))

const productInputSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  price: z.coerce.number().nonnegative(),
  category: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  stock: z.coerce.number().int().nonnegative().optional(),
  imageUrl: z.string().url().optional().nullable(),
  status: z.enum(['draft', 'active', 'inactive', 'deleted']).optional(),
  approvalStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
  featured: z.boolean().optional(),
})

const vendorSetupSchema = z.object({
  storeName: z.string().min(2).max(100),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal('')),
})

app.post('/api/vendor/setup', authRequired, async (req, res) => {
  const input = parseBody(vendorSetupSchema, req, res)
  if (!input) return
  const user = await getAuthedUser(req, res)
  if (!user) return
  if (user.vendor) return res.status(409).json({ message: 'Already a vendor' })
  let autoApprove = false
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'singleton' } })
    autoApprove = settings?.autoApproveVendors ?? false
  } catch {}
  const slug = `${slugify(input.storeName)}-${user.id.slice(0, 6)}`
  const vendor = await prisma.vendor.create({
    data: {
      userId: user.id,
      storeName: input.storeName,
      businessName: input.storeName,
      slug,
      description: input.description || null,
      category: input.category || null,
      location: input.location || null,
      phone: input.phone || null,
      website: input.website || null,
      status: autoApprove ? 'active' : 'pending',
      verified: false,
    },
  })
  await prisma.profile.update({ where: { userId: user.id }, data: { role: 'vendor' } })
  const updated = await prisma.user.findUnique({
    where: { id: user.id },
    include: { profile: true, customer: true, vendor: { include: { vendorSummary: true, user: { include: { profile: true } } } } },
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

app.get('/api/vendor/me', authRequired, async (req, res) => {
  const user = await getAuthedUser(req, res)
  if (!user) return
  if (!user.vendor) return res.status(404).json({ message: 'Not a vendor' })
  const vendor = user.vendor
  const products = await prisma.product.findMany({
    where: { vendorId: vendor.id, status: { not: 'deleted' } },
    include: { productImages: true, productVariants: true, vendor: true, category: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json({
    success: true,
    data: {
      ...mapVendor(vendor),
      name: vendor.storeName,
      category: vendor.category || vendor.mission || 'General',
      sales: vendor.totalSales,
      products: products.map(mapProduct),
      createdAt: vendor.joinedAt,
    },
  })
})

app.post('/api/vendor/products', authRequired, async (req, res) => {
  const input = parseBody(productInputSchema, req, res)
  if (!input) return
  const user = await getAuthedUser(req, res)
  if (!user) return
  if (!user.vendor) return res.status(403).json({ message: 'Not a vendor' })
  const vendor = user.vendor
  const category = input.categoryId
    ? await prisma.category.findUnique({ where: { id: input.categoryId } })
    : input.category
      ? await prisma.category.upsert({
          where: { slug: slugify(input.category) },
          update: { name: input.category, isActive: true },
          create: { name: input.category, slug: slugify(input.category), isActive: true },
        })
      : null

  const product = await prisma.product.create({
    data: {
      vendorId: vendor.id,
      categoryId: category?.id || null,
      name: input.name,
      slug: await uniqueProductSlug(input.name),
      description: input.description || null,
      shortDescription: input.description || null,
      price: input.price,
      stock: input.stock ?? 0,
      status: input.status || 'active',
      approvalStatus: input.approvalStatus || 'approved',
      featured: input.featured || false,
      productImages: input.imageUrl ? { create: { imageUrl: input.imageUrl, isPrimary: true } } : undefined,
    },
    include: { productImages: true, productVariants: true, vendor: true, category: true },
  })
  res.status(201).json({ data: mapProduct(product) })
})

app.put('/api/vendor/products/:id', authRequired, async (req, res) => {
  const input = parseBody(productInputSchema.partial(), req, res)
  if (!input) return
  const user = await getAuthedUser(req, res)
  if (!user) return
  if (!user.vendor) return res.status(403).json({ message: 'Not a vendor' })
  const vendor = user.vendor
  const existing = await prisma.product.findFirst({ where: { id: req.params.id, vendorId: vendor.id } })
  if (!existing) return res.status(404).json({ message: 'Product not found' })

  const category = input.category
    ? await prisma.category.upsert({
        where: { slug: slugify(input.category) },
        update: { name: input.category, isActive: true },
        create: { name: input.category, slug: slugify(input.category), isActive: true },
      })
    : input.categoryId
      ? await prisma.category.findUnique({ where: { id: input.categoryId } })
      : undefined

  const product = await prisma.product.update({
    where: { id: existing.id },
    data: {
      ...(input.name ? { name: input.name, slug: await uniqueProductSlug(input.name, existing.id) } : {}),
      ...(input.description !== undefined ? { description: input.description, shortDescription: input.description } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.stock !== undefined ? { stock: input.stock } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.approvalStatus ? { approvalStatus: input.approvalStatus } : {}),
      ...(input.featured !== undefined ? { featured: input.featured } : {}),
      ...(category !== undefined ? { categoryId: category?.id || null } : {}),
    },
    include: { productImages: true, productVariants: true, vendor: true, category: true },
  })
  res.json({ data: mapProduct(product) })
})

app.delete('/api/vendor/products/:id', authRequired, async (req, res) => {
  const user = await getAuthedUser(req, res)
  if (!user) return
  if (!user.vendor) return res.status(403).json({ message: 'Not a vendor' })
  const vendor = user.vendor
  const product = await prisma.product.findFirst({ where: { id: req.params.id, vendorId: vendor.id } })
  if (!product) return res.status(404).json({ message: 'Product not found' })
  await prisma.product.update({ where: { id: product.id }, data: { status: 'deleted' } })
  res.json({ data: true })
})

const orderSchema = z.object({
  customerId: z.string().optional(),
  cartItems: z.array(z.object({
    product_id: z.string(),
    variant_id: z.string().nullable().optional(),
    quantity: z.coerce.number().int().positive(),
    product: z.object({
      id: z.string().optional(),
      price: z.coerce.number(),
      name: z.string(),
      primary_image: z.string().nullable().optional(),
      vendor: z.object({ id: z.string() }),
    }),
  })).min(1),
  shippingInfo: z.record(z.string(), z.any()).optional(),
})

app.post('/api/orders', authRequired, async (req, res) => {
  const input = parseBody(orderSchema, req, res)
  if (!input) return
  const user = await getAuthedUser(req, res)
  if (!user) return
  const customer = user.customer || await prisma.customer.create({ data: { userId: user.id } })
  const subtotal = input.cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const tax = Number(input.shippingInfo?.tax || 0)
  const shippingCost = Number(input.shippingInfo?.shipping_cost || 0)
  const total = subtotal + tax + shippingCost

  const order = await prisma.order.create({
    data: {
      customerId: customer.id,
      orderNumber: `ORD-${Date.now()}`,
      subtotal,
      tax,
      shippingCost,
      total,
      shippingName: input.shippingInfo?.shipping_name || null,
      shippingAddress: input.shippingInfo?.shipping_address || null,
      shippingCity: input.shippingInfo?.shipping_city || null,
      shippingCountry: input.shippingInfo?.shipping_country || null,
      shippingPhone: input.shippingInfo?.shipping_phone || null,
      paymentMethod: input.shippingInfo?.payment_method || null,
      customerNote: input.shippingInfo?.customer_note || null,
      orderItems: {
        create: input.cartItems.map(item => ({
          productId: item.product_id,
          vendorId: item.product.vendor.id,
          variantId: item.variant_id || null,
          quantity: item.quantity,
          unitPrice: item.product.price,
          totalPrice: item.product.price * item.quantity,
          productName: item.product.name,
          productImage: item.product.primary_image || null,
        })),
      },
    },
    include: { orderItems: { include: { vendor: true } } },
  })
  res.status(201).json({ data: mapOrder(order) })
})

app.get('/api/orders/customer/:customerId', authRequired, async (req, res) => {
  const user = await getAuthedUser(req, res)
  if (!user) return
  if (user.customer?.id !== req.params.customerId && user.profile?.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }
  const orders = await prisma.order.findMany({
    where: { customerId: req.params.customerId },
    include: { orderItems: { include: { vendor: true } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ data: orders.map(mapOrder) })
})

app.get('/api/orders/vendor/:vendorId', authRequired, async (req, res) => {
  const user = await getAuthedUser(req, res)
  if (!user) return
  if (user.vendor?.id !== req.params.vendorId && user.profile?.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }
  const orderItems = await prisma.orderItem.findMany({
    where: { vendorId: req.params.vendorId },
    include: { order: true, vendor: true, product: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ data: orderItems.map(item => mapOrder({ ...item.order, orderItems: [item] }).order_items[0]) })
})

app.get('/api/admin/analytics', authRequired, requireAdmin, async (_req, res) => {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const [totalVendors, pendingVendors, totalCustomers, totalOrders, revenue, topVendors, recentOrders, monthlyOrders] = await Promise.all([
    prisma.vendor.count(),
    prisma.vendor.count({ where: { status: 'pending' } }),
    prisma.customer.count(),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.vendor.findMany({
      where: { status: 'active' },
      include: { _count: { select: { products: true, orderItems: true } } },
      orderBy: { totalSales: 'desc' },
      take: 5,
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, total: true },
    }),
  ])

  // Group orders by day-of-week for last 7 days
  const dayCount = Array(7).fill(0)
  recentOrders.forEach(o => {
    const daysAgo = Math.floor((now.getTime() - new Date(o.createdAt).getTime()) / (24 * 60 * 60 * 1000))
    if (daysAgo < 7) dayCount[6 - daysAgo] = (dayCount[6 - daysAgo] || 0) + 1
  })
  const ordersLast7Days = dayCount.map((count, i) => ({ day: String(i), count }))

  // Group by month for last 6 months
  const monthMap = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthMap[`${d.getFullYear()}-${d.getMonth() + 1}`] = { month: d.getMonth() + 1, year: d.getFullYear(), revenue: 0 }
  }
  monthlyOrders.forEach(o => {
    const d = new Date(o.createdAt)
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`
    if (monthMap[key]) monthMap[key].revenue += o.total || 0
  })
  const revenueByMonth = Object.values(monthMap)

  res.json({
    data: {
      totalVendors,
      pendingVendors,
      totalCustomers,
      totalOrders,
      totalRevenue: revenue._sum.total || 0,
      ordersLast7Days,
      revenueByMonth,
      topVendors: topVendors.map(vendor => ({
        id: vendor.id,
        storeName: vendor.storeName,
        orderCount: vendor._count.orderItems,
        productCount: vendor._count.products,
        revenue: vendor.totalSales,
      })),
    },
  })
})

app.get('/api/admin/vendors', authRequired, requireAdmin, async (req, res) => {
  const search = req.query.search ? String(req.query.search) : undefined
  const status = req.query.status ? String(req.query.status).toLowerCase() : undefined
  const page = Math.max(Number(req.query.page) || 1, 1)
  const limit = Math.min(Number(req.query.limit) || 20, 100)
  const skip = (page - 1) * limit
  const where = {
    ...(status ? { status } : {}),
    ...(search ? {
      OR: [
        { storeName: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ],
    } : {}),
  }
  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      include: {
        user: { include: { profile: true } },
        _count: { select: { products: true, orderItems: true } },
      },
      orderBy: { joinedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.vendor.count({ where }),
  ])
  res.json({
    data: {
      vendors: vendors.map(vendor => ({
        id: vendor.id,
        storeName: vendor.storeName,
        status: vendor.status.toUpperCase(),
        logoUrl: vendor.logoUrl,
        ownerName: vendor.user?.profile?.fullName || null,
        user: { email: vendor.user.email },
        _count: { products: vendor._count.products, orders: vendor._count.orderItems },
        revenue: vendor.totalSales || 0,
        joinedAt: vendor.joinedAt,
      })),
      total,
      page,
      limit,
    },
  })
})

app.patch('/api/admin/vendors/:id/status', authRequired, requireAdmin, async (req, res) => {
  const input = parseBody(z.object({
    status: z.enum(['pending', 'active', 'suspended', 'rejected']),
    reason: z.string().optional().nullable(),
  }), req, res)
  if (!input) return
  const vendor = await prisma.vendor.update({
    where: { id: req.params.id },
    data: { status: input.status },
    include: { user: { include: { profile: true } } },
  })
  // Write audit log (silently fails if table doesn't exist yet)
  try {
    const actor = req.currentUser
    const actionMap = { active: 'VENDOR_APPROVED', rejected: 'VENDOR_REJECTED', suspended: 'VENDOR_SUSPENDED' }
    const action = actionMap[input.status] || 'VENDOR_REACTIVATED'
    await prisma.auditLog.create({
      data: {
        actorId: actor?.id || 'system',
        action,
        targetType: 'vendor',
        targetId: vendor.id,
        targetName: vendor.storeName,
        details: input.reason ? { reason: input.reason } : undefined,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
      },
    })
  } catch {}
  res.json({ data: mapVendor(vendor) })
})

app.put('/api/admin/vendors/:id', authRequired, requireAdmin, async (req, res) => {
  const input = parseBody(z.object({
    store_name: z.string().optional(),
    business_name: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    mission: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    status: z.enum(['pending', 'active', 'suspended', 'rejected']).optional(),
  }), req, res)
  if (!input) return
  const vendor = await prisma.vendor.update({
    where: { id: req.params.id },
    data: {
      ...(input.store_name ? { storeName: input.store_name } : {}),
      ...(input.business_name !== undefined ? { businessName: input.business_name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.mission !== undefined ? { mission: input.mission } : {}),
      ...(input.location !== undefined ? { location: input.location } : {}),
      ...(input.status ? { status: input.status } : {}),
    },
    include: { vendorSummary: true, user: { include: { profile: true } } },
  })
  res.json({ data: mapVendor(vendor) })
})

app.get('/api/admin/products', authRequired, requireAdmin, async (req, res) => {
  const status = req.query.status ? String(req.query.status).toLowerCase() : undefined
  const search = req.query.search ? String(req.query.search) : undefined
  const page = Math.max(Number(req.query.page) || 1, 1)
  const limit = Math.min(Number(req.query.limit) || 20, 100)
  const skip = (page - 1) * limit
  const where = {
    ...(status === 'suspended' ? { status: 'inactive', approvalStatus: 'rejected' } : status ? { status: status === 'active' ? 'active' : status === 'draft' ? 'draft' : status } : { status: { not: 'deleted' } }),
    ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
  }
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { vendor: true, category: true, productImages: { where: { isPrimary: true }, take: 1 } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ])
  res.json({
    data: {
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        totalSold: product.totalSold,
        status: product.status.toUpperCase(),
        image: product.productImages[0]?.imageUrl || null,
        vendor: { storeName: product.vendor.storeName },
      })),
      total,
      page,
      limit,
    },
  })
})

app.patch('/api/admin/products/:id/status', authRequired, requireAdmin, async (req, res) => {
  const input = parseBody(z.object({ status: z.enum(['active', 'draft', 'inactive', 'deleted', 'suspended', 'unsuspended']) }), req, res)
  if (!input) return
  let data = {}
  if (input.status === 'suspended') {
    data = { status: 'inactive', approvalStatus: 'rejected' }
  } else if (input.status === 'unsuspended') {
    data = { status: 'active', approvalStatus: 'approved' }
  } else {
    data = { status: input.status, approvalStatus: input.status === 'active' ? 'approved' : undefined }
  }
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data,
    include: { productImages: true, productVariants: true, vendor: true, category: true },
  })
  try {
    const actor = req.currentUser
    await prisma.auditLog.create({
      data: {
        actorId: actor?.id || 'system',
        action: input.status === 'suspended' ? 'PRODUCT_SUSPENDED' : 'PRODUCT_UNSUSPENDED',
        targetType: 'product',
        targetId: product.id,
        targetName: product.name,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
      },
    })
  } catch {}
  res.json({ data: mapProduct(product) })
})

app.get('/api/admin/orders', authRequired, requireAdmin, async (req, res) => {
  const status = req.query.status ? String(req.query.status).toLowerCase() : undefined
  const search = req.query.search ? String(req.query.search) : undefined
  const page = Math.max(Number(req.query.page) || 1, 1)
  const limit = Math.min(Number(req.query.limit) || 20, 100)
  const skip = (page - 1) * limit
  const where = {
    ...(status ? { status } : {}),
    ...(search ? {
      OR: [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { user: { email: { contains: search, mode: 'insensitive' } } } },
      ],
    } : {}),
  }
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        customer: { include: { user: { include: { profile: true } } } },
        orderItems: { include: { vendor: true }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])
  res.json({
    data: {
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status.toUpperCase(),
        paymentStatus: order.paymentStatus.toUpperCase(),
        channel: 'WEB',
        createdAt: order.createdAt,
        user: { name: order.customer.user.profile?.fullName || order.customer.user.email },
        vendor: { storeName: order.orderItems[0]?.vendor.storeName || 'Multiple vendors' },
      })),
      total,
      page,
      limit,
    },
  })
})

app.patch('/api/admin/orders/:id/status', authRequired, requireAdmin, async (req, res) => {
  const input = parseBody(z.object({ status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']) }), req, res)
  if (!input) return
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status: input.status },
    include: { orderItems: { include: { vendor: true } } },
  })
  res.json({ data: mapOrder(order) })
})

app.get('/api/admin/users', authRequired, requireAdmin, async (req, res) => {
  const search = req.query.search ? String(req.query.search) : undefined
  const role = req.query.role ? String(req.query.role) : undefined
  const page = Math.max(Number(req.query.page) || 1, 1)
  const limit = Math.min(Number(req.query.limit) || 20, 100)
  const skip = (page - 1) * limit
  const where = {
    ...(search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { fullName: { contains: search, mode: 'insensitive' } } },
      ],
    } : {}),
    ...(role ? { profile: { role } } : {}),
  }
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { profile: true, vendor: { select: { storeName: true, status: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])
  res.json({
    data: {
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        fullName: u.profile?.fullName || null,
        role: u.profile?.role || 'customer',
        storeName: u.vendor?.storeName || null,
        createdAt: u.createdAt,
      })),
      total,
      page,
      limit,
    },
  })
})

app.get('/api/admin/audit-logs', authRequired, requireAdmin, async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1)
  const limit = Math.min(Number(req.query.limit) || 30, 100)
  const skip = (page - 1) * limit
  const action = req.query.action ? String(req.query.action) : undefined
  const targetType = req.query.targetType ? String(req.query.targetType) : undefined
  const where = {
    ...(action ? { action } : {}),
    ...(targetType ? { targetType } : {}),
  }
  try {
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])
    res.json({ data: { logs, total, page, limit } })
  } catch {
    // AuditLog table may not exist yet (migration pending)
    res.json({ data: { logs: [], total: 0, page, limit } })
  }
})

// ─── ADMIN: Settings ─────────────────────────────────────────────────────────
app.get('/api/admin/settings', authRequired, requireAdmin, async (_req, res) => {
  try {
    const settings = await prisma.siteSettings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton' },
    })
    res.json({ data: settings })
  } catch {
    res.json({ data: { siteName: 'SouQna', currency: 'USD', commissionRate: 10, autoApproveVendors: false, maintenanceMode: false } })
  }
})

app.patch('/api/admin/settings', authRequired, requireAdmin, async (req, res) => {
  const input = parseBody(z.object({
    siteName: z.string().min(1).max(100).optional(),
    currency: z.string().max(10).optional(),
    commissionRate: z.number().min(0).max(100).optional(),
    autoApproveVendors: z.boolean().optional(),
    maintenanceMode: z.boolean().optional(),
  }), req, res)
  if (!input) return
  try {
    const settings = await prisma.siteSettings.upsert({
      where: { id: 'singleton' },
      update: input,
      create: { id: 'singleton', ...input },
    })
    try {
      const actor = req.currentUser
      await prisma.auditLog.create({
        data: {
          actorId: actor?.id || 'system',
          action: 'SETTINGS_UPDATED',
          targetType: 'settings',
          targetId: 'singleton',
          targetName: 'Site Settings',
          details: input,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        },
      })
    } catch {}
    res.json({ data: settings })
  } catch (err) {
    res.status(500).json({ message: 'Failed to update settings' })
  }
})

// ─── ADMIN: Subscriptions ───────────────────────────────────────────────────
app.get('/api/admin/subscriptions', authRequired, requireAdmin, async (req, res) => {
  const status = req.query.status ? String(req.query.status) : undefined
  const subs = await prisma.vendorSubscription.findMany({
    where: status ? { status } : undefined,
    include: { vendor: { select: { storeName: true, slug: true, logoUrl: true } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ data: subs.map(mapSubscription) })
})

app.patch('/api/admin/subscriptions/:id', authRequired, requireAdmin, async (req, res) => {
  const input = parseBody(z.object({
    status: z.enum(['pending_payment', 'active', 'expired', 'cancelled']),
    adminNote: z.string().optional().nullable(),
  }), req, res)
  if (!input) return
  const existing = await prisma.vendorSubscription.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ message: 'Subscription not found' })
  const now = new Date()
  const startDate = input.status === 'active' ? now : existing.startDate
  const endDate = input.status === 'active' && !existing.endDate
    ? new Date(now.getTime() + (existing.plan === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000)
    : existing.endDate
  const sub = await prisma.vendorSubscription.update({
    where: { id: req.params.id },
    data: {
      status: input.status,
      adminNote: input.adminNote ?? existing.adminNote,
      startDate,
      endDate,
    },
    include: { vendor: { select: { storeName: true, slug: true, logoUrl: true } } },
  })
  res.json({ data: mapSubscription(sub) })
})

// ─── VENDOR: Subscription ───────────────────────────────────────────────────
const SUBSCRIPTION_PRICES = { monthly: 15, annual: 120 }

app.post('/api/subscriptions', authRequired, async (req, res) => {
  const input = parseBody(z.object({
    plan: z.enum(['monthly', 'annual']),
    paymentMethod: z.enum(['wish_money', 'omt', 'cash_delivery', 'credit_card']),
    paymentProof: z.string().optional().nullable(),
    shippingAddress: z.string().optional().nullable(),
  }), req, res)
  if (!input) return
  const user = await getAuthedUser(req, res)
  if (!user) return
  if (!user.vendor) return res.status(403).json({ message: 'Not a vendor' })
  const amount = SUBSCRIPTION_PRICES[input.plan]
  let proofUrl = input.paymentProof || null
  if (proofUrl && proofUrl.startsWith('data:')) {
    const result = await cloudinary.uploader.upload(proofUrl, { folder: 'souqna/payment-proofs', resource_type: 'auto' })
    proofUrl = result.secure_url
  }
  const sub = await prisma.vendorSubscription.create({
    data: {
      vendorId: user.vendor.id,
      plan: input.plan,
      status: 'pending_payment',
      paymentMethod: input.paymentMethod,
      amount,
      paymentProof: proofUrl,
    },
    include: { vendor: { select: { storeName: true, slug: true, logoUrl: true } } },
  })
  res.status(201).json({ data: mapSubscription(sub) })
})

app.get('/api/subscriptions/my', authRequired, async (req, res) => {
  const user = await getAuthedUser(req, res)
  if (!user) return
  if (!user.vendor) return res.status(404).json({ message: 'Not a vendor' })
  const sub = await prisma.vendorSubscription.findFirst({
    where: { vendorId: user.vendor.id },
    orderBy: { createdAt: 'desc' },
    include: { vendor: { select: { storeName: true, slug: true, logoUrl: true } } },
  })
  res.json({ data: mapSubscription(sub) })
})

// ─── VENDOR: Profile Update ─────────────────────────────────────────────────
const vendorProfileSchema = z.object({
  storeName: z.string().min(2).max(100).optional(),
  description: z.string().nullable().optional(),
  mission: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  website: z.string().url().nullable().optional().or(z.literal('')),
  whatsapp: z.string().nullable().optional(),
  instagram: z.string().nullable().optional(),
  facebook: z.string().nullable().optional(),
  tiktok: z.string().nullable().optional(),
  youtube: z.string().nullable().optional(),
})

app.patch('/api/vendor/profile', authRequired, async (req, res) => {
  const input = parseBody(vendorProfileSchema, req, res)
  if (!input) return
  const user = await getAuthedUser(req, res)
  if (!user) return
  if (!user.vendor) return res.status(403).json({ message: 'Not a vendor' })
  const vendor = await prisma.vendor.update({
    where: { id: user.vendor.id },
    data: {
      ...(input.storeName ? { storeName: input.storeName } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.mission !== undefined ? { mission: input.mission } : {}),
      ...(input.location !== undefined ? { location: input.location } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.website !== undefined ? { website: input.website || null } : {}),
      ...(input.whatsapp !== undefined ? { whatsapp: input.whatsapp } : {}),
      ...(input.instagram !== undefined ? { instagram: input.instagram } : {}),
      ...(input.facebook !== undefined ? { facebook: input.facebook } : {}),
      ...(input.tiktok !== undefined ? { tiktok: input.tiktok } : {}),
      ...(input.youtube !== undefined ? { youtube: input.youtube } : {}),
    },
    include: { vendorSummary: true, socialLinks: true, user: { include: { profile: true } } },
  })
  res.json({ data: mapVendor(vendor) })
})

app.post('/api/vendor/cover', authRequired, async (req, res) => {
  const { imageData } = req.body
  if (!imageData) return res.status(400).json({ message: 'No image data' })
  const user = await getAuthedUser(req, res)
  if (!user) return
  if (!user.vendor) return res.status(403).json({ message: 'Not a vendor' })
  const result = await cloudinary.uploader.upload(imageData, {
    folder: 'souqna/covers',
    resource_type: 'auto',
    transformation: [{ width: 1400, height: 400, crop: 'fill', quality: 'auto', fetch_format: 'auto' }],
  })
  const vendor = await prisma.vendor.update({
    where: { id: user.vendor.id },
    data: { coverUrl: result.secure_url, coverPublicId: result.public_id },
    include: { vendorSummary: true, socialLinks: true, user: { include: { profile: true } } },
  })
  res.json({ data: mapVendor(vendor), url: result.secure_url })
})

app.post('/api/vendor/logo', authRequired, async (req, res) => {
  const { imageData } = req.body
  if (!imageData) return res.status(400).json({ message: 'No image data' })
  const user = await getAuthedUser(req, res)
  if (!user) return
  if (!user.vendor) return res.status(403).json({ message: 'Not a vendor' })
  const result = await cloudinary.uploader.upload(imageData, {
    folder: 'souqna/logos',
    resource_type: 'auto',
    transformation: [{ width: 300, height: 300, crop: 'fill', quality: 'auto', fetch_format: 'auto' }],
  })
  const vendor = await prisma.vendor.update({
    where: { id: user.vendor.id },
    data: { logoUrl: result.secure_url, logoPublicId: result.public_id },
    include: { vendorSummary: true, socialLinks: true, user: { include: { profile: true } } },
  })
  res.json({ data: mapVendor(vendor), url: result.secure_url })
})

// ─── ADMIN: Patch Users Role ─────────────────────────────────────────────────
app.patch('/api/admin/users/:id/role', authRequired, requireAdmin, async (req, res) => {
  const input = parseBody(z.object({ role: z.enum(['admin', 'vendor', 'customer']) }), req, res)
  if (!input) return
  const profile = await prisma.profile.findFirst({ where: { userId: req.params.id } })
  if (!profile) return res.status(404).json({ message: 'User not found' })
  const updated = await prisma.profile.update({ where: { id: profile.id }, data: { role: input.role } })
  res.json({ data: mapProfile(updated) })
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ message: 'Internal server error' })
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason)
})

app.listen(PORT, () => {
  console.log(`Souqna API listening on port ${PORT}`)
})
