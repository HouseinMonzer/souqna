import { useNavigate } from 'react-router-dom'

const values = [
  { icon: '🤝', title: 'Trust', desc: 'Every vendor is verified. Every product is authentic. We stand behind every transaction on our platform.' },
  { icon: '🌿', title: 'Local First', desc: 'We champion Lebanese producers and artisans, helping them reach buyers across the country and beyond.' },
  { icon: '🔒', title: 'Secure', desc: 'End-to-end secure payments, buyer protection, and transparent dispute resolution on every order.' },
  { icon: '💚', title: 'Community', desc: 'We are more than a marketplace. We are a movement to support Lebanon\'s vibrant entrepreneurial spirit.' },
]

const team = [
  { name: 'Housein Monzer', role: 'Founder & CEO', initials: 'HM', color: '#2D4A1E' },
  { name: 'Sara Khalil', role: 'Head of Operations', initials: 'SK', color: '#5C8A2E' },
  { name: 'Rami Farouk', role: 'Lead Engineer', initials: 'RF', color: '#4a7c59' },
  { name: 'Nour Saleh', role: 'Vendor Relations', initials: 'NS', color: '#b5620e' },
]

function AboutPage() {
  const navigate = useNavigate()
  document.title = 'About | SouqNa'

  return (
    <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{ backgroundColor: '#2D4A1E', padding: '64px 24px', textAlign: 'center' }}>
        <p style={{ color: '#A3C46C', fontSize: '12px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '12px' }}>
          🇱🇧 Made in Lebanon
        </p>
        <h1 style={{ color: '#F7F2E8', fontFamily: 'Georgia, serif', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: '700', marginBottom: '20px', lineHeight: '1.2' }}>
          Connecting Lebanon's<br />Finest Vendors
        </h1>
        <p style={{ color: 'rgba(247,242,232,0.75)', fontSize: '18px', maxWidth: '580px', margin: '0 auto 32px', lineHeight: '1.7' }}>
          SouqNa is Lebanon's first dedicated multi-vendor marketplace — built to empower local businesses and delight buyers with authentic, high-quality products.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/shop')} style={{ backgroundColor: '#5C8A2E', color: '#fff', border: 'none', borderRadius: '8px', padding: '13px 28px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
            Browse the Shop →
          </button>
          <button onClick={() => navigate('/register')} style={{ backgroundColor: 'transparent', color: '#F7F2E8', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: '8px', padding: '13px 28px', fontSize: '15px', fontWeight: '500', cursor: 'pointer' }}>
            Become a Vendor
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e0dbd0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '24px', textAlign: 'center' }}>
          {[
            { num: '120+', label: 'Active Vendors' },
            { num: '5,000+', label: 'Products Listed' },
            { num: '15,000+', label: 'Happy Buyers' },
            { num: '2024', label: 'Founded' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: '700', color: '#2D4A1E' }}>{s.num}</div>
              <div style={{ fontSize: '14px', color: '#7a8a6e', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '64px 24px' }}>

        {/* Mission */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '32px', fontWeight: '700', color: '#1A2E0E', marginBottom: '20px' }}>
            Our Mission
          </h2>
          <p style={{ fontSize: '17px', color: '#4a5a3e', lineHeight: '1.8', maxWidth: '680px', margin: '0 auto' }}>
            Lebanon is home to some of the most talented artisans, farmers, and entrepreneurs in the Middle East. SouqNa exists to give them a digital storefront — a place where their products can be discovered, trusted, and loved by buyers everywhere.
          </p>
          <p style={{ fontSize: '17px', color: '#4a5a3e', lineHeight: '1.8', maxWidth: '680px', margin: '20px auto 0' }}>
            We believe in buying local, supporting communities, and celebrating the richness of Lebanese craftsmanship and agriculture.
          </p>
        </div>

        {/* Values */}
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: '700', color: '#1A2E0E', marginBottom: '32px', textAlign: 'center' }}>
          Our Values
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginBottom: '64px' }}>
          {values.map(v => (
            <div key={v.title} style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1.5px solid #e0dbd0', padding: '28px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>{v.icon}</div>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: '700', color: '#1A2E0E', marginBottom: '10px' }}>{v.title}</h3>
              <p style={{ fontSize: '14px', color: '#7a8a6e', lineHeight: '1.6' }}>{v.desc}</p>
            </div>
          ))}
        </div>

        {/* Team */}
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: '700', color: '#1A2E0E', marginBottom: '32px', textAlign: 'center' }}>
          The Team
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px', marginBottom: '64px' }}>
          {team.map(m => (
            <div key={m.name} style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1.5px solid #e0dbd0', padding: '28px 20px', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: m.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '20px', margin: '0 auto 14px' }}>
                {m.initials}
              </div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '16px', fontWeight: '700', color: '#1A2E0E', marginBottom: '4px' }}>{m.name}</div>
              <div style={{ fontSize: '13px', color: '#7a8a6e' }}>{m.role}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ backgroundColor: '#2D4A1E', borderRadius: '20px', padding: '48px 32px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: '700', color: '#F7F2E8', marginBottom: '12px' }}>
            Ready to get started?
          </h2>
          <p style={{ color: 'rgba(247,242,232,0.75)', fontSize: '16px', marginBottom: '24px' }}>
            Join thousands of buyers and hundreds of verified Lebanese vendors on SouqNa.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/shop')} style={{ backgroundColor: '#5C8A2E', color: '#fff', border: 'none', borderRadius: '8px', padding: '13px 28px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
              Shop Now
            </button>
            <button onClick={() => navigate('/contact')} style={{ backgroundColor: 'transparent', color: '#F7F2E8', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: '8px', padding: '13px 28px', fontSize: '15px', cursor: 'pointer' }}>
              Contact Us
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default AboutPage
