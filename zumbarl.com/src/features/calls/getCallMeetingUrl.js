import { getCurrentViewerProfile } from '../auth/viewerProfile'

const OPEN_CALL_EVENT = 'zumbarl:open-call'
const LOCAL_HOST_PATTERN = /^(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/

// In local development Jitsi runs on the same machine as the app but the
// backend generates room URLs with one fixed host. Serving the room from the
// same hostname the app is loaded from keeps localhost viewers on a secure
// origin (WebRTC is disabled on plain http:// for non-localhost hosts).
export function normalizeRoomUrl(roomUrl) {
  try {
    const url = new URL(roomUrl)
    if (LOCAL_HOST_PATTERN.test(url.hostname) && url.hostname !== window.location.hostname) {
      url.hostname = window.location.hostname
    }
    return url.toString()
  } catch {
    return roomUrl
  }
}

export function getSupportCircleMeetingUrl(room) {
  if (!room?.roomUrl) return ''

  const alias = room.alias || 'Circle member'
  const toolbarButtons = encodeURIComponent(JSON.stringify([
    'microphone',
    'hangup',
    'participants-pane',
    'raisehand',
    'tileview',
    'settings',
  ]))
  const hashParams = [
    `userInfo.displayName="${encodeURIComponent(alias)}"`,
    'config.prejoinConfig.enabled=false',
    'config.prejoinPageEnabled=false',
    'config.startAudioOnly=true',
    'config.startWithVideoMuted=true',
    'config.disableInviteFunctions=true',
    'config.disableDeepLinking=true',
    `config.toolbarButtons=${toolbarButtons}`,
  ]

  return `${normalizeRoomUrl(room.roomUrl)}#${hashParams.join('&')}`
}

export function getCallMeetingUrl(call) {
  if (!call?.roomUrl) return ''

  const viewerName = getCurrentViewerProfile().name || 'Zumbarl user'
  const hashParams = [
    `userInfo.displayName="${encodeURIComponent(viewerName)}"`,
    'config.prejoinConfig.enabled=false',
    'config.prejoinPageEnabled=false',
    ...(call.callType === 'audio'
      ? ['config.startAudioOnly=true', 'config.startWithVideoMuted=true']
      : ['config.startWithVideoMuted=false']),
  ]

  return `${normalizeRoomUrl(call.roomUrl)}#${hashParams.join('&')}`
}

export function openCallOverlay(call) {
  window.dispatchEvent(new CustomEvent(OPEN_CALL_EVENT, { detail: call }))
}

export function subscribeToCallOverlay(onOpenCall) {
  const handleOpenCall = (event) => onOpenCall(event.detail)
  window.addEventListener(OPEN_CALL_EVENT, handleOpenCall)
  return () => window.removeEventListener(OPEN_CALL_EVENT, handleOpenCall)
}
