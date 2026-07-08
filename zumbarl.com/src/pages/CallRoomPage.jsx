import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { openCallOverlay } from '../features/calls/getCallMeetingUrl'
import { readCall } from '../features/calls/services/callService'

// Deep-link entry point: loads the call, hands it to the in-app call popup,
// and returns the user to messages instead of rendering a full-screen room.
function CallRoomPage() {
  const { callId } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    readCall(callId)
      .then((call) => {
        if (!isMounted) return
        if (call.status === 'accepted') {
          openCallOverlay(call)
          navigate('/messages', { replace: true })
        } else {
          setError(`This call is ${call.status}.`)
        }
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError.message)
      })
    return () => { isMounted = false }
  }, [callId, navigate])

  if (error) {
    return (
      <main className="call-room-state">
        <h1>Call unavailable</h1>
        <p>{error}</p>
        <button type="button" onClick={() => navigate('/messages', { replace: true })}>Back to messages</button>
      </main>
    )
  }

  return <main className="call-room-state"><p>Opening your call…</p></main>
}

export default CallRoomPage
