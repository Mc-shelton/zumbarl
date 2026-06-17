export const BUSINESS_MARKETING_DETAIL_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'creators', label: 'Creator Collaborations', count: 12 },
  { id: 'applications', label: 'Applications', count: 38 },
  { id: 'performance', label: 'Performance' },
  { id: 'payments', label: 'Payments' },
  { id: 'activity', label: 'Activity' },
]

export const BUSINESS_MARKETING_CAMPAIGN_DETAILS = {
  'level-up-skills': {
    campaignId: 'MKT-2025-00012',
    category: 'Social Media Campaign',
    createdAt: 'May 12, 2025',
    createdBy: 'Zetech Studios',
    campaignType: 'Project',
    engagementMode: 'Remote',
    applicationVisibility: 'Visible to all students',
    autoClose: 'May 20, 2025 (30 days)',
    overview: [
      ['Objective', 'Increase brand awareness and drive engagement for Zetech Studios digital services.'],
      ['Target Audience', 'University and college students interested in digital skills and online learning.'],
      ['Deliverables', '1. Social media post or video mentioning/tagging @ZetechStudios\n2. Share campaign message in captions or content\n3. Use provided hashtags'],
      ['Hashtags', '#ZetechPower #LevelUpYourSkills #DigitalSkills #StudentLife'],
      ['Platforms', 'Instagram, TikTok, YouTube'],
      ['Preferred Content Types', 'Reels, TikTok videos, Stories, Feed posts'],
    ],
    timeline: [
      { label: 'Campaign Created', date: 'May 12, 2025', status: 'done' },
      { label: 'Campaign Published', date: 'May 13, 2025', status: 'done' },
      { label: 'Accepting Applications', date: 'May 13 - May 20, 2025', status: 'done' },
      { label: 'Content Live', date: 'May 21 - May 27, 2025', status: 'current' },
      { label: 'Campaign Ends', date: 'May 27, 2025', status: 'upcoming' },
    ],
    budget: [
      { label: 'Spent', amount: 'KES 12,400', percent: 50, tone: 'purple' },
      { label: 'Committed', amount: 'KES 6,800', percent: 27, tone: 'orange' },
      { label: 'Remaining', amount: 'KES 5,800', percent: 23, tone: 'green' },
    ],
    performance: [
      { label: 'Reach', value: '12.4K', change: '+18%' },
      { label: 'Engagement', value: '1.2K', change: '+24%' },
      { label: 'Link Clicks', value: '320', change: '+12%' },
      { label: 'Applications', value: '45', change: '+28%' },
    ],
    creators: [
      { name: 'Wanjiru M.', handle: '@wanjiru_creates', platform: 'Instagram', followers: '24.6K', status: 'Live', engagement: '1.2K', amount: 'KES 4,000', tone: 'pink' },
      { name: 'Kevin The Creator', handle: '@kevinonthego', platform: 'TikTok', followers: '18.3K', status: 'Live', engagement: '980', amount: 'KES 3,500', tone: 'dark' },
      { name: 'Study With Lynn', handle: '@studywithlynn', platform: 'Instagram', followers: '31.2K', status: 'Scheduled', engagement: '-', amount: 'KES 4,000', tone: 'pink' },
    ],
    applications: [
      { label: 'New Applications', value: 18, detail: 'Awaiting review' },
      { label: 'Shortlisted', value: 12, detail: 'Ready for collaboration offers' },
      { label: 'Invited', value: 8, detail: 'Creator invites sent' },
    ],
    activity: [
      'Wanjiru M. posted first Instagram reel.',
      'Kevin moved to live content review.',
      'Study With Lynn scheduled campaign content.',
      '12 new creator applications received today.',
    ],
  },
}
