const PROFILE_DEFINITIONS = [
  {
    id: 'cedar',
    label: 'Cedar',
    description: 'Warm and grounded',
    pitchSemitones: -4.1,
    highShelfGain: -1.8,
    presenceGain: 1.1,
  },
  {
    id: 'river',
    label: 'River',
    description: 'Clear and softened',
    pitchSemitones: 3.2,
    highShelfGain: -2.5,
    presenceGain: -1.2,
  },
  {
    id: 'sunbird',
    label: 'Sunbird',
    description: 'Light and bright',
    pitchSemitones: 4.7,
    highShelfGain: 1.4,
    presenceGain: -1.8,
  },
]

export const VOICE_SHIELD_PROFILES = PROFILE_DEFINITIONS.map(({ id, label, description }) => ({ id, label, description }))

function randomBetween(min, max) {
  if (globalThis.crypto?.getRandomValues) {
    const values = new Uint32Array(1)
    globalThis.crypto.getRandomValues(values)
    return min + (values[0] / 0xffffffff) * (max - min)
  }
  return min + Math.random() * (max - min)
}

export function resolveVoiceShieldProfile(profileId) {
  const profile = PROFILE_DEFINITIONS.find((candidate) => candidate.id === profileId) || PROFILE_DEFINITIONS[0]

  // Keep one subtly randomized transformation for the full room session. This
  // avoids publishing a globally fixed preset without making a speaker's voice
  // wobble during a conversation.
  return {
    ...profile,
    pitchSemitones: profile.pitchSemitones + randomBetween(-0.38, 0.38),
    highShelfGain: profile.highShelfGain + randomBetween(-0.45, 0.45),
    presenceGain: profile.presenceGain + randomBetween(-0.35, 0.35),
  }
}
