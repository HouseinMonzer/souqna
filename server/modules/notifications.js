const { prisma } = require('../lib/prisma')
const { createRouter } = require('../lib/router')
const { z, id, pageQuery, paginate } = require('../lib/validation')
const { notFound } = require('../lib/errors')
const { mapNotification } = require('../lib/mappers')
const { requireUser } = require('../middleware/auth')

const { router, get, patch, post } = createRouter({ tag: 'Notifications' })

get('/notifications', {
  summary: 'Your notifications with the unread count',
  auth: true,
  middleware: requireUser,
  query: z.object({ ...pageQuery, unread: z.enum(['true', 'false']).optional() }),
}, async (req, res) => {
  const userId = req.currentUser.id
  const { take, skip, page, limit } = paginate(req.query, 20)
  const where = { userId, ...(req.query.unread === 'true' ? { readAt: null } : {}) }
  const [notifications, total, unread] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip, take }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ])
  res.json({ data: notifications.map(mapNotification), total, unread, page, limit })
})

patch('/notifications/:id/read', {
  summary: 'Mark a notification as read',
  auth: true,
  middleware: requireUser,
  params: z.object({ id }),
}, async (req, res) => {
  const { count } = await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.currentUser.id, readAt: null },
    data: { readAt: new Date() },
  })
  if (!count && !await prisma.notification.count({ where: { id: req.params.id, userId: req.currentUser.id } })) {
    throw notFound('Notification not found')
  }
  res.json({ data: true })
})

post('/notifications/read-all', { summary: 'Mark all notifications as read', auth: true, middleware: requireUser }, async (req, res) => {
  const { count } = await prisma.notification.updateMany({
    where: { userId: req.currentUser.id, readAt: null },
    data: { readAt: new Date() },
  })
  res.json({ data: { updated: count } })
})

module.exports = { router }
