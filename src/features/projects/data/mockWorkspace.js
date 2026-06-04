import { FiCheck, FiFileText, FiFolder, FiGrid, FiSend, FiUploadCloud } from 'react-icons/fi'

export const project = {
  title: 'Social Media Content Creation',
  status: 'In Progress',
  id: '#ZP78492',
  posted: 'Apr 28, 2024',
  budget: 'KES 25,000',
  deadline: 'May 28, 2024',
  client: 'BrightPath Solutions',
  owner: 'Mercy Wanjiku',
  category: 'Digital Marketing',
  skills: 'Content Creation, Canva, Copywriting, Social Media Strategy',
  overview:
    "We're looking for a creative individual to manage our social media channels and create engaging content that grows our online presence.",
  details: [
    { label: 'Deliverable', value: 'High-quality posts, stories, and captions across Instagram, LinkedIn & Facebook' },
    { label: 'Frequency', value: '3 posts per week + daily stories' },
    { label: 'Platforms', value: 'Instagram, LinkedIn, Facebook' },
    { label: 'Content Types', value: 'Graphics, short videos, carousels, captions' },
    { label: 'Brand Guidelines', value: 'Will be provided after onboarding' },
  ],
}

export const milestoneProject = {
  title: 'DataVista Dashboard Redesign',
  status: 'In Progress',
  id: '#ZP78456',
  posted: 'Apr 30, 2024',
  budget: 'KES 35,000',
  deadline: 'Jun 15, 2024',
  client: 'DataVista Analytics',
  owner: 'Mercy Wanjiku',
  category: 'UI/UX Design',
  hasMilestones: true,
}

export const teamProject = {
  ...project,
  title: 'Social Media Content Creation',
  id: '#ZPR8492',
  started: 'Apr 28, 2024',
  budget: 'KES 25,000',
  deadline: 'May 28, 2024',
  hasTeam: true,
  hasMilestones: true,
}

export const teamMembers = [
  { name: 'Mercy Wanjiku', role: 'Project Owner', tasks: 8, workload: '75%', availability: 'Available', tone: 'owner' },
  { name: 'Brian Mwangi', role: 'Designer', tasks: 6, workload: '60%', availability: 'Available', tone: 'designer' },
  { name: 'Shadrach Otieno', role: 'Content Writer', tasks: 7, workload: '85%', availability: 'Busy', tone: 'writer' },
  { name: "Lydia Achieng'", role: 'Social Media Manager', tasks: 9, workload: '90%', availability: 'Busy', tone: 'manager' },
  { name: 'Kevin Mutua', role: 'Video Editor', tasks: 4, workload: '45%', availability: 'Available', tone: 'video' },
  { name: 'Grace Njori', role: 'Data Analyst', tasks: 3, workload: '30%', availability: 'Available', tone: 'analyst' },
]

export const teamBoardColumns = [
  {
    title: 'To Do',
    tone: 'todo',
    tasks: [
      ['Research trending topics', 'Identify trending topics relevant to our target audience.', 'Low'],
      ['Create content calendar', 'Plan content for May across all platforms.', 'Medium'],
      ['Write captions', 'Write engaging captions for upcoming posts.', 'Low'],
      ['Gather visual assets', 'Collect photos, graphics and brand assets.', 'Low'],
    ],
  },
  {
    title: 'In Progress',
    tone: 'progress',
    tasks: [
      ['Design post templates', 'Create 5 reusable templates for Instagram posts.', 'High'],
      ['Create 5 Instagram posts', 'Design and prepare 5 Instagram feed posts.', 'High'],
      ['Create 3 LinkedIn posts', 'Design posts tailored for LinkedIn audience.', 'Medium'],
      ['Create Instagram Stories', 'Design 4 Instagram Story slides.', 'Medium'],
      ['Prepare reel script', 'Write script for 1 Instagram Reel.', 'Low'],
    ],
  },
  {
    title: 'Review',
    tone: 'review',
    tasks: [
      ['Review Instagram posts', 'Review designs and copy for Instagram posts.', 'Medium'],
      ['Review LinkedIn posts', 'Review content for LinkedIn posts.', 'Medium'],
      ['Review captions', 'Review captions for tone, clarity and engagement.', 'Low'],
    ],
  },
  {
    title: 'Done',
    tone: 'done',
    tasks: [
      ['Kickoff meeting', 'Project kickoff and alignment with team.', 'Apr 28'],
      ['Brand guidelines review', 'Reviewed brand guidelines and key messaging.', 'Apr 29'],
      ['Competitor analysis', 'Analyzed top 5 competitors on social media.', 'Apr 30'],
      ['Platform audit', 'Completed audit of existing social media platforms.', 'May 1'],
      ['Content strategy', 'Defined content pillars and strategy.', 'May 2'],
    ],
  },
  {
    title: 'Blocked',
    tone: 'blocked',
    tasks: [
      ['Waiting for brand assets', 'Waiting for updated logo and brand images.', 'High'],
      ['Access to analytics', 'Need admin access to Instagram and LinkedIn analytics.', 'Medium'],
    ],
  },
]

