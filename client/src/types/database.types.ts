// ============================================================
// 🛒 SOUQNA - TypeScript Types
// Generated from Supabase Schema
// ============================================================

// ============================================================
// 📦 ENUMS
// ============================================================

export type UserRole = 'admin' | 'vendor' | 'customer'

export type VendorStatus = 'pending' | 'active' | 'suspended' | 'rejected'

export type ProductStatus = 'draft' | 'active' | 'inactive' | 'deleted'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'

export type DocumentType =
  | 'national_id'
  | 'commercial_register'
  | 'tax_certificate'
  | 'bank_statement'
  | 'other'

export type NotificationType =
  | 'order'
  | 'product'
  | 'vendor'
  | 'system'
  | 'review'
  | 'payout'

export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'youtube'
  | 'twitter'
  | 'whatsapp'
  | 'website'

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed'

// ============================================================
// 👤 PROFILE
// ============================================================

export interface Profile {
  id: string
  role: UserRole
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'>
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at'>>

// ============================================================
// 🧑‍💼 CUSTOMER
// ============================================================

export interface Customer {
  id: string
  user_id: string
  created_at: string
}

// Customer with profile joined
export interface CustomerWithProfile extends Customer {
  profile: Profile
}

// ============================================================
// 🏪 VENDOR
// ============================================================

export interface Vendor {
  id: string
  user_id: string
  store_name: string
  slug: string
  logo_url: string | null
  cover_url: string | null
  description: string | null
  mission: string | null
  location: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  email: string | null
  phone: string | null
  website: string | null
  verified: boolean
  status: VendorStatus
  rating: number
  total_reviews: number
  total_sales: number
  response_time: number | null   // hours
  fulfillment_rate: number
  shipping_policy: string | null
  return_policy: string | null
  warranty_policy: string | null
  commission_rate: number
  joined_at: string
  updated_at: string
}

export type VendorInsert = Omit<
  Vendor,
  'id' | 'rating' | 'total_reviews' | 'total_sales' | 'fulfillment_rate' | 'joined_at' | 'updated_at'
>
export type VendorUpdate = Partial<
  Omit<Vendor, 'id' | 'user_id' | 'joined_at'>
>

// Vendor with social links joined
export interface VendorWithSocials extends Vendor {
  vendor_social_links: VendorSocialLink[]
}

// Vendor public profile (for store page)
export interface VendorPublicProfile extends VendorWithSocials {
  active_products: number
  total_orders: number
}

// ============================================================
// 🔗 VENDOR SOCIAL LINKS
// ============================================================

export interface VendorSocialLink {
  id: string
  vendor_id: string
  platform: SocialPlatform
  url: string
  created_at: string
}

export type VendorSocialLinkInsert = Omit<VendorSocialLink, 'id' | 'created_at'>
export type VendorSocialLinkUpdate = Partial<Pick<VendorSocialLink, 'url'>>

// ============================================================
// 📂 CATEGORY
// ============================================================

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export type CategoryInsert = Omit<Category, 'id' | 'created_at'>
export type CategoryUpdate = Partial<Omit<Category, 'id' | 'created_at'>>

// Category with children
export interface CategoryWithChildren extends Category {
  children: Category[]
}

// ============================================================
// 📦 PRODUCT
// ============================================================

export interface Product {
  id: string
  vendor_id: string
  category_id: string | null
  name: string
  slug: string
  short_description: string | null
  description: string | null
  specifications: Record<string, string> | null  // JSONB
  price: number
  compare_price: number | null
  cost_price: number | null
  stock: number
  low_stock_alert: number
  sku: string | null
  weight: number | null
  status: ProductStatus
  approval_status: ApprovalStatus
  featured: boolean
  meta_title: string | null
  meta_description: string | null
  rating: number
  total_reviews: number
  total_sold: number
  views: number
  created_at: string
  updated_at: string
}

export type ProductInsert = Omit<
  Product,
  'id' | 'rating' | 'total_reviews' | 'total_sold' | 'views' | 'created_at' | 'updated_at'
>
export type ProductUpdate = Partial<
  Omit<Product, 'id' | 'vendor_id' | 'created_at'>
>

// Product with images, vendor, category
export interface ProductWithDetails extends Product {
  product_images: ProductImage[]
  product_variants: ProductVariant[]
  vendor: Pick<Vendor, 'id' | 'store_name' | 'slug' | 'logo_url' | 'rating' | 'verified'>
  category: Pick<Category, 'id' | 'name' | 'slug'> | null
}

// Product card (lightweight for listing)
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

// ============================================================
// 🖼️ PRODUCT IMAGE
// ============================================================

export interface ProductImage {
  id: string
  product_id: string
  image_url: string
  alt_text: string | null
  sort_order: number
  is_primary: boolean
  created_at: string
}

export type ProductImageInsert = Omit<ProductImage, 'id' | 'created_at'>
export type ProductImageUpdate = Partial<Pick<ProductImage, 'alt_text' | 'sort_order' | 'is_primary'>>

// ============================================================
// 🎨 PRODUCT VARIANT
// ============================================================

export interface ProductVariant {
  id: string
  product_id: string
  option_name: string   // e.g. "Color", "Size"
  option_value: string  // e.g. "Red", "XL"
  price_adjustment: number
  stock: number
  sku: string | null
  created_at: string
}

export type ProductVariantInsert = Omit<ProductVariant, 'id' | 'created_at'>
export type ProductVariantUpdate = Partial<
  Omit<ProductVariant, 'id' | 'product_id' | 'created_at'>
>

// Grouped variants (for product page UI)
export interface VariantGroup {
  option_name: string
  values: Array<{
    option_value: string
    price_adjustment: number
    stock: number
    variant_id: string
  }>
}

// ============================================================
// 🛒 ORDER
// ============================================================

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
}

