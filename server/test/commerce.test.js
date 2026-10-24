const { describe, it, before, after } = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')
const { app, prisma, createUser, createProduct, teardown } = require('./helpers')
const { deriveOrderStatus } = require('../modules/orders')
const { runSubscriptionJob } = require('../jobs/subscriptionExpiry')
const { sentMail } = require('../lib/mailer')

after(teardown)

const DAY_MS = 24 * 60 * 60 * 1000
const shipping = {
  shipping_name: 'Test Buyer',
  shipping_address: 'Hamra Street 1',
  shipping_city: 'Beirut',
  shipping_phone: '+96170000000',
  payment_method: 'cash_delivery',
}

const placeOrder = (cookie, cartItems, { key, shippingInfo = shipping } = {}) => {
  const req = request(app).post('/api/orders').set('Cookie', cookie)
  if (key) req.set('Idempotency-Key', key)
  return req.send({ cartItems, shippingInfo })
}

async function deliveredPurchase(customer, product) {
  return prisma.order.create({
    data: {
      customerId: customer.user.customer.id,
      orderNumber: `ORD-D-${product.id}-${customer.user.id}`,
      status: 'delivered',
      orderItems: {
        create: {
          productId: product.id,
          vendorId: product.vendorId,
          quantity: 1,
          unitPrice: product.price,
          totalPrice: product.price,
          productName: product.name,
          vendorStatus: 'delivered',
        },
      },
    },
  })
}

describe('money and orders', () => {
  let vendor, customer, product

  before(async () => {
    vendor = await createUser('vendor')
    customer = await createUser('customer')
    product = await createProduct(vendor.user.vendor.id, { price: '19.99', stock: 10 })
  })

  it('keeps cent-exact totals', async () => {
    const res = await placeOrder(customer.cookie, [{ product_id: product.id, quantity: 3 }])
    assert.equal(res.status, 201)
    assert.equal(res.body.data.subtotal, 59.97)
    assert.equal(res.body.data.total, 63.47)
    assert.equal(res.body.data.order_items[0].unit_price, 19.99)
    const stored = await prisma.order.findUnique({ where: { id: res.body.data.id } })
    assert.equal(stored.total.toString(), '63.47')
  })

  it('stores prices with two decimals and returns numbers', async () => {
    const res = await request(app)
      .post('/api/vendor/products')
      .set('Cookie', vendor.cookie)
      .send({ name: 'Za\'atar Mix', price: 4.1, comparePrice: 5.25 })
    assert.equal(res.status, 201)
    assert.equal(res.body.data.price, 4.1)
    assert.equal(res.body.data.compare_price, 5.25)
  })

  it('rejects a compare price that is not above the price', async () => {
    const res = await request(app)
      .post('/api/vendor/products')
      .set('Cookie', vendor.cookie)
      .send({ name: 'Bad discount', price: 10, comparePrice: 9 })
    assert.equal(res.status, 400)
  })

  it('replays an order with the same idempotency key instead of charging twice', async () => {
    const key = 'checkout-attempt-0001'
    const before = await prisma.product.findUnique({ where: { id: product.id } })
    const first = await placeOrder(customer.cookie, [{ product_id: product.id, quantity: 1 }], { key })
    const second = await placeOrder(customer.cookie, [{ product_id: product.id, quantity: 1 }], { key })
    assert.equal(first.status, 201)
    assert.equal(second.status, 200)
    assert.equal(second.body.replayed, true)
    assert.equal(second.body.data.id, first.body.data.id)
    const after = await prisma.product.findUnique({ where: { id: product.id } })
    assert.equal(after.stock, before.stock - 1)
    assert.equal(after.totalSold, before.totalSold + 1)
  })

  it('rejects a malformed idempotency key', async () => {
    const res = await placeOrder(customer.cookie, [{ product_id: product.id, quantity: 1 }], { key: 'bad key!' })
    assert.equal(res.status, 400)
  })

  it('ships to a saved address, but not to another user\'s address', async () => {
    const other = await createUser('customer')
    const mine = await prisma.address.create({
      data: { userId: customer.user.id, fullName: 'Me', phone: '+9611234567', line1: 'Gemmayze 5', city: 'Beirut' },
    })
    const theirs = await prisma.address.create({
      data: { userId: other.user.id, fullName: 'Them', phone: '+9611234567', line1: 'Jounieh 1', city: 'Jounieh' },
    })
    const ok = await placeOrder(customer.cookie, [{ product_id: product.id, quantity: 1 }], {
      shippingInfo: { address_id: mine.id, payment_method: 'cash_delivery' },
    })
    const denied = await placeOrder(customer.cookie, [{ product_id: product.id, quantity: 1 }], {
      shippingInfo: { address_id: theirs.id, payment_method: 'cash_delivery' },
    })
    assert.equal(ok.status, 201)
    assert.equal(ok.body.data.shipping_address, 'Gemmayze 5')
    assert.equal(denied.status, 400)
  })

  it('notifies vendors and emails the buyer when an order is placed', async () => {
    const mailBefore = sentMail.length
    await placeOrder(customer.cookie, [{ product_id: product.id, quantity: 1 }])
    const notes = await prisma.notification.findMany({ where: { userId: vendor.user.id, type: 'order.new' } })
    assert.ok(notes.length >= 1)
    await new Promise(resolve => setTimeout(resolve, 50))
    assert.ok(sentMail.slice(mailBefore).some(m => m.to === customer.user.email && m.subject.startsWith('Order confirmed')))
  })
})

