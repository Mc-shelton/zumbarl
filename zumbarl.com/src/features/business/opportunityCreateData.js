export const BUSINESS_CREATE_STEPS = [
  { id: 'details', label: 'Campaign Details', meta: 'Basic information' },
  { id: 'targeting', label: 'Targeting', meta: 'Choose your audience' },
  { id: 'content', label: 'Content & Deliverables', meta: 'What creators will deliver' },
  { id: 'scope', label: 'Budget & Schedule', meta: 'Set budget and timeline' },
  { id: 'review', label: 'Review & Launch', meta: 'Review and launch' },
]

export const BUSINESS_CREATE_DEFAULTS = {
  applicationDeadline: 'Jun 30, 2026',
  availability: 'Flexible',
  budget: 'KES 25,000',
  budgetAllocation: {
    instagram: 40,
    tiktok: 30,
    xTwitter: 10,
    youtube: 20,
  },
  category: 'Marketing & Communications',
  contentGuidelines: [
    'Highlight how the opportunity helps students learn and grow',
    'Keep content authentic and relatable',
    'Use positive and empowering tone',
    'Tag @zetechstudios and use #ZetechPower',
    'Avoid sensitive topics and misleading claims',
  ].join('\n'),
  contentMessage: 'Promoting Zetech Studios digital services to help students level up their skills and build their future.',
  contentRequirements: ['Mention Zetech Studios', 'Include call-to-action', 'Minimum 15 seconds (video)', 'High quality visuals'],
  companyDescription: 'We are a digital creative studio helping brands build strong online presence through content and design.',
  companyName: 'Zetech Studios',
  deliverables: {
    blogArticle: 0,
    instagramPost: 2,
    instagramStory: 3,
    tiktokVideo: 1,
    youtubeShort: 0,
  },
  duration: '2-4 weeks',
  endDate: 'Jun 27, 2026',
  engagementMode: 'Remote',
  estimatedPayout: 'KES 18,000 - 22,000',
  experienceLevel: 'Any level',
  gender: 'All',
  opportunityType: 'Project',
  paymentTerm: 'Pay per Deliverable',
  remainingBudget: 'KES 3,000 - 7,000',
  screeningFocus: 'Portfolio samples, brand voice, and consistent weekly availability',
  skills: 'Social Media, Content Creation, Canva',
  startDate: 'Jun 22, 2026',
  summary: "We're looking for a creative student to manage our social media channels and grow our online presence.",
  targetAgeMax: '28',
  targetAgeMin: '18',
  targetCourseField: '',
  targetInterests: ['Digital Skills', 'Entrepreneurship', 'Tech', 'Design', 'Personal Development'],
  targetLocations: ['Kenya'],
  targetPlatforms: ['Instagram', 'TikTok', 'YouTube'],
  targetUniversities: ['Strathmore University', 'Jomo Kenyatta University'],
  targetYear: 'All Years',
  totalBudget: '25,000',
  referenceFiles: [],
  title: 'Social Media Management',
  visibility: 'Visible to all students',
}

export const BUSINESS_CREATE_TYPE_OPTIONS = [
  {
    id: 'Project',
    label: 'Project',
    meta: 'One-time project with a clear delivery',
  },
  {
    id: 'Ongoing',
    label: 'Ongoing',
    meta: 'Long-term / part-time engagement',
  },
  {
    id: 'Task',
    label: 'Task',
    meta: 'Small task or quick job',
  },
]

export const BUSINESS_CREATE_SELECTS = {
  availability: ['Flexible', 'Weekdays', 'Weekends', 'Immediate'],
  category: ['Marketing & Communications', 'Design & Product', 'Web Development', 'Data & Analytics', 'Video & Content'],
  courseFields: ['Business', 'Engineering', 'Media', 'Computer Science', 'Design', 'Any field'],
  engagementMode: ['Remote', 'Hybrid', 'On-site'],
  experienceLevel: ['Any level', 'Beginner', 'Intermediate', 'Advanced'],
}

export const BUSINESS_CREATE_TARGETING = {
  genders: ['All', 'Male', 'Female', 'Other'],
  interests: ['Digital Skills', 'Entrepreneurship', 'Tech', 'Design', 'Personal Development'],
  locations: ['Kenya', 'Nairobi', 'Mombasa', 'Kisumu', 'Remote'],
  platforms: ['Instagram', 'TikTok', 'YouTube', 'X (Twitter)', 'Any Platform'],
  universities: ['Strathmore University', 'Jomo Kenyatta University', 'Zetech University', 'USIU Africa', 'University of Nairobi'],
  years: ['All Years', 'Year 1', 'Year 2', 'Year 3', 'Year 4+'],
}

export const BUSINESS_CREATE_DELIVERABLES = [
  { id: 'instagramPost', icon: 'instagram', label: 'Instagram Post', meta: 'Feed post' },
  { id: 'instagramStory', icon: 'instagram', label: 'Instagram Story', meta: 'Story slide' },
  { id: 'tiktokVideo', icon: 'tiktok', label: 'TikTok Video', meta: 'Short video' },
  { id: 'youtubeShort', icon: 'youtube', label: 'YouTube Short', meta: 'Short video' },
  { id: 'blogArticle', icon: 'file', label: 'Blog / Article', meta: 'Blog mention' },
]

export const BUSINESS_CREATE_CONTENT_REQUIREMENTS = [
  'Mention Zetech Studios',
  'Include call-to-action',
  'Minimum 15 seconds (video)',
  'High quality visuals',
  'Show student benefit',
  'Use approved brand language',
]

export const BUSINESS_CREATE_BUDGET_PLATFORMS = [
  { id: 'instagram', icon: 'instagram', label: 'Instagram' },
  { id: 'tiktok', icon: 'tiktok', label: 'TikTok' },
  { id: 'youtube', icon: 'youtube', label: 'YouTube' },
  { id: 'xTwitter', icon: 'x', label: 'X (Twitter)' },
]

export const BUSINESS_CREATE_PAYMENT_TERMS = [
  {
    id: 'Pay per Deliverable',
    label: 'Pay per Deliverable',
    meta: 'Pay creators when they submit and you approve each deliverable.',
  },
  {
    id: 'Pay on Completion',
    label: 'Pay on Completion',
    meta: 'Pay creators after the opportunity ends and all deliverables are approved.',
  },
]

export const BUSINESS_CREATE_SETTINGS = [
  { label: 'Visibility', value: 'Visible to all students', icon: 'eye' },
  { label: 'All students', value: 'Any student can apply', icon: 'users' },
  { label: 'Auto close', value: '30 days after deadline', icon: 'calendar' },
]
