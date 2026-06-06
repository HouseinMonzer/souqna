import { defineConfig } from '@prisma/internals'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

export default defineConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || '',
    },
  },
})
