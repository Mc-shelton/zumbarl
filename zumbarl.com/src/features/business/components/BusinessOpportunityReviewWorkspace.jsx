import { useState } from 'react'
import {
  FiBarChart2,
  FiCalendar,
  FiCheckCircle,
  FiCreditCard,
  FiDownload,
  FiDollarSign,
  FiEye,
  FiFileText,
  FiFilter,
  FiFolder,
  FiHeart,
  FiImage,
  FiLock,
  FiPhone,
  FiMessageSquare,
  FiMoreVertical,
  FiMapPin,
  FiPlus,
  FiSave,
  FiSearch,
  FiSend,
  FiSettings,
  FiSmile,
  FiStar,
  FiUpload,
  FiTrendingUp,
  FiUsers,
  FiVideo,
  FiX,
} from 'react-icons/fi'
import { Button, MetricCard, PersonRow, StatusPill } from '../../../components/ui'

const REVIEW_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'applications', label: 'Applications', count: 18 },
  { id: 'deliverables', label: 'Work & Deliverables', count: 6 },
  { id: 'payments', label: 'Payments', count: 4 },
  { id: 'performance', label: 'Performance' },
  { id: 'messages', label: 'Messages', count: 8 },
  { id: 'activity', label: 'Activity' },
]

const PLATFORM_BUDGETS = [
  { label: 'Instagram', value: 'KES 10,000', share: '40%' },
  { label: 'TikTok', value: 'KES 7,500', share: '30%' },
  { label: 'YouTube', value: 'KES 5,000', share: '20%' },
  { label: 'X (Twitter)', value: 'KES 2,500', share: '10%' },
]

const DELIVERABLES = [
  { label: 'Instagram Feed Post', value: 2 },
  { label: 'Instagram Story', value: 3 },
  { label: 'TikTok Video', value: 1 },
  { label: 'YouTube Short', value: 1 },
  { label: 'X (Twitter) Tweet', value: 0 },
]

const REVIEW_IMAGE = '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp'

const APPLICATION_FILTERS = [
  { id: 'all', label: 'All', count: 18 },
  { id: 'new', label: 'New', count: 5 },
  { id: 'shortlisted', label: 'Shortlisted', count: 6 },
  { id: 'accepted', label: 'Accepted', count: 3 },
  { id: 'rejected', label: 'Rejected', count: 4 },
]

const APPLICATION_ROWS = [
  {
    id: 'wanjiru-m',
    avatar: '/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp',
    creator: 'Wanjiru M.',
    handle: '@wanjiru_creates',
    platform: 'Instagram',
    followers: '24.6K',
    engagementRate: '5.8%',
    submitted: 'May 20, 2025',
    submittedAgo: '2 hours ago',
    status: 'New',
    tone: 'blue',
  },
  {
    id: 'kevin-creator',
    avatar: '/assets/index/business_page_images/optimized/bruno-ngarukiye-IzEcrYJ1G34-unsplash.webp',
    creator: 'Kevin The Creator',
    handle: '@kevinthego',
    platform: 'TikTok',
    followers: '18.3K',
    engagementRate: '6.2%',
    submitted: 'May 20, 2025',
    submittedAgo: '5 hours ago',
    status: 'New',
    tone: 'blue',
  },
  {
    id: 'study-with-lynn',
    avatar: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
    creator: 'Study With Lynn',
    handle: '@studywithlynn',
    platform: 'Instagram',
    followers: '31.2K',
    engagementRate: '4.9%',
    submitted: 'May 19, 2025',
    submittedAgo: '1 day ago',
    status: 'Shortlisted',
    tone: 'orange',
  },
  {
    id: 'brian-otieno',
    avatar: '/assets/index/business_page_images/optimized/omar-lopez-1qfy-jDc_jo-unsplash.webp',
    creator: 'Brian Otieno',
    handle: '@brian.creates',
    platform: 'TikTok',
    followers: '12.7K',
    engagementRate: '7.1%',
    submitted: 'May 19, 2025',
    submittedAgo: '1 day ago',
    status: 'Accepted',
    tone: 'green',
  },
  {
    id: 'campus-talks',
    avatar: '/assets/index/business_page_images/optimized/annie-spratt-hCb3lIB8L8E-unsplash.webp',
    creator: 'Campus Talks KE',
    handle: '@campustalks.ke',
    platform: 'YouTube',
    followers: '22.1K',
    engagementRate: '5.3%',
    submitted: 'May 18, 2025',
    submittedAgo: '2 days ago',
    status: 'Rejected',
    tone: 'red',
  },
  {
    id: 'learn-with-paul',
    avatar: '/assets/index/business_page_images/optimized/justin-buisson-vIluu0IH6Ps-unsplash.webp',
    creator: 'Learn With Paul',
    handle: '@learnwithpaul',
    platform: 'Instagram',
    followers: '15.4K',
    engagementRate: '4.1%',
    submitted: 'May 18, 2025',
    submittedAgo: '2 days ago',
    status: 'New',
    tone: 'blue',
  },
  {
    id: 'mindset-mentor',
    avatar: '/assets/index/business_page_images/optimized/0xk-y5n-nhkRd7U-unsplash.webp',
    creator: 'Mindset Mentor',
    handle: '@mindset.mentor',
    platform: 'TikTok',
    followers: '9.8K',
    engagementRate: '6.7%',
    submitted: 'May 17, 2025',
    submittedAgo: '3 days ago',
    status: 'Shortlisted',
    tone: 'orange',
  },
]

const SHORTLISTED_APPLICATION_ROWS = [
  {
    id: 'shortlisted-lynn',
    avatar: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
    creator: 'Study With Lynn',
    handle: '@studywithlynn',
    platform: 'Instagram',
    followers: '31.2K',
    engagementRate: '4.9%',
    shortlistedOn: 'May 20, 2025',
    shortlistedTime: '10:30 AM',
    submitted: 'May 19, 2025',
    submittedAgo: '1 day ago',
    status: 'Shortlisted',
    tone: 'orange',
  },
  {
    id: 'shortlisted-mindset',
    avatar: '/assets/index/business_page_images/optimized/0xk-y5n-nhkRd7U-unsplash.webp',
    creator: 'Mindset Mentor',
    handle: '@mindset.mentor',
    platform: 'TikTok',
    followers: '9.8K',
    engagementRate: '6.7%',
    shortlistedOn: 'May 19, 2025',
    shortlistedTime: '2:15 PM',
    submitted: 'May 17, 2025',
    submittedAgo: '3 days ago',
    status: 'Shortlisted',
    tone: 'orange',
  },
  {
    id: 'shortlisted-kevin',
    avatar: '/assets/index/business_page_images/optimized/bruno-ngarukiye-IzEcrYJ1G34-unsplash.webp',
    creator: 'Kevin The Creator',
    handle: '@kevinthego',
    platform: 'TikTok',
    followers: '18.3K',
    engagementRate: '6.2%',
    shortlistedOn: 'May 20, 2025',
    shortlistedTime: '9:45 AM',
    submitted: 'May 20, 2025',
    submittedAgo: '5 hours ago',
    status: 'New',
    tone: 'blue',
  },
  {
    id: 'shortlisted-wanjiru',
    avatar: '/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp',
    creator: 'Wanjiru M.',
    handle: '@wanjiru_creates',
    platform: 'Instagram',
    followers: '24.6K',
    engagementRate: '5.8%',
    shortlistedOn: 'May 20, 2025',
    shortlistedTime: '9:30 AM',
    submitted: 'May 20, 2025',
    submittedAgo: '2 hours ago',
    status: 'New',
    tone: 'blue',
  },
  {
    id: 'shortlisted-brian',
    avatar: '/assets/index/business_page_images/optimized/omar-lopez-1qfy-jDc_jo-unsplash.webp',
    creator: 'Brian Otieno',
    handle: '@brian.creates',
    platform: 'TikTok',
    followers: '12.7K',
    engagementRate: '7.1%',
    shortlistedOn: 'May 19, 2025',
    shortlistedTime: '11:20 AM',
    submitted: 'May 19, 2025',
    submittedAgo: '1 day ago',
    status: 'Shortlisted',
    tone: 'orange',
  },
  {
    id: 'shortlisted-campus',
    avatar: '/assets/index/business_page_images/optimized/annie-spratt-hCb3lIB8L8E-unsplash.webp',
    creator: 'Campus Talks KE',
    handle: '@campustalks.ke',
    platform: 'YouTube',
    followers: '22.1K',
    engagementRate: '5.3%',
    shortlistedOn: 'May 18, 2025',
    shortlistedTime: '4:40 PM',
    submitted: 'May 18, 2025',
    submittedAgo: '2 days ago',
    status: 'Rejected',
    tone: 'red',
  },
]

const DELIVERABLE_FILTERS = [
  { id: 'deliverables', label: 'Deliverables', count: 6 },
  { id: 'submitted-work', label: 'Submitted Work', count: 6 },
  { id: 'files', label: 'Files', count: 12 },
  { id: 'messages', label: 'Messages', count: 8 },
]

const BUSINESS_DELIVERABLE_FILES = [
  { name: 'Zetech_Campaign_Designs.zip', type: 'ZIP', owner: 'Wanjiru M.', updated: 'May 20, 2025', size: '38.4 MB', tone: 'zip' },
  { name: 'Landing_Page_Source.zip', type: 'ZIP', owner: 'Kevin The Creator', updated: 'May 20, 2025', size: '42.8 MB', tone: 'zip' },
  { name: 'Campus_Market_Report.pdf', type: 'PDF', owner: 'Study With Lynn', updated: 'May 19, 2025', size: '2.1 MB', tone: 'pdf' },
  { name: 'Instagram_Insights_Before_After.pdf', type: 'PDF', owner: 'Brian Otieno', updated: 'May 19, 2025', size: '6.8 MB', tone: 'pdf' },
  { name: 'Activation_Checkin_Proof.zip', type: 'ZIP', owner: 'Campus Talks KE', updated: 'May 18, 2025', size: '14.2 MB', tone: 'zip' },
  { name: 'Launch_Workflow_Submission.zip', type: 'ZIP', owner: 'Grace Wanjiku', updated: 'May 18, 2025', size: '31.6 MB', tone: 'zip' },
]

const BUSINESS_DELIVERABLE_MESSAGES = [
  {
    author: 'Wanjiru M.',
    date: 'May 20, 2:14 PM',
    text: 'I uploaded the final exports and editable source files. Please review the asset pack and let me know if any format is missing.',
    files: BUSINESS_DELIVERABLE_FILES.slice(0, 1),
    mine: false,
  },
  {
    author: 'Brian Mwangi',
    date: 'May 20, 2:22 PM',
    text: 'Thanks Wanjiru. I am checking the source files and originality status now.',
    mine: true,
  },
  {
    author: 'Kevin The Creator',
    date: 'May 20, 4:40 PM',
    text: 'The GitHub repo, deployment URL and Loom walkthrough are ready for the landing page build.',
    files: BUSINESS_DELIVERABLE_FILES.slice(1, 2),
    mine: false,
  },
  {
    author: 'Zumbarl Support',
    date: 'May 20, 5:05 PM',
    text: 'Reminder: approve only after the evidence matches the brief. Scope additions after acceptance should be handled as a new requirement.',
    mine: false,
  },
]

const DELIVERABLE_ROWS = [
  {
    id: 'file-asset-pack',
    title: 'Campaign Design Asset Pack',
    required: true,
    type: 'Type 1 - File Asset',
    description: 'Final poster, source files and editable brand templates.',
    dueDate: 'May 21, 2025',
    dueMeta: 'Overdue',
    submissions: '4 / 6',
    status: 'In Review',
    tone: 'blue',
    icon: 'instagram',
  },
  {
    id: 'code-development',
    title: 'Landing Page Build',
    required: true,
    type: 'Type 2 - Code & Development',
    description: 'GitHub repository, live URL and Loom walkthrough.',
    dueDate: 'May 22, 2025',
    dueMeta: '2 days left',
    submissions: '2 / 4',
    status: 'In Review',
    tone: 'blue',
    icon: 'x',
  },
  {
    id: 'document-report',
    title: 'Campus Market Research Report',
    required: true,
    type: 'Type 3 - Document',
    description: 'Google Docs report with edit history and plagiarism check.',
    dueDate: 'May 23, 2025',
    dueMeta: '3 days left',
    submissions: '3 / 5',
    status: 'Submitted',
    tone: 'green',
    icon: 'youtube',
  },
  {
    id: 'stats-metrics',
    title: 'Instagram Growth Metrics',
    required: true,
    type: 'Type 4 - Stats & Metrics',
    description: 'Before and after analytics screenshots with API verification.',
    dueDate: 'May 24, 2025',
    dueMeta: '4 days left',
    submissions: '5 / 8',
    status: 'In Progress',
    tone: 'orange',
    icon: 'instagram',
  },
  {
    id: 'proof-based',
    title: 'Campus Activation Proof',
    required: true,
    type: 'Type 5 - Proof-Based',
    description: 'Geo-tagged check-in, photo evidence and recipient confirmation.',
    dueDate: 'May 25, 2025',
    dueMeta: '5 days left',
    submissions: '6 / 10',
    status: 'In Progress',
    tone: 'orange',
    icon: 'tiktok',
  },
  {
    id: 'hybrid-launch',
    title: 'Hybrid Launch Workflow',
    required: true,
    type: 'Type 6 - Hybrid',
    description: 'Design assets, proof of posting and engagement analytics.',
    dueDate: 'May 26, 2025',
    dueMeta: '6 days left',
    submissions: '3 / 3',
    status: 'Not Started',
    tone: 'gray',
    icon: 'instagram',
  },
]

