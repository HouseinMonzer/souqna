// Creates in-app notifications. Pass a transaction client to make them part of
// the surrounding write.
async function notify(db, userIds, { type, title, body = null, link = null }) {
  const ids = [...new Set([].concat(userIds).filter(Boolean))]
  if (!ids.length) return
  await db.notification.createMany({
    data: ids.map(userId => ({ userId, type, title, body, link })),
  })
}

module.exports = { notify }
