import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://oceqycktkyxggvhpffip.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZXF5Y2t0a3l4Z2d2aHBmZmlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MTA5OTgsImV4cCI6MjA5NDE4Njk5OH0.1dWgIs3M5HFunJ0pjHSaM-l1na9UsBAmGPqT0UNiHTI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedData() {
  console.log('🌱 Starting seed...')

  try {
    // Add products only (simpler - no foreign keys)
    console.log('📦 Adding products...')
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .insert([
        {
          name: 'Organic Olive Oil 500ml',
          slug: 'organic-olive-oil-500ml',
          description: 'Premium extra virgin olive oil',
          price: 12.00,
          status: 'active',
          approval_status: 'approved',
        },
        {
          name: 'Wireless Headphones Pro',
          slug: 'wireless-headphones-pro',
          description: 'Professional wireless headphones with noise cancellation',
          price: 45.00,
          status: 'active',
          approval_status: 'approved',
        },
        {
          name: "Za'atar Mix Traditional",
          slug: 'zaatar-mix-traditional',
          description: 'Traditional Lebanese zaatar mix',
          price: 8.50,
          status: 'active',
          approval_status: 'approved',
        },
      ])
      .select()

    if (productsError) {
      console.warn('⚠️ Products error (may need manual setup):', productsError.message)
    } else {
      console.log('✅ Products added:', productsData?.length)
    }

    console.log('✨ Seed attempt complete!')
  } catch (error) {
    console.error('❌ Seed failed:', error.message)
    console.log('\n📌 Note: If this fails due to policies, go to Supabase Dashboard and:')
    console.log('   1. Click SQL Editor')
    console.log('   2. Create vendors and products tables if needed')
    console.log('   3. Or disable RLS policies temporarily')
  }
}

seedData()
