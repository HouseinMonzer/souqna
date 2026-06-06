export type UserRole = 'admin' | 'vendor' | 'customer'
export type VendorStatus = 'pending' | 'active' | 'suspended' | 'rejected'
export type ProductStatus = 'draft' | 'active' | 'inactive' | 'deleted'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type SubscriptionPlan = 'monthly' | 'annual'
export type SubscriptionStatus = 'pending_payment' | 'active' | 'expired' | 'cancelled'
export type PaymentMethod = 'wish_money' | 'omt' | 'cash_delivery' | 'credit_card'

export interface Profile {
  id: string
  role: UserRole
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export type ProfileUpdate = Partial<Pick<Profile, 'full_name' | 'avatar_url' | 'phone' | 'role'>>

export interface Customer {
  id: string
  user_id: string
  created_at: string
}

export interface Vendor {
  id: string
  user_id: string
  store_name: string
  business_name: string | null
  slug: string
  logo_url: string | null
  logo_public_id: string | null
  cover_url: string | null
  cover_public_id: string | null
  description: string | null
  mission: string | null
  location: string | null
  address: string | null
  email: string | null
  phone: string | null
  website: string | null
  whatsapp: string | null
  instagram: string | null
  facebook: string | null
  tiktok: string | null
  youtube: string | null
  verified: boolean
  status: VendorStatus
  rating: number
  total_reviews: number
  total_sales: number
  products_count: number
  joined_at: string
  updated_at: string
  social_links?: VendorSocialLink[]
}

export type VendorInsert = Partial<Omit<Vendor, 'id' | 'joined_at' | 'updated_at'>>
export type VendorUpdate = Partial<Omit<Vendor, 'id' | 'user_id' | 'joined_at' | 'updated_at'>>

export interface VendorSummary {
  vendor_id: string
  store_name?: string
  status?: VendorStatus
  rating: number
  total_reviews: number
  total_sales: number
  active_products?: number
  pending_products?: number
  total_orders: number
  gross_revenue?: number
  net_revenue?: number
}

export interface VendorSocialLink {
  id: string
  vendor_id: string
  platform: string
  url: string
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  image_url: string
  public_id: string | null
  alt_text: string | null
  sort_order: number
  is_primary: boolean
  created_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  option_name: string
  option_value: string
  price_adjustment: number
  stock: number
  sku: string | null
  created_at: string
}

export interface Product {
  id: string
  vendor_id: string
  category_id: string | null
  name: string
  slug: string
  short_description: string | null
  description: string | null
  price: number
  compare_price: number | null
  stock: number
  sku: string | null
  status: ProductStatus
  approval_status: ApprovalStatus
  featured: boolean
  rating: number
  total_reviews: number
  total_sold: number
  views: number
  primary_image: string | null
  created_at: string
  updated_at: string
  product_images: ProductImage[]
  product_variants: ProductVariant[]
  vendors: Pick<Vendor, 'id' | 'store_name' | 'slug' | 'logo_url' | 'rating' | 'verified' | 'location'> | null
  vendor: Pick<Vendor, 'id' | 'store_name' | 'slug' | 'logo_url' | 'rating' | 'verified'> | null
  categories: Category | null
  category: Category | null
}

export type ProductInsert = {
  name: string
  description?: string | null
  price: number
  category?: string | null
  categoryId?: string | null
  stock?: number
  imageUrl?: string | null
  featured?: boolean
}

export type ProductUpdate = Partial<ProductInsert & {
  status: ProductStatus
  approvalStatus: ApprovalStatus
}>

export interface ProductCard {
  id: string
  name: string
  slug: string
  price: number
  compare_price: number | null
  rating: number
  total_reviews: number
  total_sold: number
  featured: boolean
  primary_image: string | null
  vendor: Pick<Vendor, 'id' | 'store_name' | 'slug'>
  category: Pick<Category, 'id' | 'name'> | null
}

export interface Order {
  id: string
  customer_id: string
  order_number: string
  status: OrderStatus
  subtotal: number
  shipping_cost: number
  tax: number
  discount: number
  total: number
  payment_status: PaymentStatus
  payment_method: string | null
  shipping_name: string | null
  shipping_address: string | null
  shipping_city: string | null
  shipping_country: string | null
  shipping_phone: string | null
  tracking_number: string | null
  customer_note: string | null
  admin_note: string | null
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  vendor_id: string
  variant_id: string | null
  quantity: number
  unit_price: number
  total_price: number
  product_name: string
  product_image: string | null
  variant_info: string | null
  vendor_status: OrderStatus
  tracking_number: string | null
  created_at: string
}

export interface CartItem {
  product_id: string
  variant_id: string | null
  quantity: number
  product: ProductCard
  variant: ProductVariant | null
}

export interface AuthUser {
  id: string
  email: string
  isVerified: boolean
  profile: Profile
  vendor?: Vendor | null
  customer?: Customer | null
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages?: number
}

export interface VendorSubscription {
  id: string
  vendor_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  payment_method: PaymentMethod | null
  amount: number
  start_date: string | null
  end_date: string | null
  payment_proof: string | null
  admin_note: string | null
  created_at: string
  updated_at: string
  vendor?: { store_name: string; slug: string; logo_url: string | null } | null
}

export interface VendorCart {
  vendorId: string
  vendorName: string
  vendorSlug: string
  vendorLogo: string | null
  items: CartItem[]
}

export const SUBSCRIPTION_PRICES: Record<SubscriptionPlan, number> = {
  monthly: 15,
  annual: 120,
}
