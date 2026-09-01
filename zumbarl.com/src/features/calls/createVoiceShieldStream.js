import { SoundTouchNode } from '@soundtouchjs/audio-worklet'
import soundTouchProcessorUrl from '@soundtouchjs/audio-worklet/processor?url'
import { resolveVoiceShieldProfile } from './voiceShieldProfiles'

function stopTracks(stream) {
  stream?.getTracks().forEach((track) => track.stop())
}

export async function createVoiceShieldStream(profileId, onFailure = () => {}, { enabled = true } = {}) {
  if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext) {
    throw new Error('Voice Shield is not supported by this browser.')
  }

  const profile = resolveVoiceShieldProfile(profileId)
  let microphoneStream
  let audioContext

  try {
    microphoneStream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: {
        autoGainControl: true,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 48000,
      },
    })

    if (!enabled) {
      const outputTrack = microphoneStream.getAudioTracks()[0]
      if (!outputTrack) throw new Error('Your microphone did not provide an audio track.')
      outputTrack.contentHint = 'speech'
      return {
        stream: microphoneStream,
        track: outputTrack,
        profile: { id: 'natural', label: 'Natural voice' },
        setMuted(muted) { outputTrack.enabled = !muted },
        async dispose() { stopTracks(microphoneStream) },
      }
    }

    audioContext = new AudioContext({ latencyHint: 'interactive', sampleRate: 48000 })
    await SoundTouchNode.register(audioContext, soundTouchProcessorUrl)
    if (audioContext.state === 'suspended') await audioContext.resume()

    const source = audioContext.createMediaStreamSource(microphoneStream)
    const highPass = new BiquadFilterNode(audioContext, { type: 'highpass', frequency: 82, Q: 0.72 })
    const transformer = new SoundTouchNode({ context: audioContext, outputChannelCount: 1 })
    transformer.pitchSemitones.value = profile.pitchSemitones

    const presence = new BiquadFilterNode(audioContext, {
      type: 'peaking',
      frequency: 1450,
      Q: 0.8,
      gain: profile.presenceGain,
    })
    const highShelf = new BiquadFilterNode(audioContext, {
      type: 'highshelf',
      frequency: 4100,
      gain: profile.highShelfGain,
    })
    const compressor = new DynamicsCompressorNode(audioContext, {
      threshold: -24,
      knee: 16,
      ratio: 3.2,
      attack: 0.008,
      release: 0.18,
    })
    const destination = audioContext.createMediaStreamDestination()

    source.connect(highPass)
    highPass.connect(transformer)
    transformer.connect(presence)
    presence.connect(highShelf)
    highShelf.connect(compressor)
    compressor.connect(destination)

    const outputTrack = destination.stream.getAudioTracks()[0]
    if (!outputTrack) throw new Error('Voice Shield could not create a protected audio track.')
    outputTrack.contentHint = 'speech'

    let disposed = false
    const failClosed = (message) => {
      if (disposed) return
      disposed = true
      stopTracks(microphoneStream)
      outputTrack.stop()
      source.disconnect()
      highPass.disconnect()
      transformer.disconnect()
      presence.disconnect()
      highShelf.disconnect()
      compressor.disconnect()
      if (audioContext.state !== 'closed') audioContext.close().catch(() => {})
      onFailure(new Error(message))
    }
    const handleProcessorError = () => failClosed('Voice Shield stopped processing. Your microphone has been disconnected.')
    const handleMicrophoneEnded = () => failClosed('Microphone access ended. The audio room has been disconnected.')
    transformer.addEventListener('processorerror', handleProcessorError)
    microphoneStream.getAudioTracks().forEach((track) => track.addEventListener('ended', handleMicrophoneEnded))

    return {
      stream: destination.stream,
      track: outputTrack,
      profile,
      setMuted(muted) {
        outputTrack.enabled = !muted
      },
      async dispose() {
        if (disposed) return
        disposed = true
        transformer.removeEventListener('processorerror', handleProcessorError)
        microphoneStream.getAudioTracks().forEach((track) => track.removeEventListener('ended', handleMicrophoneEnded))
        stopTracks(microphoneStream)
        stopTracks(destination.stream)
        source.disconnect()
        highPass.disconnect()
        transformer.disconnect()
        presence.disconnect()
        highShelf.disconnect()
        compressor.disconnect()
        if (audioContext.state !== 'closed') await audioContext.close()
      },
    }
  } catch (error) {
    stopTracks(microphoneStream)
    if (audioContext && audioContext.state !== 'closed') await audioContext.close().catch(() => {})
    throw error
  }
}
