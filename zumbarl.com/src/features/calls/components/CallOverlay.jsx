import { useEffect, useRef } from 'react'
import { FiPhoneOff } from 'react-icons/fi'
import { getCallMeetingUrl } from '../getCallMeetingUrl'
import { endCall, endCallOnPageClose, readCall } from '../services/callService'

function participantName(call) {
  const participant = call.caller || call.recipient
  return participant?.name
    || [participant?.firstName, participant?.lastName].filter(Boolean).join(' ')
    || 'Zumbarl call'
}

function CallOverlay({ call, onClose }) {
  const isEndingRef = useRef(false)
  const meetingUrl = getCallMeetingUrl(call)
  const canEmbedCall = typeof window === 'undefined' || window.isSecureContext

  useEffect(() => {
    if (!call?.id) return undefined
    const handlePageClose = () => endCallOnPageClose(call.id)
    window.addEventListener('pagehide', handlePageClose)
    window.addEventListener('beforeunload', handlePageClose)
    return () => {
      window.removeEventListener('pagehide', handlePageClose)
      window.removeEventListener('beforeunload', handlePageClose)
    }
  }, [call?.id])

  useEffect(() => {
    if (!call?.id) return undefined
    const intervalId = window.setInterval(async () => {
      try {
        const nextCall = await readCall(call.id)
        if (nextCall.status !== 'ringing' && nextCall.status !== 'accepted') {
          onClose()
        }
      } catch {
        onClose()
      }
    }, 2500)
    return () => window.clearInterval(intervalId)
  }, [call?.id, onClose])

  if (!call) return null

  async function handleEndCall() {
    if (isEndingRef.current) return
    isEndingRef.current = true
    try {
      await endCall(call.id)
    } finally {
      onClose()
    }
  }

  function openSecureCallTab() {
    if (!meetingUrl) return
    window.open(meetingUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="call-overlay" role="dialog" aria-modal="true" aria-label="Active call">
      <div className="call-overlay-panel">
        <header>
          <div>
            <strong>{participantName(call)}</strong>
            <span>{call.callType === 'audio' ? 'Audio call' : 'Video call'}</span>
          </div>
          <button type="button" onClick={handleEndCall}>
            <FiPhoneOff aria-hidden="true" />
            End call
          </button>
        </header>
        {canEmbedCall ? (
          <iframe
            src={meetingUrl}
            title="Zumbarl call"
            allow="camera; microphone; fullscreen; display-capture; autoplay"
          />
        ) : (
          <div className="call-overlay-secure-context">
            <strong>Open this call in a separate tab</strong>
            <p>
              This browser blocks camera and microphone access inside calls opened from a plain
              HTTP network address unless that local origin is trusted for development.
            </p>
            <button type="button" onClick={openSecureCallTab}>Open call tab</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CallOverlay
