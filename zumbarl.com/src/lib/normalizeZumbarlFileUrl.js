function isLocalZumbarlFile(metadata = {}) {
  return metadata.provider === 'local'
    || String(metadata.bucket || '').startsWith('zumbarl-')
    || String(metadata.storageKey || '').length > 0
}

function normalizeZumbarlFileUrl(value, metadata = {}) {
  const url = String(value || '')
  if (!url) return url
  if (url.startsWith('/files/')) return url

  try {
    const parsed = new URL(url)
    if (parsed.pathname.startsWith('/files/')) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`
    }
  } catch {
    // Preserve non-URL values; validation belongs to the upload boundary.
  }

  if (!isLocalZumbarlFile(metadata)) return url
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
