const xss = require('xss')

// Strips all HTML from user-submitted text. Apply to anything rendered in the
// UI or emails (names, descriptions, notes).
function sanitizeText(input) {
  if (input == null) return input
  return xss(String(input), {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
  })
}

const sanitizeOrNull = value => (value ? sanitizeText(value) : null)

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

module.exports = { sanitizeText, sanitizeOrNull, slugify }
