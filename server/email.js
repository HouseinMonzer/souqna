const nodemailer = require('nodemailer')

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'
const EMAIL_FROM = process.env.EMAIL_FROM || '"SouQna" <noreply@souqna.com>'

let _transporter = null

async function getTransporter() {
  if (_transporter) return _transporter

  if (process.env.SMTP_HOST) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  } else {
    const test = await nodemailer.createTestAccount()
    _transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: test.user, pass: test.pass },
    })
    console.log('[email] No SMTP configured — using Ethereal test account:', test.user)
  }

  return _transporter
}

async function send(to, subject, html) {
  try {
    const t = await getTransporter()
    const info = await t.sendMail({ from: EMAIL_FROM, to, subject, html })
    const preview = nodemailer.getTestMessageUrl(info)
    if (preview) console.log(`[email] Preview → ${preview}`)
    return info
  } catch (err) {
    console.error('[email] Failed to send to', to, err.message)
  }
}

// ─── Shared layout ────────────────────────────────────────────────────────────

function layout(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#F7F2E8;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F2E8;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e0dbd0;">

      <!-- Header -->
      <tr><td style="background:#2D4A1E;padding:28px 32px;text-align:center;">
        <span style="font-family:Georgia,serif;font-size:30px;font-weight:700;color:#ffffff;">Souq</span>
        <span style="font-family:Georgia,serif;font-size:30px;font-weight:700;color:#8BC34A;">na</span>
        <p style="margin:6px 0 0;color:#a5c87a;font-size:13px;letter-spacing:1px;">Lebanon's Marketplace</p>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:36px 40px;">
        ${body}
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#f4f0e8;padding:20px 32px;text-align:center;border-top:1px solid #e0dbd0;">
        <p style="margin:0 0 6px;font-size:12px;color:#8a9a7e;">SouQna — Lebanon's Multi-Vendor Marketplace</p>
        <p style="margin:0;font-size:11px;color:#aaa;">You're receiving this because you have an account at SouQna.</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

function btn(href, label, color = '#5C8A2E') {
  return `<a href="${href}" style="display:inline-block;padding:13px 28px;background:${color};color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">${label}</a>`
}

function divider() {
  return `<hr style="border:none;border-top:1px solid #e0dbd0;margin:24px 0;">`
}

// ─── Template: Email verification ─────────────────────────────────────────────

function sendVerificationEmail(to, name, token) {
  const link = `${CLIENT_URL}/verify-email?token=${token}`
  const firstName = (name || '').split(' ')[0] || 'there'

  const body = `
    <h2 style="margin:0 0 8px;color:#1A2E0E;font-family:Georgia,serif;">Verify your email address</h2>
    <p style="margin:0 0 20px;color:#4a5a3e;font-size:15px;">Hi ${firstName},</p>
    <p style="margin:0 0 20px;color:#4a5a3e;font-size:15px;">
      Thanks for joining SouQna! Click the button below to verify your email address and activate your account.
    </p>
    <p style="text-align:center;margin:0 0 24px;">${btn(link, 'Verify Email Address')}</p>
    <p style="margin:0 0 8px;color:#888;font-size:13px;">Or copy this link into your browser:</p>
    <p style="margin:0 0 20px;word-break:break-all;font-size:12px;color:#5C8A2E;">${link}</p>
    ${divider()}
    <p style="margin:0;color:#aaa;font-size:12px;">This link expires in <strong>24 hours</strong>. If you didn't create an account, you can ignore this email.</p>
  `
  return send(to, 'Verify your SouQna email address', layout('Verify Email', body))
}

// ─── Template: Order confirmation (to buyer) ──────────────────────────────────

function sendOrderConfirmation(to, { orderNumber, items, subtotal, shippingCost, total, shippingName, shippingAddress, shippingCity }) {
  const itemRows = items.map(i => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0ece4;font-size:14px;color:#1A2E0E;">${i.productName} ${i.variantInfo ? `<span style="color:#888;">(${i.variantInfo})</span>` : ''}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0ece4;font-size:14px;color:#888;text-align:center;">x${i.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0ece4;font-size:14px;color:#1A2E0E;text-align:right;">$${(i.unitPrice * i.quantity).toFixed(2)}</td>
    </tr>
  `).join('')

  const body = `
    <h2 style="margin:0 0 6px;color:#1A2E0E;font-family:Georgia,serif;">Order Confirmed!</h2>
    <p style="margin:0 0 20px;color:#4a5a3e;font-size:15px;">Thank you for your order. We've received it and vendors are reviewing your items.</p>

    <div style="background:#f7faf3;border:1px solid #d4e8b0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#5C8A2E;font-weight:700;letter-spacing:0.5px;">ORDER NUMBER</p>
      <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#1A2E0E;font-family:Georgia,serif;">${orderNumber}</p>
    </div>

    <h3 style="margin:0 0 12px;color:#1A2E0E;font-size:15px;">Items ordered</h3>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${itemRows}
      <tr>
        <td colspan="2" style="padding:10px 0 4px;font-size:13px;color:#888;">Subtotal</td>
        <td style="padding:10px 0 4px;font-size:13px;color:#888;text-align:right;">$${subtotal.toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:4px 0;font-size:13px;color:#888;">Shipping</td>
        <td style="padding:4px 0;font-size:13px;color:#888;text-align:right;">$${shippingCost.toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:10px 0 0;font-size:16px;font-weight:700;color:#1A2E0E;">Total</td>
        <td style="padding:10px 0 0;font-size:16px;font-weight:700;color:#5C8A2E;text-align:right;">$${total.toFixed(2)}</td>
      </tr>
    </table>

    ${divider()}

    <h3 style="margin:0 0 10px;color:#1A2E0E;font-size:15px;">Delivery address</h3>
    <p style="margin:0;font-size:14px;color:#4a5a3e;line-height:1.7;">
      ${shippingName}<br>
      ${shippingAddress || ''}<br>
      ${shippingCity || ''}
    </p>

    ${divider()}
    <p style="margin:0;text-align:center;">${btn(`${CLIENT_URL}/dashboard`, 'View Your Orders')}</p>
  `
  return send(to, `Order confirmed — ${orderNumber}`, layout('Order Confirmed', body))
}

// ─── Template: New order alert (to vendor) ────────────────────────────────────

function sendVendorNewOrderAlert(to, { storeName, orderNumber, buyerFirstName, items, total, shippingAddress, shippingCity, dashboardUrl }) {
  const itemRows = items.map(i => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0ece4;font-size:14px;color:#1A2E0E;">${i.productName}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0ece4;font-size:14px;color:#888;text-align:center;">x${i.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0ece4;font-size:14px;color:#1A2E0E;text-align:right;">$${(i.unitPrice * i.quantity).toFixed(2)}</td>
    </tr>
  `).join('')

  const body = `
    <h2 style="margin:0 0 8px;color:#1A2E0E;font-family:Georgia,serif;">New order received!</h2>
    <p style="margin:0 0 20px;color:#4a5a3e;font-size:15px;">Hi <strong>${storeName}</strong>, you have a new order waiting for your approval.</p>

    <div style="background:#f7faf3;border:1px solid #d4e8b0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#5C8A2E;font-weight:700;">ORDER NUMBER</p>
      <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#1A2E0E;font-family:Georgia,serif;">${orderNumber}</p>
      <p style="margin:6px 0 0;font-size:13px;color:#888;">Buyer: <strong>${buyerFirstName}</strong></p>
    </div>

    <h3 style="margin:0 0 12px;color:#1A2E0E;font-size:15px;">Items to fulfill</h3>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${itemRows}
      <tr>
        <td colspan="2" style="padding:10px 0 0;font-size:16px;font-weight:700;color:#1A2E0E;">Your total</td>
        <td style="padding:10px 0 0;font-size:16px;font-weight:700;color:#5C8A2E;text-align:right;">$${total.toFixed(2)}</td>
      </tr>
    </table>

    ${divider()}

    <p style="margin:0 0 8px;font-size:14px;color:#4a5a3e;"><strong>Deliver to:</strong> ${shippingAddress || ''}, ${shippingCity || ''}</p>

    ${divider()}
    <p style="margin:0 0 16px;font-size:15px;color:#4a5a3e;">Please review and approve or reject this order from your vendor dashboard.</p>
    <p style="text-align:center;">${btn(dashboardUrl || `${CLIENT_URL}/dashboard`, 'View & Approve Order')}</p>
  `
  return send(to, `New order ${orderNumber} — action required`, layout('New Order', body))
}

// ─── Template: Order item status update (to buyer) ────────────────────────────

function sendOrderStatusUpdate(to, { orderNumber, storeName, newStatus, items, trackingNumber }) {
  const statusLabel = {
    confirmed:  'approved your order',
    processing: 'is preparing your order',
    shipped:    'has shipped your order',
    delivered:  'marked your order as delivered',
    cancelled:  'cancelled your order',
  }[newStatus] || `updated your order status to ${newStatus}`

  const itemList = items.map(i => `<li style="margin-bottom:4px;font-size:14px;color:#4a5a3e;">${i.productName} × ${i.quantity}</li>`).join('')

  const body = `
    <h2 style="margin:0 0 8px;color:#1A2E0E;font-family:Georgia,serif;">Order update</h2>
    <p style="margin:0 0 20px;color:#4a5a3e;font-size:15px;">
      <strong>${storeName}</strong> ${statusLabel}.
    </p>

    <div style="background:#f7faf3;border:1px solid #d4e8b0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#5C8A2E;font-weight:700;">ORDER</p>
      <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#1A2E0E;font-family:Georgia,serif;">${orderNumber}</p>
    </div>

    <ul style="margin:0 0 20px;padding-left:20px;">${itemList}</ul>

    ${trackingNumber ? `<p style="margin:0 0 20px;font-size:14px;color:#4a5a3e;"><strong>Tracking #:</strong> ${trackingNumber}</p>` : ''}

    ${divider()}
    <p style="text-align:center;">${btn(`${CLIENT_URL}/dashboard`, 'Track Your Order')}</p>
  `
  return send(to, `Order update — ${orderNumber}`, layout('Order Update', body))
}

module.exports = {
  sendVerificationEmail,
  sendOrderConfirmation,
  sendVendorNewOrderAlert,
  sendOrderStatusUpdate,
}
