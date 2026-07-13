export const BUSINESS_OPPORTUNITY_TABS = [
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'completed', label: 'Completed' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'archived', label: 'Archived' },
]

export const BUSINESS_OPPORTUNITY_FILTERS = {
  budgets: [
    { label: 'All Budget', value: 'all' },
    { label: 'Under KES 20K', value: 'under-20' },
    { label: 'KES 20K+', value: 'over-20' },
  ],
  categories: [
    { label: 'All Categories', value: 'all' },
    { label: 'Social Media', value: 'Social Media' },
    { label: 'UI/UX Design', value: 'UI/UX Design' },
    { label: 'Web Development', value: 'Web Development' },
    { label: 'Data Analysis', value: 'Data Analysis' },
    { label: 'Video Editing', value: 'Video Editing' },
  ],
  skills: [
    { label: 'All Skills', value: 'all' },
    { label: 'Canva', value: 'Canva' },
    { label: 'Figma', value: 'Figma' },
    { label: 'JavaScript', value: 'JavaScript' },
    { label: 'SQL', value: 'SQL' },
    { label: 'Premiere Pro', value: 'Premiere Pro' },
  ],
  stages: [
    { label: 'All Stages', value: 'all' },
    { label: 'Open', value: 'Open' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Draft', value: 'Draft' },
  ],
}
