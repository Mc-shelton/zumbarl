function isLocalZumbarlFile(metadata = {}) {
  if (metadata.provider) return metadata.provider === 'local'
  return String(metadata.bucket || '').startsWith('zumbarl-')
    && String(metadata.storageKey || '').length > 0
}

function localZumbarlFileUrl(metadata = {}) {
  const bucket = String(metadata.bucket || '')
  const storageKey = String(metadata.storageKey || '')
  if (!bucket || !storageKey) return ''

  const encodedPath = [bucket, ...storageKey.split('/')]
    .map((part) => encodeURIComponent(part))
    .join('/')

  return bucket === 'zumbarl-public-assets'
    ? `/files/${encodedPath}`
    : `/api/v1/uploads/content/${encodedPath}`
}

function normalizeZumbarlFileUrl(value, metadata = {}) {
  const url = String(value || '')
  if (!url) return url
  if (isLocalZumbarlFile(metadata)) return localZumbarlFileUrl(metadata) || url

  const normalizeLegacyLocalPath = (pathname, suffix = '') => {
    if (!pathname.startsWith('/files/')) return ''
    const storedPath = pathname.slice('/files/'.length)
    const bucket = storedPath.split('/', 1)[0]
    return bucket === 'zumbarl-public-assets'
      ? `${pathname}${suffix}`
      : `/api/v1/uploads/content/${storedPath}${suffix}`
  }

  if (url.startsWith('/files/')) return normalizeLegacyLocalPath(url)

  try {
    const parsed = new URL(url)
    if (parsed.pathname.startsWith('/files/')) {
      return normalizeLegacyLocalPath(parsed.pathname, `${parsed.search}${parsed.hash}`)
    }
  } catch {
    // Preserve non-URL values; validation belongs to the upload boundary.
  }

  return url
}

function normalizeZumbarlFileMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return metadata

  return {
    ...metadata,
    previewUrl: normalizeZumbarlFileUrl(metadata.previewUrl, metadata),
    url: normalizeZumbarlFileUrl(metadata.url, metadata),
  }
}

export {
  normalizeZumbarlFileMetadata,
  normalizeZumbarlFileUrl,
}
