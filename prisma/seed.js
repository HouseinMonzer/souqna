const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function upsertVendor({ email, clerkId, storeName, category, location, description, rating, totalSales, productsCount }) {
  const user = await prisma.user.upsert({
    where: { clerkId },
    update: { email },
    create: {
      clerkId,
      email,
      profile: {
        create: {
          fullName: storeName,
          role: 'vendor',
        },
      },
      vendor: {
        create: {
          storeName,
          businessName: storeName,
          slug: slugify(storeName),
          description,
          mission: category,
          category,
          location,
          verified: true,
          status: 'active',
          rating,
          totalReviews: Math.round(rating * 65),
          totalSales,
          productsCount,
        },
      },
    },
    include: { vendor: true },
  })

  if (!user.vendor) {
    throw new Error(`Seed vendor missing for ${email}`)
  }

  await prisma.vendorSummary.upsert({
    where: { vendorId: user.vendor.id },
    update: {
      totalSales,
      totalOrders: Math.round(totalSales / 7),
      totalProducts: productsCount,
      rating,
      reviews: Math.round(rating * 65),
    },
    create: {
      vendorId: user.vendor.id,
      totalSales,
      totalOrders: Math.round(totalSales / 7),
      totalProducts: productsCount,
      rating,
      reviews: Math.round(rating * 65),
    },
  })

  return user.vendor
}

async function main() {
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'food-beverage' },
      update: { name: 'Food & Beverage', isActive: true, sortOrder: 10 },
      create: { name: 'Food & Beverage', slug: 'food-beverage', isActive: true, sortOrder: 10 },
    }),
    prisma.category.upsert({
      where: { slug: 'crafts-gifts' },
      update: { name: 'Crafts & Gifts', isActive: true, sortOrder: 20 },
      create: { name: 'Crafts & Gifts', slug: 'crafts-gifts', isActive: true, sortOrder: 20 },
    }),
    prisma.category.upsert({
      where: { slug: 'fashion' },
      update: { name: 'Fashion', isActive: true, sortOrder: 30 },
      create: { name: 'Fashion', slug: 'fashion', isActive: true, sortOrder: 30 },
    }),
  ])

  const food = categories[0]
  const crafts = categories[1]

  const zaatar = await upsertVendor({
    email: 'zaatar@souqna.local',
    clerkId: 'seed_vendor_zaatar',
    storeName: 'Zaatar & More',
    category: 'Food & Beverage',
    location: 'Beirut, Lebanon',
    description: 'Traditional Lebanese spices and pantry staples.',
    rating: 4.8,
    totalSales: 1250,
    productsCount: 3,
  })

  const dragon = await upsertVendor({
    email: 'dragon@souqna.local',
    clerkId: 'seed_vendor_dragon',
    storeName: 'Dragon Crafts',
    category: 'Crafts & Gifts',
    location: 'Shanghai, China',
    description: 'Porcelain, silk, and handcrafted gifts.',
    rating: 4.9,
    totalSales: 2150,
    productsCount: 3,
  })

  const products = [
    {
      vendorId: zaatar.id,
      categoryId: food.id,
      name: 'Lebanese Zaatar Mix',
      description: 'Authentic zaatar blend with sumac, thyme, and sesame seeds.',
      price: 12.99,
      stock: 45,
      image: 'https://via.placeholder.com/600?text=Zaatar+Mix',
      featured: true,
      rating: 4.8,
      totalReviews: 48,
    },
    {
      vendorId: zaatar.id,
      categoryId: food.id,
      name: 'Premium Cedar Nuts',
      description: 'Fresh Lebanese cedar nuts from Mount Lebanon.',
      price: 24.99,
      stock: 24,
      image: 'https://via.placeholder.com/600?text=Cedar+Nuts',
      featured: true,
      rating: 4.7,
      totalReviews: 33,
    },
    {
      vendorId: zaatar.id,
      categoryId: food.id,
      name: 'Organic Lebanese Olive Oil',
      description: 'Cold-pressed extra virgin olive oil from the Bekaa Valley.',
      price: 18.99,
      stock: 60,
      image: 'https://via.placeholder.com/600?text=Olive+Oil',
      rating: 4.6,
      totalReviews: 22,
    },
    {
      vendorId: dragon.id,
      categoryId: crafts.id,
      name: 'Blue & White Porcelain Vase',
      description: 'Hand-painted porcelain vase in a classic blue and white style.',
      price: 89.99,
      stock: 8,
      image: 'https://via.placeholder.com/600?text=Porcelain+Vase',
      featured: true,
      rating: 4.9,
      totalReviews: 56,
    },
    {
      vendorId: dragon.id,
      categoryId: crafts.id,
      name: 'Silk Dragon Tapestry',
      description: 'Premium silk tapestry with dragon embroidery.',
      price: 149.99,
      stock: 5,
      image: 'https://via.placeholder.com/600?text=Silk+Tapestry',
      featured: true,
      rating: 4.8,
      totalReviews: 34,
    },
    {
      vendorId: dragon.id,
      categoryId: crafts.id,
      name: 'Bamboo Tea Set',
      description: 'Handcrafted bamboo tea set with porcelain cups.',
      price: 65.99,
      stock: 18,
      image: 'https://via.placeholder.com/600?text=Tea+Set',
      rating: 4.7,
      totalReviews: 18,
    },
  ]

  for (const item of products) {
    const slug = slugify(item.name)
    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        vendorId: item.vendorId,
        categoryId: item.categoryId,
        description: item.description,
        shortDescription: item.description,
        price: item.price,
        stock: item.stock,
        featured: Boolean(item.featured),
        rating: item.rating,
        totalReviews: item.totalReviews,
        status: 'active',
        approvalStatus: 'approved',
      },
      create: {
        vendorId: item.vendorId,
        categoryId: item.categoryId,
        name: item.name,
        slug,
        description: item.description,
        shortDescription: item.description,
        price: item.price,
        stock: item.stock,
        featured: Boolean(item.featured),
        rating: item.rating,
        totalReviews: item.totalReviews,
        status: 'active',
        approvalStatus: 'approved',
      },
    })

    await prisma.productImage.upsert({
      where: { id: `${product.id}-primary` },
      update: { imageUrl: item.image, isPrimary: true, sortOrder: 0 },
      create: {
        id: `${product.id}-primary`,
        productId: product.id,
        imageUrl: item.image,
        isPrimary: true,
      },
    })
  }

  console.log('Database seeded.')
}

main()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
