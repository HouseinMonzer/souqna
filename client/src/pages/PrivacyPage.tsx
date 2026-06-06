function PrivacyPage() {
  document.title = 'Privacy Policy | SouqNa'

  const sections = [
    {
      title: '1. Information We Collect',
      content: `We collect information you provide directly to us when you create an account, make a purchase, or contact us for support. This includes:\n\n• Personal information (name, email address, phone number)\n• Billing and shipping address\n• Payment information (processed securely; we do not store full card numbers)\n• Profile information and preferences\n• Communications with vendors and our support team\n\nWe also collect information automatically when you use our platform, including browser type, IP address, pages visited, and time spent on our site.`,
    },
    {
      title: '2. How We Use Your Information',
      content: `We use the information we collect to:\n\n• Process transactions and send related communications\n• Create and maintain your account\n• Send promotional communications (with your consent)\n• Respond to your comments and questions\n• Monitor and analyze usage patterns to improve our platform\n• Detect and prevent fraudulent transactions and other illegal activities\n• Comply with Lebanese law and legal obligations`,
    },
    {
      title: '3. Information Sharing',
      content: `We share your information with vendors when you place an order (name, delivery address, and contact for fulfillment purposes only). We do not sell, trade, or rent your personal information to third parties.\n\nWe may share information with trusted service providers who assist us in operating our website, conducting our business, or servicing you — under strict confidentiality agreements.\n\nWe may also release your information when we believe release is appropriate to comply with Lebanese law, enforce our site policies, or protect ours or others' rights, property, or safety.`,
    },
    {
      title: '4. Data Storage & Security',
      content: `Your data is stored on secure servers hosted in the European Union (Neon PostgreSQL). We implement industry-standard security measures including SSL encryption, secure password hashing, and regular security audits.\n\nWhile we take reasonable precautions to protect your personal information, no transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security.`,
    },
    {
      title: '5. Cookies',
      content: `We use cookies and similar tracking technologies to track activity on our platform and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier.\n\nYou can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.`,
    },
    {
      title: '6. Your Rights',
      content: `Under Lebanese data protection law, you have the right to:\n\n• Access the personal data we hold about you\n• Request correction of inaccurate data\n• Request deletion of your data (subject to legal obligations)\n• Object to processing of your data\n• Request restriction of processing\n• Data portability\n\nTo exercise any of these rights, contact us at privacy@souqna.lb`,
    },
    {
      title: '7. Children\'s Privacy',
      content: `Our platform is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If we discover that a child under 13 has provided us with personal information, we immediately delete this from our servers.`,
    },
    {
      title: '8. Changes to This Policy',
      content: `We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.`,
    },
    {
      title: '9. Contact Us',
      content: `If you have any questions about this Privacy Policy, please contact us:\n\nSouqNa Lebanon\nEmail: privacy@souqna.lb\nPhone: +961 1 234 567\nAddress: Beirut, Lebanon`,
    },
  ]

  return (
    <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh' }}>
      <div style={{ backgroundColor: '#2D4A1E', padding: '48px 24px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <h1 style={{ color: '#F7F2E8', fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: '700', marginBottom: '8px' }}>Privacy Policy</h1>
          <p style={{ color: 'rgba(247,242,232,0.65)', fontSize: '14px' }}>Last updated: January 1, 2025</p>
        </div>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ backgroundColor: '#EBF2DE', borderRadius: '12px', padding: '20px 24px', marginBottom: '36px', border: '1px solid #c8d8a8' }}>
          <p style={{ fontSize: '15px', color: '#2D4A1E', lineHeight: '1.7' }}>
            SouqNa ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and share information about you when you use our platform at souqna.lb and related services.
          </p>
        </div>

        {sections.map((s, i) => (
          <div key={i} style={{ marginBottom: '32px' }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '700', color: '#1A2E0E', marginBottom: '12px' }}>
              {s.title}
            </h2>
            <div style={{ fontSize: '15px', color: '#4a5a3e', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
              {s.content}
            </div>
            {i < sections.length - 1 && <div style={{ borderBottom: '1px solid #e0dbd0', marginTop: '28px' }} />}
          </div>
        ))}
      </div>
    </div>
  )
}

export default PrivacyPage
