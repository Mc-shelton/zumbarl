function titleCase(value: string) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\p{Letter}[\p{Letter}\p{Number}'’]*/gu, (word) => {
      // Preserve short acronyms and lower-camel product names such as AI and iOS.
      if (/^[A-Z0-9]{2,4}$/.test(word) || /^[a-z][A-Z]/.test(word)) return word
      return `${word[0].toLocaleUpperCase('en-US')}${word.slice(1).toLocaleLowerCase('en-US')}`
    })
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function isFileDescriptor(value: Record<string, unknown>) {
  return typeof value.fileName === 'string'
    || typeof value.mimeType === 'string'
    || typeof value.storageKey === 'string'
}

function normalizeTitleFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeTitleFields)
  if (!isPlainObject(value)) return value

  const fileDescriptor = isFileDescriptor(value)
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => {
    if (key === 'title' && !fileDescriptor) {
      if (typeof entry === 'string') return [key, titleCase(entry)]
      if (isPlainObject(entry) && typeof entry.set === 'string') {
        return [key, { ...entry, set: titleCase(entry.set) }]
      }
    }
    return [key, normalizeTitleFields(entry)]
  }))
}

export {
  normalizeTitleFields,
  titleCase
}
