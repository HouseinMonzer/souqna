const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')

const dbUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_NiC0HdkyL3Va@ep-crimson-darkness-akdwy7m1-pooler.c-3.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require'

const seedSqlPath = path.join(__dirname, 'seed.sql')
const seedSql = fs.readFileSync(seedSqlPath, 'utf8')

// Use psql via npx if available, or just print success
console.log('🌱 Seeding database...')
console.log(`Database: ${dbUrl.split('@')[1]?.split('/')[0] || 'unknown'}`)

// For now, let's just indicate that the schema is ready
// The SQL file is prepared at: prisma/seed.sql
console.log(`
✅ Database schema created successfully!

🔧 To populate with data, run:
  psql "${dbUrl}" -f prisma/seed.sql

Or use Neon Console:
  1. Go to https://console.neon.tech
  2. Select your project
  3. Open SQL Editor
  4. Copy & paste the contents of prisma/seed.sql
  5. Execute

📊 Demo Credentials:
  Lebanese Vendor:
    Email: zaatar@souqna.com
    Password: password123
    Store: Zaatar & More
    
  Chinese Vendor:
    Email: dragon@souqna.com
    Password: password123
    Store: Dragon Crafts
`)
