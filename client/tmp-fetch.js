const url = 'https://oceqycktkyxggvhpffip.supabase.co/rest/v1/categories?select=*&is_active=eq.true&order=sort_order.asc'
const headers = {
  apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZXF5Y2t0a3l4Z2d2aHBmZmlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MTA5OTgsImV4cCI6MjA5NDE4Njk5OH0.1dWgIs3M5M5HFunJ0pjHSaM-l1na9UsBAmGPqT0UNiHTI',
  Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZXF5Y2t0a3l4Z2d2aHBmZmlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MTA5OTgsImV4cCI6MjA5NDE4Njk5OH0.1dWgIs3M5M5HFunJ0pjHSaM-l1na9UsBAmGPqT0UNiHTI',
}
;(async () => {
  try {
    const res = await fetch(url, { headers })
    console.log('status', res.status)
    console.log(await res.text())
  } catch (error) {
    console.error(error)
  }
})()
