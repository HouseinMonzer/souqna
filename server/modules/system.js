const express = require('express')
const env = require('../config/env')
const { prisma } = require('../lib/prisma')
const { z } = require('../lib/validation')
const { registry } = require('../lib/router')

const router = express.Router()

// Liveness: the process is up. Readiness: it can also reach the database.
router.get('/health', (_req, res) => res.json({ ok: true }))

router.get('/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ ok: true, db: 'up' })
  } catch (err) {
    req.log.error({ err: err.message }, 'readiness check failed')
    res.status(503).json({ ok: false, db: 'down' })
  }
})

const jsonSchema = schema => z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' })

function parametersFor(schema, location) {
  if (!schema) return []
  const { properties = {}, required = [] } = jsonSchema(schema)
  return Object.entries(properties).map(([name, propSchema]) => ({
    name,
    in: location,
    required: location === 'path' || required.includes(name),
    schema: propSchema,
  }))
}

function buildOpenApiDocument() {
  const paths = {}
  for (const route of registry) {
    const path = route.path.replace(/:(\w+)/g, '{$1}')
    paths[path] ??= {}
    paths[path][route.method] = {
      tags: route.tag ? [route.tag] : undefined,
      summary: route.summary,
      security: route.auth ? [{ cookieAuth: [] }] : undefined,
      parameters: [...parametersFor(route.params, 'path'), ...parametersFor(route.query, 'query')],
      requestBody: route.body ? { required: true, content: { 'application/json': { schema: jsonSchema(route.body) } } } : undefined,
      responses: {
        200: { description: 'Success' },
        400: { description: 'Invalid request' },
        ...(route.auth ? { 401: { description: 'Not signed in' }, 403: { description: 'Not allowed' } } : {}),
      },
    }
  }
  return {
    openapi: '3.1.0',
    info: { title: 'SouQna API', version: '1.0.0', description: 'Multi-vendor marketplace API. Generated from the request validation schemas.' },
    servers: [{ url: env.API_URL || `http://localhost:${env.PORT}` }],
    components: { securitySchemes: { cookieAuth: { type: 'apiKey', in: 'cookie', name: 'souqna_token' } } },
    paths,
  }
}

// Interactive docs are a development aid only.
if (!env.IS_PROD) {
  let document
  router.get('/docs/openapi.json', (_req, res) => {
    document ??= buildOpenApiDocument()
    res.json(document)
  })

  const SWAGGER = 'https://unpkg.com/swagger-ui-dist@5.17.14'
  router.get('/docs', (_req, res) => {
    res.setHeader('Content-Security-Policy', `default-src 'none'; script-src ${SWAGGER} 'unsafe-inline'; style-src ${SWAGGER}; img-src 'self' data:; connect-src 'self'`)
    res.type('html').send(`<!doctype html><html><head><meta charset="utf-8"><title>SouQna API</title>
<link rel="stylesheet" href="${SWAGGER}/swagger-ui.css"></head><body><div id="ui"></div>
<script src="${SWAGGER}/swagger-ui-bundle.js"></script>
<script>SwaggerUIBundle({ url: '/api/docs/openapi.json', dom_id: '#ui' })</script></body></html>`)
  })
}

module.exports = { router, buildOpenApiDocument }