export const teamSprints = [
  { title: 'Planning & Research', status: 'Completed', dates: 'Apr 28 - May 4, 2024', progress: '100%', tasks: '4 / 4', points: '20 / 20', goal: 'Lay the foundation by researching the audience, platforms and content direction.' },
  { title: 'Content Production', status: 'In Progress', dates: 'May 5 - May 19, 2024', progress: '64%', tasks: '6 / 10', points: '32 / 50', goal: 'Create and produce content across platforms based on the content plan.' },
  { title: 'Review & Optimization', status: 'Upcoming', dates: 'May 20 - May 24, 2024', progress: '0%', tasks: '0 / 5', points: '0 / 20', goal: 'Review content, optimize for engagement and incorporate feedback.' },
  { title: 'Delivery & Handover', status: 'Upcoming', dates: 'May 25 - May 28, 2024', progress: '0%', tasks: '0 / 3', points: '0 / 10', goal: 'Finalize content, deliver assets and hand over project.' },
]

export const teamMilestones = [
  { id: 1, title: 'Project Started', detail: 'Project kickoff and alignment with team.', status: 'Completed', due: 'Apr 28, 2024', owner: 'Mercy W.', progress: '100%' },
  { id: 2, title: 'Content Strategy', detail: 'Define content pillars, audience personas and strategy.', status: 'Completed', due: 'May 2, 2024', owner: 'Brian M.', progress: '100%' },
  { id: 3, title: 'Content Production', detail: 'Create and design content across platforms.', status: 'In Progress', due: 'May 19, 2024', owner: 'Shadrach O.', progress: '64%' },
  { id: 4, title: 'Content Review', detail: 'Review and approve content for publishing.', status: 'Upcoming', due: 'May 24, 2024', owner: 'Lydia A.', progress: '0%' },
  { id: 5, title: 'Project Delivery', detail: 'Deliver final assets and campaign report.', status: 'Upcoming', due: 'May 28, 2024', owner: 'Brian M.', progress: '0%' },
]

export const milestoneItems = [
  { id: 1, title: 'Wireframes & Information Architecture', description: 'Low-fidelity wireframes and sitemap for the dashboard structure.', deliverables: 'Sitemap, Wireframes, IA Document', due: 'May 10, 2024', amount: 'KES 7,000', status: 'Completed', tone: 'complete', icon: FiCheck },
  { id: 2, title: 'Dashboard UI Design', description: 'High-fidelity UI for all key screens and interactions.', deliverables: 'UI Screens, Design System, Style Guide', due: 'May 25, 2024', amount: 'KES 15,000', status: 'In Progress', tone: 'progress', icon: FiGrid },
  { id: 3, title: 'Prototype & Handoff', description: 'Interactive prototype and design handoff for development.', deliverables: 'Interactive Prototype, Handoff Package', due: 'Jun 5, 2024', amount: 'KES 15,000', status: 'Pending', tone: 'pending', icon: FiUploadCloud },
  { id: 4, title: 'Implementation Support', description: 'Support during development and integration.', deliverables: 'QA Support, Feedback Logs', due: 'Jun 10, 2024', amount: 'KES 10,000', status: 'Pending', tone: 'pending', icon: FiFileText },
  { id: 5, title: 'Project Delivery', description: 'Final review, documentation and project sign-off.', deliverables: 'Final Documentation, Sign-off, Source Files', due: 'Jun 15, 2024', amount: 'KES 8,000', status: 'Pending', tone: 'pending', icon: FiSend },
]

