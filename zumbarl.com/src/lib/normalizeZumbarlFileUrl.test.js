import { describe, expect, it } from 'vitest'
import { normalizeZumbarlFileUrl } from './normalizeZumbarlFileUrl'

describe('normalizeZumbarlFileUrl', () => {
  it('keeps public assets on the public file route', () => {
    expect(normalizeZumbarlFileUrl('/files/zumbarl-public-assets/platform/logo.png'))
      .toBe('/files/zumbarl-public-assets/platform/logo.png')
  })

  it('moves legacy protected assets to the authenticated content route', () => {
    expect(normalizeZumbarlFileUrl('/files/zumbarl-opportunity-files/opportunities/demo/brief.png'))
      .toBe('/api/v1/uploads/content/zumbarl-opportunity-files/opportunities/demo/brief.png')
  })

  it('removes an obsolete host while preserving a public asset path', () => {
    expect(normalizeZumbarlFileUrl('https://192.168.100.19:5174/files/zumbarl-public-assets/platform/demo.webp'))
      .toBe('/files/zumbarl-public-assets/platform/demo.webp')
  })
})
