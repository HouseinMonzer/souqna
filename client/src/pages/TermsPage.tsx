import { useNavigate } from 'react-router-dom'

function TermsPage() {
  const navigate = useNavigate()
  document.title = 'Terms of Service | SouqNa'

  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: `By accessing and using SouqNa (souqna.lb), you accept and agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.\n\nWe reserve the right to update these terms at any time. Continued use of the platform constitutes your acceptance of any modifications.`,
    },
    {
      title: '2. Description of Service',
      content: `SouqNa is a multi-vendor marketplace platform that connects independent sellers ("Vendors") with buyers ("Customers") in Lebanon. We provide the technology platform, payment processing support, and dispute resolution services. We are not the seller of any product listed on our platform — vendors are solely responsible for the products they sell.`,
    },
    {
      title: '3. Vendor Terms',
      content: `To become a vendor on SouqNa, you must:\n\n• Have a valid Lebanese business registration or be an individual seller\n• Purchase an active subscription plan (monthly or annual)\n• Provide accurate business and product information\n• Comply with all Lebanese laws regarding product safety, labeling, and taxation\n• Respond to customer inquiries within 48 hours\n• Ship orders within the stated processing time\n\nVendors are responsible for their own tax obligations. SouqNa is not liable for any vendor's failure to comply with applicable laws.`,
    },
    {
      title: '4. Buyer Terms',
      content: `As a buyer on SouqNa, you agree to:\n\n• Provide accurate shipping and contact information\n• Pay for all purchases made through your account\n• Not misuse our platform or attempt to circumvent our systems\n• Contact support before initiating chargebacks or payment disputes\n\nAll sales are final unless the product is significantly not as described. Buyers have 7 days from delivery to report issues.`,
    },
    {
      title: '5. Payments & Fees',
      content: `SouqNa supports multiple payment methods including Wish Money, OMT transfer, Cash on Delivery, and Credit Card. All prices are displayed in USD unless otherwise stated.\n\nVendor subscriptions are non-refundable once activated. Buyers may receive refunds in cases of non-delivery or items significantly not as described, subject to vendor cooperation and SouqNa review.`,
    },
    {
      title: '6. Prohibited Content',
      content: `The following products and content are strictly prohibited on SouqNa:\n\n• Counterfeit or replica goods\n• Weapons, explosives, or dangerous materials\n• Illegal substances or drug paraphernalia\n• Adult content of any kind\n• Stolen goods or goods obtained through illegal means\n• Items that infringe on intellectual property rights\n• Products that violate Lebanese law\n\nViolation of this section will result in immediate account termination and may be reported to relevant Lebanese authorities.`,
    },
    {
      title: '7. Limitation of Liability',
      content: `SouqNa shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, goodwill, or other intangible losses, resulting from your use of our platform.\n\nOur total liability to you for all claims arising from or related to the service shall not exceed the amount you paid to us in the twelve months preceding the claim.`,
    },
    {
      title: '8. Governing Law',
      content: `These Terms shall be governed by and interpreted in accordance with the laws of the Republic of Lebanon. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of Beirut, Lebanon.`,
    },
    {
      title: '9. Contact',
      content: `For questions about these Terms, contact us:\n\nSouqNa Lebanon\nEmail: legal@souqna.lb\nPhone: +961 1 234 567`,
    },
  ]

  return (
    <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh' }}>
      <div style={{ backgroundColor: '#2D4A1E', padding: '48px 24px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <h1 style={{ color: '#F7F2E8', fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: '700', marginBottom: '8px' }}>Terms of Service</h1>
          <p style={{ color: 'rgba(247,242,232,0.65)', fontSize: '14px' }}>Last updated: January 1, 2025</p>
        </div>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ backgroundColor: '#EBF2DE', borderRadius: '12px', padding: '20px 24px', marginBottom: '36px', border: '1px solid #c8d8a8' }}>
          <p style={{ fontSize: '15px', color: '#2D4A1E', lineHeight: '1.7' }}>
            Please read these Terms of Service carefully before using the SouqNa platform. By using our service, you confirm that you are at least 18 years old and agree to these terms.
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

        <div style={{ marginTop: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#7a8a6e', marginBottom: '16px' }}>
            Questions? We're happy to clarify anything.
          </p>
          <button onClick={() => navigate('/contact')} style={{ backgroundColor: '#2D4A1E', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 28px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            Contact Support
          </button>
        </div>
      </div>
    </div>
  )
}

export default TermsPage