export type OrderInsert = Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>
export type OrderUpdate = Partial<
  Pick<Order, 'status' | 'payment_status' | 'tracking_number' | 'admin_note'>
>

// Order with items
export interface OrderWithItems extends Order {
  order_items: OrderItemWithDetails[]
}

// ============================================================
// 📋 ORDER ITEM
// ============================================================

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

export type OrderItemInsert = Omit<OrderItem, 'id' | 'created_at'>
export type OrderItemUpdate = Partial<
  Pick<OrderItem, 'vendor_status' | 'tracking_number'>
>

export interface OrderItemWithDetails extends OrderItem {
  vendor: Pick<Vendor, 'id' | 'store_name' | 'slug' | 'logo_url'>
}

// ============================================================
// ⭐ REVIEW
// ============================================================

export interface Review {
  id: string
  customer_id: string
  product_id: string | null
  vendor_id: string | null
  order_id: string | null
  rating: number  // 1-5
  title: string | null
  comment: string | null
  is_verified: boolean
  is_featured: boolean
  helpful_count: number
  created_at: string
  updated_at: string
}

export type ReviewInsert = Omit<
  Review,
  'id' | 'is_verified' | 'is_featured' | 'helpful_count' | 'created_at' | 'updated_at'
>
export type ReviewUpdate = Partial<Pick<Review, 'title' | 'comment' | 'rating'>>

export interface ReviewWithCustomer extends Review {
  customer: Pick<Profile, 'full_name' | 'avatar_url'>
}

// ============================================================
// 💝 WISHLIST
// ============================================================

export interface Wishlist {
  id: string
  customer_id: string
  product_id: string
  created_at: string
}

export type WishlistInsert = Omit<Wishlist, 'id' | 'created_at'>

export interface WishlistWithProduct extends Wishlist {
  product: ProductCard
}

// ============================================================
// 📄 VENDOR DOCUMENT
// ============================================================

export interface VendorDocument {
  id: string
  vendor_id: string
  document_type: DocumentType
  file_url: string
  file_name: string | null
  status: ApprovalStatus
  admin_note: string | null
  created_at: string
  updated_at: string
}

export type VendorDocumentInsert = Omit<VendorDocument, 'id' | 'status' | 'admin_note' | 'created_at' | 'updated_at'>
export type VendorDocumentUpdate = Partial<Pick<VendorDocument, 'status' | 'admin_note'>>

// ============================================================
// 🔔 NOTIFICATION
// ============================================================

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  link: string | null
  is_read: boolean
  created_at: string
}

export type NotificationInsert = Omit<Notification, 'id' | 'is_read' | 'created_at'>
export type NotificationUpdate = Pick<Notification, 'is_read'>

// ============================================================
// ⚙️ PLATFORM SETTINGS
// ============================================================

