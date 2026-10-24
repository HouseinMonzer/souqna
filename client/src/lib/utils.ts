import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function formatCurrency(amount: number, symbol = '$'): string {
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(date))
}
export function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}
export function getDiscountPercent(price: number, comparePrice: number): number {
  return Math.round(((comparePrice - price) / comparePrice) * 100)
}
export function truncate(text: string, length: number): string {
  return text.length > length ? text.slice(0, length) + '...' : text
}
// Returns the URL only if it uses http(s); blocks javascript:, data: and other
// schemes that would execute when rendered as an <a href>.
export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

// The app always sets `dir` on <html> (and the showcase on subtrees), so the
// nearest attribute is the reliable source for keyboard and swipe direction.
export function isRtlElement(element: Element): boolean {
  return element.closest('[dir]')?.getAttribute('dir') === 'rtl'
}
