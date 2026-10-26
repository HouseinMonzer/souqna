const pino = require('pino')
const env = require('../config/env')

const logger = pino({
  level: env.LOG_LEVEL || (env.NODE_ENV === 'test' ? 'silent' : 'info'),
  base: { service: 'souqna-api' },
  redact: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]'],
})

module.exports = { logger }
