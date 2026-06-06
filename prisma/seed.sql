-- Insert categories
INSERT INTO "Category" (id, name, slug) VALUES
  ('cat1', 'Electronics', 'electronics'),
  ('cat2', 'Food & Beverage', 'food-beverage'),
  ('cat3', 'Fashion', 'fashion'),
  ('cat4', 'Crafts & Gifts', 'crafts')
ON CONFLICT (slug) DO NOTHING;

-- Insert Lebanese user
INSERT INTO "User" (id, email, password, "createdAt", "updatedAt") VALUES
  ('user1', 'zaatar@souqna.com', 'c0caf47c9e1e4f9b8c6d6e0f3f0e0a0f', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert Lebanese profile
INSERT INTO "Profile" (id, "userId", "fullName", "avatarUrl", role, "createdAt", "updatedAt") VALUES
  ('prof1', 'user1', 'Zaatar & More', NULL, 'vendor', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert Lebanese vendor
INSERT INTO "Vendor" (id, "userId", "storeName", slug, description, "businessName", category, location, "logoUrl", verified, status, rating, "totalSales", "productsCount", "joinedAt", "updatedAt") VALUES
  ('vendor1', 'user1', 'Zaatar & More', 'zaatar-more', 'Traditional Lebanese spices and products', 'Zaatar & More Co.', 'Food & Beverage', 'Beirut, Lebanon', NULL, true, 'active', 4.8, 1250, 15, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Insert Chinese user
INSERT INTO "User" (id, email, password, "createdAt", "updatedAt") VALUES
  ('user2', 'dragon@souqna.com', 'c0caf47c9e1e4f9b8c6d6e0f3f0e0a0f', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert Chinese profile
INSERT INTO "Profile" (id, "userId", "fullName", "avatarUrl", role, "createdAt", "updatedAt") VALUES
  ('prof2', 'user2', 'Dragon Crafts', NULL, 'vendor', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert Chinese vendor
INSERT INTO "Vendor" (id, "userId", "storeName", slug, description, "businessName", category, location, "logoUrl", verified, status, rating, "totalSales", "productsCount", "joinedAt", "updatedAt") VALUES
  ('vendor2', 'user2', 'Dragon Crafts', 'dragon-crafts', 'Authentic Chinese handicrafts and porcelain', 'Dragon Crafts Ltd.', 'Crafts & Gifts', 'Shanghai, China', NULL, true, 'active', 4.9, 2150, 28, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Insert Lebanese products
INSERT INTO "Product" (id, "vendorId", "categoryId", name, slug, description, price, status, "approvalStatus", featured, "createdAt", "updatedAt") VALUES
  ('prod1', 'vendor1', 'cat2', 'Lebanese Zaatar Mix', 'lebanese-zaatar-mix', 'Authentic zaatar blend with sumac, thyme, and sesame seeds', 12.99, 'active', 'approved', true, NOW(), NOW()),
  ('prod2', 'vendor1', 'cat2', 'Premium Cedar Nuts', 'cedar-nuts', 'Fresh Lebanese cedar nuts from Mount Lebanon', 24.99, 'active', 'approved', true, NOW(), NOW()),
  ('prod3', 'vendor1', 'cat2', 'Organic Lebanese Olive Oil', 'olive-oil-organic', 'Cold-pressed extra virgin olive oil from the Bekaa Valley', 18.99, 'active', 'approved', false, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Insert Chinese products
INSERT INTO "Product" (id, "vendorId", "categoryId", name, slug, description, price, status, "approvalStatus", featured, "createdAt", "updatedAt") VALUES
  ('prod4', 'vendor2', 'cat4', 'Blue & White Porcelain Vase', 'blue-white-porcelain-vase', 'Hand-painted Ming Dynasty style porcelain vase', 89.99, 'active', 'approved', true, NOW(), NOW()),
  ('prod5', 'vendor2', 'cat4', 'Silk Tapestry - Dragon Design', 'silk-tapestry-dragon', 'Traditional silk embroidered tapestry with golden dragon motif', 149.99, 'active', 'approved', true, NOW(), NOW()),
  ('prod6', 'vendor2', 'cat4', 'Bamboo Tea Set - Premium', 'bamboo-tea-set', 'Complete tea set with handcrafted bamboo accessories', 65.99, 'active', 'approved', false, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Insert product images
INSERT INTO "ProductImage" (id, "productId", "imageUrl", "isPrimary") VALUES
  ('img1', 'prod1', 'https://via.placeholder.com/400?text=Zaatar', true),
  ('img2', 'prod2', 'https://via.placeholder.com/400?text=Cedar+Nuts', true),
  ('img3', 'prod3', 'https://via.placeholder.com/400?text=Olive+Oil', true),
  ('img4', 'prod4', 'https://via.placeholder.com/400?text=Porcelain+Vase', true),
  ('img5', 'prod5', 'https://via.placeholder.com/400?text=Silk+Tapestry', true),
  ('img6', 'prod6', 'https://via.placeholder.com/400?text=Tea+Set', true)
ON CONFLICT DO NOTHING;

-- Insert vendor summaries
INSERT INTO "VendorSummary" (id, "vendorId", "totalSales", "totalOrders", "totalProducts", rating, reviews) VALUES
  ('summary1', 'vendor1', 1250, 185, 15, 4.8, 312),
  ('summary2', 'vendor2', 2150, 289, 28, 4.9, 521)
ON CONFLICT DO NOTHING;
