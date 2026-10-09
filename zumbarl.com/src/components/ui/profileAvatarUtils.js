import { normalizeZumbarlFileUrl } from '../../lib/normalizeZumbarlFileUrl'

export const DEFAULT_PROFILE_AVATAR = '/assets/index/bee_nobg.png'

export function resolveProfileAvatar(value) {
  return normalizeZumbarlFileUrl(value) || DEFAULT_PROFILE_AVATAR
}