describe('order tracking and fulfilment', () => {
  let vendorA, vendorB, customer, productA, productB, order

  before(async () => {
    vendorA = await createUser('vendor')
    vendorB = await createUser('vendor')
    customer = await createUser('customer')
    productA = await createProduct(vendorA.user.vendor.id, { stock: 5 })
    productB = await createProduct(vendorB.user.vendor.id, { stock: 5 })
    const res = await placeOrder(customer.cookie, [
      { product_id: productA.id, quantity: 2 },
      { product_id: productB.id, quantity: 1 },
    ])
    order = res.body.data
  })

  const itemFor = productId => order.order_items.find(i => i.product_id === productId)
  const setStatus = (vendor, itemId, status) => request(app)
    .patch(`/api/vendor/orders/${itemId}/status`)
    .set('Cookie', vendor.cookie)
    .send({ status })

  it('shows the full order and timeline to the customer', async () => {
    const res = await request(app).get(`/api/orders/${order.id}`).set('Cookie', customer.cookie)
    assert.equal(res.status, 200)
    assert.equal(res.body.data.order_items.length, 2)
    assert.equal(res.body.data.status_history[0].status, 'pending')
  })

  it('shows a vendor only their own lines and hides the order from strangers', async () => {
    const asVendor = await request(app).get(`/api/orders/${order.id}`).set('Cookie', vendorA.cookie)
    const stranger = await createUser('customer')
    const asStranger = await request(app).get(`/api/orders/${order.id}`).set('Cookie', stranger.cookie)
    assert.equal(asVendor.status, 200)
    assert.deepEqual(asVendor.body.data.order_items.map(i => i.product_id), [productA.id])
    assert.equal(asStranger.status, 404)
  })

  it('restocks on cancellation and blocks further changes', async () => {
    const cancel = await setStatus(vendorB, itemFor(productB.id).id, 'cancelled')
    assert.equal(cancel.status, 200)
    const restocked = await prisma.product.findUnique({ where: { id: productB.id } })
    assert.equal(restocked.stock, 5)
    assert.equal(restocked.totalSold, 0)
    const again = await setStatus(vendorB, itemFor(productB.id).id, 'shipped')
    assert.equal(again.status, 409)
  })

  it('derives the order status from its items and records history', async () => {
    await setStatus(vendorA, itemFor(productA.id).id, 'shipped')
    let stored = await prisma.order.findUnique({ where: { id: order.id }, include: { statusHistory: true } })
    assert.equal(stored.status, 'shipped')

    await setStatus(vendorA, itemFor(productA.id).id, 'delivered')
    stored = await prisma.order.findUnique({ where: { id: order.id }, include: { statusHistory: true } })
    assert.equal(stored.status, 'delivered')
    assert.ok(stored.statusHistory.some(h => h.orderItemId === null && h.status === 'delivered'))

    const notes = await prisma.notification.count({ where: { userId: customer.user.id, type: 'order.status' } })
    assert.ok(notes >= 3)
  })

  it('derives statuses correctly', () => {
    assert.equal(deriveOrderStatus(['cancelled', 'cancelled']), 'cancelled')
    assert.equal(deriveOrderStatus(['shipped', 'pending']), 'pending')
    assert.equal(deriveOrderStatus(['delivered', 'cancelled']), 'delivered')
  })

  it('paginates the customer order list', async () => {
    const res = await request(app).get('/api/orders/my?limit=1').set('Cookie', customer.cookie)
    assert.equal(res.status, 200)
    assert.equal(res.body.data.length, 1)
    assert.equal(res.body.limit, 1)
  })
})

