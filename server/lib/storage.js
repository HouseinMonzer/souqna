const { UTApi, UTFile } = require('uploadthing/server')
const env = require('../config/env')
const { logger } = require('./logger')
const { UploadError, decodeImageDataUrl } = require('./upload')

// UploadThing reads UPLOADTHING_TOKEN from the environment.
const utapi = env.UPLOADTHING_TOKEN ? new UTApi() : null

// Uploads a base64 image data URL after verifying its bytes.
async function uploadDataUrl(dataUrl, namePrefix = 'upload') {
  const { buffer, mime, ext } = decodeImageDataUrl(dataUrl)
  if (!utapi) throw new UploadError('Image uploads are not configured.', 503)
  const file = new UTFile([buffer], `${namePrefix}-${Date.now()}.${ext}`, { type: mime })
  const result = await utapi.uploadFiles(file)
  if (result.error) throw new Error(result.error.message || 'Upload failed')
  return { url: result.data.ufsUrl || result.data.url, key: result.data.key }
}

async function deleteFiles(keys) {
  if (!keys.length || !utapi) return
  try {
    await utapi.deleteFiles(keys)
  } catch (err) {
    logger.warn({ err, keys }, 'storage cleanup failed')
  }
}

module.exports = { uploadDataUrl, deleteFiles }
