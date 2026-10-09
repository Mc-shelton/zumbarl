import { Buffer } from 'node:buffer'
import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { optimizeMediaBuffer, shouldOptimizeMedia } from './optimizeMediaUpload.js'

describe('media upload optimization', () => {
  it('converts a large feed image to a smaller bounded WebP', async () => {
    const input = await sharp({
      create: {
        width: 2400,
        height: 1600,
        channels: 3,
        background: { r: 118, g: 81, b: 111 }
      }
    }).jpeg({ quality: 98 }).toBuffer()

    const result = await optimizeMediaBuffer({
      buffer: input,
      fileName: 'campus-photo.jpeg',
      mimeType: 'image/jpeg',
      scope: 'connect-post'
    })
    const metadata = await sharp(result.buffer).metadata()

    expect(result.mimeType).toBe('image/webp')
    expect(result.fileName).toBe('campus-photo.webp')
    expect(result.optimization.status).toBe('optimized')
    expect(result.buffer.byteLength).toBeLessThan(input.byteLength)
    expect(Math.max(metadata.width || 0, metadata.height || 0)).toBeLessThanOrEqual(1920)
  })

  it('uses a smaller size ceiling for profile images', async () => {
    const input = await sharp({
      create: {
        width: 1400,
        height: 900,
        channels: 3,
        background: { r: 42, g: 73, b: 94 }
      }
    }).png().toBuffer()
    const result = await optimizeMediaBuffer({
      buffer: input,
      fileName: 'avatar.png',
      mimeType: 'image/png',
      scope: 'profile-picture'
    })
    const metadata = await sharp(result.buffer).metadata()

    expect(Math.max(metadata.width || 0, metadata.height || 0)).toBeLessThanOrEqual(512)
  })

  it('preserves regulated evidence and ordinary documents byte-for-byte', async () => {
    const bytes = Buffer.from('original-evidence')
    const protectedImage = await optimizeMediaBuffer({
      buffer: bytes,
      fileName: 'identity.jpg',
      mimeType: 'image/jpeg',
      scope: 'student-kyc-identity'
    })
    const document = await optimizeMediaBuffer({
      buffer: bytes,
      fileName: 'brief.pdf',
      mimeType: 'application/pdf',
      scope: 'general'
    })

    expect(protectedImage.optimization.reason).toBe('protected-scope')
    expect(document.optimization.reason).toBe('unsupported-media-type')
    expect(protectedImage.buffer).toEqual(bytes)
    expect(document.buffer).toEqual(bytes)
    expect(shouldOptimizeMedia('video/quicktime', 'connect-story')).toBe(true)
  })
})