export interface PlatformSettings {
  id: string
  default_commission: number
  tax_rate: number
  currency: string
  currency_symbol: string
  min_payout_amount: number
  free_shipping_min: number | null
  maintenance_mode: boolean
  allow_vendor_register: boolean
  updated_at: string
}

export type PlatformSettingsUpdate = Partial<Omit<PlatformSettings, 'id' | 'updated_at'>>

// ============================================================
// 💳 VENDOR PAYOUT
// ============================================================

export interface VendorPayout {
  id: string
  vendor_id: string
  amount: number
  status: PayoutStatus
  payment_method: string | null
  reference: string | null
  note: string | null
  created_at: string
  processed_at: string | null
}

export type VendorPayoutInsert = Omit<VendorPayout, 'id' | 'created_at' | 'processed_at'>
export type VendorPayoutUpdate = Partial<Pick<VendorPayout, 'status' | 'reference' | 'processed_at'>>

// ============================================================
// 📊 VIEWS (read-only)
// ============================================================

export interface VendorSummary {
  vendor_id: string
  store_name: string
  status: VendorStatus
  rating: number
  total_reviews: number
  total_sales: number
  active_products: number
  pending_products: number
  total_orders: number
  gross_revenue: number
  net_revenue: number
}

export interface AdminOverview {
  total_customers: number
  active_vendors: number
  pending_vendors: number
  active_products: number
  pending_products: number
  total_orders: number
  gross_revenue: number
  pending_orders: number
  refund_requests: number
}

// ============================================================
// 🗃️ SUPABASE DATABASE TYPE (for typed client)
// ============================================================

export interface Database {
  public: {
    Tables: {
      profiles:             { Row: Profile;          Insert: ProfileInsert;          Update: ProfileUpdate }
      customers:            { Row: Customer;         Insert: Omit<Customer, 'id' | 'created_at'>; Update: never }
      vendors:              { Row: Vendor;           Insert: VendorInsert;           Update: VendorUpdate }
      vendor_social_links:  { Row: VendorSocialLink; Insert: VendorSocialLinkInsert; Update: VendorSocialLinkUpdate }
      categories:           { Row: Category;         Insert: CategoryInsert;         Update: CategoryUpdate }
      products:             { Row: Product;          Insert: ProductInsert;          Update: ProductUpdate }
      product_images:       { Row: ProductImage;     Insert: ProductImageInsert;     Update: ProductImageUpdate }
      product_variants:     { Row: ProductVariant;   Insert: ProductVariantInsert;   Update: ProductVariantUpdate }
      orders:               { Row: Order;            Insert: OrderInsert;            Update: OrderUpdate }
      order_items:          { Row: OrderItem;        Insert: OrderItemInsert;        Update: OrderItemUpdate }
      reviews:              { Row: Review;           Insert: ReviewInsert;           Update: ReviewUpdate }
      wishlists:            { Row: Wishlist;         Insert: WishlistInsert;         Update: never }
      vendor_documents:     { Row: VendorDocument;   Insert: VendorDocumentInsert;   Update: VendorDocumentUpdate }
      notifications:        { Row: Notification;     Insert: NotificationInsert;     Update: NotificationUpdate }
      platform_settings:    { Row: PlatformSettings; Insert: never;                  Update: PlatformSettingsUpdate }
      vendor_payouts:       { Row: VendorPayout;     Insert: VendorPayoutInsert;     Update: VendorPayoutUpdate }
    }
    Views: {
      vendor_summary: { Row: VendorSummary }
      admin_overview: { Row: AdminOverview }
    }
  }
}

// ============================================================
// 🛠️ UTILITY TYPES
// ============================================================

// API response wrapper
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  loading: boolean
}

// Pagination
export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Filter/Sort for product listing
export interface ProductFilters {
  category?: string
  vendor?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  inStock?: boolean
  featured?: boolean
  search?: string
}

export type SortOption =
  | 'newest'
  | 'oldest'
  | 'price_asc'
  | 'price_desc'
  | 'rating_desc'
  | 'best_selling'

// Cart item (client-side only)
export interface CartItem {
  product_id: string
  variant_id: string | null
  quantity: number
  product: ProductCard
  variant: ProductVariant | null
}

// Auth state
export interface AuthUser {
  id: string
  email: string
  profile: Profile
  vendor?: Vendor | null
  customer?: Customer | null
}