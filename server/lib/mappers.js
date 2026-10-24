// Maps Prisma records to the snake_case shapes the client already consumes.
// Money fields are Decimal in the database and plain numbers on the wire.
const { toNumber } = require('./money')

function mapProfile(profile) {
  if (!profile) return null
  return {
    id: profile.id,
    role: profile.role,
    full_name: profile.fullName,
    avatar_url: profile.avatarUrl,
    phone: profile.phone,
    created_at: profile.createdAt,
    updated_at: profile.updatedAt,
  }
}

function mapCustomer(customer) {
  if (!customer) return null
  return {
    id: customer.id,
    user_id: customer.userId,
    created_at: customer.createdAt,
  }
}

function mapVendor(vendor) {
  if (!vendor) return null
  return {
    id: vendor.id,
    user_id: vendor.userId,
    store_name: vendor.storeName,
    business_name: vendor.businessName,
    slug: vendor.slug,
    logo_url: vendor.logoUrl,
    logo_public_id: vendor.logoPublicId,
    cover_url: vendor.coverUrl,
    cover_public_id: vendor.coverPublicId,
    description: vendor.description,
    mission: vendor.mission || vendor.category,
    location: vendor.location,
    address: vendor.address,
    email: vendor.email,
    phone: vendor.phone,
    website: vendor.website,
    whatsapp: vendor.whatsapp,
    instagram: vendor.instagram,
    facebook: vendor.facebook,
    tiktok: vendor.tiktok,
    youtube: vendor.youtube,
    verified: vendor.verified,
    status: vendor.status,
    rating: vendor.rating,
    total_reviews: vendor.totalReviews || vendor.vendorSummary?.reviews || 0,
    total_sales: vendor.totalSales,
    products_count: vendor.productsCount,
    joined_at: vendor.joinedAt,
    updated_at: vendor.updatedAt,
    profiles: vendor.user?.profile ? mapProfile(vendor.user.profile) : null,
    social_links: (vendor.socialLinks || []).map(sl => ({
      id: sl.id,
      vendor_id: sl.vendorId,
      platform: sl.platform,
      url: sl.url,
      created_at: sl.createdAt,
    })),
  }
}

function mapAuthUser(user) {
  return {
    id: user.id,
    email: user.email,
    isVerified: user.isVerified ?? true,
    profile: mapProfile(user.profile),
    vendor: mapVendor(user.vendor),
    customer: mapCustomer(user.customer),
  }
}

function mapSubscription(sub) {
  if (!sub) return null
  return {
    id: sub.id,
    vendor_id: sub.vendorId,
    plan: sub.plan,
    status: sub.status,
    payment_method: sub.paymentMethod,
    amount: toNumber(sub.amount),
    start_date: sub.startDate,
    end_date: sub.endDate,
    payment_proof: sub.paymentProof,
    admin_note: sub.adminNote,
    created_at: sub.createdAt,
    updated_at: sub.updatedAt,
    vendor: sub.vendor ? { store_name: sub.vendor.storeName, slug: sub.vendor.slug, logo_url: sub.vendor.logoUrl } : null,
  }
}

function mapCategory(category) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image_url: category.imageUrl,
    sort_order: category.sortOrder,
    is_active: category.isActive,
    created_at: category.createdAt,
  }
}

function mapProductVendor(vendor) {
  return {
    id: vendor.id,
    store_name: vendor.storeName,
    slug: vendor.slug,
    logo_url: vendor.logoUrl,
    rating: vendor.rating,
    verified: vendor.verified,
  }
}

