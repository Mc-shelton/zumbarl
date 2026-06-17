export const BUSINESS_OPPORTUNITY_BRIEF_STEPS = [
  { id: 'details', label: 'Opportunity Details', meta: 'Basic information' },
  { id: 'requirements', label: 'Requirements', meta: 'Skills & qualifications' },
  { id: 'scope', label: 'Scope & Budget', meta: 'Deliverables & budget' },
  { id: 'review', label: 'Review & Publish', meta: 'Review and publish' },
]

export const BUSINESS_OPPORTUNITY_BRIEF_DEFAULTS = {
  acceptanceCriteria: 'Content is approved before publishing, captions follow the brand voice, analytics are submitted weekly, and all final assets are handed over in editable formats.',
  applicationDeadline: 'Jun 24, 2026',
  availability: 'Flexible',
  budget: '15,000',
  bidderInstructions: 'Apply with 2 relevant content samples, your weekly availability, expected turnaround time, and any questions about the campaign scope.',
  category: 'Social Media',
  companyDescription: 'We are a digital creative studio helping brands build strong online presence through content and design.',
  companyName: 'Zetech Studios',
  deliverables: 'Weekly content calendar, 8 social posts, basic analytics report, and final campaign summary.',
  duration: '2-4 weeks',
  engagementMode: 'Remote',
  estimatedStartDate: 'Jul 1, 2026',
  experienceLevel: 'Any level',
  mustHave: ['Social Media', 'Content Creation', 'Canva'],
  opportunityType: 'Project',
  paymentTerms: 'Milestone-based',
  portfolioRequired: 'Portfolio samples required',
  preferredQualifications: 'Experience managing Instagram or TikTok pages for clubs, student groups, or small businesses.',
  screeningFocus: 'Portfolio samples, writing quality, brand voice, and weekly availability.',
  skills: 'Social Media, Content Creation, Canva',
  summary: "We're looking for a creative student to manage our social media channels and grow our online presence.",
  title: 'Social Media Management',
  visibility: 'Visible to all students',
}

export const BUSINESS_OPPORTUNITY_BRIEF_TYPE_OPTIONS = [
  {
    id: 'Project',
    label: 'Project',
    meta: 'One-time project with defined deliverables',
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

export const BUSINESS_OPPORTUNITY_BRIEF_SELECTS = {
  availability: ['Flexible', 'Immediate', 'Weekdays', 'Weekends'],
  category: ['Social Media', 'UI/UX Design', 'Web Development', 'Data Analysis', 'Video Editing', 'Marketing & Communications'],
  engagementMode: ['Remote', 'Hybrid', 'On-site'],
  experienceLevel: ['Any level', 'Beginner', 'Intermediate', 'Advanced'],
  paymentTerms: ['Milestone-based', 'Fixed price', 'Hourly', 'Pay on completion'],
  portfolioRequired: ['Portfolio samples required', 'Portfolio optional', 'No portfolio needed'],
}

export const BUSINESS_OPPORTUNITY_BRIEF_SKILLS = [
  'Social Media',
  'Content Creation',
  'Canva',
  'Copywriting',
  'Analytics',
  'Video Editing',
]

export const BUSINESS_OPPORTUNITY_BRIEF_SETTINGS = [
  { label: 'Visibility', value: 'Visible to all students', icon: 'eye' },
  { label: 'All students', value: 'Any student can apply', icon: 'users' },
  { label: 'Auto close', value: '30 days after deadline', icon: 'calendar' },
]
