import { describe, expect, it } from 'vitest'
import { assertSafeUpload } from './manageUploadsService.js'

describe('upload safety', () => {
  it('allows expected document and image uploads', () => {
    expect(() => assertSafeUpload('brief.pdf', 'application/pdf', 100)).not.toThrow()
    expect(() => assertSafeUpload('photo.webp', 'image/webp', 100)).not.toThrow()
  })

  it('blocks active web content and executable files', () => {
    expect(() => assertSafeUpload('payload.html', 'text/html', 100)).toThrowError(/not accepted/)
    expect(() => assertSafeUpload('payload.svg', 'image/svg+xml', 100)).toThrowError(/not accepted/)
    expect(() => assertSafeUpload('payload.exe', 'application/octet-stream', 100)).toThrowError(/not accepted/)
  })

  it('enforces the upload size boundary', () => {
    expect(() => assertSafeUpload('empty.pdf', 'application/pdf', 0)).toThrowError(/between 1 byte and 50 MB/)
    expect(() => assertSafeUpload('large.pdf', 'application/pdf', 50 * 1024 * 1024 + 1)).toThrowError(/between 1 byte and 50 MB/)
  })
})
