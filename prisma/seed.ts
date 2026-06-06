import { PrismaClient } from '../generated/prisma'
import * as crypto from 'crypto'

const prisma = new PrismaClient()

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

async function main() {
  console.log('🌱 Starting database seed...')

  // Create categories
  const electronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: { name: 'Electronics', slug: 'electronics' },
  })

  const food = await prisma.category.upsert({
    where: { slug: 'food-beverage' },
    update: {},
    create: { name: 'Food & Beverage', slug: 'food-beverage' },
  })

  const fashion = await prisma.category.upsert({
    where: { slug: 'fashion' },
    update: {},
    create: { name: 'Fashion', slug: 'fashion' },
  })

  const crafts = await prisma.category.upsert({
    where: { slug: 'crafts' },
    update: {},
    create: { name: 'Crafts & Gifts', slug: 'crafts' },
  })

  // Lebanese vendor
  const lebanesUser = await prisma.user.upsert({
    where: { email: 'zaatar@souqna.com' },
    update: {},
    create: {
      email: 'zaatar@souqna.com',
      password: hashPassword('password123'),
      profile: {
        create: {
          fullName: 'Zaatar & More',
          role: 'vendor',
        },
      },
      vendor: {
        create: {
          storeName: 'Zaatar & More',
          slug: 'zaatar-more',
          description: 'Traditional Lebanese spices and products',
          businessName: 'Zaatar & More Co.',
          category: 'Food & Beverage',
          location: 'Beirut, Lebanon',
          verified: true,
          status: 'active',
          rating: 4.8,
          totalSales: 1250,
          productsCount: 15,
        },
      },
    },
  })

  // Chinese vendor
  const chineseUser = await prisma.user.upsert({
    where: { email: 'dragon@souqna.com' },
    update: {},
    create: {
      email: 'dragon@souqna.com',
      password: hashPassword('password123'),
      profile: {
        create: {
          fullName: 'Dragon Crafts',
          role: 'vendor',
        },
      },
      vendor: {
        create: {
          storeName: 'Dragon Crafts',
          slug: 'dragon-crafts',
          description: 'Authentic Chinese handicrafts and porcelain',
          businessName: 'Dragon Crafts Ltd.',
          category: 'Crafts & Gifts',
          location: 'Shanghai, China',
          verified: true,
          status: 'active',
          rating: 4.9,
          totalSales: 2150,
          productsCount: 28,
        },
      },
    },
  })

  // Lebanese products
  await prisma.product.upsert({
    where: { slug: 'lebanese-zaatar-mix' },
    update: {},
    create: {
      name: 'Lebanese Zaatar Mix',
      slug: 'lebanese-zaatar-mix',
      description: 'Authentic zaatar blend with sumac, thyme, and sesame seeds',
      price: 12.99,
      status: 'active',
      approvalStatus: 'approved',
      featured: true,
      vendorId: lebanesUser.vendor!.id,
      categoryId: food.id,
      productImages: {
        create: [
          {
            imageUrl: 'https://via.placeholder.com/400?text=Zaatar',
            isPrimary: true,
          },
        ],
      },
    },
  })

  await prisma.product.upsert({
    where: { slug: 'cedar-nuts' },
    update: {},
    create: {
      name: 'Premium Cedar Nuts',
      slug: 'cedar-nuts',
      description: 'Fresh Lebanese cedar nuts from Mount Lebanon',
      price: 24.99,
      status: 'active',
      approvalStatus: 'approved',
      featured: true,
      vendorId: lebanesUser.vendor!.id,
      categoryId: food.id,
      productImages: {
        create: [
          {
            imageUrl: 'https://via.placeholder.com/400?text=Cedar+Nuts',
            isPrimary: true,
          },
        ],
      },
    },
  })

  await prisma.product.upsert({
    where: { slug: 'olive-oil-organic' },
    update: {},
    create: {
      name: 'Organic Lebanese Olive Oil',
      slug: 'olive-oil-organic',
      description: 'Cold-pressed extra virgin olive oil from the Bekaa Valley',
      price: 18.99,
      status: 'active',
      approvalStatus: 'approved',
      featured: false,
      vendorId: lebanesUser.vendor!.id,
      categoryId: food.id,
      productImages: {
        create: [
          {
            imageUrl: 'https://via.placeholder.com/400?text=Olive+Oil',
            isPrimary: true,
          },
        ],
      },
    },
  })

  // Chinese products
  await prisma.product.upsert({
    where: { slug: 'blue-white-porcelain-vase' },
    update: {},
    create: {
      name: 'Blue & White Porcelain Vase',
      slug: 'blue-white-porcelain-vase',
      description: 'Hand-painted Ming Dynasty style porcelain vase',
      price: 89.99,
      status: 'active',
      approvalStatus: 'approved',
      featured: true,
      vendorId: chineseUser.vendor!.id,
      categoryId: crafts.id,
      productImages: {
        create: [
          {
            imageUrl: 'https://via.placeholder.com/400?text=Porcelain+Vase',
            isPrimary: true,
          },
        ],
      },
    },
  })

  await prisma.product.upsert({
    where: { slug: 'silk-tapestry-dragon' },
    update: {},
    create: {
      name: 'Silk Tapestry - Dragon Design',
      slug: 'silk-tapestry-dragon',
      description: 'Traditional silk embroidered tapestry with golden dragon motif',
      price: 149.99,
      status: 'active',
      approvalStatus: 'approved',
      featured: true,
      vendorId: chineseUser.vendor!.id,
      categoryId: crafts.id,
      productImages: {
        create: [
          {
            imageUrl: 'https://via.placeholder.com/400?text=Silk+Tapestry',
            isPrimary: true,
          },
        ],
      },
    },
  })

  await prisma.product.upsert({
    where: { slug: 'bamboo-tea-set' },
    update: {},
    create: {
      name: 'Bamboo Tea Set - Premium',
      slug: 'bamboo-tea-set',
      description: 'Complete tea set with handcrafted bamboo accessories',
      price: 65.99,
      status: 'active',
      approvalStatus: 'approved',
      featured: false,
      vendorId: chineseUser.vendor!.id,
      categoryId: crafts.id,
      productImages: {
        create: [
          {
            imageUrl: 'https://via.placeholder.com/400?text=Tea+Set',
            isPrimary: true,
          },
        ],
      },
    },
  })

  // Create vendor summaries
  await prisma.vendorSummary.upsert({
    where: { vendorId: lebanesUser.vendor!.id },
    update: {},
    create: {
      vendorId: lebanesUser.vendor!.id,
      totalSales: 1250,
      totalOrders: 185,
      totalProducts: 15,
      rating: 4.8,
      reviews: 312,
    },
  })

  await prisma.vendorSummary.upsert({
    where: { vendorId: chineseUser.vendor!.id },
    update: {},
    create: {
      vendorId: chineseUser.vendor!.id,
      totalSales: 2150,
      totalOrders: 289,
      totalProducts: 28,
      rating: 4.9,
      reviews: 521,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log(`
Lebanese Vendor: 
  Email: zaatar@souqna.com
  Password: password123
  Store: Zaatar & More

Chinese Vendor:
  Email: dragon@souqna.com
  Password: password123
  Store: Dragon Crafts
  `)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