const SUBMITTED_WORK_ROWS = [
  {
    id: 'type-1-file-asset',
    creator: 'Wanjiru M.',
    handle: '@wanjiru_designs',
    avatar: '/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp',
    platform: 'Canva',
    frameworkType: 'Type 1 - File Asset',
    deliverable: 'Campaign Design Asset Pack',
    submittedDate: 'May 20, 2025',
    submittedAgo: '2 hours ago',
    preview: '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp',
    file: 'Zetech_Campaign_Designs.zip',
    size: '38.4 MB',
    extraFiles: '+6',
    filesSubmitted: '7 files',
    status: 'In Review',
    tone: 'blue',
    summaryItems: [
      { label: 'Upload Method', value: 'Direct Upload', meta: 'Zumbarl files' },
      { label: 'Accepted Formats', value: 'PNG, PDF, SVG', meta: 'Source included' },
      { label: 'Revision Limit', value: '2 rounds', meta: 'Brief defined' },
      { label: 'Originality', value: 'Clear', meta: 'Reverse image check' },
    ],
    result: { label: 'Result', value: '7 files', meta: 'Ready for review', status: 'Assets Received', percent: 'All required files submitted' },
    evidenceTitle: 'Files Submitted',
    evidenceDescription: 'Final exports and editable source files uploaded to Zumbarl.',
    evidence: [
      { title: 'Final Poster Export', image: '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp', stat: 'PNG + PDF', label: 'Final artwork', meta: 'No watermark detected' },
      { title: 'Editable Source Pack', image: '/assets/index/business_page_images/optimized/0xk-y5n-nhkRd7U-unsplash.webp', stat: 'Figma + SVG', label: 'Source files', meta: 'Ownership ready on escrow release' },
    ],
    verification: 'Company review, reverse image originality check and revision cycle tracking completed.',
    paymentModel: 'Single escrow release',
    paymentStatus: 'Ready to Release',
  },
  {
    id: 'type-2-code-dev',
    creator: 'Kevin The Creator',
    handle: '@kevinbuilds',
    avatar: '/assets/index/business_page_images/optimized/bruno-ngarukiye-IzEcrYJ1G34-unsplash.webp',
    platform: 'GitHub',
    frameworkType: 'Type 2 - Code & Development',
    deliverable: 'Landing Page Build',
    submittedDate: 'May 20, 2025',
    submittedAgo: '5 hours ago',
    preview: '/assets/index/business_page_images/optimized/omar-lopez-1qfy-jDc_jo-unsplash.webp',
    file: 'github.com/kevinbuilds/zetech-landing',
    size: 'Live URL + repo',
    extraFiles: '+1',
    filesSubmitted: 'Repo, live URL, Loom',
    status: 'Submitted',
    tone: 'green',
    summaryItems: [
      { label: 'Primary Method', value: 'GitHub Repo', meta: 'Commit history visible' },
      { label: 'Secondary Method', value: 'Live URL', meta: 'Deploy preview' },
      { label: 'Walkthrough', value: 'Loom video', meta: '5 min demo' },
      { label: 'Checklist', value: '9 / 10', meta: 'Brief adherence' },
    ],
    result: { label: 'Result', value: 'Live', meta: 'Deploy verified', status: 'Runnable', percent: '9 of 10 checks passed' },
    evidenceTitle: 'Technical Evidence',
    evidenceDescription: 'Repository, deployment and walkthrough evidence for a runnable submission.',
    evidence: [
      { title: 'Repository Review', image: '/assets/index/business_page_images/optimized/omar-lopez-1qfy-jDc_jo-unsplash.webp', stat: '24 commits', label: 'GitHub history', meta: 'Student-authored commits' },
      { title: 'Live Demo', image: '/assets/index/business_page_images/optimized/justin-buisson-vIluu0IH6Ps-unsplash.webp', stat: '200 OK', label: 'Deploy URL', meta: 'Homepage and lead form tested' },
    ],
    verification: 'Auto checklist, commit history and live demo verification completed.',
    paymentModel: 'Milestone release',
    paymentStatus: 'Code Review Pending',
  },
  {
    id: 'type-3-document',
    creator: 'Study With Lynn',
    handle: '@studywithlynn',
    avatar: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
    platform: 'Google Docs',
    frameworkType: 'Type 3 - Document',
    deliverable: 'Campus Market Research Report',
    submittedDate: 'May 19, 2025',
    submittedAgo: '1 day ago',
    preview: '/assets/index/business_page_images/optimized/annie-spratt-hCb3lIB8L8E-unsplash.webp',
    file: 'Campus_Market_Report.gdoc',
    size: '2,480 words',
    extraFiles: '+1',
    filesSubmitted: 'Google Doc + PDF',
    status: 'In Review',
    tone: 'blue',
    summaryItems: [
      { label: 'Preferred Method', value: 'Google Docs', meta: 'Share link active' },
      { label: 'Word Count', value: '2,480', meta: 'Within brief range' },
      { label: 'Similarity Score', value: '11%', meta: 'Below 20% threshold' },
      { label: 'Edit History', value: 'Verified', meta: 'Authorship visible' },
    ],
    result: { label: 'Result', value: '11%', meta: 'Similarity score', status: 'Manual Review Clear', percent: 'AI indicator shown, not blocked' },
    evidenceTitle: 'Document Evidence',
    evidenceDescription: 'Writing submission with plagiarism, AI indicator and edit-history checks.',
    evidence: [
      { title: 'Document Preview', image: '/assets/index/business_page_images/optimized/annie-spratt-hCb3lIB8L8E-unsplash.webp', stat: '2,480', label: 'Words', meta: 'Within requested range' },
      { title: 'Originality Report', image: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp', stat: '11%', label: 'Similarity', meta: 'Manual review not required' },
    ],
    verification: 'Plagiarism check, AI indicator and Google Docs edit history reviewed.',
    paymentModel: 'Approval release',
    paymentStatus: 'Ready to Release',
  },
  {
    id: 'type-4-stats',
    creator: 'Brian Otieno',
    handle: '@brian.growth',
    avatar: '/assets/index/business_page_images/optimized/omar-lopez-1qfy-jDc_jo-unsplash.webp',
    platform: 'Instagram',
    frameworkType: 'Type 4 - Stats & Metrics',
    deliverable: 'Instagram Growth Metrics',
    submittedDate: 'May 19, 2025',
    submittedAgo: '1 day ago',
    preview: '/assets/index/business_page_images/optimized/justin-buisson-vIluu0IH6Ps-unsplash.webp',
    file: 'Instagram_Insights_Before_After.pdf',
    size: '4 screenshots',
    extraFiles: '+2',
    filesSubmitted: 'Before/after screenshots',
    status: 'Changes Requested',
    tone: 'orange',
    summaryItems: [
      { label: 'Metric Target', value: '+10,000', meta: 'Followers' },
      { label: 'Measurement Window', value: 'May 1 - May 15', meta: '2025' },
      { label: 'Baseline', value: '24,600', meta: 'Followers' },
      { label: 'How Measured', value: 'Instagram Insights', meta: 'API available' },
    ],
    result: { label: 'Result', value: '+10,250', meta: 'Followers', status: 'Target Achieved', percent: '102.5% of target' },
    evidenceTitle: 'Analytics Evidence',
    evidenceDescription: 'Before and after platform analytics screenshots with API verification.',
    evidence: [
      { title: 'Before (Apr 30, 2025)', image: '/assets/index/business_page_images/optimized/justin-buisson-vIluu0IH6Ps-unsplash.webp', stat: '24,600', label: 'Followers', meta: 'Baseline screenshot' },
      { title: 'After (May 15, 2025)', image: '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp', stat: '34,850', label: 'Followers', meta: 'API verified' },
    ],
    verification: 'Platform analytics screenshots and Instagram Insights API verification completed.',
    paymentModel: '50% content, 50% metrics',
    paymentStatus: 'Metric Payment Pending',
  },
  {
    id: 'type-5-proof',
    creator: 'Campus Talks KE',
    handle: '@campusactivators',
    avatar: '/assets/index/business_page_images/optimized/annie-spratt-hCb3lIB8L8E-unsplash.webp',
    platform: 'In-App Proof',
    frameworkType: 'Type 5 - Proof-Based',
    deliverable: 'Campus Activation Proof',
    submittedDate: 'May 18, 2025',
    submittedAgo: '2 days ago',
    preview: '/assets/index/business_page_images/optimized/0xk-y5n-nhkRd7U-unsplash.webp',
    file: 'Activation_Checkin_Proof',
    size: 'GPS + photos',
    extraFiles: '+4',
    filesSubmitted: 'GPS log, EXIF photos, confirmation',
    status: 'Approved',
    tone: 'green',
    summaryItems: [
      { label: 'GPS Check-in', value: '143m', meta: 'Within 200m' },
      { label: 'Photo Proof', value: 'EXIF valid', meta: 'Captured in-app' },
      { label: 'WhatsApp Confirm', value: 'Received', meta: 'Recipient verified' },
      { label: 'Milestones', value: '3 / 3', meta: 'Sequential stages' },
    ],
    result: { label: 'Result', value: 'Complete', meta: 'All proof accepted', status: 'Verified', percent: 'Safety gates satisfied' },
    evidenceTitle: 'Physical-World Proof',
    evidenceDescription: 'Geo-tagged photos, GPS check-in and recipient confirmation.',
    evidence: [
      { title: 'Geo-tagged Photo', image: '/assets/index/business_page_images/optimized/0xk-y5n-nhkRd7U-unsplash.webp', stat: '143m', label: 'From venue', meta: 'EXIF timestamp valid' },
      { title: 'Recipient Confirmation', image: '/assets/index/business_page_images/optimized/annie-spratt-hCb3lIB8L8E-unsplash.webp', stat: 'Confirmed', label: 'WhatsApp', meta: 'Completion acknowledged' },
    ],
    verification: 'GPS check-in, in-app EXIF photo and recipient confirmation reviewed.',
    paymentModel: 'Sequential milestone release',
    paymentStatus: 'Released',
  },
  {
    id: 'type-6-hybrid',
    creator: 'Grace Wanjiku',
    handle: '@grace.launch',
    avatar: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
    platform: 'Hybrid',
    frameworkType: 'Type 6 - Hybrid',
    deliverable: 'Hybrid Launch Workflow',
    submittedDate: 'May 18, 2025',
    submittedAgo: '2 days ago',
    preview: '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp',
    file: 'Launch_Workflow_Submission',
    size: '3 stages',
    extraFiles: '+5',
    filesSubmitted: 'Assets, post proof, analytics',
    status: 'In Review',
    tone: 'blue',
    summaryItems: [
      { label: 'Stage 1', value: 'Assets', meta: '40% payment' },
      { label: 'Stage 2', value: 'Posting Proof', meta: '30% payment' },
      { label: 'Stage 3', value: 'Analytics', meta: '30% payment' },
      { label: 'Submission Lock', value: 'Passed', meta: 'Sequential approval' },
    ],
    result: { label: 'Result', value: '3 / 3', meta: 'Stages submitted', status: 'Ready for staged review', percent: 'Payment split totals 100%' },
    evidenceTitle: 'Hybrid Evidence',
    evidenceDescription: 'Combined asset upload, proof of posting and engagement analytics.',
    evidence: [
      { title: 'Stage 1 + 2', image: '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp', stat: '70%', label: 'Assets + proof', meta: 'Stages approved in sequence' },
      { title: 'Stage 3', image: '/assets/index/business_page_images/optimized/justin-buisson-vIluu0IH6Ps-unsplash.webp', stat: '30%', label: 'Analytics', meta: 'Awaiting final metric review' },
    ],
    verification: 'Component workflow, staged escrow split and sequential submission lock reviewed.',
    paymentModel: '40% assets, 30% proof, 30% analytics',
    paymentStatus: 'Final Stage Pending',
  },
]

const PAYMENT_METRICS = [
  { label: 'Total Budget', value: 'KES 25,000', meta: '100% of budget', tone: 'blue' },
  { label: 'Total Paid', value: 'KES 12,400', meta: '50% of budget', tone: 'green' },
  { label: 'Pending Payments', value: 'KES 7,600', meta: '30.4% of budget', tone: 'orange' },
  { label: 'Available Balance', value: 'KES 5,000', meta: '19.6% of budget', tone: 'purple' },
]

const PAYMENT_ROWS = [
  {
    id: 'pay-wanjiru',
    creator: 'Wanjiru M.',
    handle: '@wanjiru_creates',
    avatar: '/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp',
    deliverables: '2 Deliverables',
    totalAmount: 'KES 4,000',
    paidAmount: 'KES 4,000',
    status: 'Paid',
    tone: 'green',
    date: 'May 20, 2025',
    dateMeta: 'Paid on May 20, 2025',
  },
  {
    id: 'pay-kevin',
    creator: 'Kevin The Creator',
    handle: '@kevinthego',
    avatar: '/assets/index/business_page_images/optimized/bruno-ngarukiye-IzEcrYJ1G34-unsplash.webp',
    deliverables: '1 Deliverable',
    totalAmount: 'KES 3,000',
    paidAmount: 'KES 3,000',
    status: 'Paid',
    tone: 'green',
    date: 'May 20, 2025',
    dateMeta: 'Paid on May 20, 2025',
  },
  {
    id: 'pay-lynn',
    creator: 'Study With Lynn',
    handle: '@studywithlynn',
    avatar: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
    deliverables: '2 Deliverables',
    totalAmount: 'KES 2,500',
    paidAmount: 'KES 1,250',
    status: 'Partially Paid',
    tone: 'orange',
    date: 'May 27, 2025',
    dateMeta: 'Due in 5 days',
  },
  {
    id: 'pay-brian',
    creator: 'Brian Otieno',
    handle: '@brian.creates',
    avatar: '/assets/index/business_page_images/optimized/omar-lopez-1qfy-jDc_jo-unsplash.webp',
    deliverables: '1 Deliverable',
    totalAmount: 'KES 2,000',
    paidAmount: 'KES 0',
    status: 'Pending',
    tone: 'blue',
    date: 'May 27, 2025',
    dateMeta: 'Due in 5 days',
  },
  {
    id: 'pay-campus-talks',
    creator: 'Campus Talks KE',
    handle: '@campustalks.ke',
    avatar: '/assets/index/business_page_images/optimized/annie-spratt-hCb3lIB8L8E-unsplash.webp',
    deliverables: '1 Deliverable',
    totalAmount: 'KES 1,500',
    paidAmount: 'KES 0',
    status: 'Pending',
    tone: 'blue',
    date: 'May 27, 2025',
    dateMeta: 'Due in 5 days',
  },
  {
    id: 'pay-mindset',
    creator: 'Mindset Mentor',
    handle: '@mindset.mentor',
    avatar: '/assets/index/business_page_images/optimized/0xk-y5n-nhkRd7U-unsplash.webp',
    deliverables: '1 Deliverable',
    totalAmount: 'KES 1,500',
    paidAmount: 'KES 0',
    status: 'Pending',
    tone: 'blue',
    date: 'May 27, 2025',
    dateMeta: 'Due in 5 days',
  },
]

const PERFORMANCE_METRICS = [
  { label: 'Total Reach', value: '124.3K', change: '+ 18.6% vs previous 14 days', tone: 'purple', icon: FiUsers },
  { label: 'Total Impressions', value: '312.7K', change: '+ 22.4% vs previous 14 days', tone: 'green', icon: FiBarChart2 },
  { label: 'Engagements', value: '17.6K', change: '+ 15.2% vs previous 14 days', tone: 'pink', icon: FiHeart },
  { label: 'Engagement Rate', value: '5.6%', change: '+ 8.3% vs previous 14 days', tone: 'blue', icon: FiTrendingUp },
]

const TOP_CREATORS = [
  {
    id: 'creator-kevin',
    creator: 'Kevin The Creator',
    handle: '@kevinthego',
    avatar: '/assets/index/business_page_images/optimized/bruno-ngarukiye-IzEcrYJ1G34-unsplash.webp',
    reach: '28.6K',
    impressions: '72.4K',
    engagements: '4.6K',
    rate: '6.4%',
    performance: 'Excellent',
    tone: 'green',
  },
  {
    id: 'creator-wanjiru',
    creator: 'Wanjiru M.',
    handle: '@wanjiru_creates',
    avatar: '/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp',
    reach: '24.1K',
    impressions: '58.7K',
    engagements: '3.4K',
    rate: '5.8%',
    performance: 'Excellent',
    tone: 'green',
  },
  {
    id: 'creator-lynn',
    creator: 'Study With Lynn',
    handle: '@studywithlynn',
    avatar: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
    reach: '19.8K',
    impressions: '45.2K',
    engagements: '2.2K',
    rate: '4.9%',
    performance: 'Good',
    tone: 'blue',
  },
  {
    id: 'creator-campus',
    creator: 'Campus Talks KE',
    handle: '@campustalks.ke',
    avatar: '/assets/index/business_page_images/optimized/annie-spratt-hCb3lIB8L8E-unsplash.webp',
    reach: '18.3K',
    impressions: '40.6K',
    engagements: '1.8K',
    rate: '4.4%',
    performance: 'Good',
    tone: 'blue',
  },
  {
    id: 'creator-brian',
    creator: 'Brian Otieno',
    handle: '@brian.creates',
    avatar: '/assets/index/business_page_images/optimized/omar-lopez-1qfy-jDc_jo-unsplash.webp',
    reach: '14.6K',
    impressions: '31.8K',
    engagements: '1.2K',
    rate: '3.9%',
    performance: 'Average',
    tone: 'orange',
  },
]

const ACTIVITY_GROUPS = [
  {
    date: 'May 20, 2025',
    items: [
      {
        id: 'activity-payment',
        time: '2:30 PM',
        type: 'Payment made',
        detail: 'Paid KES 3,000 to Kevin The Creator for TikTok Video',
        actor: 'Brian Mwangi',
        role: 'Project Owner',
        avatar: '/assets/index/business_page_images/optimized/omar-lopez-1qfy-jDc_jo-unsplash.webp',
        action: 'Paid',
        tone: 'green',
        icon: FiCheckCircle,
      },
      {
        id: 'activity-work-submitted',
        time: '11:15 AM',
        type: 'Work submitted',
        detail: 'Kevin The Creator submitted TikTok_Video_Final.mp4',
        actor: 'Kevin The Creator',
        role: 'Creator',
        avatar: '/assets/index/business_page_images/optimized/bruno-ngarukiye-IzEcrYJ1G34-unsplash.webp',
        action: 'View',
        tone: 'purple',
        icon: FiUpload,
      },
      {
        id: 'activity-message',
        time: '9:45 AM',
        type: 'Message sent',
        detail: 'Brian Mwangi sent a message to Study With Lynn',
        actor: 'Brian Mwangi',
        role: 'Project Owner',
        avatar: '/assets/index/business_page_images/optimized/omar-lopez-1qfy-jDc_jo-unsplash.webp',
        action: 'View',
        tone: 'orange',
        icon: FiMessageSquare,
      },
    ],
  },
  {
    date: 'May 19, 2025',
    items: [
      {
        id: 'activity-status',
        time: '4:20 PM',
        type: 'Status updated',
        detail: "Campus Talks KE's deliverable status changed to Accepted",
        actor: 'Brian Mwangi',
        role: 'Project Owner',
        avatar: '/assets/index/business_page_images/optimized/omar-lopez-1qfy-jDc_jo-unsplash.webp',
        action: 'Accepted',
        tone: 'pink',
        icon: FiMessageSquare,
      },
      {
        id: 'activity-file',
        time: '1:05 PM',
        type: 'File uploaded',
        detail: 'Study With Lynn uploaded Story_Set_1.zip',
        actor: 'Study With Lynn',
        role: 'Creator',
        avatar: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
        action: 'View',
        tone: 'blue',
        icon: FiFileText,
      },
      {
        id: 'activity-shortlisted',
        time: '10:30 AM',
        type: 'Creator shortlisted',
        detail: 'Mindset Mentor was shortlisted for Instagram Story',
        actor: 'Brian Mwangi',
        role: 'Project Owner',
        avatar: '/assets/index/business_page_images/optimized/omar-lopez-1qfy-jDc_jo-unsplash.webp',
        action: 'View',
        tone: 'purple',
        icon: FiCheckCircle,
      },
    ],
  },
  {
    date: 'May 18, 2025',
    items: [
      {
        id: 'activity-invited',
        time: '3:40 PM',
        type: 'Creator invited',
        detail: 'Brian Otieno was invited to the opportunity',
        actor: 'Brian Mwangi',
        role: 'Project Owner',
        avatar: '/assets/index/business_page_images/optimized/omar-lopez-1qfy-jDc_jo-unsplash.webp',
        tone: 'teal',
        icon: FiUsers,
      },
      {
        id: 'activity-published',
        time: '11:00 AM',
        type: 'Opportunity published',
        detail: 'Level Up Your Skills campaign was published',
        actor: 'Brian Mwangi',
        role: 'Project Owner',
        avatar: '/assets/index/business_page_images/optimized/omar-lopez-1qfy-jDc_jo-unsplash.webp',
        tone: 'purple',
        icon: FiBarChart2,
      },
    ],
  },
  {
    date: 'May 17, 2025',
    items: [
      {
        id: 'activity-settings',
        time: '2:15 PM',
        type: 'Settings updated',
        detail: 'Engagement mode changed to Remote',
        actor: 'Brian Mwangi',
        role: 'Project Owner',
        avatar: '/assets/index/business_page_images/optimized/omar-lopez-1qfy-jDc_jo-unsplash.webp',
        tone: 'gray',
        icon: FiSettings,
      },
    ],
  },
]

function getSkillList(opportunity) {
  return Array.isArray(opportunity?.skills)
    ? opportunity.skills
    : String(opportunity?.skills || '').split(',').map((item) => item.trim()).filter(Boolean)
}

function ReviewField({ label, value }) {
  return (
    <label className="business-review-editor-field">
      <span>{label}</span>
      <input readOnly value={value || ''} />
    </label>
  )
}

function ReviewSelect({ label, value }) {
  return (
    <label className="business-review-editor-field">
      <span>{label}</span>
      <select defaultValue={value || ''}>
        <option>{value || 'Not set'}</option>
      </select>
    </label>
  )
}

function PlatformBadge({ platform }) {
  const label = platform === 'YouTube' ? '▶' : platform === 'TikTok' ? '♪' : '◎'
  const tone = platform.toLowerCase().replace(/\s+/g, '-')

  return <span className={`business-review-platform-badge tone-${tone}`}>{label}</span>
}

function DeliverableIcon({ icon }) {
  if (icon === 'instagram') {
    return <span className="business-review-deliverable-icon tone-instagram"><FiImage aria-hidden="true" /></span>
  }

  if (icon === 'youtube') {
    return <span className="business-review-deliverable-icon tone-youtube">▶</span>
  }

  if (icon === 'tiktok') {
    return <span className="business-review-deliverable-icon tone-tiktok"><FiVideo aria-hidden="true" /></span>
  }

  return <span className="business-review-deliverable-icon tone-x">X</span>
}

function ApplicationReviewModal({ application, initialStep = 'review', onClose }) {
  const [reviewStep, setReviewStep] = useState(initialStep)

  if (!application) return null

  const isScheduling = reviewStep === 'schedule'

  return (
    <div className="business-review-modal-backdrop" role="presentation">
      <section className="business-review-application-modal" role="dialog" aria-modal="true" aria-labelledby="application-review-title">
        <header>
          <div>
            <h2 id="application-review-title">
              {isScheduling ? 'Shortlist & Schedule Interview' : 'Review Application'}
            </h2>
            <p>
              {isScheduling
                ? `You're about to shortlist ${application.creator} and schedule an interview.`
                : "Review the creator's profile, competitiveness and application details."}
            </p>
          </div>
          <button type="button" aria-label="Close application review" onClick={onClose}>
            <FiX aria-hidden="true" />
          </button>
        </header>

        <div className="business-review-application-modal-body">
          <aside className="business-review-application-profile">
            <section className="business-profile-card">
              <div className="business-review-applicant-head">
                <img src={application.avatar} alt={`${application.creator} avatar`} />
                <div>
                  <h3>{application.creator} <StatusPill tone={application.tone}>{application.status}</StatusPill></h3>
                  <p>{application.handle} <PlatformBadge platform={application.platform} /></p>
                </div>
              </div>
              <div className="business-review-applicant-meta">
                <span><FiMapPin aria-hidden="true" /> Nairobi, Kenya</span>
                <span><FiCalendar aria-hidden="true" /> Joined Apr 2023</span>
              </div>
              <p>Education content creator passionate about helping students and young professionals grow their skills and careers.</p>
              <dl className="business-review-applicant-stats">
                <div><dt>{application.followers}</dt><dd>Followers</dd></div>
                <div><dt>{application.engagementRate}</dt><dd>Eng. Rate</dd></div>
                <div><dt>120.3K</dt><dd>Avg. Views</dd></div>
              </dl>
              <div className="business-review-applicant-platforms">
                <h4>Top Platforms</h4>
                <span><PlatformBadge platform="Instagram" />68%</span>
                <span><PlatformBadge platform="TikTok" />22%</span>
                <span><PlatformBadge platform="YouTube" />10%</span>
              </div>
            </section>

            <section className="business-profile-card business-review-applicant-mini-card">
              <header>
                <h3>Jobs Done</h3>
                <span>12</span>
              </header>
              <p>Completed Campaigns</p>
              <Button tone="ghost">View Portfolio</Button>
            </section>

            <section className="business-profile-card business-review-applicant-score">
              <h3>Generally Competitiveness</h3>
              <div>
                <figure><span>72/100</span></figure>
                <p><StatusPill tone="green">High</StatusPill>Strong engagement, quality content and audience match.</p>
              </div>
              <button type="button">See how score is calculated</button>
            </section>
          </aside>

          {isScheduling ? (
            <section className="business-review-schedule-panel">
              <div className="business-review-schedule-notice">
                <FiCheckCircle aria-hidden="true" />
                <p><strong>{application.creator} will be moved to Shortlisted.</strong><span>You can always change this later.</span></p>
              </div>

              <section className="business-review-schedule-section">
                <h3>1. Interview Type</h3>
                <div className="business-review-interview-type-grid">
                  <label className="is-selected">
                    <input type="radio" name="interview-type" defaultChecked />
                    <span><FiVideo aria-hidden="true" /></span>
                    <strong>Video Call</strong>
                    <em>Google Meet or Zoom interview</em>
                  </label>
                  <label>
                    <input type="radio" name="interview-type" />
                    <span><FiPhone aria-hidden="true" /></span>
                    <strong>Audio Call</strong>
                    <em>Phone call interview</em>
                  </label>
                </div>
              </section>

              <section className="business-review-schedule-section">
                <h3>2. Interview Details</h3>
                <div className="business-review-schedule-fields">
                  <label><span>Date</span><select defaultValue="may-22"><option value="may-22">May 22, 2025</option></select></label>
                  <label><span>Time</span><select defaultValue="11"><option value="11">11:00 AM</option></select></label>
                  <label><span>Duration</span><select defaultValue="30"><option value="30">30 mins</option></select></label>
                  <label><span>Time Zone</span><select defaultValue="eat"><option value="eat">EAT (UTC+3)</option></select></label>
                </div>
              </section>

              <section className="business-review-schedule-section">
                <h3>3. Interviewers</h3>
                <div className="business-review-interviewers">
                  <PersonRow avatar="/assets/index/business_page_images/optimized/omar-lopez-1qfy-jDc_jo-unsplash.webp" name="Brian Mwangi" subtitle="Owner" />
                  <PersonRow avatar="/assets/index/business_page_images/optimized/bruno-ngarukiye-IzEcrYJ1G34-unsplash.webp" name="Kevin The Creator" subtitle="Creator Manager" />
                  <button type="button"><FiPlus aria-hidden="true" /> Add interviewer</button>
                </div>
              </section>

              <section className="business-review-schedule-section">
                <h3>4. Meeting Link (Optional)</h3>
                <label className="business-review-radio-row"><input type="radio" name="meeting-link" defaultChecked /> <span><strong>Generate Google Meet link</strong><em>A new Google Meet link will be generated and shared.</em></span></label>
                <label className="business-review-radio-row"><input type="radio" name="meeting-link" /> <span><strong>Add custom meeting link</strong></span></label>
              </section>

              <section className="business-review-schedule-section">
                <h3>5. Add a Note (Optional)</h3>
                <textarea defaultValue="Let's discuss your content ideas, past campaigns and how you plan to deliver results for this campaign." />
              </section>
            </section>
          ) : (
            <section className="business-profile-card business-review-application-form-card">
              <header>
                <div>
                  <h3>Application Form</h3>
                  <p>Submitted on {application.submitted} · {application.submittedAgo}</p>
                </div>
                <StatusPill tone={application.tone}>{application.status}</StatusPill>
              </header>
              <ol>
                <li>
                  <h4>Why are you interested in this opportunity?</h4>
                  <p>I&apos;m passionate about education and believe in the mission of Zetech Power to empower learners with practical skills. This opportunity aligns perfectly with my content and audience.</p>
                </li>
                <li>
                  <h4>How do you plan to promote this campaign?</h4>
                  <p>I will create engaging Instagram Reels and Stories, a TikTok video, and a YouTube Short highlighting the benefits of the course and encouraging sign-ups.</p>
                </li>
                <li>
                  <h4>Which platforms will you use?</h4>
                  <div className="business-review-application-platform-choice">
                    <span><PlatformBadge platform="Instagram" />Instagram</span>
                    <span><PlatformBadge platform="TikTok" />TikTok</span>
                    <span><PlatformBadge platform="YouTube" />YouTube</span>
                  </div>
                </li>
                <li>
                  <h4>Estimated deliverables</h4>
                  <ul>
                    <li>2 Instagram Reels</li>
                    <li>3 Instagram Stories</li>
                    <li>1 TikTok Video</li>
                    <li>1 YouTube Short</li>
                  </ul>
                </li>
                <li>
                  <h4>Any previous experience promoting similar campaigns?</h4>
                  <p>Yes, I&apos;ve worked with eLearn Kenya and CareerHub on similar education campaigns.</p>
                </li>
                <li>
                  <h4>Additional comments (optional)</h4>
                  <p>Excited to be part of this and deliver impactful results!</p>
                </li>
              </ol>
            </section>
          )}
        </div>

        <footer>
          {isScheduling ? (
            <>
              <Button tone="ghost" onClick={onClose}>Cancel</Button>
              <Button tone="ghost" onClick={() => setReviewStep('review')}>Back</Button>
              <Button tone="brand">Shortlist & Schedule Interview</Button>
            </>
          ) : (
            <>
              <Button tone="ghost" onClick={onClose}>Close</Button>
              <Button className="business-review-modal-reject" tone="ghost">Reject</Button>
              <Button className="business-review-modal-shortlist" tone="ghost" onClick={() => setReviewStep('schedule')}>Shortlist</Button>
              <Button tone="brand">Accept</Button>
            </>
          )}
        </footer>
      </section>
    </div>
  )
}

function RequestChangesDialog({ submission, onCancel, onSend }) {
  return (
    <section className="business-review-request-changes-dialog" role="dialog" aria-modal="true" aria-labelledby="request-changes-title">
      <header>
        <div>
          <h3 id="request-changes-title">Request Changes</h3>
          <p>Send feedback to {submission.creator} and request changes to this submission.</p>
        </div>
        <button type="button" aria-label="Close request changes" onClick={onCancel}>
          <FiX aria-hidden="true" />
        </button>
      </header>

      <section className="business-review-request-summary" aria-label="Submission summary">
        <div>
          <PlatformBadge platform={submission.platform} />
          <strong>{submission.deliverable}</strong>
        </div>
        <dl>
          {(submission.summaryItems || []).slice(0, 2).map((item) => (
            <div key={item.label}><dt>{item.label}</dt><dd>{item.value}<span>{item.meta}</span></dd></div>
          ))}
          <div><dt>Submitted on</dt><dd>{submission.submittedDate} · 2:14 PM</dd></div>
          <div><dt>{submission.result?.label || 'Result'}</dt><dd className="is-positive">{submission.result?.value}<span>{submission.result?.meta}</span></dd></div>
        </dl>
      </section>

      <label className="business-review-request-field">
        <span>What needs to be changed?</span>
        <em>Be clear and specific so the creator can improve and resubmit.</em>
        <textarea
          maxLength="1000"
          defaultValue={`Thanks for the submission! Please provide the following:\n\n- Align the resubmission with the agreed ${submission.frameworkType} requirements.\n- Include clearer evidence for ${submission.deliverable}.\n- Make sure all files, links or proof items named in the brief are included.\n- Confirm the evidence is native to the submission method, not recreated manually.`}
        />
        <small>287/1000</small>
      </label>

      <section className="business-review-request-support">
        <h4>Supporting reference (optional)</h4>
        <button type="button">
          <FiUpload aria-hidden="true" />
          <span><strong>Upload file or screenshot</strong><em>PNG, JPG or PDF up to 5MB</em></span>
        </button>
      </section>

      <aside className="business-review-request-reminder">
        <FiMessageSquare aria-hidden="true" />
        <div>
          <strong>Reminder to Creator</strong>
          <span>Please address the requested changes and resubmit within 3 days.</span>
        </div>
      </aside>

      <footer>
        <Button tone="ghost" onClick={onCancel}>Cancel</Button>
        <Button tone="brand" onClick={onSend}>Send Request</Button>
      </footer>
    </section>
  )
}

function RatingStars({ score }) {
  return (
    <span className="business-review-approve-stars" aria-label={`${score} out of 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <FiStar key={index} className={index < score ? 'is-filled' : ''} aria-hidden="true" />
      ))}
    </span>
  )
}

function ApproveReleasePaymentDialog({ submission, onCancel, onApprove }) {
  const ratings = [
    { label: 'Quality of Work', note: 'How well the creator met the requirements and delivered quality results.', score: 5, result: 'Excellent', icon: FiFileText },
    { label: 'Communication', note: 'Responsiveness, clarity and professionalism in communication.', score: 4, result: 'Very Good', icon: FiMessageSquare },
    { label: 'Timeliness', note: 'Adherence to deadlines and submission within the agreed time.', score: 5, result: 'Excellent', icon: FiCalendar },
    { label: 'Initiative & Creativity', note: 'Proactiveness and ability to go beyond basic expectations.', score: 4, result: 'Very Good', icon: FiHeart },
    { label: 'Accuracy of Results', note: 'Accuracy and authenticity of the data and results delivered.', score: 5, result: 'Excellent', icon: FiCheckCircle },
  ]

  return (
    <section className="business-review-approve-dialog" role="dialog" aria-modal="true" aria-labelledby="approve-payment-title">
      <header>
        <div>
          <div className="business-review-submission-breadcrumbs" aria-label="Approval path">
            <span>Projects</span>
            <span>Level Up Your Skills</span>
            <span>Work & Deliverables</span>
            <span>Submitted Work</span>
            <span>Approve & Release Payment</span>
          </div>
          <h3 id="approve-payment-title">
            Approve & Release Payment <StatusPill tone="purple">Campaign</StatusPill>
          </h3>
          <p>Review performance, rate the creator and release payment.</p>
        </div>
        <button type="button" aria-label="Close approve payment" onClick={onCancel}>
          <FiX aria-hidden="true" />
        </button>
      </header>

      <div className="business-review-approve-body">
        <main className="business-review-approve-main">
          <section className="business-profile-card business-review-approve-summary">
            <h4>Submission Summary</h4>
            <dl>
              {(submission.summaryItems || []).map((item) => (
                <div key={item.label}><dt>{item.label}</dt><dd>{item.value}<span>{item.meta}</span></dd></div>
              ))}
              <div><dt>{submission.result?.label || 'Result'}</dt><dd className="is-positive">{submission.result?.value}<span>{submission.result?.meta}</span><StatusPill tone="green">{submission.result?.status}</StatusPill><small>{submission.result?.percent}</small></dd></div>
            </dl>
          </section>

          <section className="business-profile-card business-review-approve-ratings">
            <h4>Rate the Creator on Zumbarl Matrices</h4>
            <p>Your ratings help maintain quality and unlock better opportunities for creators.</p>
            <div>
              {ratings.map((rating) => {
                const Icon = rating.icon
                return (
                  <article key={rating.label}>
                    <span><Icon aria-hidden="true" /></span>
                    <div>
                      <strong>{rating.label}</strong>
                      <em>{rating.note}</em>
                    </div>
                    <RatingStars score={rating.score} />
                    <b>{rating.result}</b>
                  </article>
                )
              })}
            </div>
            <footer>
              <h5>Overall Rating</h5>
              <p>Great job! You rated {submission.creator}.</p>
              <div><strong>4.6 / 5</strong><RatingStars score={5} /><StatusPill tone="green">Excellent</StatusPill></div>
              <label>
                <span>Feedback (Optional)</span>
                <textarea placeholder={`Share feedback with ${submission.creator}. This helps them improve and grow.`} maxLength="500" />
                <em>0/500</em>
              </label>
            </footer>
          </section>

          <aside className="business-review-approve-note">
            <FiMessageSquare aria-hidden="true" />
            <span>By approving, you confirm that the creator has met the deliverable requirements and the results are accurate.</span>
          </aside>
        </main>

        <aside className="business-review-approve-side">
          <section className="business-profile-card business-review-approve-payment-summary">
            <header><h4>Payment Summary</h4><button type="button">Edit</button></header>
            <dl>
              <div><dt>Total Amount</dt><dd>KES 20,000</dd></div>
              <div><dt>Platform Fee (10%)</dt><dd>-KES 2,000</dd></div>
              <div><dt>Total Payout</dt><dd>KES 18,000</dd></div>
            </dl>
          </section>

          <section className="business-profile-card business-review-submission-payment">
            <h4>Payment Model</h4>
            <div className="business-review-payment-split">
              <strong>{submission.paymentModel || 'Payment model agreed'}</strong>
              <div><span className="is-paid"><FiCheckCircle aria-hidden="true" /></span><span className="is-pending"><FiCheckCircle aria-hidden="true" /></span></div>
              <dl>
                <div><dt>Content Delivery</dt><dd>50%</dd><span>Paid on submission</span><StatusPill tone="green">Paid</StatusPill></div>
                <div><dt>Verification</dt><dd>50%</dd><span>Paid on approval</span><StatusPill tone="green">{submission.paymentStatus || 'Ready to Release'}</StatusPill></div>
              </dl>
            </div>
          </section>

          <section className="business-profile-card business-review-approve-method">
            <header><h4>Payment Method</h4><button type="button">Edit</button></header>
            <div>
              <FiCreditCard aria-hidden="true" />
              <span><strong>Bank Transfer</strong><em>Equity Bank **** 1234</em></span>
            </div>
          </section>

          <section className="business-profile-card business-review-approve-confirm">
            <h4>You are about to</h4>
            <ul>
              <li><FiCheckCircle aria-hidden="true" /> Approve the submission</li>
              <li><FiCheckCircle aria-hidden="true" /> Release the remaining payment (KES 18,000) to the creator</li>
              <li><FiCheckCircle aria-hidden="true" /> Submit your ratings and feedback</li>
            </ul>
          </section>

          <Button className="business-review-approve-release" tone="brand" onClick={onApprove}>
            <FiLock aria-hidden="true" />
            Approve & Release Payment
          </Button>
          <p className="business-review-approve-warning">Once approved, payment will be released immediately and cannot be reversed.</p>
        </aside>
      </div>
    </section>
  )
}

function AddDeliverableModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="business-review-modal-backdrop" role="presentation">
      <section className="business-review-add-deliverable-modal" role="dialog" aria-modal="true" aria-labelledby="add-deliverable-title">
        <header>
          <div>
            <h2 id="add-deliverable-title">Add Deliverable</h2>
            <p>Add a new deliverable to define what the creator needs to submit.</p>
          </div>
          <button type="button" aria-label="Close add deliverable" onClick={onClose}>
            <FiX aria-hidden="true" />
          </button>
        </header>

        <div className="business-review-add-deliverable-body">
          <label className="business-review-add-field">
            <span>1. Deliverable Type <em>*</em></span>
            <small>What type of content or output do you expect?</small>
            <select defaultValue="file-asset">
              <option value="file-asset">Type 1 - File Asset Deliverable</option>
              <option value="code-development">Type 2 - Code & Development Deliverable</option>
              <option value="document">Type 3 - Document Deliverable</option>
              <option value="stats-metrics">Type 4 - Stats & Metrics Deliverable</option>
              <option value="proof-based">Type 5 - Proof-Based Deliverable</option>
              <option value="hybrid">Type 6 - Hybrid Deliverable</option>
            </select>
          </label>

          <label className="business-review-add-field">
            <span>2. Title <em>*</em></span>
            <small>Give your deliverable a clear title.</small>
            <input type="text" defaultValue="Campaign Design Asset Pack" />
          </label>

          <label className="business-review-add-field business-review-add-description">
            <span>3. Description <em>*</em></span>
            <small>Explain what needs to be created and any key requirements.</small>
            <div className="business-review-add-editor">
              <div className="business-review-add-editor-toolbar">
                <select defaultValue="paragraph" aria-label="Text style">
                  <option value="paragraph">Paragraph</option>
                </select>
                <button type="button" aria-label="Bold">B</button>
                <button type="button" aria-label="Italic">I</button>
                <button type="button" aria-label="Underline">U</button>
                <button type="button" aria-label="Bulleted list">•</button>
                <button type="button" aria-label="Numbered list">1.</button>
                <button type="button" aria-label="Insert link">⌁</button>
                <button type="button" aria-label="More editor actions">...</button>
              </div>
              <textarea
                defaultValue={`Create a high-quality file asset package for the campaign.\n\n• Upload final PNG and PDF exports\n• Include editable source files where required\n• Use the provided brand assets\n• Do not watermark escrow-backed deliverables`}
              />
              <em>156/2000</em>
            </div>
          </label>

          <div className="business-review-add-grid">
            <label className="business-review-add-field">
              <span>4. Format <em>*</em></span>
              <small>What should the deliverable be?</small>
              <select defaultValue="image">
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
              </select>
            </label>
            <label className="business-review-add-field">
              <span>5. Due Date <em>*</em></span>
              <small>When should this be submitted?</small>
              <input type="text" defaultValue="May 21, 2025" />
            </label>
            <label className="business-review-add-field">
              <span>6. Max Submissions</span>
              <small>How many submissions allowed?</small>
              <input type="number" min="1" defaultValue="3" />
            </label>
          </div>

          <section className="business-review-add-upload">
            <h3>7. Attach Reference (Optional)</h3>
            <p>Attach brief, assets or examples to guide the creator.</p>
            <button type="button">
              <FiUpload aria-hidden="true" />
              <span><strong>Click to upload or drag and drop</strong><em>PNG, JPG, PDF or ZIP (Max 50MB)</em></span>
            </button>
          </section>

          <label className="business-review-add-notify">
            <input type="checkbox" defaultChecked />
            <span>Notify creators about this new deliverable</span>
          </label>
        </div>

        <footer>
          <Button tone="ghost" onClick={onClose}>Cancel</Button>
          <Button tone="brand" onClick={onClose}>Add Deliverable</Button>
        </footer>
      </section>
    </div>
  )
}

function PublishOpportunityModal({ isOpen, opportunity, type, onClose }) {
  const [publishStep, setPublishStep] = useState(1)

  if (!isOpen) return null

  const services = [
    { icon: 'instagram', milestone: 'Instagram Feed Post', description: '1 feed post to promote the campaign and brand message.', quantity: '1 post', unitCost: '10,000', total: '10,000' },
    { icon: 'tiktok', milestone: 'TikTok Video', description: '1 short-form video highlighting the campaign.', quantity: '1 video', unitCost: '10,000', total: '10,000' },
    { icon: 'youtube', milestone: 'YouTube Short', description: '1 short video for YouTube Shorts.', quantity: '1 short', unitCost: '5,000', total: '5,000' },
  ]

  return (
    <div className="business-review-modal-backdrop" role="presentation">
      <section className="business-review-publish-modal" role="dialog" aria-modal="true" aria-labelledby="publish-opportunity-title">
        <button type="button" className="business-review-publish-close" aria-label="Close publish opportunity" onClick={onClose}>
          <FiX aria-hidden="true" />
        </button>

        <header className="business-review-publish-head">
          <h2 id="publish-opportunity-title">Publish Opportunity</h2>
          <p>Complete the financing details to publish your opportunity.</p>
        </header>

        <ol className="business-review-publish-steps" aria-label="Publish opportunity steps">
          <li className={publishStep === 1 ? 'is-active' : 'is-complete'}><span>{publishStep > 1 ? <FiCheckCircle aria-hidden="true" /> : '1'}</span><strong>Budget & Services</strong><em>Define budget and services</em></li>
          <li className={publishStep === 2 ? 'is-active' : publishStep > 2 ? 'is-complete' : ''}><span>{publishStep > 2 ? <FiCheckCircle aria-hidden="true" /> : '2'}</span><strong>Payment Method</strong><em>Choose payment option</em></li>
          <li className={publishStep === 3 ? 'is-active' : ''}><span>3</span><strong>STK Push</strong><em>Complete payment</em></li>
        </ol>

        <div className="business-review-publish-body">
          <section className="business-review-publish-summary">
            <h2>Opportunity Summary</h2>
            <div>
              <figure>
                <img src={REVIEW_IMAGE} alt={`${opportunity.title} cover`} />
                <figcaption>{opportunity.title}</figcaption>
              </figure>
              <dl>
                <div><dt>Type</dt><dd>{type}</dd></div>
                <div><dt>Objective</dt><dd>Brand Awareness</dd></div>
                <div><dt>Category</dt><dd>{opportunity.category || 'Education & Learning'}</dd></div>
              </dl>
              <dl>
                <div><dt>Engagement Mode</dt><dd>{opportunity.engagementMode || 'Remote'}</dd></div>
                <div><dt>Visibility</dt><dd>Visible to all creators</dd></div>
                <div><dt>Deadline</dt><dd>{opportunity.deadline || 'May 27, 2025'} (5 days left)</dd></div>
              </dl>
              <dl>
                <div><dt>Budget</dt><dd>{opportunity.budget || 'KES 25,000'}</dd></div>
                <div><dt>Applications</dt><dd>{opportunity.applicants || 18} ({Math.max(0, (opportunity.applicants || 18) - 18)} new)</dd></div>
              </dl>
            </div>
          </section>

          {publishStep === 3 ? (
            <section className="business-review-publish-stk">
              <h2>Payment Details</h2>
              <div className="business-review-publish-stk-grid">
                <div className="business-review-publish-stk-main">
                  <div className="business-review-publish-selected-method">
                    <span><FiCreditCard aria-hidden="true" /></span>
                    <strong>You selected: Pay with Wallet (Zumbarl Wallet)</strong>
                    <em>Available Balance: KES 32,450</em>
                  </div>
                  <section className="business-review-publish-amount">
                    <span>Amount to Pay</span>
                    <strong>KES 25,000</strong>
                    <p>This amount will be deducted from your Zumbarl wallet.</p>
                  </section>
                  <section className="business-review-publish-phone">
                    <header>
                      <FiMessageSquare aria-hidden="true" />
                      <div>
                        <strong>You will receive an STK push on your registered phone number</strong>
                        <p>Enter your phone number to receive the payment request.</p>
                      </div>
                    </header>
                    <label>
                      <span>Phone Number</span>
                      <div><strong>🇰🇪</strong><input type="text" defaultValue="+254 712 345 678" /><StatusPill tone="green">Verified</StatusPill></div>
                      <em>Make sure this is the number registered with M-Pesa.</em>
                    </label>
                  </section>
                </div>
                <aside className="business-review-publish-phone-preview" aria-label="STK push preview">
                  <div>
                    <span>STK Push</span>
                    <strong>Zumbarl<br />KES 25,000</strong>
                    <p>Enter your M-Pesa PIN to complete the payment.</p>
                  </div>
                  <b><FiLock aria-hidden="true" /></b>
                </aside>
              </div>
            </section>
          ) : publishStep === 2 ? (
            <section className="business-review-publish-payment">
              <h2>Payment Method</h2>
              <p>Select how you would like to pay for this opportunity.</p>
              <div className="business-review-publish-payment-options">
                <label className="is-selected">
                  <input type="radio" name="publish-payment-method" defaultChecked />
                  <span><FiCreditCard aria-hidden="true" /></span>
                  <strong>Pay with Wallet <em>(Recommended)</em></strong>
                  <small>Pay securely using your Zumbarl wallet balance.</small>
                  <b>Available Balance<br />KES 32,450</b>
                </label>
                <label>
                  <input type="radio" name="publish-payment-method" />
                  <span><FiCreditCard aria-hidden="true" /></span>
                  <strong>Bank Transfer</strong>
                  <small>Make payment directly to our bank account.</small>
                  <b>Processing Time<br />1-2 hours</b>
                </label>
                <label>
                  <input type="radio" name="publish-payment-method" />
                  <span><FiCreditCard aria-hidden="true" /></span>
                  <strong>Pay with Card</strong>
                  <small>Pay securely using Visa, Mastercard or other cards.</small>
                  <b>Processing Time<br />Instant</b>
                </label>
              </div>
              <aside>
                <FiMessageSquare aria-hidden="true" />
                <span>You will be redirected to complete the payment after reviewing your details.</span>
              </aside>
            </section>
          ) : (
            <>
              <section className="business-review-publish-breakdown">
                <header>
                  <div>
                    <h2>Budget & Services Breakdown</h2>
                    <p>Define the services required and allocate budget.</p>
                  </div>
                </header>
                <div className="business-review-publish-table">
                  <div className="business-review-publish-table-head">
                    <span>Milestone / Deliverable</span>
                    <span>Description</span>
                    <span>Quantity</span>
                    <span>Unit Cost (KES)</span>
                    <span>Total (KES)</span>
                    <span />
                  </div>
                  {services.map((service) => (
                    <article key={service.milestone} className="business-review-publish-table-row">
                      <div>
                        <DeliverableIcon icon={service.icon} />
                        <strong>{service.milestone}</strong>
                      </div>
                      <p>{service.description}</p>
                      <select defaultValue={service.quantity} aria-label={`${service.milestone} quantity`}>
                        <option>{service.quantity}</option>
                      </select>
                      <input type="text" defaultValue={service.unitCost} aria-label={`${service.milestone} unit cost`} />
                      <strong>{service.total}</strong>
                      <button type="button" aria-label={`Remove ${service.milestone}`}><FiX aria-hidden="true" /></button>
                    </article>
                  ))}
                </div>
                <footer>
                  <button type="button" className="business-profile-ghost-btn"><FiPlus aria-hidden="true" /> Add Milestone / Deliverable</button>
                  <p><span>Subtotal</span><strong>KES 25,000</strong></p>
                </footer>
              </section>

              <section className="business-review-publish-total">
                <span>Total Budget</span>
                <strong>KES 25,000</strong>
                <p>This is the total amount that will be paid to creators upon completion.</p>
              </section>
            </>
          )}

          {publishStep === 3 ? (
            <section className="business-review-publish-next">
              <h2>What happens next?</h2>
              <div>
                <article><FiUsers aria-hidden="true" /><span><strong>1. STK Push Sent</strong><em>You&apos;ll receive an STK push on your phone.</em></span></article>
                <article><FiLock aria-hidden="true" /><span><strong>2. Enter M-Pesa PIN</strong><em>Enter your PIN to authorize the payment.</em></span></article>
                <article><FiCheckCircle aria-hidden="true" /><span><strong>3. Payment Confirmed</strong><em>We&apos;ll confirm payment and publish your opportunity.</em></span></article>
              </div>
            </section>
          ) : null}
        </div>

        <footer className="business-review-publish-actions">
          {publishStep > 1 ? (
            <Button tone="ghost" onClick={() => setPublishStep(publishStep - 1)}>Back</Button>
          ) : (
            <Button tone="ghost" onClick={onClose}>Cancel</Button>
          )}
          {publishStep === 3 ? <p><FiMessageSquare aria-hidden="true" /> You will be redirected after successful payment.</p> : null}
          <Button tone="brand" onClick={() => setPublishStep(Math.min(3, publishStep + 1))}>
            {publishStep === 3 ? 'Send STK Push' : publishStep === 2 ? 'Next: STK Push' : 'Next: Payment Method'}
          </Button>
        </footer>
      </section>
    </div>
  )
}

function SubmittedWorkReviewModal({ submission, onClose }) {
  const [isRequestingChanges, setIsRequestingChanges] = useState(false)
  const [isApprovingPayment, setIsApprovingPayment] = useState(false)

  if (!submission) return null

  return (
    <div className="business-review-modal-backdrop" role="presentation">
      <section
        className={`business-review-application-modal business-review-submission-modal${isRequestingChanges || isApprovingPayment ? ' is-obscured' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="submitted-work-review-title"
      >
        <header>
          <div>
            <div className="business-review-submission-breadcrumbs" aria-label="Review path">
              <span>Projects</span>
              <span>Level Up Your Skills</span>
              <span>Work & Deliverables</span>
              <span>Submitted Work</span>
            </div>
            <h2 id="submitted-work-review-title">
              Review Submission <StatusPill tone="purple">{submission.frameworkType}</StatusPill>
            </h2>
            <p>Review the {submission.deliverable.toLowerCase()} submitted by {submission.creator}.</p>
          </div>
          <button type="button" aria-label="Close submitted work review" onClick={onClose}>
            <FiX aria-hidden="true" />
          </button>
        </header>

        <div className="business-review-submission-modal-body">
          <div className="business-review-submission-main">
            <section className="business-profile-card business-review-submission-overview">
              <h3>Submission Overview</h3>
              <div className="business-review-submission-metrics">
                <dl>
                  {(submission.summaryItems || []).map((item) => (
                    <div key={item.label}>
                      <dt>{item.label}</dt>
                      <dd>{item.value}</dd>
                      <span>{item.meta}</span>
                    </div>
                  ))}
                </dl>
                <aside>
                  <span>{submission.result?.label || 'Result'}</span>
                  <strong>{submission.result?.value}</strong>
                  <em>{submission.result?.meta}</em>
                  <StatusPill tone="green">{submission.result?.status}</StatusPill>
                  <small>{submission.result?.percent}</small>
                </aside>
              </div>
            </section>

            <section className="business-profile-card business-review-submission-creator-card">
              <h3>Submitted By Creator</h3>
              <div className="business-review-submission-creator-grid">
                <PersonRow
                  avatar={submission.avatar}
                  name={submission.creator}
                  subtitle={submission.handle}
                />
                <div>
                  <span>Submitted on</span>
                  <strong>{submission.submittedDate} · 2:14 PM</strong>
                </div>
                <div>
                  <span>Submitted within 48hrs</span>
                  <strong><FiCheckCircle aria-hidden="true" /> Yes</strong>
                </div>
                <div>
                  <span>Files Submitted</span>
                  <strong>{submission.filesSubmitted || (submission.extraFiles ? '2 files' : '1 file')}</strong>
                </div>
              </div>
              <div className="business-review-submission-creator-meta">
                <span><FiMapPin aria-hidden="true" /> Nairobi, Kenya</span>
                <span><FiCalendar aria-hidden="true" /> Joined Apr 2023</span>
                <Button tone="ghost">View Profile</Button>
              </div>

              <div className="business-review-submission-evidence">
                <header>
                  <h4>{submission.evidenceTitle || 'Evidence Submitted'}</h4>
                  <p>{submission.evidenceDescription || 'Submission evidence attached by the creator.'}</p>
                </header>
                <div className="business-review-submission-evidence-grid">
                  {(submission.evidence || []).map((item) => (
                    <article key={item.title}>
                      <strong>{item.title}</strong>
                      <figure>
                        <img src={item.image} alt={`${item.title} evidence`} />
                        <figcaption>
                          <span>{item.label}</span>
                          <b>{item.stat}</b>
                          <em>{item.meta}</em>
                        </figcaption>
                      </figure>
                    </article>
                  ))}
                </div>
                <div className="business-review-submission-verification">
                  <FiCheckCircle aria-hidden="true" />
                  <div>
                    <strong>Verification</strong>
                    <span>{submission.verification}</span>
                  </div>
                  <StatusPill tone="green">Verified</StatusPill>
                </div>
              </div>
            </section>

            <section className="business-profile-card business-review-submission-timeline">
              <h3>Activity Timeline</h3>
              <ol>
                <li className="is-complete"><strong>Submitted by creator</strong><span>{submission.submittedDate} · 2:14 PM</span></li>
                <li className="is-current"><strong>Under review</strong><span>{submission.submittedDate} · 2:20 PM</span></li>
                <li><strong>Decision pending</strong><span>Awaiting your review</span></li>
                <li><strong>Payment release</strong><span>Upon approval</span></li>
              </ol>
            </section>
          </div>

          <aside className="business-review-submission-side">
            <section className="business-profile-card business-review-submission-payment">
              <header>
                <h3>Payment Model</h3>
                <button type="button">Edit</button>
              </header>
              <div className="business-review-payment-split">
                <strong>{submission.paymentModel || 'Payment model agreed'}</strong>
                <div><span className="is-paid"><FiCheckCircle aria-hidden="true" /></span><span className="is-pending"><FiCheckCircle aria-hidden="true" /></span></div>
                <dl>
                  <div><dt>Submission</dt><dd>50%</dd><span>Paid on submission</span><StatusPill tone="green">Paid</StatusPill></div>
                  <div><dt>Verification</dt><dd>50%</dd><span>Paid on approval</span><StatusPill tone="blue">{submission.paymentStatus || 'Pending'}</StatusPill></div>
                </dl>
              </div>
            </section>

            <section className="business-profile-card business-review-submission-decision">
              <h3>Review & Decision</h3>
              <label>
                <span>Your Feedback (Optional)</span>
                <textarea placeholder="Add feedback for the creator..." maxLength="500" />
                <em>0/500</em>
              </label>
              <div>
                <Button className="business-review-submission-approve" tone="brand" onClick={() => setIsApprovingPayment(true)}>Approve & Release Payment</Button>
                <Button className="business-review-submission-changes" tone="ghost" onClick={() => setIsRequestingChanges(true)}>Request Changes</Button>
                <Button className="business-review-submission-reject" tone="ghost">Reject Submission</Button>
              </div>
            </section>
          </aside>
        </div>
      </section>
      {isRequestingChanges ? (
        <RequestChangesDialog
          submission={submission}
          onCancel={() => setIsRequestingChanges(false)}
          onSend={() => setIsRequestingChanges(false)}
        />
      ) : null}
      {isApprovingPayment ? (
        <ApproveReleasePaymentDialog
          submission={submission}
          onCancel={() => setIsApprovingPayment(false)}
          onApprove={() => setIsApprovingPayment(false)}
        />
      ) : null}
    </div>
  )
}

function ApplicationsPanel({ activeApplicationStatus, onChangeApplicationStatus }) {
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [initialReviewStep, setInitialReviewStep] = useState('review')
  const isShortlisted = activeApplicationStatus === 'shortlisted'

  function openApplicationReview(application, step = 'review') {
    setInitialReviewStep(step)
    setSelectedApplication(application)
  }

  return (
    <section className="business-profile-card business-review-applications-card">
      <header>
        <div>
          <h2>All Applications</h2>
          <p>Review, evaluate and manage creator applications.</p>
        </div>
      </header>

      <div className="business-review-application-tabs" role="tablist" aria-label="Application status filters">
        {APPLICATION_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={activeApplicationStatus === filter.id ? 'is-active' : ''}
            onClick={() => onChangeApplicationStatus(filter.id)}
          >
            {filter.label}
            <span>{filter.count}</span>
          </button>
        ))}
      </div>

      <div className={isShortlisted ? 'business-review-shortlisted-toolbar' : 'business-review-application-toolbar'}>
        <label>
          <FiSearch aria-hidden="true" />
          <input type="search" placeholder="Search creators by name or username..." />
        </label>
        <select defaultValue="all-platforms" aria-label="Filter by platform">
          <option value="all-platforms">Platform: All</option>
        </select>
        <select defaultValue={isShortlisted ? 'shortlisted' : 'all-statuses'} aria-label="Filter by status">
          <option value="all-statuses">Status: All</option>
          <option value="shortlisted">Status: Shortlisted</option>
        </select>
        <select defaultValue={isShortlisted ? 'recently-shortlisted' : 'newest'} aria-label="Sort applications">
          <option value="newest">Sort by: Newest</option>
          <option value="recently-shortlisted">Sort by: Recently Shortlisted</option>
        </select>
        <button type="button">
          <FiFilter aria-hidden="true" />
          Filters
        </button>
      </div>

      {isShortlisted ? (
        <div className="business-review-shortlisted-table">
          <div className="business-review-shortlisted-head">
            <span><input type="checkbox" aria-label="Select all shortlisted applications" /></span>
            <span>Creator</span>
            <span>Platform</span>
            <span>Followers</span>
            <span>Eng. Rate</span>
            <span>Shortlisted On</span>
            <span>Actions</span>
          </div>
          {SHORTLISTED_APPLICATION_ROWS.map((row) => (
            <article key={row.id} className="business-review-shortlisted-row">
              <span><input type="checkbox" aria-label={`Select ${row.creator}`} /></span>
              <PersonRow
                avatar={row.avatar}
                className="business-review-application-creator"
                name={row.creator}
                subtitle={row.handle}
                badge={row.status === 'New' ? <em>New</em> : null}
              />
              <span><PlatformBadge platform={row.platform} /></span>
              <strong>{row.followers}</strong>
              <strong className="business-review-engagement-rate">{row.engagementRate}</strong>
              <time>{row.shortlistedOn}<span>{row.shortlistedTime}</span></time>
              <div className="business-review-shortlisted-actions">
                <button type="button" onClick={() => openApplicationReview(row)}>Review</button>
                <button type="button" onClick={() => openApplicationReview(row, 'schedule')}>Start Interview</button>
                <button type="button" aria-label={`More actions for ${row.creator}`}><FiMoreVertical aria-hidden="true" /></button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="business-review-application-table">
        <div className="business-review-application-head">
          <span><input type="checkbox" aria-label="Select all applications" /></span>
          <span>Creator</span>
          <span>Platform</span>
          <span>Followers</span>
          <span>Eng. Rate</span>
          <span>Submitted</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {APPLICATION_ROWS.map((row) => (
          <article key={row.id} className="business-review-application-row">
            <span><input type="checkbox" aria-label={`Select ${row.creator}`} /></span>
            <PersonRow
              avatar={row.avatar}
              className="business-review-application-creator"
              name={row.creator}
              subtitle={row.handle}
              badge={row.status === 'New' ? <em>New</em> : null}
            />
            <span><PlatformBadge platform={row.platform} /></span>
            <strong>{row.followers}</strong>
            <strong className="business-review-engagement-rate">{row.engagementRate}</strong>
            <time>{row.submitted}<span>{row.submittedAgo}</span></time>
            <StatusPill className="business-review-status-pill" tone={row.tone}>{row.status}</StatusPill>
            <div className="business-review-application-actions">
              <button type="button" onClick={() => openApplicationReview(row)}>Review</button>
              <button type="button" aria-label={`More actions for ${row.creator}`}>⋮</button>
            </div>
          </article>
        ))}
        </div>
      )}

      <footer className="business-review-application-pagination">
        <p>{isShortlisted ? 'Showing 1-6 of 6 shortlisted applications' : 'Showing 1-7 of 18 applications'}</p>
        <div>
          <button type="button" aria-label="Previous page">←</button>
          <button type="button" className="is-active">1</button>
          <button type="button">2</button>
          <button type="button">3</button>
          <button type="button" aria-label="Next page">→</button>
        </div>
      </footer>
      <ApplicationReviewModal
        application={selectedApplication}
        initialStep={initialReviewStep}
        onClose={() => setSelectedApplication(null)}
      />
    </section>
  )
}

function BusinessSubmittedWorkSummary() {
  return (
    <div className="business-review-submitted-student-view">
      <section className="business-review-submission-success">
        <div className="business-review-submission-success-mark">
          <FiCheckCircle aria-hidden="true" />
        </div>
        <div>
          <h3>Submitted Work Ready for Review</h3>
          <p>Six submitted-work examples are available across the deliverables framework. Review files, evidence, and messages before making a decision.</p>
        </div>
        <dl>
          <div><dt>Submitted on</dt><dd>May 20, 2025 at 2:14 PM</dd></div>
          <div><dt>Next step</dt><dd>Business review</dd></div>
          <div><dt>You'll be notified</dt><dd>When creators resubmit or reply</dd></div>
        </dl>
      </section>

      <section className="business-review-submitted-file-view">
        <article>
          <h3>Submission Summary</h3>
          <dl>
            <div><dt>Work Title</dt><dd>Six deliverable workflow submissions</dd></div>
            <div><dt>Submitted Files</dt><dd>12 files across six framework types</dd></div>
            <div><dt>Description</dt><dd>Creator submissions include uploaded assets, repository links, documents, analytics proof, GPS evidence and staged hybrid artifacts.</dd></div>
            <div><dt>Feedback Request</dt><dd>Review each type-specific evidence package and request changes where the proof does not match the original brief.</dd></div>
          </dl>
        </article>

        <article>
          <header>
            <h3>Submitted Files</h3>
            <button type="button">
              Download All
              <FiDownload aria-hidden="true" />
            </button>
          </header>
          {BUSINESS_DELIVERABLE_FILES.slice(0, 3).map((file) => (
            <p key={file.name}>
              <FiFolder aria-hidden="true" />
              <strong>{file.name}</strong>
              <span>{file.size}</span>
              <FiDownload aria-hidden="true" />
            </p>
          ))}
        </article>
      </section>
    </div>
  )
}

function BusinessDeliverableFilesPanel() {
  return (
    <section className="business-review-files-panel">
      <header>
        <div>
          <h3>Submitted Files</h3>
          <p>Review, download and organize all files submitted against this opportunity.</p>
        </div>
        <button type="button" className="business-profile-primary-btn">
          <FiUpload aria-hidden="true" />
          Upload Files
        </button>
      </header>

      <div className="business-review-files-tools">
        <label>
          <FiSearch aria-hidden="true" />
          <input type="search" placeholder="Search files..." />
        </label>
        <button type="button">Filter</button>
        <button type="button" aria-label="List view"><FiFileText aria-hidden="true" /></button>
      </div>

      <section className="business-review-files-table" aria-label="Business submitted files">
        <div className="business-review-files-row is-head">
          <span>Name</span>
          <span>Type</span>
          <span>Owner</span>
          <span>Last Updated</span>
          <span>Size</span>
          <span />
        </div>
        {BUSINESS_DELIVERABLE_FILES.map((file) => (
          <div key={file.name} className="business-review-files-row">
            <span>
              <FiFileText className={`is-${file.tone}`} aria-hidden="true" />
              <strong>{file.name}</strong>
            </span>
            <span>{file.type}</span>
            <span>
              <img src="/assets/index/bee_nobg.png" alt="" />
              {file.owner}
            </span>
            <span>{file.updated}</span>
            <span>{file.size}</span>
            <button type="button" aria-label={`More actions for ${file.name}`}>
              <FiMoreVertical aria-hidden="true" />
            </button>
          </div>
        ))}
      </section>
    </section>
  )
}

function BusinessDeliverableMessagesPanel() {
  return (
    <section className="business-review-messages-grid">
      <aside className="business-review-message-list">
        <h3>Messages</h3>
        <label>
          <FiMessageSquare aria-hidden="true" />
          <input type="search" placeholder="Search messages" />
        </label>
        {BUSINESS_DELIVERABLE_MESSAGES.map((message, index) => (
          <button key={`${message.author}-${message.date}`} type="button" className={index === 0 ? 'is-active' : ''}>
            <img src={message.mine ? '/assets/index/business_page_images/optimized/omar-lopez-1qfy-jDc_jo-unsplash.webp' : '/assets/index/bee_nobg.png'} alt="" />
            <span>
              <strong>{message.author}</strong>
              <em>{message.files ? 'Shared a file' : message.text}</em>
            </span>
            <small>{index === 0 ? '2:14 PM' : index === 1 ? '2:22 PM' : 'May 20'}</small>
          </button>
        ))}
      </aside>

      <section className="business-review-chat">
        <header>
          <img src="/assets/index/bee_nobg.png" alt="" />
          <div>
            <h3>Deliverables Thread</h3>
            <p>Online</p>
          </div>
          <button type="button" aria-label="Call"><FiPhone aria-hidden="true" /></button>
          <button type="button" aria-label="Video call"><FiVideo aria-hidden="true" /></button>
          <button type="button" aria-label="Thread info"><FiSettings aria-hidden="true" /></button>
        </header>

        <div className="business-review-chat-body">
          <p className="business-review-chat-start">This is the beginning of your deliverables conversation for Level Up Your Skills.</p>
          {BUSINESS_DELIVERABLE_MESSAGES.map((message) => (
            <article key={`${message.author}-${message.date}`} className={message.mine ? 'is-mine' : ''}>
              {!message.mine ? <img src="/assets/index/bee_nobg.png" alt="" /> : null}
              <div>
                <p><strong>{message.author}</strong><span>{message.date}</span></p>
                <div className="business-review-chat-bubble">
                  {message.text}
                  {message.files ? (
                    <div className="business-review-chat-files">
                      {message.files.map((file) => (
                        <button key={file.name} type="button">
                          <FiFileText aria-hidden="true" />
                          <span><strong>{file.name}</strong><em>{file.type} · {file.size}</em></span>
                          <FiDownload aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>

        <footer>
          <input type="text" placeholder="Type a message..." />
          <button type="button" aria-label="Attach file"><FiUpload aria-hidden="true" /></button>
          <button type="button" aria-label="Add reaction"><FiSmile aria-hidden="true" /></button>
          <button type="button" className="business-profile-primary-btn" aria-label="Send message"><FiSend aria-hidden="true" /></button>
        </footer>
      </section>
    </section>
  )
}

function DeliverablesPanel() {
  const [activeDeliverableTab, setActiveDeliverableTab] = useState('deliverables')
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [isAddingDeliverable, setIsAddingDeliverable] = useState(false)
  const isSubmittedWork = activeDeliverableTab === 'submitted-work'
  const isFiles = activeDeliverableTab === 'files'
  const isMessages = activeDeliverableTab === 'messages'

  return (
    <section className="business-profile-card business-review-deliverables-card">
      <header>
        <div>
          <h2>{isMessages ? 'Messages' : isFiles ? 'Files' : isSubmittedWork ? 'Submitted Work' : 'Work & Deliverables'}</h2>
          <p>{isMessages ? 'Coordinate with creators around evidence, revisions and approvals.' : isFiles ? 'Access all submitted files and reference assets.' : isSubmittedWork ? 'Review and provide feedback on creator submissions.' : 'Manage the deliverables, review submissions and files.'}</p>
        </div>
        {!isSubmittedWork && !isFiles && !isMessages ? (
          <div>
            <button type="button" className="business-profile-primary-btn" onClick={() => setIsAddingDeliverable(true)}>
              <FiPlus aria-hidden="true" />
              Add Deliverable
            </button>
            <button type="button" className="business-profile-ghost-btn">Actions</button>
          </div>
        ) : null}
      </header>

      <div className="business-review-application-tabs" role="tablist" aria-label="Deliverable sections">
        {DELIVERABLE_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={activeDeliverableTab === filter.id ? 'is-active' : ''}
            onClick={() => setActiveDeliverableTab(filter.id)}
          >
            {filter.label}
            <span>{filter.count}</span>
          </button>
        ))}
      </div>

      {isMessages ? (
        <BusinessDeliverableMessagesPanel />
      ) : isFiles ? (
        <BusinessDeliverableFilesPanel />
      ) : isSubmittedWork ? (
        <>
          <BusinessSubmittedWorkSummary />
          <div className="business-review-submitted-toolbar">
            <label>
              <FiSearch aria-hidden="true" />
              <input type="search" placeholder="Search submitted work..." />
            </label>
            <select defaultValue="all-deliverables" aria-label="Filter submissions by deliverable">
              <option value="all-deliverables">Deliverable: All</option>
            </select>
            <select defaultValue="all-statuses" aria-label="Filter submissions by status">
              <option value="all-statuses">Status: All</option>
            </select>
            <select defaultValue="all-creators" aria-label="Filter submissions by creator">
              <option value="all-creators">Creator: All</option>
            </select>
            <button type="button">
              <FiFilter aria-hidden="true" />
              Filters
            </button>
          </div>

          <div className="business-review-submitted-table">
            <div className="business-review-submitted-head">
              <span>Creator</span>
              <span>Deliverable</span>
              <span>Submitted On</span>
              <span>Submission</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {SUBMITTED_WORK_ROWS.map((row) => (
              <article key={row.id} className="business-review-submitted-row">
                <PersonRow
                  avatar={row.avatar}
                  className="business-review-application-creator"
                  name={row.creator}
                  subtitle={row.handle}
                />
                <div className="business-review-submitted-deliverable">
                  <PlatformBadge platform={row.platform} />
                  <strong>{row.deliverable}</strong>
                </div>
                <time>{row.submittedDate}<span>{row.submittedAgo}</span></time>
                <div className="business-review-submitted-file">
                  <figure>
                    <img src={row.preview} alt={`${row.file} preview`} />
                    {row.duration ? <figcaption>{row.duration}</figcaption> : null}
                  </figure>
                  <div>
                    <strong>{row.file}</strong>
                    <span>{row.size}</span>
                  </div>
                  {row.extraFiles ? <em>{row.extraFiles}</em> : null}
                </div>
                <StatusPill className="business-review-status-pill" tone={row.tone}>{row.status}</StatusPill>
                <div className="business-review-deliverable-actions">
                  <button type="button" onClick={() => setSelectedSubmission(row)}>{row.status === 'Approved' ? 'View' : 'Review'}</button>
                  <button type="button" aria-label={`More actions for ${row.creator}`}>
                    <FiMoreVertical aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>

          <button type="button" className="business-review-submitted-more">Viewing all six deliverable framework samples</button>
          <footer className="business-review-application-pagination">
            <p>Showing 1-6 of 6 submissions</p>
            <div>
              <button type="button" aria-label="Previous page">←</button>
              <button type="button" className="is-active">1</button>
              <button type="button">2</button>
              <button type="button" aria-label="Next page">→</button>
            </div>
          </footer>
          <SubmittedWorkReviewModal
            submission={selectedSubmission}
            onClose={() => setSelectedSubmission(null)}
          />
        </>
      ) : (
        <>
          <div className="business-review-deliverable-toolbar">
            <label>
              <FiSearch aria-hidden="true" />
              <input type="search" placeholder="Search deliverables..." />
            </label>
            <select defaultValue="all-statuses" aria-label="Filter deliverables by status">
              <option value="all-statuses">Status: All</option>
            </select>
            <select defaultValue="all-types" aria-label="Filter deliverables by type">
              <option value="all-types">Type: All</option>
            </select>
          </div>

          <div className="business-review-deliverable-table">
            <div className="business-review-deliverable-head">
              <span aria-hidden="true" />
              <span>Deliverable</span>
              <span>Type</span>
              <span>Description</span>
              <span>Due Date</span>
              <span>Submissions</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            {DELIVERABLE_ROWS.map((row) => (
              <article key={row.id} className="business-review-deliverable-row">
                <button type="button" className="business-review-deliverable-drag" aria-label={`Reorder ${row.title}`}>⋮⋮</button>
                <div className="business-review-deliverable-title">
                  <DeliverableIcon icon={row.icon} />
                  <div>
                    <strong>{row.title}</strong>
                    <em>{row.required ? 'Required' : 'Optional'}</em>
                  </div>
                </div>
                <strong>{row.type}</strong>
                <p>{row.description}</p>
                <time>
                  <span><FiCalendar aria-hidden="true" /> {row.dueDate}</span>
                  <em className={row.dueMeta === 'Overdue' ? 'is-overdue' : ''}>{row.dueMeta}</em>
                </time>
                <strong className="business-review-deliverable-submissions">{row.submissions}</strong>
                <StatusPill className="business-review-status-pill" tone={row.tone}>{row.status}</StatusPill>
                <div className="business-review-deliverable-actions">
                  <button type="button">View</button>
                  <button type="button" aria-label={`More actions for ${row.title}`}>
                    <FiMoreVertical aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>

          <footer className="business-review-deliverable-footer">
            Showing 1-6 of 6 deliverables
          </footer>
        </>
      )}
      <AddDeliverableModal
        isOpen={isAddingDeliverable}
        onClose={() => setIsAddingDeliverable(false)}
      />
    </section>
  )
}

function PaymentsPanel() {
  return (
    <section className="business-profile-card business-review-payments-card">
      <header>
        <div>
          <h2>Payments</h2>
          <p>Manage creator payments, track disbursements and download invoices.</p>
        </div>
      </header>

      <div className="business-review-payment-metrics">
        {PAYMENT_METRICS.map((metric) => (
          <MetricCard
            key={metric.label}
            change={metric.meta}
            icon={metric.tone === 'blue' ? FiDollarSign : FiCreditCard}
            label={metric.label}
            tone={metric.tone}
            value={metric.value}
          />
        ))}
      </div>

      <div className="business-review-payment-toolbar">
        <label>
          <FiSearch aria-hidden="true" />
          <input type="search" placeholder="Search creators by name..." />
        </label>
        <select defaultValue="all-statuses" aria-label="Filter by creator status">
          <option value="all-statuses">Status: All</option>
        </select>
        <select defaultValue="all-payments" aria-label="Filter by payment status">
          <option value="all-payments">Payment Status: All</option>
        </select>
        <select defaultValue="newest" aria-label="Sort payments">
          <option value="newest">Sort by: Newest</option>
        </select>
        <button type="button">
          <FiFilter aria-hidden="true" />
          Filters
        </button>
      </div>

      <div className="business-review-payment-table">
        <div className="business-review-payment-head">
          <span>Creator</span>
          <span>Deliverables</span>
          <span>Total Amount</span>
          <span>Paid Amount</span>
          <span>Payment Status</span>
          <span>Due Date / Paid On</span>
          <span>Actions</span>
        </div>
        {PAYMENT_ROWS.map((row) => (
          <article key={row.id} className="business-review-payment-row">
            <PersonRow
              avatar={row.avatar}
              className="business-review-application-creator"
              name={row.creator}
              subtitle={row.handle}
            />
            <strong>{row.deliverables}</strong>
            <strong>{row.totalAmount}</strong>
            <strong>{row.paidAmount}</strong>
            <StatusPill className="business-review-status-pill" tone={row.tone}>{row.status}</StatusPill>
            <time>{row.date}<span>{row.dateMeta}</span></time>
            <div className="business-review-payment-actions">
              <button type="button">{row.status === 'Paid' ? 'View Receipt' : 'Make Payment'}</button>
              <button type="button" aria-label={`More payment actions for ${row.creator}`}>
                <FiMoreVertical aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
      </div>

      <footer className="business-review-payment-footer">
        <p>Showing 1-6 of 6 payments</p>
        <dl>
          {PAYMENT_METRICS.map((metric) => (
            <div key={metric.label}>
              <dt>{metric.label}</dt>
              <dd>{metric.value}</dd>
            </div>
          ))}
        </dl>
      </footer>
    </section>
  )
}

function PerformanceChart({ title, variant }) {
  return (
    <section className="business-review-performance-chart">
      <header>
        <h3>{title}</h3>
        <div>
          {variant === 'reach' ? (
            <>
              <span className="tone-purple">Reach</span>
              <span className="tone-green">Impressions</span>
            </>
          ) : (
            <>
              <span className="tone-pink">Likes</span>
              <span className="tone-blue">Comments</span>
              <span className="tone-orange">Shares</span>
            </>
          )}
        </div>
      </header>
      <div className={`business-review-performance-graph is-${variant}`}>
        <i />
        <i />
        <i />
        <i />
        <span>May 12</span>
        <span>May 14</span>
        <span>May 16</span>
        <span>May 18</span>
        <span>May 20</span>
        <span>May 22</span>
        <span>May 24</span>
        <span>May 26</span>
      </div>
    </section>
  )
}

function PerformancePanel() {
  return (
    <section className="business-profile-card business-review-performance-card">
      <header>
        <div>
          <h2>Performance Overview</h2>
          <p>Key performance metrics and engagement insights.</p>
        </div>
        <div>
          <button type="button" className="business-profile-ghost-btn">
            <FiCalendar aria-hidden="true" />
            May 12 - May 26, 2025
          </button>
          <button type="button" className="business-profile-ghost-btn">
            <FiFilter aria-hidden="true" />
            Filters
          </button>
        </div>
      </header>

      <div className="business-review-performance-metrics">
        {PERFORMANCE_METRICS.map((metric) => (
          <MetricCard
            key={metric.label}
            change={metric.change}
            icon={metric.icon}
            label={metric.label}
            tone={metric.tone}
            value={metric.value}
          />
        ))}
      </div>

      <div className="business-review-performance-charts">
        <PerformanceChart title="Reach Over Time" variant="reach" />
        <PerformanceChart title="Engagements Over Time" variant="engagements" />
      </div>

      <section className="business-review-performance-table">
        <header>
          <h3>Top Performing Creators</h3>
        </header>
        <div className="business-review-performance-head">
          <span>Creator</span>
          <span>Reach</span>
          <span>Impressions</span>
          <span>Engagements</span>
          <span>Engagement Rate</span>
          <span>Performance</span>
        </div>
        {TOP_CREATORS.map((creator) => (
          <article key={creator.id} className="business-review-performance-row">
            <PersonRow
              avatar={creator.avatar}
              className="business-review-application-creator"
              name={creator.creator}
              subtitle={creator.handle}
            />
            <strong>{creator.reach}</strong>
            <strong>{creator.impressions}</strong>
            <strong>{creator.engagements}</strong>
            <strong>{creator.rate}</strong>
            <StatusPill className="business-review-status-pill" tone={creator.tone}>{creator.performance}</StatusPill>
          </article>
        ))}
        <button type="button" className="business-review-submitted-more">View all performance details</button>
      </section>
    </section>
  )
}

function ActivityPanel() {
  return (
    <section className="business-profile-card business-review-activity-card">
      <header>
        <div>
          <h2>Activity Timeline</h2>
          <p>A chronological view of all actions and updates for this opportunity.</p>
        </div>
        <button type="button" className="business-profile-ghost-btn">
          <FiFilter aria-hidden="true" />
          Filters
        </button>
      </header>

      <div className="business-review-activity-timeline">
        {ACTIVITY_GROUPS.map((group) => (
          <section key={group.date}>
            <h3>{group.date}</h3>
            <div>
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <article key={item.id} className="business-review-activity-row">
                    <time>{item.time}</time>
                    <span className={`business-review-activity-icon tone-${item.tone}`}>
                      <Icon aria-hidden="true" />
                    </span>
                    <strong>{item.type}</strong>
                    <p>{item.detail}</p>
                    <div className="business-review-activity-actor">
                      <img src={item.avatar} alt={`${item.actor} avatar`} />
                      <span><b>{item.actor}</b><em>{item.role}</em></span>
                    </div>
                    {item.action ? (
                      <button type="button" className={`business-review-activity-action tone-${item.tone}`}>
                        {item.action}
                      </button>
                    ) : <span aria-hidden="true" />}
                  </article>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      <footer className="business-review-activity-footer">
        <button type="button">Load more activity</button>
      </footer>
    </section>
  )
}

function OverviewPanel({ onBack, opportunity, skills, type }) {
  return (
    <section className="business-profile-card business-review-editor-card">
      <header>
        <div>
          <h2>Opportunity Details</h2>
          <p>View and edit your opportunity details.</p>
        </div>
        <div>
          <button type="button" className="business-profile-ghost-btn" onClick={onBack}>
            <FiX aria-hidden="true" />
            Cancel
          </button>
          <button type="button" className="business-profile-primary-btn">
            <FiSave aria-hidden="true" />
            Save Changes
          </button>
        </div>
      </header>

      <div className="business-review-editor-grid">
        <section>
          <ReviewField label="Opportunity Title" value={opportunity.title} />
          <div className="business-review-editor-two">
            <ReviewSelect label="Type" value={type} />
            <ReviewSelect label="Category" value={opportunity.category} />
          </div>
          <label className="business-review-editor-field">
            <span>Objective</span>
            <textarea readOnly value={opportunity.description || ''} />
          </label>
          <div className="business-review-platforms">
            <span>Instagram</span>
            <span>TikTok</span>
            <span>YouTube</span>
            <button type="button">+ Add Platform</button>
          </div>
          <div className="business-review-editor-three">
            <ReviewSelect label="Location" value="Kenya" />
            <ReviewSelect label="Age Range" value="18 - 28" />
            <ReviewSelect label="Gender" value="All" />
          </div>
          <div className="business-review-interest-row">
            {skills.slice(0, 4).map((skill) => <span key={skill}>{skill}</span>)}
          </div>
          <div className="business-review-editor-two">
            <ReviewField label="Start Date" value="May 20, 2025" />
            <ReviewField label="End Date" value={opportunity.deadline || 'May 27, 2025'} />
          </div>
        </section>

        <section>
          <div className="business-review-budget-card">
            <h3>Budget & Compensation</h3>
            <ReviewField label="Total Budget (KES)" value={String(opportunity.budget || '').replace(/[^\d,]/g, '') || '25,000'} />
            <ReviewSelect label="Creator Compensation" value="Pay per Deliverable" />
            <ul>
              {PLATFORM_BUDGETS.map((item) => (
                <li key={item.label}><span>{item.label}</span><strong>{item.value}</strong><em>{item.share}</em></li>
              ))}
            </ul>
          </div>
          <div className="business-review-budget-card">
            <h3>Deliverables</h3>
            <ul>
              {DELIVERABLES.map((item) => (
                <li key={item.label}><span>{item.label}</span><strong>{item.value}</strong></li>
              ))}
            </ul>
            <button type="button">+ Add Deliverable</button>
          </div>
          <div className="business-review-budget-card">
            <h3>Additional Requirements</h3>
            <p>Please tag @{opportunity.company?.toLowerCase().replace(/\s+/g, '.') || 'zetech.studios'} and use #{opportunity.title.replace(/\s+/g, '')} in all posts.</p>
          </div>
        </section>
      </div>
    </section>
  )
}

export function BusinessOpportunityReviewWorkspace({
  activeApplicationStatus,
  activeReviewTab,
  onBack,
  onChangeApplicationStatus,
  onChangeReviewTab,
  opportunity,
}) {
  const [isPublishingOpportunity, setIsPublishingOpportunity] = useState(false)

  if (!opportunity) return null

  const skills = getSkillList(opportunity)
  const type = opportunity.category === 'Social Media' ? 'Campaign' : opportunity.mode || 'Project'

  return (
    <>
      <header className="business-review-workspace-head">
        <nav aria-label="Opportunity breadcrumb">
          <button type="button" onClick={onBack}>Opportunities</button>
          <span>/</span>
          <strong>{opportunity.title}</strong>
        </nav>
        <div>
          <h1>{opportunity.title}</h1>
          <span>{type}</span>
        </div>
        <p>{opportunity.description}</p>
        <aside>
          <button type="button" className="business-profile-primary-btn" onClick={() => setIsPublishingOpportunity(true)}>
            <FiPlus aria-hidden="true" />
            Publish Opportunity
          </button>
          <button type="button" className="business-profile-ghost-btn">
            <FiEye aria-hidden="true" />
            Preview Opportunity
          </button>
        </aside>
      </header>

      <section className="business-profile-card business-review-overview-card">
        <div className="business-review-cover">
          <img src={REVIEW_IMAGE} alt={`${opportunity.title} opportunity`} />
        </div>
        <dl>
          <div><dt>Type</dt><dd>{type}</dd></div>
          <div><dt>Objective</dt><dd>Brand Awareness</dd></div>
          <div><dt>Category</dt><dd>{opportunity.category}</dd></div>
          <div><dt>Platforms</dt><dd>Instagram, TikTok, YouTube +1</dd></div>
        </dl>
        <dl>
          <div><dt>Budget</dt><dd>{opportunity.budget}</dd></div>
          <div><dt>Applications</dt><dd>{opportunity.applicants} ({Math.max(0, opportunity.applicants - 12)} new)</dd></div>
          <div><dt>Status</dt><dd><span>{opportunity.status}</span></dd></div>
          <div><dt>Deadline</dt><dd>{opportunity.deadline || 'Rolling'}</dd></div>
        </dl>
        <dl>
          <div><dt>Created by</dt><dd>Brian Mwangi</dd></div>
          <div><dt>Created on</dt><dd>May 12, 2025</dd></div>
          <div><dt>Engagement Mode</dt><dd>{opportunity.engagementMode || 'Remote'}</dd></div>
          <div><dt>Visible to</dt><dd>All creators</dd></div>
        </dl>
      </section>

      <div className="business-review-detail-tabs" role="tablist" aria-label="Opportunity review sections">
        {REVIEW_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeReviewTab === tab.id}
            className={activeReviewTab === tab.id ? 'is-active' : ''}
            onClick={() => onChangeReviewTab(tab.id)}
          >
            {tab.label}
            {tab.count ? <span>{tab.count}</span> : null}
          </button>
        ))}
      </div>

      {activeReviewTab === 'applications' ? (
        <ApplicationsPanel
          activeApplicationStatus={activeApplicationStatus}
          onChangeApplicationStatus={onChangeApplicationStatus}
        />
      ) : activeReviewTab === 'deliverables' ? (
        <DeliverablesPanel />
      ) : activeReviewTab === 'payments' ? (
        <PaymentsPanel />
      ) : activeReviewTab === 'performance' ? (
        <PerformancePanel />
      ) : activeReviewTab === 'messages' ? (
        <section className="business-profile-card business-review-deliverables-card">
          <header>
            <div>
              <h2>Messages</h2>
              <p>Coordinate with creators around evidence, revisions and approvals.</p>
            </div>
          </header>
          <BusinessDeliverableMessagesPanel />
        </section>
      ) : activeReviewTab === 'activity' ? (
        <ActivityPanel />
      ) : (
        <OverviewPanel onBack={onBack} opportunity={opportunity} skills={skills} type={type} />
      )}
      <PublishOpportunityModal
        isOpen={isPublishingOpportunity}
        opportunity={opportunity}
        type={type}
        onClose={() => setIsPublishingOpportunity(false)}
      />
    </>
  )
}
