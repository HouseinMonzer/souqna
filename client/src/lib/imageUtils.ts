// Client-side image compression. Resizes to fit within maxWidth/maxHeight,
// re-encodes as JPEG with the given quality, and corrects EXIF rotation so
// phone photos don't come out sideways. Returns a base64 data URL ready to
// send to the server. Typical 4MB phone photo → ~200-400KB JPEG.
//
// Defaults are tuned for product/cover photos. Pass smaller dimensions for
// logos to avoid sending oversized square images.

export interface CompressOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number  // 0..1, JPEG quality
}

export async function compressImage(file: File, opts: CompressOptions = {}): Promise<string> {
  const maxWidth = opts.maxWidth ?? 1600
  const maxHeight = opts.maxHeight ?? 1600
  const quality = opts.quality ?? 0.85

  // createImageBitmap with imageOrientation: 'from-image' auto-corrects EXIF
  // rotation (works in Chrome/Edge/Firefox + Safari 15+).
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })

  const scale = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height, 1)
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Canvas 2D not available')
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return canvas.toDataURL('image/jpeg', quality)
}

// Convenience presets used by the dashboard.
// `aspectRatio` forces a centered crop so every upload of the same kind has the
// same shape (square logos, 16:9 covers, square products on white background).
export const ImagePresets = {
  product: { maxWidth: 1200, maxHeight: 1200, quality: 0.85, aspectRatio: 1,    background: '#ffffff' },
  cover:   { maxWidth: 1920, maxHeight: 720,  quality: 0.85, aspectRatio: 16/6, background: '#1A2E0E' },
  logo:    { maxWidth: 512,  maxHeight: 512,  quality: 0.9,  aspectRatio: 1,    background: '#ffffff' },
} as const

export interface CropOptions extends CompressOptions {
  aspectRatio?: number   // target width/height; cover-crops then letterboxes
  background?: string    // canvas fill before drawing (for letterbox edges)
}

// Cover-crop the source so it fits the target aspect ratio, then resize and
// JPEG-encode. Always produces the same shape for the same preset.
export async function processImage(file: File, opts: CropOptions = {}): Promise<string> {
  const maxWidth = opts.maxWidth ?? 1600
  const maxHeight = opts.maxHeight ?? 1600
  const quality = opts.quality ?? 0.85
  const aspectRatio = opts.aspectRatio
  const background = opts.background ?? '#ffffff'

  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })

  let targetW = bitmap.width
  let targetH = bitmap.height
  let sx = 0, sy = 0, sw = bitmap.width, sh = bitmap.height

  if (aspectRatio) {
    const sourceRatio = bitmap.width / bitmap.height
    if (sourceRatio > aspectRatio) {
      // source is wider than target — crop sides
      sw = Math.round(bitmap.height * aspectRatio)
      sx = Math.round((bitmap.width - sw) / 2)
    } else {
      // source is taller — crop top/bottom
      sh = Math.round(bitmap.width / aspectRatio)
      sy = Math.round((bitmap.height - sh) / 2)
    }
    targetW = sw
    targetH = sh
  }

  const scale = Math.min(maxWidth / targetW, maxHeight / targetH, 1)
  const outW = Math.round(targetW * scale)
  const outH = Math.round(targetH * scale)

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Canvas 2D not available')
  }
  ctx.fillStyle = background
  ctx.fillRect(0, 0, outW, outH)
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, outW, outH)
  bitmap.close()

  return canvas.toDataURL('image/jpeg', quality)
}
