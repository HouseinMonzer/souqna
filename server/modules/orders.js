const crypto = require('crypto')
const { prisma } = require('../lib/prisma')
const { createRouter } = require('../lib/router')
const { z, id, pageQuery, paginate } = require('../lib/validation')
const { HttpError, notFound, forbidden, conflict, badRequest } = require('../lib/errors')
const { decimal, sum } = require('../lib/money')
const { notify } = require('../lib/notify')
const { sanitizeOrNull, sanitizeText } = require('../lib/sanitize')
const { mapOrder, mapOrderItem } = require('../lib/mappers')
const { sendOrderConfirmation, sendVendorNewOrderAlert, sendOrderStatusUpdate } = require('../lib/mailer')
const { limiters } = require('../middleware/security')
const { requireUser, requireVendorAccount } = require('../middleware/auth')
const { publicProductWhere } = require('./catalog')

const { router, get, post, patch } = createRouter({ tag: 'Orders' })

const SHIPPING_COST = decimal('3.50')
const TERMINAL_STATUSES = new Set(['delivered', 'cancelled', 'refunded'])
const orderInclude = { orderItems: { include: { vendor: true } } }

const shippingFields = {
  shipping_name: z.string().trim().min(1).max(200),
  shipping_address: z.string().trim().min(1).max(500),
  shipping_city: z.string().trim().min(1).max(100),
  shipping_phone: z.string().trim().min(1).max(50),
}

const orderSchema = z.object({
  cartItems: z.array(z.object({
    product_id: id,
    variant_id: id.nullable().optional(),
    quantity: z.coerce.number().int().positive().max(100),
  })).min(1).max(50),
  shippingInfo: z.object({
    // Either a saved address or the shipping fields inline.
    address_id: id.optional(),
    shipping_name: shippingFields.shipping_name.optional(),
    shipping_address: shippingFields.shipping_address.optional(),
    shipping_city: shippingFields.shipping_city.optional(),
    shipping_phone: shippingFields.shipping_phone.optional(),
    customer_note: z.string().max(1000).nullable().optional(),
    payment_method: z.literal('cash_delivery'),
  }).refine(
    info => info.address_id || (info.shipping_name && info.shipping_address && info.shipping_city && info.shipping_phone),
    { message: 'Choose a saved address or fill in the shipping details', path: ['address_id'] },
  ),
})

const idempotencyKeySchema = z.string().regex(/^[A-Za-z0-9_-]{8,100}$/)

async function resolveShipping(userId, info) {
  if (!info.address_id) {
    return {
      shippingName: sanitizeText(info.shipping_name),
      shippingAddress: sanitizeText(info.shipping_address),
      shippingCity: sanitizeText(info.shipping_city),
      shippingPhone: sanitizeText(info.shipping_phone),
      shippingCountry: null,
      shippingZip: null,
    }
  }
  const address = await prisma.address.findFirst({ where: { id: info.address_id, userId } })
  if (!address) throw badRequest('Saved address not found.')
  return {
    shippingName: address.fullName,
    shippingAddress: [address.line1, address.line2].filter(Boolean).join(', '),
    shippingCity: address.city,
    shippingPhone: address.phone,
    shippingCountry: address.country,
    shippingZip: address.postalCode,
  }
}

function sendOrderEmails(user, order) {
  const buyerFirstName = (user.profile?.fullName || user.email).split(' ')[0]
  sendOrderConfirmation(user.email, {
    orderNumber: order.orderNumber,
    items: order.orderItems,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    total: order.total,
    shippingName: order.shippingName,
    shippingAddress: order.shippingAddress,
    shippingCity: order.shippingCity,
  })
  const byVendor = new Map()
  for (const item of order.orderItems) {
    if (!byVendor.has(item.vendorId)) byVendor.set(item.vendorId, { vendor: item.vendor, items: [] })
    byVendor.get(item.vendorId).items.push(item)
  }
  for (const { vendor, items } of byVendor.values()) {
    if (!vendor?.user?.email) continue
    sendVendorNewOrderAlert(vendor.user.email, {
      storeName: vendor.storeName,
      orderNumber: order.orderNumber,
      buyerFirstName,
      items,
      total: sum(items.map(i => i.totalPrice)),
      shippingAddress: order.shippingAddress,
      shippingCity: order.shippingCity,
    })
  }
}

