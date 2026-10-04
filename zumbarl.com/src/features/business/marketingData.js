export const BUSINESS_MARKETING_TABS = [
  { id: 'all', label: 'All Campaigns' },
  { id: 'active', label: 'Active' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'completed', label: 'Completed' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'collaborations', label: 'Collaborations' },
  { id: 'analytics', label: 'Analytics' },
]

export const BUSINESS_MARKETING_FILTERS = {
  types: [
    { label: 'All Types', value: 'all' },
    { label: 'Brand Awareness', value: 'Brand Awareness' },
    { label: 'Product Promotion', value: 'Product Promotion' },
    { label: 'Education Promo', value: 'Education Promo' },
    { label: 'Channel Sponsorship', value: 'Channel Sponsorship' },
  ],
  platforms: [
    { label: 'All Platforms', value: 'all' },
    { label: 'Instagram', value: 'Instagram' },
    { label: 'TikTok', value: 'TikTok' },
    { label: 'YouTube', value: 'YouTube' },
    { label: 'X', value: 'X' },
  ],
  statuses: [
    { label: 'All Status', value: 'all' },
    { label: 'Active', value: 'Active' },
    { label: 'Scheduled', value: 'Scheduled' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Draft', value: 'Draft' },
  ],
}

export const BUSINESS_MARKETING_CREATE_OPTIONS = [
  {
    id: 'social',
    title: 'Social Media Campaign',
    description: 'Get your brand promoted on student social media.',
    icon: 'campaign',
    tone: 'purple',
  },
  {
    id: 'sponsor',
    title: 'Sponsor a Channel',
    description: 'Sponsor student YouTube channels, blogs or podcasts.',
    icon: 'video',
    tone: 'orange',
  },
  {
    id: 'seeding',
    title: 'Product Seeding',
    description: 'Send products to student creators for reviews and mentions.',
    icon: 'gift',
    tone: 'green',
  },
]
