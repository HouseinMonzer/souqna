// Creates or resets the demo customer and vendor accounts.
// Usage: DEMO_ACCOUNT_PASSWORD='<strong password>' node scripts/seed-demo-accounts.js
require('dotenv').config({ path: '.env.local', quiet: true })
require('dotenv').config({ quiet: true })

const bcrypt = require('bcrypt')
const { PrismaClient } = require('@prisma/client')

const password = process.env.DEMO_ACCOUNT_PASSWORD
if (!password || password.length < 12) {
  console.error('Set DEMO_ACCOUNT_PASSWORD (at least 12 characters) before running this script.')
  process.exit(1)
}

const customers = [
  ['sara.demo@souqna.com', 'Sara Ahmad'],
  ['omar.demo@souqna.com', 'Omar Hassan'],
  ['lina.demo@souqna.com', 'Lina Mansour'],
  ['karim.demo@souqna.com', 'Karim Youssef'],
  ['nour.demo@souqna.com', 'Nour Khalil'],
]

const vendors = [
  ['techzone.demo@souqna.com', 'TechZone', 'Electronics'],
  ['fashionhub.demo@souqna.com', 'FashionHub', 'Fashion'],
  ['freshgrocer.demo@souqna.com', 'FreshGrocer', 'Food & Grocery'],
  ['bookcorner.demo@souqna.com', 'BookCorner', 'Books'],
  ['sportspro.demo@souqna.com', 'SportsPro', 'Sports & Fitness'],
]

const prisma = new PrismaClient()

async function upsertAccount({ email, fullName, role, vendor }) {
  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, isVerified: true },
    create: {
      email,
      passwordHash,
      isVerified: true,
      profile: { create: { fullName, role } },
      customer: role === 'customer' ? { create: {} } : undefined,
    },
    include: { vendor: true },
  })
  if (vendor && !user.vendor) {
    await prisma.vendor.create({
      data: {
        userId: user.id,
        storeName: vendor.storeName,
        businessName: vendor.storeName,
        slug: `${vendor.storeName.toLowerCase()}-demo`,
        category: vendor.category,
        status: 'active',
      },
    })
  }
}

async function main() {
  for (const [email, fullName] of customers) {
    await upsertAccount({ email, fullName, role: 'customer' })
  }
  for (const [email, storeName, category] of vendors) {
    await upsertAccount({ email, fullName: `${storeName} Store`, role: 'vendor', vendor: { storeName, category } })
  }
  console.log(`Seeded ${customers.length + vendors.length} demo accounts.`)
}

main()
  .catch(err => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
