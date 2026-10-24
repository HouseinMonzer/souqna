const { AuditAction } = require('@prisma/client')
const { prisma } = require('../lib/prisma')
const { createRouter } = require('../lib/router')
const { z, id, pageQuery, paginate, searchTerm } = require('../lib/validation')
const { badRequest, notFound } = require('../lib/errors')
const { toNumber } = require('../lib/money')
const { notify } = require('../lib/notify')
const { writeAudit } = require('../lib/audit')
const { sanitizeText, sanitizeOrNull } = require('../lib/sanitize')
const { mapOrder, mapProduct, mapProfile, mapSubscription, mapVendor } = require('../lib/mappers')
const { requireAdmin } = require('../middleware/auth')
const { PLAN_DAYS, subscriptionInclude, hasOtherActivePlan } = require('./subscriptions')

const { router, get, patch, put } = createRouter({ tag: 'Admin' })

const lowerEnum = values => z.string().trim().toLowerCase().pipe(z.enum(values)).optional()
const VENDOR_STATUSES = ['pending', 'active', 'suspended', 'rejected']
const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
const SUBSCRIPTION_STATUSES = ['pending_payment', 'active', 'expired', 'cancelled']
const DAY_MS = 24 * 60 * 60 * 1000
const admin = { auth: true, middleware: requireAdmin }

