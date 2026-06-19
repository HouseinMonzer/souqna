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
export const ImagePresets = {
  product: { maxWidth: 1200, maxHeight: 1200, quality: 0.85 },
  cover:   { maxWidth: 1920, maxHeight: 720,  quality: 0.85 },
  logo:    { maxWidth: 512,  maxHeight: 512,  quality: 0.9  },
} as const