post('/orders', {
  summary: 'Place an order. Send an Idempotency-Key header to make retries safe.',
  auth: true,
  middleware: [limiters.order, ...requireUser],
  body: orderSchema,
}, async (req, res) => {
  const user = req.currentUser
  const input = req.body

  const rawKey = req.get('Idempotency-Key')
  if (rawKey !== undefined && !idempotencyKeySchema.safeParse(rawKey).success) {
    throw badRequest('Invalid Idempotency-Key header')
  }
  const idempotencyKey = rawKey ?? null
  const customer = user.customer || await prisma.customer.create({ data: { userId: user.id } })

  if (idempotencyKey) {
    const existing = await prisma.order.findUnique({
      where: { customerId_idempotencyKey: { customerId: customer.id, idempotencyKey } },
      include: orderInclude,
    })
    if (existing) return res.status(200).json({ data: mapOrder(existing), replayed: true })
  }

  const productIds = [...new Set(input.cartItems.map(i => i.product_id))]
  const variantIds = input.cartItems.map(i => i.variant_id).filter(Boolean)
  const [products, variants, shipping] = await Promise.all([
    prisma.product.findMany({
      where: { ...publicProductWhere, id: { in: productIds } },
      include: { productImages: { where: { isPrimary: true }, take: 1 } },
    }),
    variantIds.length ? prisma.productVariant.findMany({ where: { id: { in: variantIds } } }) : [],
    resolveShipping(user.id, input.shippingInfo),
  ])
  const productMap = new Map(products.map(p => [p.id, p]))
  const variantMap = new Map(variants.map(v => [v.id, v]))

  // Prices always come from the database, never from the client.
  const itemsData = input.cartItems.map(item => {
    const product = productMap.get(item.product_id)
    if (!product) throw badRequest('One of the products is no longer available.')
    const variant = item.variant_id ? variantMap.get(item.variant_id) : null
    if (item.variant_id && variant?.productId !== product.id) throw badRequest(`Invalid variant for ${product.name}.`)
    const unitPrice = decimal(product.price).plus(variant?.priceAdjustment ?? 0)
    return {
      productId: product.id,
      vendorId: product.vendorId,
      variantId: variant?.id || null,
      quantity: item.quantity,
      unitPrice,
      totalPrice: unitPrice.times(item.quantity),
      productName: product.name,
      productImage: product.productImages[0]?.imageUrl || null,
      variantInfo: variant ? `${variant.optionName}: ${variant.optionValue}` : null,
    }
  })

  const subtotal = sum(itemsData.map(i => i.totalPrice))
  const total = subtotal.plus(SHIPPING_COST)

  let order
  try {
    order = await prisma.$transaction(async tx => {
      for (const item of itemsData) {
        // Conditional decrement: fails atomically if another order took the stock.
        const where = { stock: { gte: item.quantity } }
        const data = { stock: { decrement: item.quantity } }
        const { count } = item.variantId
          ? await tx.productVariant.updateMany({ where: { id: item.variantId, ...where }, data })
          : await tx.product.updateMany({ where: { id: item.productId, ...where }, data })
        if (count === 0) throw conflict(`Out of stock: ${item.productName}`)
        await tx.product.update({ where: { id: item.productId }, data: { totalSold: { increment: item.quantity } } })
      }

      const created = await tx.order.create({
        data: {
          customerId: customer.id,
          orderNumber: `ORD-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
          idempotencyKey,
          subtotal,
          tax: 0,
          shippingCost: SHIPPING_COST,
          total,
          ...shipping,
          paymentMethod: input.shippingInfo.payment_method,
          customerNote: sanitizeOrNull(input.shippingInfo.customer_note),
          orderItems: { create: itemsData },
          statusHistory: { create: { status: 'pending', actorId: user.id } },
        },
        include: { orderItems: { include: { vendor: { include: { user: true } } } } },
      })

      await notify(tx, [...new Set(created.orderItems.map(i => i.vendor.userId))], {
        type: 'order.new',
        title: `New order ${created.orderNumber}`,
        body: 'A customer placed an order that needs your approval.',
        link: '/dashboard',
      })
      return created
    })
  } catch (error) {
    // A concurrent retry with the same key won the race: return its order.
    if (idempotencyKey && error?.code === 'P2002') {
      const existing = await prisma.order.findUnique({
        where: { customerId_idempotencyKey: { customerId: customer.id, idempotencyKey } },
        include: orderInclude,
      })
      if (existing) return res.status(200).json({ data: mapOrder(existing), replayed: true })
    }
    throw error
  }

  sendOrderEmails(user, order)
  res.status(201).json({ data: mapOrder(order) })
})

get('/orders/my', {
  summary: "The signed-in customer's orders",
  auth: true,
  middleware: requireUser,
  query: z.object(pageQuery),
}, async (req, res) => {
  const customerId = req.currentUser.customer?.id
  const { take, skip, page, limit } = paginate(req.query, 20)
  if (!customerId) return res.json({ data: [], total: 0, page, limit })
  const where = { customerId }
  const [orders, total] = await Promise.all([
    prisma.order.findMany({ where, include: orderInclude, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.order.count({ where }),
  ])
  res.json({ data: orders.map(mapOrder), total, page, limit })
})

get('/orders/customer/:customerId', {
  summary: "A customer's orders (owner or admin)",
  auth: true,
  middleware: requireUser,
  params: z.object({ customerId: id }),
  query: z.object(pageQuery),
}, async (req, res) => {
  const user = req.currentUser
  if (user.customer?.id !== req.params.customerId && user.profile?.role !== 'admin') throw forbidden()
  const { take, skip, page, limit } = paginate(req.query, 50)
  const where = { customerId: req.params.customerId }
  const [orders, total] = await Promise.all([
    prisma.order.findMany({ where, include: orderInclude, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.order.count({ where }),
  ])
  res.json({ data: orders.map(mapOrder), total, page, limit })
})

get('/orders/vendor/:vendorId', {
  summary: "A vendor's order items (owner or admin)",
  auth: true,
  middleware: requireUser,
  params: z.object({ vendorId: id }),
  query: z.object(pageQuery),
}, async (req, res) => {
  const user = req.currentUser
  if (user.vendor?.id !== req.params.vendorId && user.profile?.role !== 'admin') throw forbidden()
  const { take, skip, page, limit } = paginate(req.query, 50)
  const where = { vendorId: req.params.vendorId }
  const [items, total] = await Promise.all([
    prisma.orderItem.findMany({ where, include: { order: true, vendor: true }, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.orderItem.count({ where }),
  ])
  res.json({ data: items.map(mapOrderItem), total, page, limit })
})

get('/orders/:id', {
  summary: 'Order detail with status timeline (customer, involved vendor, or admin)',
  auth: true,
  middleware: requireUser,
  params: z.object({ id }),
}, async (req, res) => {
  const user = req.currentUser
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { ...orderInclude, statusHistory: { orderBy: { createdAt: 'asc' } } },
  })
  if (!order) throw notFound('Order not found')

  const isOwner = order.customerId === user.customer?.id
  const isAdmin = user.profile?.role === 'admin'
  const vendorId = user.vendor?.id
  if (isOwner || isAdmin) return res.json({ data: mapOrder(order) })

  // Vendors only see their own lines of a shared order.
  const ownItems = order.orderItems.filter(item => item.vendorId === vendorId)
  if (!vendorId || !ownItems.length) throw notFound('Order not found')
  const ownItemIds = new Set(ownItems.map(i => i.id))
  res.json({
    data: mapOrder({
      ...order,
      orderItems: ownItems,
      statusHistory: order.statusHistory.filter(h => !h.orderItemId || ownItemIds.has(h.orderItemId)),
    }),
  })
})

// Order status follows its items: all cancelled → cancelled, otherwise the
// least-advanced status among the remaining items.
const PROGRESSION = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
function deriveOrderStatus(statuses) {
  const active = statuses.filter(s => s !== 'cancelled')
  if (!active.length) return 'cancelled'
  return PROGRESSION[Math.min(...active.map(s => PROGRESSION.indexOf(s)))]
}

patch('/vendor/orders/:itemId/status', {
  summary: 'Vendor updates the status of one of their order items',
  auth: true,
  middleware: requireVendorAccount,
  params: z.object({ itemId: id }),
  body: z.object({
    status: z.enum(['confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
    trackingNumber: z.string().trim().max(100).optional().nullable(),
  }),
}, async (req, res) => {
  const user = req.currentUser
  const input = req.body
  const item = await prisma.orderItem.findFirst({
    where: { id: req.params.itemId, vendorId: user.vendor.id },
    include: { order: { include: { customer: { include: { user: true } } } }, vendor: true },
  })
  if (!item) throw notFound('Order item not found')
  if (TERMINAL_STATUSES.has(item.vendorStatus)) {
    throw new HttpError(409, `This item is already ${item.vendorStatus}.`)
  }

  const updated = await prisma.$transaction(async tx => {
    // Conditional transition: if a concurrent request already moved the item to
    // a final status, this matches nothing and the stock is not restored twice.
    const { count } = await tx.orderItem.updateMany({
      where: { id: item.id, vendorStatus: { notIn: [...TERMINAL_STATUSES] } },
      data: {
        vendorStatus: input.status,
        ...(input.trackingNumber !== undefined ? { trackingNumber: sanitizeOrNull(input.trackingNumber) } : {}),
      },
    })
    if (!count) throw new HttpError(409, 'This item was already updated. Refresh and try again.')
    const result = await tx.orderItem.findUnique({ where: { id: item.id }, include: { order: true, vendor: true } })

    if (input.status === 'cancelled') {
      const data = { stock: { increment: item.quantity } }
      if (item.variantId) await tx.productVariant.update({ where: { id: item.variantId }, data })
      else await tx.product.update({ where: { id: item.productId }, data })
      await tx.product.update({ where: { id: item.productId }, data: { totalSold: { decrement: item.quantity } } })
    }

    await tx.orderStatusHistory.create({
      data: { orderId: item.orderId, orderItemId: item.id, status: input.status, actorId: user.id },
    })

    const siblings = await tx.orderItem.findMany({ where: { orderId: item.orderId }, select: { vendorStatus: true } })
    const orderStatus = deriveOrderStatus(siblings.map(s => s.vendorStatus))
    if (orderStatus !== item.order.status) {
      await tx.order.update({ where: { id: item.orderId }, data: { status: orderStatus } })
      await tx.orderStatusHistory.create({ data: { orderId: item.orderId, status: orderStatus, actorId: user.id } })
    }

    await notify(tx, item.order.customer.userId, {
      type: 'order.status',
      title: `Order ${item.order.orderNumber}: ${input.status}`,
      body: `${item.vendor.storeName} marked "${item.productName}" as ${input.status}.`,
      link: `/orders/${item.orderId}`,
    })
    return result
  })

  const buyerEmail = item.order.customer.user.email
  if (buyerEmail) {
    sendOrderStatusUpdate(buyerEmail, {
      orderNumber: item.order.orderNumber,
      storeName: item.vendor.storeName,
      newStatus: input.status,
      items: [item],
      trackingNumber: updated.trackingNumber,
    })
  }
  res.json({ data: mapOrderItem(updated) })
})

module.exports = { router, deriveOrderStatus }
