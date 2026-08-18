import { sendZumbarlApiRequest } from '../../lib/sendZumbarlApiRequest'

let cachedTags = null
let pendingRequest = null

export function readNavigationFeatureTags() {
  if (cachedTags) return Promise.resolve(cachedTags)
  if (!pendingRequest) {
    pendingRequest = sendZumbarlApiRequest('/admin/navigation-feature-tags')
      .then((response) => {
        cachedTags = response?.tags || {}
        return cachedTags
      })
      .catch(() => ({}))
      .finally(() => { pendingRequest = null })
  }
  return pendingRequest
}
