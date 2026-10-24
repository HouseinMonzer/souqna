const { Prisma } = require('@prisma/client')
const env = require('../config/env')
const { HttpError } = require('../lib/errors')
const { ValidationError } = require('../lib/validation')

function notFoundHandler(_req, res) {
  res.status(404).json({ message: 'Not found' })
}

// Known client errors keep their message; everything else is logged and
// returned as a generic 500 so internals never leak.
// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, _next) {
  if (error instanceof ValidationError) {
    return res.status(400).json({ message: error.message, errors: error.errors })
  }
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message, ...error.extra })
  }
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large.' })
  }
  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Malformed JSON body.' })
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Not found' })
    if (error.code === 'P2002') return res.status(409).json({ message: 'That record already exists.' })
  }
  req.log.error({ err: env.IS_PROD ? { message: error?.message, code: error?.code } : error }, 'unhandled error')
  res.status(500).json({ message: 'Internal server error' })
}

module.exports = { notFoundHandler, errorHandler }
