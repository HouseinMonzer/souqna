const { prisma } = require('./prisma')

// Audit logging must never break the action being audited.
async function writeAudit(req, { action, targetType, targetId, targetName, details }) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: req.currentUser?.id || 'system',
        action,
        targetType,
        targetId,
        targetName,
        details: details ?? undefined,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
      },
    })
  } catch (err) {
    req.log?.warn({ err, action, targetId }, 'audit log write failed')
  }
}

module.exports = { writeAudit }
