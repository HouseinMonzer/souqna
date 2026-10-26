const env = require('./config/env')
require('./lib/asyncErrors')

const express = require('express')
const { prisma } = require('./lib/prisma')
const { applySecurity } = require('./middleware/security')
const { requestLogger } = require('./middleware/requestLogger')
const { notFoundHandler, errorHandler } = require('./middleware/error')

const modules = ['auth', 'catalog', 'vendor', 'orders', 'reviews', 'wishlist', 'addresses', 'notifications', 'subscriptions', 'admin', 'contact']

const app = express()

app.use(requestLogger)
applySecurity(app)

app.use('/api', require('./modules/system').router)
for (const name of modules) {
  app.use('/api', require(`./modules/${name}`).router)
}

app.use('/api', notFoundHandler)
app.use(errorHandler)

module.exports = { app, prisma, env }
