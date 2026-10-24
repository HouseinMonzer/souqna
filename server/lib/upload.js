const { HttpError } = require('./errors')

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

const SIGNATURES = {
  'image/jpeg': { ext: 'jpg', test: b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': { ext: 'png', test: b => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  'image/gif': { ext: 'gif', test: b => b.subarray(0, 6).toString('ascii') === 'GIF87a' || b.subarray(0, 6).toString('ascii') === 'GIF89a' },
  'image/webp': { ext: 'webp', test: b => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP' },
}

class UploadError extends HttpError {
  constructor(message, status = 400) {
    super(status, message)
  }
}

// Decodes a base64 image data URL and verifies the bytes match an allowed image
// type. The declared MIME is ignored in favour of the magic bytes, so an HTML or
// SVG payload labelled image/png is rejected.
function decodeImageDataUrl(dataUrl) {
  const match = /^data:([a-z0-9.+/-]+);base64,([A-Za-z0-9+/=\s]+)$/i.exec(String(dataUrl))
  if (!match) throw new UploadError('Invalid image data — expected a base64 image data URL')
  const buffer = Buffer.from(match[2], 'base64')
  if (buffer.length === 0) throw new UploadError('Image is empty')
  if (buffer.length > MAX_UPLOAD_BYTES) throw new UploadError('Image must be 5 MB or smaller', 413)
  const entry = Object.entries(SIGNATURES).find(([, sig]) => sig.test(buffer))
  if (!entry) throw new UploadError('Unsupported image type. Use JPEG, PNG, WebP or GIF.', 415)
  const [mime, { ext }] = entry
  return { buffer, mime, ext }
}

module.exports = { MAX_UPLOAD_BYTES, UploadError, decodeImageDataUrl }
