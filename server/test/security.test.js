const { describe, it, before, after } = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')
const { app, prisma, createUser, createProduct, teardown } = require('./helpers')

after(teardown)

describe('authentication', () => {
  it('rejects requests without a session', async () => {
    const res = await request(app).get('/api/auth/me')
    assert.equal(res.status, 401)
  })

  it('rejects a forged token', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'souqna_token=not-a-jwt')
    assert.equal(res.status, 401)
  })

  it('returns the same error for unknown email and wrong password', async () => {
    const bcrypt = require('bcrypt')
    await prisma.user.create({
      data: {
        email: 'known@test.local',
        passwordHash: await bcrypt.hash('correct-password', 4),
        isVerified: true,
        profile: { create: { role: 'customer' } },
      },
    })
    const unknown = await request(app).post('/api/auth/login').send({ email: 'nobody@test.local', password: 'whatever1' })
    const wrong = await request(app).post('/api/auth/login').send({ email: 'known@test.local', password: 'wrong-password' })
    assert.equal(unknown.status, 401)
    assert.equal(wrong.status, 401)
    assert.equal(unknown.body.message, wrong.body.message)
  })
})

describe('authorization', () => {
  let admin, customerA, customerB, vendorA, vendorB, productB

  before(async () => {
    admin = await createUser('admin')
    customerA = await createUser('customer')
    customerB = await createUser('customer')
    vendorA = await createUser('vendor')
    vendorB = await createUser('vendor')
    productB = await createProduct(vendorB.user.vendor.id)
  })

  it('blocks non-admins from admin routes', async () => {
    for (const actor of [customerA, vendorA]) {
      const res = await request(app).get('/api/admin/users').set('Cookie', actor.cookie)
      assert.equal(res.status, 403)
    }
  })

  it('allows admins into admin routes', async () => {
    const res = await request(app).get('/api/admin/users').set('Cookie', admin.cookie)
    assert.equal(res.status, 200)
  })

  it('prevents an admin from removing their own admin role', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${admin.user.id}/role`)
      .set('Cookie', admin.cookie)
      .send({ role: 'customer' })
    assert.equal(res.status, 400)
  })

  it('lets customers read only their own orders', async () => {
    const own = await request(app).get(`/api/orders/customer/${customerA.user.customer.id}`).set('Cookie', customerA.cookie)
    const other = await request(app).get(`/api/orders/customer/${customerB.user.customer.id}`).set('Cookie', customerA.cookie)
    assert.equal(own.status, 200)
    assert.equal(other.status, 403)
  })

  it('lets vendors read only their own order items', async () => {
    const own = await request(app).get(`/api/orders/vendor/${vendorA.user.vendor.id}`).set('Cookie', vendorA.cookie)
    const other = await request(app).get(`/api/orders/vendor/${vendorB.user.vendor.id}`).set('Cookie', vendorA.cookie)
    assert.equal(own.status, 200)
    assert.equal(other.status, 403)
  })

  it("prevents vendors from editing or deleting another vendor's product", async () => {
    const update = await request(app).put(`/api/vendor/products/${productB.id}`).set('Cookie', vendorA.cookie).send({ price: 1 })
    const remove = await request(app).delete(`/api/vendor/products/${productB.id}`).set('Cookie', vendorA.cookie)
    assert.equal(update.status, 404)
    assert.equal(remove.status, 404)
    const unchanged = await prisma.product.findUnique({ where: { id: productB.id } })
    assert.equal(unchanged.price, 10)
    assert.equal(unchanged.status, 'active')
  })

  it("prevents vendors from updating another vendor's order item", async () => {
    const order = await prisma.order.create({
      data: {
        customerId: customerA.user.customer.id,
        orderNumber: `ORD-TEST-${Date.now()}`,
        orderItems: {
          create: {
            productId: productB.id,
            vendorId: vendorB.user.vendor.id,
            quantity: 1,
            unitPrice: 10,
            totalPrice: 10,
            productName: productB.name,
          },
        },
      },
      include: { orderItems: true },
    })
    const res = await request(app)
      .patch(`/api/vendor/orders/${order.orderItems[0].id}/status`)
      .set('Cookie', vendorA.cookie)
      .send({ status: 'shipped' })
    assert.equal(res.status, 404)
  })

  it('requires an active vendor account to create products', async () => {
    const pending = await createUser('vendor', { vendorStatus: 'pending' })
    const body = { name: 'New product', price: 5 }
    const asCustomer = await request(app).post('/api/vendor/products').set('Cookie', customerA.cookie).send(body)
    const asPending = await request(app).post('/api/vendor/products').set('Cookie', pending.cookie).send(body)
    assert.equal(asCustomer.status, 403)
    assert.equal(asPending.status, 403)
  })

  it('only lets active vendors and admins upload images', async () => {
    const res = await request(app)
      .post('/api/upload')
      .set('Cookie', customerA.cookie)
      .send({ imageData: 'data:image/png;base64,iVBORw0KGgo=' })
    assert.equal(res.status, 403)
  })

  it('hides unpublished products from the public product endpoint', async () => {
    const draft = await createProduct(vendorB.user.vendor.id, { status: 'draft' })
    const rejected = await createProduct(vendorB.user.vendor.id, { approvalStatus: 'rejected' })
    assert.equal((await request(app).get(`/api/products/${draft.slug}`)).status, 404)
    assert.equal((await request(app).get(`/api/products/${rejected.slug}`)).status, 404)
    assert.equal((await request(app).get(`/api/products/${productB.slug}`)).status, 200)
  })
})

describe('input validation', () => {
  let vendor

  before(async () => {
    vendor = await createUser('vendor')
  })

  it('rejects javascript: URLs in product images', async () => {
    const res = await request(app)
      .post('/api/vendor/products')
      .set('Cookie', vendor.cookie)
      .send({ name: 'Bad image', price: 5, imageUrl: 'javascript:alert(1)' })
    assert.equal(res.status, 400)
  })

  it('rejects javascript: URLs in vendor profile links but accepts handles', async () => {
    const bad = await request(app).patch('/api/vendor/profile').set('Cookie', vendor.cookie).send({ website: 'javascript:alert(1)' })
    const badSocial = await request(app).patch('/api/vendor/profile').set('Cookie', vendor.cookie).send({ instagram: 'javascript:alert(1)' })
    const good = await request(app)
      .patch('/api/vendor/profile')
      .set('Cookie', vendor.cookie)
      .send({ website: 'https://example.com', instagram: '@souqna.shop', whatsapp: '+961 71 123 456' })
    assert.equal(bad.status, 400)
    assert.equal(badSocial.status, 400)
    assert.equal(good.status, 200)
  })

  it('rejects uploads whose bytes are not an allowed image type', async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>').toString('base64')
    const res = await request(app)
      .post('/api/upload')
      .set('Cookie', vendor.cookie)
      .send({ imageData: `data:image/png;base64,${svg}` })
    assert.equal(res.status, 415)
  })

  it('caps JSON bodies on non-upload routes', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'x'.repeat(200_000), email: 'big@test.local', password: 'password123' })
    assert.equal(res.status, 413)
  })

  it('rejects malformed JSON with a 400', async () => {
    const res = await request(app).post('/api/auth/register').set('Content-Type', 'application/json').send('{"name":')
    assert.equal(res.status, 400)
  })

  it('validates query enums and treats empty filters as absent', async () => {
    const admin = await createUser('admin')
    const bogus = await request(app).get('/api/admin/vendors?status=bogus').set('Cookie', admin.cookie)
    const empty = await request(app).get('/api/admin/vendors?status=&search=').set('Cookie', admin.cookie)
    const upper = await request(app).get('/api/admin/vendors?status=ACTIVE').set('Cookie', admin.cookie)
    assert.equal(bogus.status, 400)
    assert.equal(empty.status, 200)
    assert.equal(upper.status, 200)
  })

  it('rejects malformed ids in path params', async () => {
    const res = await request(app).get("/api/vendors/' OR 1=1 --")
    assert.equal(res.status, 400)
  })

  it('refuses orders that exceed stock', async () => {
    const customer = await createUser('customer')
    const product = await createProduct(vendor.user.vendor.id, { stock: 1 })
    const res = await request(app)
      .post('/api/orders')
      .set('Cookie', customer.cookie)
      .send({
        cartItems: [{ product_id: product.id, quantity: 2 }],
        shippingInfo: {
          shipping_name: 'Test', shipping_address: 'Street 1', shipping_city: 'Beirut',
          shipping_phone: '+96170000000', payment_method: 'cash_delivery',
        },
      })
    assert.equal(res.status, 409)
    const after = await prisma.product.findUnique({ where: { id: product.id } })
    assert.equal(after.stock, 1)
  })
})

describe('transport security', () => {
  it('sets strict security headers and hides the framework', async () => {
    const res = await request(app).get('/api/health')
    assert.match(res.headers['content-security-policy'], /default-src 'none'/)
    assert.equal(res.headers['x-content-type-options'], 'nosniff')
    assert.equal(res.headers['x-powered-by'], undefined)
  })

  it('only allows configured CORS origins', async () => {
    const allowed = await request(app).get('/api/health').set('Origin', 'http://allowed.test')
    const blocked = await request(app).get('/api/health').set('Origin', 'http://evil.test')
    assert.equal(allowed.headers['access-control-allow-origin'], 'http://allowed.test')
    assert.equal(blocked.status, 403)
  })

  it('returns JSON 404 for unknown API routes', async () => {
    const res = await request(app).get('/api/does-not-exist')
    assert.equal(res.status, 404)
    assert.equal(res.body.message, 'Not found')
  })
})
