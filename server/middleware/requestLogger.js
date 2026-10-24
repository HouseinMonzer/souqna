const crypto = require('crypto')
const pinoHttp = require('pino-http')
const { logger } = require('../lib/logger')

const QUIET_PATHS = new Set(['/api/health', '/api/ready'])
const VALID_REQUEST_ID = /^[A-Za-z0-9._-]{8,128}$/

const requestLogger = pinoHttp({
  logger,
  genReqId(req, res) {
    const incoming = req.headers['x-request-id']
    const id = typeof incoming === 'string' && VALID_REQUEST_ID.test(incoming) ? incoming : crypto.randomUUID()
    res.setHeader('X-Request-Id', id)
    return id
  },
  autoLogging: { ignore: req => QUIET_PATHS.has(req.url) },
  customLogLevel(_req, res, err) {
    if (err || res.statusCode >= 500) return 'error'
    if (res.statusCode >= 400) return 'warn'
    return 'info'
  },
  serializers: {
    req: req => ({ id: req.id, method: req.method, url: req.url }),
    res: res => ({ statusCode: res.statusCode }),
  },
})

module.exports = { requestLogger }
