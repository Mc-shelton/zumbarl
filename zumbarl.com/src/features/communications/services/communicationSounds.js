let audioContext = null
let isUnlocked = false

function getAudioContext() {
  if (audioContext || typeof window === 'undefined') return audioContext
  const AudioContext = window.AudioContext || window.webkitAudioContext
  audioContext = AudioContext ? new AudioContext() : null
  return audioContext
}

async function unlockCommunicationSounds() {
  const context = getAudioContext()
  if (!context || isUnlocked) return
  await context.resume().catch(() => {})
  isUnlocked = context.state === 'running'
}

function playTone(frequency, startsIn, duration, volume = 0.08) {
  const context = getAudioContext()
  if (!context || context.state !== 'running') return
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  const startsAt = context.currentTime + startsIn
  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(frequency, startsAt)
  gain.gain.setValueAtTime(0.0001, startsAt)
  gain.gain.exponentialRampToValueAtTime(volume, startsAt + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + duration)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(startsAt)
  oscillator.stop(startsAt + duration + 0.02)
}

function playMessageSound() {
  playTone(720, 0, 0.12, 0.06)
  playTone(940, 0.11, 0.16, 0.07)
}

function playMessageSentSound() {
  playTone(560, 0, 0.1, 0.045)
  playTone(760, 0.08, 0.13, 0.05)
}

function playNotificationSound() {
  playTone(620, 0, 0.16, 0.06)
  playTone(780, 0.16, 0.2, 0.06)
}

function playCallRingtone() {
  playTone(440, 0, 0.35, 0.1)
  playTone(554, 0.38, 0.35, 0.1)
  playTone(659, 0.76, 0.48, 0.1)
}

export {
  unlockCommunicationSounds,
  playMessageSound,
  playMessageSentSound,
  playNotificationSound,
  playCallRingtone,
}
