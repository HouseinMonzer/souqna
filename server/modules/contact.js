const env = require('../config/env')
const { createRouter } = require('../lib/router')
const { z } = require('../lib/validation')
const { HttpError } = require('../lib/errors')
const { sanitizeText } = require('../lib/sanitize')
const { sendContactMessage } = require('../lib/mailer')
const { limiters } = require('../middleware/security')

const { router, post } = createRouter({ tag: 'Contact' })

post('/contact', {
  summary: 'Send a message to SouQna support',
  middleware: [limiters.auth],
  body: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    subject: z.string().trim().max(150).optional(),
    message: z.string().trim().min(10, 'Message must be at least 10 characters').max(5000),
  }),
}, async (req, res) => {
  if (!env.SUPPORT_EMAIL) throw new HttpError(503, 'The contact form is not available right now. Please email us instead.')
  const { name, email, subject, message } = req.body
  await sendContactMessage(env.SUPPORT_EMAIL, {
    name: sanitizeText(name),
    email,
    subject: subject ? sanitizeText(subject) : undefined,
    message: sanitizeText(message),
  })
  res.status(202).json({ message: 'Thanks, your message has been sent.' })
})

module.exports = { router }