describe('catalog search', () => {
  let vendor, oil, cheap, hiddenVendor, hidden

  before(async () => {
    vendor = await createUser('vendor')
    await prisma.vendor.update({ where: { id: vendor.user.vendor.id }, data: { storeName: 'Beit Zeitoun' } })
    oil = await createProduct(vendor.user.vendor.id, { name: 'زيت زيتون بكر', price: '25.00', rating: 4.8, totalSold: 50 })
    cheap = await createProduct(vendor.user.vendor.id, { name: 'Olive soap bar', price: '3.00', rating: 3.1, stock: 0 })
    hiddenVendor = await createUser('vendor')
    await prisma.vendor.update({ where: { id: hiddenVendor.user.vendor.id }, data: { listingsHidden: true } })
    hidden = await createProduct(hiddenVendor.user.vendor.id, { name: 'Olive oil hidden' })
  })

  const ids = res => res.body.data.map(p => p.id)

  it('matches Arabic text', async () => {
    const res = await request(app).get(`/api/products?search=${encodeURIComponent('زيتون')}`)
    assert.deepEqual(ids(res), [oil.id])
  })

  it('matches by vendor name and filters by rating and stock', async () => {
    const byVendor = await request(app).get('/api/products?q=zeitoun')
    assert.deepEqual(new Set(ids(byVendor)), new Set([oil.id, cheap.id]))
    const rated = await request(app).get(`/api/products?vendor=${vendor.user.vendor.id}&minRating=4`)
    assert.deepEqual(ids(rated), [oil.id])
    const inStock = await request(app).get(`/api/products?vendor=${vendor.user.vendor.id}&inStock=true`)
    assert.deepEqual(ids(inStock), [oil.id])
  })

  it('sorts by price and popularity', async () => {
    const asc = await request(app).get(`/api/products?vendor=${vendor.user.vendor.id}&sort=price-asc`)
    assert.deepEqual(ids(asc), [cheap.id, oil.id])
    const popular = await request(app).get(`/api/products?vendor=${vendor.user.vendor.id}&sort=popular`)
    assert.equal(ids(popular)[0], oil.id)
  })

  it('hides products of vendors whose listings are hidden', async () => {
    const list = await request(app).get('/api/products?search=hidden')
    assert.equal(list.body.data.length, 0)
    const detail = await request(app).get(`/api/products/${hidden.slug}`)
    assert.equal(detail.status, 404)
  })

  it('clamps oversized page sizes', async () => {
    const res = await request(app).get('/api/products?limit=500')
    assert.equal(res.status, 200)
    assert.equal(res.body.limit, 50)
  })

  it('suggests products and vendors', async () => {
    const res = await request(app).get('/api/search/suggest?q=beit')
    assert.equal(res.status, 200)
    assert.equal(res.body.data.vendors[0].store_name, 'Beit Zeitoun')
  })
})

describe('reviews', () => {
  let vendor, buyer, browser, product

  before(async () => {
    vendor = await createUser('vendor')
    buyer = await createUser('customer')
    browser = await createUser('customer')
    product = await createProduct(vendor.user.vendor.id)
    await deliveredPurchase(buyer, product)
  })

  const review = (actor, body) => request(app).post(`/api/products/${product.id}/reviews`).set('Cookie', actor.cookie).send(body)

  it('only lets customers who received the product review it', async () => {
    const res = await review(browser, { rating: 5 })
    assert.equal(res.status, 403)
  })

  it('creates then updates a review and keeps ratings in sync', async () => {
    const created = await review(buyer, { rating: 4, title: 'Good', body: '<script>x</script>Fresh' })
    assert.equal(created.status, 201)
    assert.equal(created.body.data.body, 'Fresh')
    const updated = await review(buyer, { rating: 2 })
    assert.equal(updated.status, 200)

    const stored = await prisma.product.findUnique({ where: { id: product.id } })
    assert.equal(stored.rating, 2)
    assert.equal(stored.totalReviews, 1)
    const storedVendor = await prisma.vendor.findUnique({ where: { id: vendor.user.vendor.id } })
    assert.equal(storedVendor.rating, 2)

    const list = await request(app).get(`/api/products/${product.id}/reviews`)
    assert.equal(list.body.total, 1)
    assert.equal(list.body.summary.breakdown[2], 1)
  })

  it('lets only the author delete a review', async () => {
    const { id } = await prisma.review.findFirstOrThrow({ where: { productId: product.id } })
    const stranger = await request(app).delete(`/api/reviews/${id}`).set('Cookie', browser.cookie)
    assert.equal(stranger.status, 404)
    const author = await request(app).delete(`/api/reviews/${id}`).set('Cookie', buyer.cookie)
    assert.equal(author.status, 200)
    const stored = await prisma.product.findUnique({ where: { id: product.id } })
    assert.equal(stored.totalReviews, 0)
  })
})

