import { useCallback, useEffect, useRef, useState } from 'react'
import { FiPhone, FiPhoneOff, FiVideo } from 'react-icons/fi'
import { AUTH_TOKEN_KEY } from '../../../lib/sendZumbarlApiRequest'
import {
  listIncomingCalls,
  respondToCall,
} from '../services/callService'
import {
  playCallRingtone,
  playMessageSound,
  unlockCommunicationSounds,
} from '../../communications/services/communicationSounds'
import { subscribeToRealtimeEvents } from '../../communications/services/realtimeService'
import { subscribeToCallOverlay } from '../getCallMeetingUrl'
import CallOverlay from './CallOverlay'

function displayName(user) {
  return user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'A Zumbarl user'
}

function RealtimeCallAgent() {
  const authToken = window.localStorage.getItem(AUTH_TOKEN_KEY)
  const [incomingCall, setIncomingCall] = useState(null)
  const [activeCall, setActiveCall] = useState(null)
  const [isResponding, setIsResponding] = useState(false)
  const notifiedCallIdRef = useRef('')
  const incomingCallId = incomingCall?.id

  const showIncomingCall = useCallback((call) => {
    setIncomingCall(call)
    if (
      call
      && notifiedCallIdRef.current !== call.id
      && 'Notification' in window
      && window.Notification.permission === 'granted'
    ) {
      notifiedCallIdRef.current = call.id
      new window.Notification(`${displayName(call.caller)} is calling`, {
        body: `Incoming ${call.callType} call on Zumbarl`,
        tag: call.id,
      })
    }
  }, [])

  useEffect(() => subscribeToCallOverlay(setActiveCall), [])

  useEffect(() => {
    const unlock = () => unlockCommunicationSounds()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useEffect(() => {
    if (!incomingCallId) return undefined
    playCallRingtone()
    const ringtoneInterval = window.setInterval(playCallRingtone, 2200)
    return () => window.clearInterval(ringtoneInterval)
  }, [incomingCallId])

  useEffect(() => {
    if (!incomingCall?.expiresAt) return undefined
    const delay = Math.max(0, new Date(incomingCall.expiresAt).getTime() - Date.now())
    const timeoutId = window.setTimeout(() => {
      setIncomingCall((current) => current?.id === incomingCall.id ? null : current)
    }, delay)
    return () => window.clearTimeout(timeoutId)
  }, [incomingCall])

  useEffect(() => {
    if (!authToken) return undefined
    const controller = new AbortController()

    async function handleEvent(event) {
      if (event.type === 'connected') {
        window.dispatchEvent(new CustomEvent('zumbarl:realtime-connected'))
        try {
          const calls = await listIncomingCalls()
          if (!controller.signal.aborted) showIncomingCall(calls?.[0] || null)
        } catch {
          // The next stream reconnect will reconcile incoming calls again.
        }
      } else if (event.type === 'call.created') {
        showIncomingCall(event.data)
      } else if (event.type === 'call.updated') {
        window.dispatchEvent(new CustomEvent('zumbarl:call-updated', { detail: event.data }))
        setIncomingCall((current) => (
          current?.id === event.data?.id && event.data.status !== 'ringing' ? null : current
        ))
        setActiveCall((current) => (
          current?.id === event.data?.id && !['ringing', 'accepted'].includes(event.data.status)
            ? null
            : current
        ))
      } else if (event.type === 'message.created') {
        playMessageSound()
        window.dispatchEvent(new CustomEvent('zumbarl:message-created', { detail: event.data }))
      } else if (event.type === 'page-message.created') {
        playMessageSound()
        window.dispatchEvent(new CustomEvent('zumbarl:page-message-created', { detail: event.data }))
      } else if (event.type === 'page-conversation.created') {
        window.dispatchEvent(new CustomEvent('zumbarl:page-conversation-created', { detail: event.data }))
      } else if (event.type === 'message.delivered' || event.type === 'message.read') {
        window.dispatchEvent(new CustomEvent('zumbarl:message-receipt', { detail: event.data }))
      } else if (event.type === 'circle.message.created') {
        window.dispatchEvent(new CustomEvent('zumbarl:circle-message-created', { detail: event.data }))
      } else if (event.type === 'circle.message.removed') {
        window.dispatchEvent(new CustomEvent('zumbarl:circle-message-removed', { detail: event.data }))
      }
    }

    subscribeToRealtimeEvents(handleEvent, controller.signal).catch(() => {})
    return () => controller.abort()
  }, [authToken, showIncomingCall])

  async function handleResponse(response) {
    if (!incomingCall || isResponding) return
    setIsResponding(true)
    try {
      const call = await respondToCall(incomingCall.id, response)
      setIncomingCall(null)
      if (response === 'accept') setActiveCall(call)
    } catch {
      setIncomingCall(null)
    } finally {
      setIsResponding(false)
    }
  }

  if (activeCall) {
    return <CallOverlay call={activeCall} onClose={() => setActiveCall(null)} />
  }

  if (!incomingCall) return null

  return (
    <aside className="realtime-call-card" role="dialog" aria-label="Incoming call" aria-live="assertive">
      <div className="realtime-call-avatar">
        {incomingCall.callType === 'video' ? <FiVideo aria-hidden="true" /> : <FiPhone aria-hidden="true" />}
      </div>
      <div>
        <strong>{displayName(incomingCall.caller)}</strong>
        <p>Incoming {incomingCall.callType} call</p>
      </div>
      <button
        type="button"
        className="is-decline"
        disabled={isResponding}
        aria-label="Decline call"
        onClick={() => handleResponse('decline')}
      >
        <FiPhoneOff aria-hidden="true" />
      </button>
      <button
        type="button"
        className="is-accept"
        disabled={isResponding}
        aria-label="Accept call"
        onClick={() => handleResponse('accept')}
      >
        <FiPhone aria-hidden="true" />
      </button>
    </aside>
  )
}

export default RealtimeCallAgent
