export const BUSINESS_OPPORTUNITY_BRIEF_STEPS = [
  { id: 'details', label: 'Opportunity Details', meta: 'Basic information' },
  { id: 'requirements', label: 'Requirements', meta: 'Skills & qualifications' },
  { id: 'scope', label: 'Scope & Budget', meta: 'Deliverables & budget' },
  { id: 'review', label: 'Review & Publish', meta: 'Review and publish' },
]

export const BUSINESS_OPPORTUNITY_BRIEF_DEFAULTS = {
  acceptanceCriteria: '',
  applicationDeadline: '',
  availability: '',
  budget: '',
  bidderInstructions: '',
  category: '',
  deliverables: '',
  duration: '',
  engagementMode: '',
  experienceLevel: '',
  mustHave: [],
  opportunityType: '',
  opportunitySplash: null,
  paymentTerms: '',
  portfolioRequired: '',
  preferredQualifications: '',
  qualificationQuestions: [],
  requiredAttachments: [],
  screeningFocus: '',
  skills: '',
  summary: '',
  title: '',
  visibility: 'Visible to all students',
  scopeMode: 'deliverable',
  milestoneScopes: [],
  deliverableMilestones: [],
}

export const BUSINESS_OPPORTUNITY_BRIEF_TYPE_OPTIONS = [
  {
    id: 'Project',
    label: 'Project',
    meta: 'One-time project with defined deliverables',
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
  deliverableType: [
    'File Asset Deliverables',
    'Code & Development Deliverables',
    'Document Deliverables',
    'Stats & Metrics Deliverables',
    'Proof-Based Deliverables',
    'Hybrid Deliverables',
  ],
  duration: ['< 1 days', '1-2 days', '1-2 weeks', '3-4 weeks', '2-5 months', '6+ months ', 'Flexible / To be agreed'],
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
