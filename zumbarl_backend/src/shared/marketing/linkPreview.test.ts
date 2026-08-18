import { describe, expect, it } from 'vitest'
import { escapeHtmlAttribute, extractLinkPreview } from './linkPreview.js'

describe('link preview metadata', () => {
  it('extracts Open Graph tags regardless of attribute order', () => {
    const preview = extractLinkPreview(`
      <html><head>
        <meta content="Student Bundle &amp; Offer" property="og:title">
        <meta property="og:description" content="Affordable data for students">
        <meta content="/bundle.jpg" property="og:image">
        <meta property="og:site_name" content="Example Mobile">
      </head></html>
    `, 'https://example.com/offers/student')
    expect(preview).toMatchObject({
      title: 'Student Bundle & Offer',
      description: 'Affordable data for students',
      imageUrl: 'https://example.com/bundle.jpg',
      siteName: 'Example Mobile'
    })
  })

  it('escapes untrusted values used in tracking HTML', () => {
    expect(escapeHtmlAttribute('"<script>&')).toBe('&quot;&lt;script&gt;&amp;')
  })
})