export const timeline = [
  { label: 'Project Posted', date: 'Apr 28, 2024', complete: true },
  { label: 'Proposal Accepted', date: 'Apr 29, 2024', complete: true },
  { label: 'Work in Progress', date: 'Apr 30, 2024', complete: true },
  { label: 'Work Submitted', date: 'May 12, 2024', current: true },
  { label: 'Completed', date: '-', complete: false },
]

export const railFiles = [
  { name: 'Brand Guidelines.pdf', meta: 'PDF · 1.2 MB', date: 'Apr 28, 2024', tone: 'pdf' },
  { name: 'Content Calendar.xlsx', meta: 'XLSX · 18 KB', date: 'Apr 28, 2024', tone: 'sheet' },
  { name: 'Asset Pack.zip', meta: 'ZIP · 24.5 MB', date: 'Apr 28, 2024', tone: 'zip' },
]

export const workspaceFiles = [
  { name: 'Client Brief & Resources', type: 'Folder', owner: 'Mercy Wanjiku', updated: 'May 12, 2024', size: '-', icon: FiFolder, tone: 'folder' },
  { name: 'Content Assets', type: 'Folder', owner: 'Brian Mwangi', updated: 'May 10, 2024', size: '-', icon: FiFolder, tone: 'folder' },
  { name: 'Brand Guidelines.pdf', type: 'PDF', owner: 'Mercy Wanjiku', updated: 'May 1, 2024', size: '1.2 MB', icon: FiFileText, tone: 'pdf' },
  { name: 'Content Calendar.xlsx', type: 'Spreadsheet', owner: 'Brian Mwangi', updated: 'May 5, 2024', size: '18 KB', icon: FiFileText, tone: 'sheet' },
  { name: 'Campaign Strategy.pptx', type: 'Presentation', owner: 'Mercy Wanjiku', updated: 'May 6, 2024', size: '2.4 MB', icon: FiFileText, tone: 'deck' },
  { name: 'Audience Research.docx', type: 'Document', owner: 'Brian Mwangi', updated: 'May 3, 2024', size: '256 KB', icon: FiFileText, tone: 'doc' },
  { name: 'Leads Tracker Template.xlsx', type: 'Spreadsheet', owner: 'Mercy Wanjiku', updated: 'Apr 30, 2024', size: '22 KB', icon: FiFileText, tone: 'sheet' },
  { name: 'Influencer Outreach Form', type: 'Form', owner: 'Brian Mwangi', updated: 'Apr 30, 2024', size: '-', icon: FiFileText, tone: 'form' },
  { name: 'Competitor Analysis.pdf', type: 'PDF', owner: 'Brian Mwangi', updated: 'Apr 29, 2024', size: '1.8 MB', icon: FiFileText, tone: 'pdf' },
  { name: 'Content Production Timeline', type: 'Gantt Chart', owner: 'Mercy Wanjiku', updated: 'Apr 29, 2024', size: '-', icon: FiFileText, tone: 'timeline' },
]

export const submittedFiles = [
  { name: 'Instagram Posts (May 1-7).zip', size: '24.4 MB' },
  { name: 'LinkedIn Posts (May 1-7).zip', size: '18.7 MB' },
  { name: 'Facebook Posts (May 1-7).zip', size: '22.1 MB' },
]

export const messages = [
  { author: 'Mercy Wanjiku', date: 'Apr 28, 10:15 AM', text: "Hi Brian, welcome to the project! I've attached the brand guidelines and content calendar for this month.", files: railFiles.slice(0, 2), mine: false },
  { author: 'Brian Mwangi', date: 'Apr 28, 11:02 AM', text: "Thanks Mercy! I've reviewed the files and will start working on the first set of posts.", mine: true },
  { author: 'Mercy Wanjiku', date: 'Apr 28, 11:05 AM', text: 'Great! Looking forward to the update.', mine: false },
  { author: 'Mercy Wanjiku', date: 'May 12, 4:32 PM', text: 'Just a quick reminder to submit the content by May 7th.', mine: false },
  { author: 'Brian Mwangi', date: 'May 12, 4:35 PM', text: "Noted! I'll submit the work shortly.", mine: true },
]

export function resolveProjectById(projectId) {
  if (projectId === 'team-social-media-content-creation') {
    return teamProject
  }

  if (projectId === 'datavista-dashboard-redesign') {
    return milestoneProject
  }

  return project
}