get('/admin/analytics', { summary: 'Dashboard metrics', ...admin }, async (_req, res) => {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const [totalVendors, pendingVendors, totalCustomers, totalOrders, revenue, topVendors, recentOrders, monthlyOrders] = await Promise.all([
    prisma.vendor.count(),
    prisma.vendor.count({ where: { status: 'pending' } }),
    prisma.customer.count(),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { notIn: ['cancelled', 'refunded'] } } }),
    prisma.vendor.findMany({
      where: { status: 'active' },
      include: { _count: { select: { products: true, orderItems: true } } },
      orderBy: { totalSales: 'desc' },
      take: 5,
    }),
    prisma.order.findMany({ where: { createdAt: { gte: sevenDaysAgo } }, select: { createdAt: true } }),
    prisma.order.findMany({
      where: { createdAt: { gte: sixMonthsAgo }, status: { notIn: ['cancelled', 'refunded'] } },
      select: { createdAt: true, total: true },
    }),
  ])

  const dayCount = Array(7).fill(0)
  for (const order of recentOrders) {
    const daysAgo = Math.floor((now.getTime() - order.createdAt.getTime()) / DAY_MS)
    if (daysAgo < 7) dayCount[6 - daysAgo] += 1
  }

  const monthMap = new Map()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthMap.set(`${d.getFullYear()}-${d.getMonth() + 1}`, { month: d.getMonth() + 1, year: d.getFullYear(), revenue: 0 })
  }
  for (const order of monthlyOrders) {
    const bucket = monthMap.get(`${order.createdAt.getFullYear()}-${order.createdAt.getMonth() + 1}`)
    if (bucket) bucket.revenue = Math.round((bucket.revenue + toNumber(order.total)) * 100) / 100
  }

  res.json({
    data: {
      totalVendors,
      pendingVendors,
      totalCustomers,
      totalOrders,
      totalRevenue: toNumber(revenue._sum.total) || 0,
      ordersLast7Days: dayCount.map((count, i) => ({ day: String(i), count })),
      revenueByMonth: [...monthMap.values()],
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

get('/admin/vendors', {
  summary: 'All vendors',
  ...admin,
  query: z.object({ ...pageQuery, search: searchTerm, status: lowerEnum(VENDOR_STATUSES) }),
}, async (req, res) => {
  const { search, status } = req.query
  const { take, skip, page, limit } = paginate(req.query)
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
      include: { user: { include: { profile: true } }, _count: { select: { products: true, orderItems: true } } },
      orderBy: { joinedAt: 'desc' },
      skip,
      take,
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

const VENDOR_STATUS_NOTICE = {
  active: ['Your store is approved', 'You can now list products and receive orders.'],
  suspended: ['Your store is suspended', 'Contact support to resolve the issue.'],
  rejected: ['Your store application was not approved', 'Contact support for details.'],
}
const VENDOR_STATUS_AUDIT = { active: 'VENDOR_APPROVED', rejected: 'VENDOR_REJECTED', suspended: 'VENDOR_SUSPENDED' }

patch('/admin/vendors/:id/status', {
  summary: 'Approve, suspend or reject a vendor',
  ...admin,
  params: z.object({ id }),
  body: z.object({ status: z.enum(VENDOR_STATUSES), reason: z.string().max(1000).optional().nullable() }),
}, async (req, res) => {
  const { status, reason } = req.body
  const vendor = await prisma.$transaction(async tx => {
    const updated = await tx.vendor.update({
      where: { id: req.params.id },
      data: { status },
      include: { user: { include: { profile: true } } },
    })
    if (VENDOR_STATUS_NOTICE[status]) {
      const [title, body] = VENDOR_STATUS_NOTICE[status]
      await notify(tx, updated.userId, { type: 'vendor.status', title, body: reason ? `${body} ${reason}` : body, link: '/dashboard' })
    }
    return updated
  })
  await writeAudit(req, {
    action: VENDOR_STATUS_AUDIT[status] || 'VENDOR_REACTIVATED',
    targetType: 'vendor',
    targetId: vendor.id,
    targetName: vendor.storeName,
    details: reason ? { reason } : undefined,
  })
  res.json({ data: mapVendor(vendor) })
})

put('/admin/vendors/:id', {
  summary: 'Edit vendor details',
  ...admin,
  params: z.object({ id }),
  body: z.object({
    store_name: z.string().trim().min(2).max(100).optional(),
    business_name: z.string().max(200).nullable().optional(),
    description: z.string().max(2000).nullable().optional(),
    mission: z.string().max(500).nullable().optional(),
    location: z.string().max(200).nullable().optional(),
    status: z.enum(VENDOR_STATUSES).optional(),
  }),
}, async (req, res) => {
  const input = req.body
  const vendor = await prisma.vendor.update({
    where: { id: req.params.id },
    data: {
      ...(input.store_name ? { storeName: sanitizeText(input.store_name) } : {}),
      ...(input.business_name !== undefined ? { businessName: sanitizeOrNull(input.business_name) } : {}),
      ...(input.description !== undefined ? { description: sanitizeOrNull(input.description) } : {}),
      ...(input.mission !== undefined ? { mission: sanitizeOrNull(input.mission) } : {}),
      ...(input.location !== undefined ? { location: sanitizeOrNull(input.location) } : {}),
      ...(input.status ? { status: input.status } : {}),
    },
    include: { vendorSummary: true, user: { include: { profile: true } } },
  })
  res.json({ data: mapVendor(vendor) })
})

get('/admin/products', {
  summary: 'All products',
  ...admin,
  query: z.object({ ...pageQuery, search: searchTerm, status: lowerEnum(['draft', 'active', 'inactive', 'deleted', 'suspended']) }),
}, async (req, res) => {
  const { status, search } = req.query
  const { take, skip, page, limit } = paginate(req.query)
  const where = {
    ...(status === 'suspended' ? { status: 'inactive', approvalStatus: 'rejected' } : status ? { status } : { status: { not: 'deleted' } }),
    ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
  }
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { vendor: true, category: true, productImages: { where: { isPrimary: true }, take: 1 } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.product.count({ where }),
  ])
  res.json({
    data: {
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        price: toNumber(product.price),
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

patch('/admin/products/:id/status', {
  summary: 'Change a product status or suspend it',
  ...admin,
  params: z.object({ id }),
  body: z.object({ status: z.enum(['active', 'draft', 'inactive', 'deleted', 'suspended', 'unsuspended']) }),
}, async (req, res) => {
  const { status } = req.body
  const data = status === 'suspended' ? { status: 'inactive', approvalStatus: 'rejected' }
    : status === 'unsuspended' ? { status: 'active', approvalStatus: 'approved' }
      : { status, ...(status === 'active' ? { approvalStatus: 'approved' } : {}) }
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data,
    include: { productImages: true, productVariants: true, vendor: true, category: true },
  })
  if (status === 'suspended' || status === 'unsuspended') {
    await writeAudit(req, {
      action: status === 'suspended' ? 'PRODUCT_SUSPENDED' : 'PRODUCT_UNSUSPENDED',
      targetType: 'product',
      targetId: product.id,
      targetName: product.name,
    })
  }
  res.json({ data: mapProduct(product) })
})

get('/admin/orders', {
  summary: 'All orders',
  ...admin,
  query: z.object({ ...pageQuery, search: searchTerm, status: lowerEnum(ORDER_STATUSES) }),
}, async (req, res) => {
  const { status, search } = req.query
  const { take, skip, page, limit } = paginate(req.query)
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
      take,
    }),
    prisma.order.count({ where }),
  ])
  res.json({
    data: {
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        total: toNumber(order.total),
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

patch('/admin/orders/:id/status', {
  summary: 'Override an order status',
  ...admin,
  params: z.object({ id }),
  body: z.object({ status: z.enum(ORDER_STATUSES), note: z.string().trim().max(500).optional() }),
}, async (req, res) => {
  const { status, note } = req.body
  const order = await prisma.$transaction(async tx => {
    const existing = await tx.order.findUnique({ where: { id: req.params.id }, include: { customer: true } })
    if (!existing) throw notFound('Order not found')
    const updated = await tx.order.update({
      where: { id: existing.id },
      data: { status },
      include: { orderItems: { include: { vendor: true } } },
    })
    if (existing.status !== status) {
      await tx.orderStatusHistory.create({
        data: { orderId: existing.id, status, note: note ? sanitizeText(note) : null, actorId: req.currentUser.id },
      })
      await notify(tx, existing.customer.userId, {
        type: 'order.status',
        title: `Order ${existing.orderNumber}: ${status}`,
        link: `/orders/${existing.id}`,
      })
    }
    return updated
  })
  await writeAudit(req, { action: 'ORDER_STATUS_CHANGED', targetType: 'order', targetId: order.id, targetName: order.orderNumber, details: { status } })
  res.json({ data: mapOrder(order) })
})

get('/admin/users', {
  summary: 'All users',
  ...admin,
  query: z.object({ ...pageQuery, search: searchTerm, role: lowerEnum(['admin', 'vendor', 'customer']) }),
}, async (req, res) => {
  const { search, role } = req.query
  const { take, skip, page, limit } = paginate(req.query)
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
      take,
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

patch('/admin/users/:id/role', {
  summary: "Change a user's role",
  ...admin,
  params: z.object({ id }),
  body: z.object({ role: z.enum(['admin', 'vendor', 'customer']) }),
}, async (req, res) => {
  if (req.params.id === req.currentUser.id && req.body.role !== 'admin') {
    throw badRequest('You cannot remove your own admin role.')
  }
  const profile = await prisma.profile.findUnique({ where: { userId: req.params.id } })
  if (!profile) throw notFound('User not found')
  const updated = await prisma.profile.update({ where: { id: profile.id }, data: { role: req.body.role } })
  await writeAudit(req, { action: 'USER_ROLE_CHANGED', targetType: 'user', targetId: req.params.id, targetName: profile.fullName || req.params.id, details: { role: req.body.role } })
  res.json({ data: mapProfile(updated) })
})

get('/admin/audit-logs', {
  summary: 'Audit trail',
  ...admin,
  query: z.object({
    ...pageQuery,
    action: z.enum(Object.values(AuditAction)).optional(),
    targetType: z.string().trim().max(40).optional(),
  }),
}, async (req, res) => {
  const { action, targetType } = req.query
  const { take, skip, page, limit } = paginate(req.query, 30)
  const where = { ...(action ? { action } : {}), ...(targetType ? { targetType } : {}) }
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.auditLog.count({ where }),
  ])
  res.json({ data: { logs, total, page, limit } })
})

get('/admin/settings', { summary: 'Site settings', ...admin }, async (_req, res) => {
  const settings = await prisma.siteSettings.upsert({ where: { id: 'singleton' }, update: {}, create: { id: 'singleton' } })
  res.json({ data: settings })
})

patch('/admin/settings', {
  summary: 'Update site settings',
  ...admin,
  body: z.object({
    siteName: z.string().trim().min(1).max(100).optional(),
    currency: z.string().trim().regex(/^[A-Z]{3}$/).optional(),
    commissionRate: z.number().min(0).max(100).optional(),
    autoApproveVendors: z.boolean().optional(),
    maintenanceMode: z.boolean().optional(),
  }),
}, async (req, res) => {
  const settings = await prisma.siteSettings.upsert({
    where: { id: 'singleton' },
    update: req.body,
    create: { id: 'singleton', ...req.body },
  })
  await writeAudit(req, { action: 'SETTINGS_UPDATED', targetType: 'settings', targetId: 'singleton', targetName: 'Site Settings', details: req.body })
  res.json({ data: settings })
})

get('/admin/subscriptions', {
  summary: 'Vendor subscriptions',
  ...admin,
  query: z.object({ status: lowerEnum(SUBSCRIPTION_STATUSES) }),
}, async (req, res) => {
  const subs = await prisma.vendorSubscription.findMany({
    where: req.query.status ? { status: req.query.status } : undefined,
    include: subscriptionInclude,
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  res.json({ data: subs.map(mapSubscription) })
})

const SUBSCRIPTION_AUDIT = { active: 'SUBSCRIPTION_APPROVED', cancelled: 'SUBSCRIPTION_CANCELLED', expired: 'SUBSCRIPTION_CANCELLED' }

patch('/admin/subscriptions/:id', {
  summary: 'Approve, expire or cancel a subscription',
  ...admin,
  params: z.object({ id }),
  body: z.object({ status: z.enum(SUBSCRIPTION_STATUSES), adminNote: z.string().max(1000).optional().nullable() }),
}, async (req, res) => {
  const { status, adminNote } = req.body
  const sub = await prisma.$transaction(async tx => {
    const existing = await tx.vendorSubscription.findUnique({ where: { id: req.params.id }, include: { vendor: true } })
    if (!existing) throw notFound('Subscription not found')
    const now = new Date()
    const activating = status === 'active' && existing.status !== 'active'
    const updated = await tx.vendorSubscription.update({
      where: { id: existing.id },
      data: {
        status,
        adminNote: adminNote === undefined ? existing.adminNote : sanitizeOrNull(adminNote),
        ...(activating ? {
          startDate: now,
          endDate: existing.endDate && existing.endDate > now ? existing.endDate : new Date(now.getTime() + PLAN_DAYS[existing.plan] * DAY_MS),
          reminderSentAt: null,
        } : {}),
      },
      include: subscriptionInclude,
    })

    if (activating) {
      await tx.vendor.update({ where: { id: existing.vendorId }, data: { listingsHidden: false } })
      await notify(tx, existing.vendor.userId, { type: 'subscription.active', title: 'Your subscription is active', link: '/subscription' })
    } else if (existing.status === 'active' && status !== 'active' && !await hasOtherActivePlan(tx, existing.vendorId, existing.id)) {
      await tx.vendor.update({ where: { id: existing.vendorId }, data: { listingsHidden: true } })
      await notify(tx, existing.vendor.userId, { type: 'subscription.ended', title: 'Your subscription has ended', body: 'Your products are hidden until you renew.', link: '/subscription' })
    }
    return updated
  })
  if (SUBSCRIPTION_AUDIT[status]) {
    await writeAudit(req, { action: SUBSCRIPTION_AUDIT[status], targetType: 'subscription', targetId: sub.id, targetName: sub.vendor?.storeName || sub.id, details: { status } })
  }
  res.json({ data: mapSubscription(sub) })
})

module.exports = { router }
