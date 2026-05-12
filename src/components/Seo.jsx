import { useEffect } from 'react'
import {
  SEO_BASE_URL,
  SEO_DEFAULT_IMAGE,
  SEO_DEFAULT_IMAGE_ALT,
  SEO_DEFAULT_KEYWORDS,
  SEO_SHARED_JSON_LD,
} from '../features/seo/constants'

const ensureAbsoluteUrl = (url) => {
  if (!url) {
    return SEO_DEFAULT_IMAGE
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  return `${SEO_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

const buildCanonicalUrl = (path = '/') => {
  const canonicalUrl = new URL(path, SEO_BASE_URL)
  canonicalUrl.hash = ''
  canonicalUrl.search = ''

  if (canonicalUrl.pathname !== '/' && canonicalUrl.pathname.endsWith('/')) {
    canonicalUrl.pathname = canonicalUrl.pathname.replace(/\/+$/, '')
  }

  return canonicalUrl.toString()
}

const upsertMeta = (selector, attributes) => {
  let meta = document.head.querySelector(selector)

  if (!meta) {
    meta = document.createElement('meta')
    document.head.appendChild(meta)
  }

  Object.entries(attributes).forEach(([key, value]) => {
    meta.setAttribute(key, value)
  })
}

const upsertLink = (selector, attributes) => {
  let link = document.head.querySelector(selector)

  if (!link) {
    link = document.createElement('link')
    document.head.appendChild(link)
  }

  Object.entries(attributes).forEach(([key, value]) => {
    link.setAttribute(key, value)
  })
}

function Seo({
  title,
  description,
  path = '/',
  keywords = SEO_DEFAULT_KEYWORDS,
  image = SEO_DEFAULT_IMAGE,
  imageAlt = SEO_DEFAULT_IMAGE_ALT,
  robots = 'index,follow',
  jsonLd = [],
}) {
  useEffect(() => {
    const canonicalUrl = buildCanonicalUrl(path)
    const socialImageUrl = ensureAbsoluteUrl(image)
    const jsonLdPayload = [...SEO_SHARED_JSON_LD, ...jsonLd]

    document.title = title

    upsertMeta('meta[name="description"]', { name: 'description', content: description })
    upsertMeta('meta[name="keywords"]', { name: 'keywords', content: keywords })
    upsertMeta('meta[name="robots"]', { name: 'robots', content: robots })
    upsertMeta('meta[name="author"]', { name: 'author', content: 'Zumbarl' })

    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' })
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: 'Zumbarl' })
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title })
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description })
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl })
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: socialImageUrl })
    upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt', content: imageAlt })

    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title })
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description })
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: socialImageUrl })
    upsertMeta('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt', content: imageAlt })

    upsertLink('link[rel="canonical"]', { rel: 'canonical', href: canonicalUrl })

    document.querySelectorAll('script[data-seo-json-ld="true"]').forEach((script) => {
      script.remove()
    })

    jsonLdPayload.forEach((entry) => {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.setAttribute('data-seo-json-ld', 'true')
      script.text = JSON.stringify(entry)
      document.head.appendChild(script)
    })
  }, [description, image, imageAlt, jsonLd, keywords, path, robots, title])

  return null
}

export default Seo
