-- Phase 1: money as DECIMAL(12,2), order idempotency + status history,
-- reviews, wishlist, addresses, notifications, trigram search indexes.

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "listingsHidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,2) USING ROUND("price"::numeric, 2),
ALTER COLUMN "comparePrice" SET DATA TYPE DECIMAL(12,2) USING ROUND("comparePrice"::numeric, 2);

-- AlterTable
ALTER TABLE "ProductVariant" ALTER COLUMN "priceAdjustment" SET DATA TYPE DECIMAL(12,2) USING ROUND("priceAdjustment"::numeric, 2);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "idempotencyKey" TEXT,
ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(12,2) USING ROUND("subtotal"::numeric, 2),
ALTER COLUMN "shippingCost" SET DATA TYPE DECIMAL(12,2) USING ROUND("shippingCost"::numeric, 2),
ALTER COLUMN "tax" SET DATA TYPE DECIMAL(12,2) USING ROUND("tax"::numeric, 2),
ALTER COLUMN "discount" SET DATA TYPE DECIMAL(12,2) USING ROUND("discount"::numeric, 2),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(12,2) USING ROUND("total"::numeric, 2);

-- AlterTable
ALTER TABLE "OrderItem" ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(12,2) USING ROUND("unitPrice"::numeric, 2),
ALTER COLUMN "totalPrice" SET DATA TYPE DECIMAL(12,2) USING ROUND("totalPrice"::numeric, 2);

-- AlterTable
ALTER TABLE "VendorSubscription" ADD COLUMN     "reminderSentAt" TIMESTAMP(3),
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2) USING ROUND("amount"::numeric, 2);

-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT,
    "status" "OrderStatus" NOT NULL,
    "note" TEXT,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "country" TEXT NOT NULL DEFAULT 'LB',
    "postalCode" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderStatusHistory_orderId_createdAt_idx" ON "OrderStatusHistory"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "Review_productId_createdAt_idx" ON "Review"("productId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Review_productId_userId_key" ON "Review"("productId", "userId");

-- CreateIndex
CREATE INDEX "WishlistItem_userId_createdAt_idx" ON "WishlistItem"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_userId_productId_key" ON "WishlistItem"("userId", "productId");

-- CreateIndex
CREATE INDEX "Address_userId_idx" ON "Address"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "Vendor_storeName_trgm_idx" ON "Vendor" USING GIN ("storeName" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Product_totalSold_idx" ON "Product"("totalSold");

-- CreateIndex
CREATE INDEX "Product_name_trgm_idx" ON "Product" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Product_shortDescription_trgm_idx" ON "Product" USING GIN ("shortDescription" gin_trgm_ops);

-- CreateIndex
CREATE UNIQUE INDEX "Order_customerId_idempotencyKey_key" ON "Order"("customerId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "VendorSubscription_status_endDate_idx" ON "VendorSubscription"("status", "endDate");

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

