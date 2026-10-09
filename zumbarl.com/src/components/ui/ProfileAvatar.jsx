import { DEFAULT_PROFILE_AVATAR, resolveProfileAvatar } from './profileAvatarUtils'
import './profile-avatar.css'

function ProfileAvatar({ alt = '', className = '', onError, src, ...imageProps }) {
  const avatarUrl = resolveProfileAvatar(src)
  const isFallback = avatarUrl === DEFAULT_PROFILE_AVATAR

  const handleError = (event) => {
    if (event.currentTarget.src.endsWith(DEFAULT_PROFILE_AVATAR)) return
    event.currentTarget.classList.add('is-fallback')
    event.currentTarget.src = DEFAULT_PROFILE_AVATAR
    onError?.(event)
  }

  return (
    <img
      {...imageProps}
      className={['profile-avatar-image', isFallback ? 'is-fallback' : '', className].filter(Boolean).join(' ')}
      src={avatarUrl}
      alt={alt}
      onError={handleError}
    />
  )
}

export default ProfileAvatar
