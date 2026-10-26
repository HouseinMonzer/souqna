// Public contact and payment details, set per deployment (see client/.env.example).
// Empty values hide the related UI rather than showing placeholders.
const value = (raw: string | undefined) => raw?.trim() || null

export const config = {
  supportEmail: value(import.meta.env.VITE_SUPPORT_EMAIL),
  supportWhatsapp: value(import.meta.env.VITE_SUPPORT_WHATSAPP),
  paymentWishNumber: value(import.meta.env.VITE_PAYMENT_WISH_NUMBER),
  paymentOmtDetails: value(import.meta.env.VITE_PAYMENT_OMT_DETAILS),
}
