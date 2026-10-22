-- Clerk auth was replaced by native JWT + OAuth; the column is unused.
DROP INDEX IF EXISTS "User_clerkId_key";
ALTER TABLE "User" DROP COLUMN IF EXISTS "clerkId";
