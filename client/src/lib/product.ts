import type { Product, ProductCard } from '../types/database.types'

/** The slim product shape stored in the cart. */
export function toCartProduct(product: Product): ProductCard {
  const vendor = product.vendor ?? product.vendors
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    compare_price: product.compare_price,
    rating: product.rating,
    total_reviews: product.total_reviews,
    total_sold: product.total_sold,
    featured: product.featured,
    primary_image: product.primary_image,
    vendor: { id: vendor?.id ?? product.vendor_id, store_name: vendor?.store_name ?? '', slug: vendor?.slug ?? '' },
    category: product.category ? { id: product.category.id, name: product.category.name } : null,
  }
}

export function productImages(product: Product) {
  const images = [...(product.product_images ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
  const urls = images.map(img => ({ src: img.image_url, alt: img.alt_text || product.name }))
  if (!urls.length && product.primary_image) urls.push({ src: product.primary_image, alt: product.name })
  return urls
}