function mapProduct(product) {
  if (!product) return null
  const images = product.productImages || []
  const primaryImage = images.find(img => img.isPrimary) || images[0]
  return {
    id: product.id,
    vendor_id: product.vendorId,
    category_id: product.categoryId,
    name: product.name,
    slug: product.slug,
    short_description: product.shortDescription,
    description: product.description,
    price: toNumber(product.price),
    compare_price: toNumber(product.comparePrice),
    stock: product.stock,
    sku: product.sku,
    status: product.status,
    approval_status: product.approvalStatus,
    featured: product.featured,
    rating: product.rating,
    total_reviews: product.totalReviews,
    total_sold: product.totalSold,
    views: product.views,
    primary_image: primaryImage?.imageUrl || null,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
    product_images: images.map(img => ({
      id: img.id,
      product_id: img.productId,
      image_url: img.imageUrl,
      public_id: img.publicId,
      alt_text: img.altText,
      sort_order: img.sortOrder,
      is_primary: img.isPrimary,
      created_at: img.createdAt,
    })),
    product_variants: (product.productVariants || []).map(variant => ({
      id: variant.id,
      product_id: variant.productId,
      option_name: variant.optionName,
      option_value: variant.optionValue,
      price_adjustment: toNumber(variant.priceAdjustment),
      stock: variant.stock,
      sku: variant.sku,
      created_at: variant.createdAt,
    })),
    vendors: product.vendor ? { ...mapProductVendor(product.vendor), location: product.vendor.location } : null,
    vendor: product.vendor ? mapProductVendor(product.vendor) : null,
    categories: product.category ? mapCategory(product.category) : null,
    category: product.category ? mapCategory(product.category) : null,
  }
}

function mapStatusHistory(entry) {
  return {
    id: entry.id,
    order_item_id: entry.orderItemId,
    status: entry.status,
    note: entry.note,
    created_at: entry.createdAt,
  }
}

function mapOrderItem(item) {
  return {
    id: item.id,
    order_id: item.orderId,
    product_id: item.productId,
    vendor_id: item.vendorId,
    variant_id: item.variantId,
    quantity: item.quantity,
    unit_price: toNumber(item.unitPrice),
    total_price: toNumber(item.totalPrice),
    product_name: item.productName,
    product_image: item.productImage,
    variant_info: item.variantInfo,
    vendor_status: item.vendorStatus,
    tracking_number: item.trackingNumber,
    created_at: item.createdAt,
    vendors: item.vendor ? mapVendor(item.vendor) : null,
    orders: item.order ? {
      order_number: item.order.orderNumber,
      status: item.order.status,
      created_at: item.order.createdAt,
      shipping_name: item.order.shippingName,
    } : null,
  }
}

function mapOrder(order) {
  return {
    id: order.id,
    customer_id: order.customerId,
    order_number: order.orderNumber,
    status: order.status,
    subtotal: toNumber(order.subtotal),
    shipping_cost: toNumber(order.shippingCost),
    tax: toNumber(order.tax),
    discount: toNumber(order.discount),
    total: toNumber(order.total),
    payment_status: order.paymentStatus,
    payment_method: order.paymentMethod,
    shipping_name: order.shippingName,
    shipping_address: order.shippingAddress,
    shipping_city: order.shippingCity,
    shipping_country: order.shippingCountry,
    shipping_phone: order.shippingPhone,
    tracking_number: order.trackingNumber,
    customer_note: order.customerNote,
    admin_note: order.adminNote,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
    order_items: (order.orderItems || []).map(mapOrderItem),
    ...(order.statusHistory ? { status_history: order.statusHistory.map(mapStatusHistory) } : {}),
  }
}

function mapReview(review) {
  const fullName = review.user?.profile?.fullName || ''
  const [first, last] = fullName.trim().split(/\s+/)
  return {
    id: review.id,
    product_id: review.productId,
    rating: review.rating,
    title: review.title,
    body: review.body,
    author_name: first ? `${first}${last ? ` ${last[0]}.` : ''}` : 'Customer',
    verified_purchase: true,
    created_at: review.createdAt,
    updated_at: review.updatedAt,
  }
}

function mapAddress(address) {
  return {
    id: address.id,
    label: address.label,
    full_name: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    region: address.region,
    country: address.country,
    postal_code: address.postalCode,
    is_default: address.isDefault,
    created_at: address.createdAt,
    updated_at: address.updatedAt,
  }
}

function mapNotification(notification) {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    link: notification.link,
    read_at: notification.readAt,
    created_at: notification.createdAt,
  }
}

module.exports = {
  mapProfile,
  mapCustomer,
  mapVendor,
  mapAuthUser,
  mapSubscription,
  mapCategory,
  mapProduct,
  mapOrder,
  mapOrderItem,
  mapStatusHistory,
  mapReview,
  mapAddress,
  mapNotification,
}
