// Creates or drops a throwaway database on the TEST_DATABASE_URL server.
// Usage: node server/test/db.js create|drop <name>
const { PrismaClient } = require('@prisma/client')

const [action, name] = process.argv.slice(2)
if (!/^souqna_t_[a-z0-9_]+$/.test(name || '')) throw new Error(`Refusing to touch database "${name}"`)

const prisma = new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL })

const statement = action === 'create'
  ? `CREATE DATABASE "${name}"`
  : `DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`

prisma.$executeRawUnsafe(statement)
  .finally(() => prisma.$disconnect())
  .catch(err => {
    console.error(err.message)
    process.exit(1)
  })
