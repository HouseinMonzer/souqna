const { prisma } = require('../lib/prisma')
const { logger } = require('../lib/logger')
const { notify } = require('../lib/notify')
const { sendSubscriptionExpiring, sendSubscriptionExpired } = require('../lib/mailer')
const { hasOtherActivePlan } = require('../modules/subscriptions')

const DAY_MS = 24 * 60 * 60 * 1000
const REMINDER_WINDOW_MS = 7 * DAY_MS

const withVendorUser = { vendor: { include: { user: true } } }

// Every state change is a conditional update, so concurrent runs from several
// API instances cannot expire or remind the same subscription twice.
async function runSubscriptionJob({ now = new Date() } = {}) {
  let expired = 0
  let reminded = 0

  const due = await prisma.vendorSubscription.findMany({
    where: { status: 'active', endDate: { lt: now } },
    include: withVendorUser,
  })
  for (const sub of due) {
    const changed = await prisma.$transaction(async tx => {
      const { count } = await tx.vendorSubscription.updateMany({
        where: { id: sub.id, status: 'active' },
        data: { status: 'expired' },
      })
      if (!count) return false
      if (!await hasOtherActivePlan(tx, sub.vendorId, sub.id, now)) {
        await tx.vendor.update({ where: { id: sub.vendorId }, data: { listingsHidden: true } })
        await notify(tx, sub.vendor.userId, {
          type: 'subscription.ended',
          title: 'Your subscription has expired',
          body: 'Your products are hidden until you renew.',
          link: '/subscription',
        })
        return true
      }
      return false
    })
    if (changed) {
      expired += 1
      sendSubscriptionExpired(sub.vendor.user.email, { storeName: sub.vendor.storeName })
    }
  }

  const ending = await prisma.vendorSubscription.findMany({
    where: { status: 'active', reminderSentAt: null, endDate: { gte: now, lte: new Date(now.getTime() + REMINDER_WINDOW_MS) } },
    include: withVendorUser,
  })
  for (const sub of ending) {
    const { count } = await prisma.vendorSubscription.updateMany({
      where: { id: sub.id, reminderSentAt: null },
      data: { reminderSentAt: now },
    })
    if (!count) continue
    reminded += 1
    await notify(prisma, sub.vendor.userId, {
      type: 'subscription.expiring',
      title: 'Your subscription ends soon',
      body: `It ends on ${sub.endDate.toDateString()}. Renew to keep your products visible.`,
      link: '/subscription',
    })
    sendSubscriptionExpiring(sub.vendor.user.email, { storeName: sub.vendor.storeName, endDate: sub.endDate })
  }

  return { expired, reminded }
}

function startSubscriptionJob({ intervalMs = 60 * 60 * 1000, initialDelayMs = 30_000 } = {}) {
  const tick = async () => {
    try {
      const result = await runSubscriptionJob()
      if (result.expired || result.reminded) logger.info(result, 'subscription job')
    } catch (err) {
      logger.error({ err }, 'subscription job failed')
    }
  }
  const first = setTimeout(tick, initialDelayMs)
  const interval = setInterval(tick, intervalMs)
  first.unref()
  interval.unref()
  return () => {
    clearTimeout(first)
    clearInterval(interval)
  }
}

module.exports = { runSubscriptionJob, startSubscriptionJob }
