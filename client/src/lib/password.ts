/** 0–4 from length and character variety; a hint, not a security guarantee. */
export function passwordScore(password: string) {
  if (!password) return 0
  let score = password.length >= 8 ? 1 : 0
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++
  return Math.min(score, 4)
}
