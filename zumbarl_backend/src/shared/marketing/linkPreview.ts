function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
}

function htmlAttributes(tag: string) {
  const attributes: Record<string, string> = {}
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(["'])(.*?)\2/gs)) {
    attributes[match[1].toLowerCase()] = decodeHtmlEntities(match[3].trim())
  }
  return attributes
}

function firstNonempty(...values: Array<string | undefined>) {
  return values.find((value) => value?.trim())?.trim() || ''
}

function extractLinkPreview(html: string, pageUrl: string) {
  const meta = new Map<string, string>()
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const attributes = htmlAttributes(tag)
    const key = (attributes.property || attributes.name || '').toLowerCase()
    if (key && attributes.content && !meta.has(key)) meta.set(key, attributes.content)
  }
  const titleTag = decodeHtmlEntities(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() || '')
  const title = firstNonempty(meta.get('og:title'), meta.get('twitter:title'), titleTag)
  const description = firstNonempty(meta.get('og:description'), meta.get('twitter:description'), meta.get('description'))
  const imageValue = firstNonempty(meta.get('og:image:secure_url'), meta.get('og:image'), meta.get('twitter:image'))
  let imageUrl = ''
  try {
    if (imageValue) imageUrl = new URL(imageValue, pageUrl).toString()
  } catch {
    imageUrl = ''
  }
  return {
    title,
    description,
    imageUrl,
    siteName: firstNonempty(meta.get('og:site_name')),
    type: firstNonempty(meta.get('og:type')) || 'website',
    url: firstNonempty(meta.get('og:url')) || pageUrl
  }
}

function escapeHtmlAttribute(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export {
  escapeHtmlAttribute,
  extractLinkPreview
}
