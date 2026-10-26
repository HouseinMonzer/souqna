const express = require('express')
const { validate } = require('./validation')

// Every route defined through createRouter is recorded here so the OpenAPI
// document is generated from the same zod schemas that validate requests.
const registry = []

function createRouter({ prefix = '/api', tag }) {
  const router = express.Router()

  const define = method => (path, spec, ...handlers) => {
    if (typeof spec === 'function') {
      handlers.unshift(spec)
      spec = {}
    }
    const { middleware = [], params, query, body, ...docs } = spec
    registry.push({ method, path: `${prefix}${path}`, tag, params, query, body, ...docs })
    const chain = [...middleware]
    if (params || query || body) chain.push(validate({ params, query, body }))
    router[method](path, ...chain, ...handlers)
  }

  return {
    router,
    prefix,
    get: define('get'),
    post: define('post'),
    put: define('put'),
    patch: define('patch'),
    delete: define('delete'),
  }
}

module.exports = { createRouter, registry }
