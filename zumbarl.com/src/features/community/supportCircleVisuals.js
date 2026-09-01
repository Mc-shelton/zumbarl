const SUPPORT_CIRCLE_VISUALS = [
  { id: 'stepping-stones', label: 'Stepping stones', description: 'A calm path toward brighter ground.', url: '/assets/wellbeing/recovery-circle-splash.webp' },
  { id: 'campus-garden', label: 'Campus garden', description: 'Belonging and connection on campus.', url: '/assets/wellbeing/first-year-circle-splash.webp' },
  { id: 'sheltered-path', label: 'Sheltered path', description: 'A protected place to move forward.', url: '/assets/wellbeing/wellness-shelter-v1.webp' },
  { id: 'meeting-ripples', label: 'Meeting ripples', description: 'Listening, connection and shared support.', url: '/assets/wellbeing/wellness-connection-v1.webp' },
  { id: 'renewal-tree', label: 'Renewal tree', description: 'Steady growth after difficult seasons.', url: '/assets/wellbeing/wellness-renewal-v1.webp' },
  { id: 'quiet-reflection', label: 'Quiet reflection', description: 'Rest, calm and room to breathe.', url: '/assets/wellbeing/wellness-reflection-v1.webp' },
]

const SUPPORT_CIRCLE_SPLASHES = {
  'group-zetech-recovery-circle': '/assets/wellbeing/recovery-circle-splash.webp',
  'group-zetech-first-year-support': '/assets/wellbeing/first-year-circle-splash.webp',
}

function getSupportCircleSplash(circle) {
  return circle?.splashImageUrl || SUPPORT_CIRCLE_SPLASHES[circle?.id] || ''
}

export { getSupportCircleSplash, SUPPORT_CIRCLE_VISUALS }