describe('wishlist, addresses and notifications', () => {
  let user, other, product

  before(async () => {
    const vendor = await createUser('vendor')
    user = await createUser('customer')
    other = await createUser('customer')
    product = await createProduct(vendor.user.vendor.id)
  })

  it('adds, lists and removes wishlist items idempotently', async () => {
    for (let i = 0; i < 2; i++) {
      const res = await request(app).post('/api/wishlist').set('Cookie', user.cookie).send({ productId: product.id })
      assert.equal(res.status, 201)
    }
    const list = await request(app).get('/api/wishlist').set('Cookie', user.cookie)
    assert.deepEqual(list.body.data.map(p => p.id), [product.id])
    await request(app).delete(`/api/wishlist/${product.id}`).set('Cookie', user.cookie)
    const empty = await request(app).get('/api/wishlist').set('Cookie', user.cookie)
    assert.equal(empty.body.data.length, 0)
  })

  it('refuses to wishlist unpublished products', async () => {
    const draft = await createProduct(product.vendorId, { status: 'draft' })
    const res = await request(app).post('/api/wishlist').set('Cookie', user.cookie).send({ productId: draft.id })
    assert.equal(res.status, 404)
  })

  it('manages default addresses and keeps them private', async () => {
    const body = { fullName: 'Lina M', phone: '+961 3 123 456', line1: 'Achrafieh 10', city: 'Beirut' }
    const first = await request(app).post('/api/addresses').set('Cookie', user.cookie).send(body)
    assert.equal(first.status, 201)
    assert.equal(first.body.data.is_default, true)
    assert.equal(first.body.data.country, 'LB')

    const second = await request(app).post('/api/addresses').set('Cookie', user.cookie).send({ ...body, line1: 'Byblos 2', isDefault: true })
    const list = await request(app).get('/api/addresses').set('Cookie', user.cookie)
    assert.deepEqual(list.body.data.map(a => a.is_default), [true, false])
    assert.equal(list.body.data[0].id, second.body.data.id)

    const hijack = await request(app).patch(`/api/addresses/${second.body.data.id}`).set('Cookie', other.cookie).send({ city: 'X' })
    assert.equal(hijack.status, 404)

    await request(app).delete(`/api/addresses/${second.body.data.id}`).set('Cookie', user.cookie)
    const promoted = await prisma.address.findUnique({ where: { id: first.body.data.id } })
    assert.equal(promoted.isDefault, true)
  })

  it('caps saved addresses at ten', async () => {
    const capped = await createUser('customer')
    const body = { fullName: 'A', phone: '+9611234567', line1: 'Street', city: 'Tyre' }
    for (let i = 0; i < 10; i++) await request(app).post('/api/addresses').set('Cookie', capped.cookie).send(body)
    const eleventh = await request(app).post('/api/addresses').set('Cookie', capped.cookie).send(body)
    assert.equal(eleventh.status, 409)
  })

  it('tracks unread notifications per user', async () => {
    await prisma.notification.createMany({
      data: [
        { userId: user.user.id, type: 'test', title: 'One' },
        { userId: user.user.id, type: 'test', title: 'Two' },
        { userId: other.user.id, type: 'test', title: 'Not yours' },
      ],
    })
    const list = await request(app).get('/api/notifications').set('Cookie', user.cookie)
    assert.equal(list.body.unread, 2)

    const theirs = await prisma.notification.findFirstOrThrow({ where: { userId: other.user.id } })
    const denied = await request(app).patch(`/api/notifications/${theirs.id}/read`).set('Cookie', user.cookie)
    assert.equal(denied.status, 404)

    await request(app).patch(`/api/notifications/${list.body.data[0].id}/read`).set('Cookie', user.cookie)
    const afterOne = await request(app).get('/api/notifications?unread=true').set('Cookie', user.cookie)
    assert.equal(afterOne.body.unread, 1)

    await request(app).post('/api/notifications/read-all').set('Cookie', user.cookie)
    const afterAll = await request(app).get('/api/notifications').set('Cookie', user.cookie)
    assert.equal(afterAll.body.unread, 0)
  })
})

