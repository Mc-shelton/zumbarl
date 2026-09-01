import { useEffect, useRef, useState } from 'react'
import { FiHeadphones, FiMic, FiMicOff, FiPhoneOff, FiShield, FiUser, FiUsers } from 'react-icons/fi'
import { createVoiceShieldStream } from './createVoiceShieldStream'
import { loadJitsiMeetLibrary } from './loadJitsiMeetLibrary'
import { updateSupportCircleAudioPresence } from '../community/services/communityService'

function readableConnectionError(error) {
  if (error?.name === 'NotAllowedError') return 'Microphone access was not allowed. Voice Shield did not connect.'
  if (error?.name === 'NotFoundError') return 'No microphone was found. Voice Shield did not connect.'
  return error?.message || 'The protected audio room could not connect.'
}

function initials(value = '') {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?'
}

export default function VoiceShieldConference({ room, profileId, shieldEnabled = true, onLeave }) {
  const { alias: roomAlias, groupId: roomGroupId, roomUrl, scheduleId: roomScheduleId } = room
  const [status, setStatus] = useState('preparing')
  const [error, setError] = useState('')
  const [muted, setMuted] = useState(false)
  const [resolvedProfile, setResolvedProfile] = useState(null)
  const [participants, setParticipants] = useState([])
  const [retryKey, setRetryKey] = useState(0)
  const audioHostRef = useRef(null)
  const shieldRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    let connection
    let conference
    let localTrack
    let shield
    let presenceIntervalId
    let presenceActive = false
    const remoteTracks = new Map()
    const remoteAudioElements = new Map()

    const failClosed = (failure) => {
      if (cancelled) return
      shield?.setMuted(true)
      shield?.dispose?.().catch(() => {})
      setStatus('failed')
      setError(readableConnectionError(failure))
    }

    const updateParticipants = () => {
      if (!conference || cancelled) return
      const remote = Array.from(conference.getParticipants?.() || []).map((participant) => ({
        id: participant.getId(),
        alias: participant.getDisplayName() || 'Circle member',
      }))
      setParticipants(remote)
    }

    const attachRemoteTrack = (track) => {
      if (track.isLocal?.() || track.getType?.() !== 'audio') return
      const participantId = track.getParticipantId?.() || track.getId?.()
      const audio = document.createElement('audio')
      audio.autoplay = true
      audio.playsInline = true
      audio.dataset.participantId = participantId
      audioHostRef.current?.appendChild(audio)
      track.attach(audio)
      remoteTracks.set(track.getId(), track)
      remoteAudioElements.set(track.getId(), audio)
    }

    const removeRemoteTrack = (track) => {
      const trackId = track.getId?.()
      const audio = remoteAudioElements.get(trackId)
      if (audio) {
        track.detach?.(audio)
        audio.remove()
      }
      remoteTracks.delete(trackId)
      remoteAudioElements.delete(trackId)
    }

    async function start() {
      try {
        setStatus('preparing')
        setError('')
        setMuted(false)
        setParticipants([])
        shield = await createVoiceShieldStream(profileId, failClosed, { enabled: shieldEnabled })
        if (cancelled) return shield.dispose()
        shieldRef.current = shield
        setResolvedProfile(shield.profile)

        setStatus('connecting')
        const { JitsiMeetJS, roomName, connectionOptions } = await loadJitsiMeetLibrary(roomUrl)
        if (cancelled) return
        JitsiMeetJS.setLogLevel?.(JitsiMeetJS.logLevels?.ERROR)
        JitsiMeetJS.init({ disableAudioLevels: false, disableThirdPartyRequests: true })

        const localTracks = await Promise.resolve(JitsiMeetJS.createLocalTracksFromMediaStreams([{
          stream: shield.stream,
          mediaType: 'audio',
          sourceType: 'device',
        }]))
        localTrack = localTracks?.[0]
        if (!localTrack) throw new Error('Voice Shield could not hand its protected track to the room.')

        connection = new JitsiMeetJS.JitsiConnection(null, null, connectionOptions)
        const connectionEvents = JitsiMeetJS.events.connection
        const conferenceEvents = JitsiMeetJS.events.conference

        connection.addEventListener(connectionEvents.CONNECTION_ESTABLISHED, async () => {
          if (cancelled) return
          try {
            conference = connection.initJitsiConference(roomName, {
              openBridgeChannel: true,
              p2p: { enabled: true },
              startAudioOnly: true,
            })
            conference.setDisplayName?.(roomAlias || 'Circle member')
            conference.on(conferenceEvents.TRACK_ADDED, attachRemoteTrack)
            conference.on(conferenceEvents.TRACK_REMOVED, removeRemoteTrack)
            conference.on(conferenceEvents.USER_JOINED, updateParticipants)
            conference.on(conferenceEvents.USER_LEFT, updateParticipants)
            conference.on(conferenceEvents.DISPLAY_NAME_CHANGED, updateParticipants)
            conference.on(conferenceEvents.CONFERENCE_JOINED, () => {
              if (cancelled) return
              updateParticipants()
              setStatus('joined')
              presenceActive = true
              updateSupportCircleAudioPresence(roomGroupId, { roomUrl, scheduleId: roomScheduleId }).catch(() => {})
              presenceIntervalId = window.setInterval(() => {
                updateSupportCircleAudioPresence(roomGroupId, { roomUrl, scheduleId: roomScheduleId }).catch(() => {})
              }, 15000)
            })
            conference.on(conferenceEvents.CONFERENCE_FAILED, (_code, reason) => failClosed(new Error(reason || 'The protected room ended unexpectedly.')))
            await conference.addTrack(localTrack)
            conference.join()
          } catch (failure) {
            failClosed(failure)
          }
        })
        connection.addEventListener(connectionEvents.CONNECTION_FAILED, () => failClosed(new Error('The audio service could not establish a secure connection.')))
        connection.addEventListener(connectionEvents.CONNECTION_DISCONNECTED, () => {
          if (!cancelled) failClosed(new Error('The protected audio room disconnected.'))
        })
        connection.connect()
      } catch (failure) {
        failClosed(failure)
      }
    }

    start()

    return () => {
      cancelled = true
      shieldRef.current = null
      if (presenceIntervalId) window.clearInterval(presenceIntervalId)
      if (presenceActive) updateSupportCircleAudioPresence(roomGroupId, { roomUrl, scheduleId: roomScheduleId }, 'leave').catch(() => {})
      remoteTracks.forEach((track) => removeRemoteTrack(track))
      try { conference?.leave?.() } catch { /* already left */ }
      try { localTrack?.dispose?.() } catch { /* already disposed */ }
      try { connection?.disconnect?.() } catch { /* already disconnected */ }
      shield?.dispose?.().catch(() => {})
    }
  }, [profileId, retryKey, roomAlias, roomGroupId, roomScheduleId, roomUrl, shieldEnabled])

  function toggleMute() {
    const nextMuted = !muted
    shieldRef.current?.setMuted(nextMuted)
    setMuted(nextMuted)
  }

  const isJoined = status === 'joined'
  return <div className="voice-shield-conference">
    <div className="voice-shield-statusbar">
      <span>{shieldEnabled ? <FiShield /> : <FiMic />}</span>
      <div><small>{shieldEnabled ? 'Voice Shield beta' : 'Voice Shield off'}</small><strong>{resolvedProfile?.label || (shieldEnabled ? 'Preparing your shield' : 'Preparing microphone')}</strong></div>
      <em className={status === 'failed' ? 'is-failed' : ''}>{status === 'preparing' ? 'Starting locally…' : status === 'connecting' ? 'Connecting…' : status === 'joined' ? (shieldEnabled ? 'Protected track live' : 'Natural voice live') : 'Microphone disconnected'}</em>
    </div>

    {status === 'failed' ? <section className="voice-shield-failed">{shieldEnabled ? <FiShield /> : <FiMicOff />}<h3>Your microphone was not sent.</h3><p>{error}</p><div><button type="button" onClick={onLeave}>Close room</button><button type="button" className="is-retry" onClick={() => setRetryKey((current) => current + 1)}>Try again</button></div></section> : <>
      <section className="voice-shield-stage">
        <header><span>Live circle</span><h3>{room.groupName}</h3><p>Audio only · {isJoined ? participants.length + 1 : '—'} in this call</p></header>
        <div className="voice-shield-people">
          <article className="is-viewer"><div>{initials(room.alias)}</div><strong>{room.alias}</strong><span>{shieldEnabled ? <FiShield /> : <FiMic />} You · {shieldEnabled ? 'shielded' : 'natural voice'}</span></article>
          {participants.map((participant) => <article key={participant.id}><div>{initials(participant.alias)}</div><strong>{participant.alias}</strong><span><FiHeadphones /> In the circle</span></article>)}
          {!participants.length && isJoined ? <aside><FiUsers /><strong>You’re the first one here.</strong><p>You can stay quietly while another member joins.</p></aside> : null}
        </div>
        {!isJoined ? <div className="voice-shield-connecting"><span /><span /><span /><p>{status === 'preparing' ? 'Transforming your microphone on this device…' : 'Taking the protected track into the room…'}</p></div> : null}
      </section>

      <aside className="voice-shield-caveat"><FiUser /><p>{shieldEnabled ? <><strong>Disguised does not mean unidentifiable.</strong> Accent, cadence, details you share, and background sounds can still reveal who you are.</> : <><strong>Your natural voice is audible.</strong> People who know you may recognize it.</>} Other participants may also record externally.</p></aside>
      <footer className="voice-shield-controls"><button type="button" onClick={toggleMute} disabled={!isJoined}>{muted ? <FiMicOff /> : <FiMic />}<span>{muted ? 'Unmute' : 'Mute'}</span></button><button type="button" className="is-leave" onClick={onLeave}><FiPhoneOff /><span>Leave room</span></button></footer>
    </>}
    <div ref={audioHostRef} className="voice-shield-remote-audio" aria-hidden="true" />
  </div>
}
