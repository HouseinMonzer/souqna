const { app, prisma, env } = require('./app')
const { logger } = require('./lib/logger')
const { startSubscriptionJob } = require('./jobs/subscriptionExpiry')

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'Souqna API listening')
})

const stopJobs = env.DISABLE_JOBS === 'true' ? () => {} : startSubscriptionJob()

let shuttingDown = false
function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
  logger.info({ signal }, 'shutting down')
  stopJobs()
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
process.on('unhandledRejection', reason => logger.error({ err: reason }, 'unhandled rejection'))