describe('subscription lifecycle', () => {
  const now = new Date()

  async function vendorWithPlan(endsInDays, extra = {}) {
    const vendor = await createUser('vendor')
    const sub = await prisma.vendorSubscription.create({
      data: {
        vendorId: vendor.user.vendor.id,
        plan: 'monthly',
        status: 'active',
        amount: '15.00',
        startDate: new Date(now.getTime() - 20 * DAY_MS),
        endDate: new Date(now.getTime() + endsInDays * DAY_MS),
        ...extra,
      },
    })
    return { vendor, sub }
  }

  it('expires lapsed plans, hides listings, and notifies the vendor once', async () => {
    const { vendor, sub } = await vendorWithPlan(-1)
    const mailBefore = sentMail.length

    const first = await runSubscriptionJob({ now })
    const second = await runSubscriptionJob({ now })
    assert.ok(first.expired >= 1)
    assert.equal(second.expired, 0)

    assert.equal((await prisma.vendorSubscription.findUnique({ where: { id: sub.id } })).status, 'expired')
    assert.equal((await prisma.vendor.findUnique({ where: { id: vendor.user.vendor.id } })).listingsHidden, true)
    assert.equal(await prisma.notification.count({ where: { userId: vendor.user.id, type: 'subscription.ended' } }), 1)
    await new Promise(resolve => setTimeout(resolve, 50))
    assert.equal(sentMail.slice(mailBefore).filter(m => m.to === vendor.user.email).length, 1)
  })

  it('keeps listings visible when another plan is still active', async () => {
    const { vendor } = await vendorWithPlan(-1)
    await prisma.vendorSubscription.create({
      data: { vendorId: vendor.user.vendor.id, plan: 'annual', status: 'active', amount: '120.00', endDate: new Date(now.getTime() + 300 * DAY_MS) },
    })
    await runSubscriptionJob({ now })
    assert.equal((await prisma.vendor.findUnique({ where: { id: vendor.user.vendor.id } })).listingsHidden, false)
  })

  it('sends a single reminder seven days before the end', async () => {
    const { vendor, sub } = await vendorWithPlan(5)
    const first = await runSubscriptionJob({ now })
    const second = await runSubscriptionJob({ now })
    assert.ok(first.reminded >= 1)
    assert.equal(second.reminded, 0)
    assert.ok((await prisma.vendorSubscription.findUnique({ where: { id: sub.id } })).reminderSentAt)
    assert.equal(await prisma.notification.count({ where: { userId: vendor.user.id, type: 'subscription.expiring' } }), 1)
  })

  it('restores listings when an admin activates a renewal', async () => {
    const admin = await createUser('admin')
    const vendor = await createUser('vendor')
    await prisma.vendor.update({ where: { id: vendor.user.vendor.id }, data: { listingsHidden: true } })
    const renewal = await prisma.vendorSubscription.create({
      data: { vendorId: vendor.user.vendor.id, plan: 'monthly', status: 'pending_payment', amount: '15.00' },
    })
    const res = await request(app)
      .patch(`/api/admin/subscriptions/${renewal.id}`)
      .set('Cookie', admin.cookie)
      .send({ status: 'active' })
    assert.equal(res.status, 200)
    assert.ok(res.body.data.end_date)
    assert.equal(res.body.data.amount, 15)
    assert.equal((await prisma.vendor.findUnique({ where: { id: vendor.user.vendor.id } })).listingsHidden, false)
  })
})

describe('operations', () => {
  it('reports readiness with a database check', async () => {
    const res = await request(app).get('/api/ready')
    assert.equal(res.status, 200)
    assert.equal(res.body.db, 'up')
  })

  it('propagates a valid request id and generates one otherwise', async () => {
    const echoed = await request(app).get('/api/health').set('X-Request-Id', 'trace-abc-12345')
    assert.equal(echoed.headers['x-request-id'], 'trace-abc-12345')
    const generated = await request(app).get('/api/health').set('X-Request-Id', 'bad id')
    assert.match(generated.headers['x-request-id'], /^[0-9a-f-]{36}$/)
  })

  it('serves an OpenAPI document generated from the route schemas', async () => {
    const res = await request(app).get('/api/docs/openapi.json')
    assert.equal(res.status, 200)
    assert.equal(res.body.openapi, '3.1.0')
    const createOrder = res.body.paths['/api/orders'].post
    assert.ok(createOrder.requestBody.content['application/json'].schema.properties.cartItems)
    assert.ok(res.body.paths['/api/products/{productId}/reviews'].get.parameters.some(p => p.name === 'productId' && p.in === 'path'))
  })

  it('returns the first validation message to the client', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Al', email: 'not-an-email', password: 'longenough' })
    assert.equal(res.status, 400)
    assert.match(res.body.message, /^email: Enter a valid email address$/)
  })
})
