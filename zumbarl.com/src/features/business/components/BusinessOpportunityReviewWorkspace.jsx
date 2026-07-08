import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TabNav } from '../../../components/ui'
import { getSplashCropStyle } from '../../../lib/getSplashCropStyle'
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
  FiSearch,
  FiSend,
  FiSettings,
  FiStar,
  FiUpload,
  FiTrendingUp,
  FiUsers,
  FiVideo,
  FiX,
} from 'react-icons/fi'
import { Button, MetricCard, PersonRow, StatusPill } from '../../../components/ui'
import { cancelCall, createCall, readCall } from '../../calls/services/callService'
import { openCallOverlay } from '../../calls/getCallMeetingUrl'
import { listConversations, listMessages, sendMessage } from '../../messages/services/messageService'
import { playCallRingtone, playMessageSentSound } from '../../communications/services/communicationSounds'

const REVIEW_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'applications', label: 'Applications', count: 18 },
  { id: 'deliverables', label: 'Work & Deliverables', count: 6 },
  { id: 'payments', label: 'Payments', count: 4 },
  { id: 'performance', label: 'Performance' },
  { id: 'messages', label: 'Messages', count: 8 },
  { id: 'activity', label: 'Activity' },
]

function getReviewTabs(opportunity, applicationCount = 0) {
  const scopeCount = getOpportunityPaymentScopeItems(opportunity).length
  const tabs = REVIEW_TABS.map((tab) => {
    if (tab.id === 'applications') return { ...tab, count: applicationCount }
    if (tab.id === 'deliverables' && scopeCount) return { ...tab, count: scopeCount }
    return tab
  })

  if (opportunity?.scopeMode === 'milestone') return tabs

  return tabs.filter((tab) => tab.id !== 'performance')
}

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
const SAMPLE_APPLICATION_PDF_PREVIEW = 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCAzMDAgMTQ0XSAvQ29udGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNSAwIFIgPj4gPj4gPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCA0NCA+PgpzdHJlYW0KQlQKL0YxIDI0IFRmCjcyIDcyIFRkCihQb3J0Zm9saW8gc2FtcGxlKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmoKPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCjAwMDAwMDAyNzQgMDAwMDAgbiAKMDAwMDAwMDM2NyAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDYgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjQzNQolJUVPRgo='

const APPLICATION_FILTERS = [
  { id: 'all', label: 'All', count: 18 },
  { id: 'new', label: 'New', count: 5 },
  { id: 'shortlisted', label: 'Shortlisted', count: 6 },
  { id: 'accepted', label: 'Accepted', count: 3 },
  { id: 'rejected', label: 'Rejected', count: 4 },
]

void SAMPLE_APPLICATION_PDF_PREVIEW

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

void PLATFORM_BUDGETS
void DELIVERABLES
void APPLICATION_ROWS
void SHORTLISTED_APPLICATION_ROWS

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
    format: 'PNG, PDF, source files',
    evidenceRequired: 'Final PNG/PDF exports, editable source files, brand assets and no-watermark proof.',
    acceptanceCriteria: 'Files match the approved brand direction, include editable sources, and pass originality review.',
    paymentRelease: 'Release after company approval and file verification.',
    budget: 'KES 6,000',
    reference: 'Brand assets and campaign brief attached.',
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
    format: 'Repository, live URL, walkthrough',
    evidenceRequired: 'GitHub repo, deploy URL, commit history and Loom walkthrough.',
    acceptanceCriteria: 'Build is runnable, source is student-authored, and all brief requirements are met.',
    paymentRelease: 'Release after technical review and live demo verification.',
    budget: 'KES 7,500',
    reference: 'Landing page copy and wireframe notes attached.',
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
    format: 'Google Docs and PDF',
    evidenceRequired: 'Editable document link, exported PDF, sources and originality report.',
    acceptanceCriteria: 'Report covers the requested audience, has clear citations, and passes originality checks.',
    paymentRelease: 'Release after document review and final approval.',
    budget: 'KES 4,000',
    reference: 'Research questions and target audience notes attached.',
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
    format: 'Analytics screenshots',
    evidenceRequired: 'Before and after screenshots, baseline, measurement window and platform metrics.',
    acceptanceCriteria: 'Metrics match the agreed window and show the target result or verified effort.',
    paymentRelease: 'Release after metric verification.',
    budget: 'KES 4,500',
    reference: 'Analytics target sheet attached.',
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
    format: 'Proof photos and confirmation',
    evidenceRequired: 'Geo-tagged photos, GPS check-in, timestamped proof and recipient confirmation.',
    acceptanceCriteria: 'Evidence matches the agreed location, recipient and activation requirements.',
    paymentRelease: 'Release after proof validation.',
    budget: 'KES 3,500',
    reference: 'Activation location and proof checklist attached.',
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
    format: 'Hybrid submission',
    evidenceRequired: 'Design assets, proof of posting and final analytics package.',
    acceptanceCriteria: 'Each component is submitted in sequence and approved before release.',
    paymentRelease: 'Release according to staged escrow split.',
    budget: 'KES 9,000',
    reference: 'Hybrid workflow brief attached.',
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

  if (icon === 'scope') {
    return <span className="business-review-deliverable-icon tone-x"><FiFileText aria-hidden="true" /></span>
  }

  return <span className="business-review-deliverable-icon tone-x">X</span>
}

function getCurrencyAmount(value) {
  return Number(String(value || '').replace(/[^\d.]/g, '')) || 0
}

function formatKesAmount(value) {
  return `KES ${getCurrencyAmount(value).toLocaleString()}`
}

function formatOpportunityDate(value, fallback = 'Not set') {
  if (!value || value === 'Rolling') return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getOpportunityCoverImage(opportunity) {
  return opportunity?.opportunitySplash?.previewUrl
    || opportunity?.opportunitySplash?.url
    || opportunity?.imageUrl
    || opportunity?.image
    || REVIEW_IMAGE
}

function getOpportunityPaymentScopeItems(opportunity) {
  const milestoneScopes = Array.isArray(opportunity?.milestoneScopes) ? opportunity.milestoneScopes : []
  const deliverableMilestones = Array.isArray(opportunity?.deliverableMilestones) ? opportunity.deliverableMilestones : []
  const usesMilestones = opportunity?.scopeMode === 'milestone' && milestoneScopes.length
  const scopeItems = usesMilestones ? milestoneScopes : deliverableMilestones

  return scopeItems.map((item, index) => {
    const budgetAmount = getCurrencyAmount(item.budgetAmount ?? item.budget)
    return {
      budgetAmount,
      description: item.description || item.requirement || item.submissionMethod || 'Defined in the opportunity scope.',
      id: item.id || `scope-${index}`,
      paymentPercent: item.paymentPercent || '',
      release: item.paymentRelease || `Release after ${usesMilestones ? 'milestone' : 'deliverable'} approval.`,
      source: item,
      title: item.title || item.type || `${usesMilestones ? 'Milestone' : 'Deliverable'} ${index + 1}`,
      typeLabel: usesMilestones ? 'Milestone' : 'Deliverable',
    }
  })
}

function getOpportunityDeliverableRows(opportunity) {
  const scopeItems = getOpportunityPaymentScopeItems(opportunity)
  if (!scopeItems.length) return DELIVERABLE_ROWS

  return scopeItems.map((item, index) => {
    const source = item.source || {}
    return {
      id: item.id,
      title: item.title,
      required: true,
      type: `${item.typeLabel} ${index + 1}`,
      description: item.description,
      dueDate: opportunity?.deadline || 'Scheduled after agreement',
      dueMeta: opportunity?.deadline ? 'From brief deadline' : 'No fixed due date',
      submissions: '0',
      status: opportunity?.status === 'Open' ? 'Ready' : opportunity?.status || 'Draft',
      tone: opportunity?.status === 'Open' ? 'green' : 'gray',
      icon: 'scope',
      format: source.evidenceRequired || 'Defined in the opportunity scope',
      evidenceRequired: source.evidenceRequired || 'Defined in the opportunity scope',
      acceptanceCriteria: source.acceptanceCriteria || 'Acceptance criteria can be confirmed during review.',
      paymentRelease: item.release,
      budget: formatKesAmount(item.budgetAmount),
      paymentPercent: item.paymentPercent ? `${item.paymentPercent}%` : 'Auto',
      requirement: item.description,
      workflow: source.workflow || source.type || item.typeLabel,
      workflowLabel: source.workflow || source.type || item.typeLabel,
      acceptedEvidence: source.evidenceRequired || 'Defined in the opportunity scope',
      lockedUntilApproved: source.lockedUntilApproved || source.isSequential,
      reference: source.reference || 'Reference files are managed from the brief.',
    }
  })
}

function getApplicationStatus(status) {
  const normalized = String(status || 'submitted').toLowerCase()
  if (['shortlisted', 'interview_scheduled'].includes(normalized)) return { id: 'shortlisted', label: 'Shortlisted', tone: 'orange' }
  if (['accepted', 'awarded'].includes(normalized)) return { id: 'accepted', label: 'Accepted', tone: 'green' }
  if (['rejected', 'removed'].includes(normalized)) return { id: 'rejected', label: 'Rejected', tone: 'red' }
  return { id: 'new', label: 'New', tone: 'blue' }
}

function formatApplicationDate(value) {
  if (!value) return { date: 'Recently', relative: 'Submission time unavailable' }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { date: String(value), relative: '' }

  const elapsedMs = Math.max(0, Date.now() - date.getTime())
  const elapsedHours = Math.floor(elapsedMs / 3_600_000)
  const relative = elapsedHours < 1
    ? 'Less than an hour ago'
    : elapsedHours < 24
      ? `${elapsedHours} hour${elapsedHours === 1 ? '' : 's'} ago`
      : `${Math.floor(elapsedHours / 24)} day${Math.floor(elapsedHours / 24) === 1 ? '' : 's'} ago`

  return {
    date: date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }),
    relative,
  }
}

function toApplicationRow(bid) {
  const student = bid.student || {}
  const applicationStatus = getApplicationStatus(bid.status)
  const submitted = formatApplicationDate(bid.appliedAt || bid.createdAt)
  const name = student.name || bid.bidderName || 'Student applicant'
  const username = student.username ? `@${student.username}` : student.email || 'Zumbarl student'

  return {
    ...bid,
    avatar: student.avatarUrl || '/assets/index/bee_nobg.png',
    bio: student.bio || 'This student has not added a profile summary yet.',
    campus: student.campus || 'Campus not provided',
    completedGigs: student.completedGigs || 0,
    course: student.course || student.careerPath || 'Course not provided',
    creator: name,
    handle: username,
    joined: formatApplicationDate(student.joinedAt).date,
    location: student.locationCity || 'Location not provided',
    questionAnswers: Array.isArray(bid.questionAnswers) ? bid.questionAnswers : [],
    attachments: Array.isArray(bid.attachments) ? bid.attachments : [],
    score: Math.round(student.score || 0),
    skills: Array.isArray(student.skills) ? student.skills : [],
    status: applicationStatus.label,
    statusId: applicationStatus.id,
    submitted: submitted.date,
    submittedAgo: submitted.relative,
    tone: applicationStatus.tone,
  }
}

function toSubmittedAttachment(attachment, index) {
  const mimeType = String(attachment.mimeType || '').toLowerCase()
  const configuredFileType = String(attachment.fileType || 'File')
  const fileName = String(attachment.fileName || '')
  const extension = fileName.split('.').pop()?.toLowerCase()
  let previewType = 'file'
  let fileType = configuredFileType

  if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension)) {
    previewType = 'image'
    fileType = `${(mimeType.split('/')[1] || extension || 'image').toUpperCase()} image`
  } else if (mimeType.startsWith('video/') || ['mp4', 'mov', 'webm'].includes(extension)) {
    previewType = 'video'
    fileType = `${(mimeType.split('/')[1] || extension || 'video').toUpperCase()} video`
  } else if (mimeType === 'application/pdf' || extension === 'pdf') {
    previewType = 'pdf'
    fileType = 'PDF'
  } else if (configuredFileType.toLowerCase() === 'image') {
    previewType = 'image'
  } else if (configuredFileType.toLowerCase() === 'video') {
    previewType = 'video'
  } else if (configuredFileType.toLowerCase() === 'pdf') {
    previewType = 'pdf'
  }

  return {
    id: attachment.uploadId || attachment.requirementId || `attachment-${index}`,
    title: attachment.label || attachment.fileName || `Attachment ${index + 1}`,
    fileType,
    meta: fileName || (configuredFileType.toLowerCase() === 'link' ? 'Submitted link' : 'Submitted file'),
    mimeType: attachment.mimeType,
    previewLabel: configuredFileType.toLowerCase() === 'link' ? 'Open link' : 'View attachment',
    previewType,
    src: attachment.url,
  }
}

function AttachmentPreview({ attachment }) {
  if (!attachment) return null

  if (attachment.previewType === 'image') {
    return <img src={attachment.src} alt={`${attachment.title} preview`} />
  }

  if (attachment.previewType === 'video') {
    return (
      <video controls poster={attachment.poster}>
        <source src={attachment.src} type={attachment.mimeType || 'video/mp4'} />
        <track kind="captions" label="English captions" />
      </video>
    )
  }

  if (attachment.previewType === 'pdf') {
    return <iframe src={attachment.src} title={`${attachment.title} PDF preview`} />
  }

  return (
    <div className="business-review-attachment-preview-empty">
      <FiFileText aria-hidden="true" />
      <p>This file type cannot be previewed inline.</p>
      <a href={attachment.src} target="_blank" rel="noreferrer">Open file</a>
    </div>
  )
}

function ApplicationReviewModal({ application, initialStep = 'review', onClose, onScheduleInterview, onStartInterview }) {
  const [reviewStep, setReviewStep] = useState(initialStep)
  const [previewAttachment, setPreviewAttachment] = useState(null)
  const [interviewType, setInterviewType] = useState('video')
  const [interviewDate, setInterviewDate] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().slice(0, 10)
  })
  const [interviewTime, setInterviewTime] = useState('11:00')
  const [interviewDuration, setInterviewDuration] = useState('30')
  const [meetingOption, setMeetingOption] = useState('generated')
  const [customMeetingUrl, setCustomMeetingUrl] = useState('')
  const [interviewNote, setInterviewNote] = useState('')
  const [isSchedulingInterview, setIsSchedulingInterview] = useState(false)
  const [isStartingInterview, setIsStartingInterview] = useState(false)
  const [scheduleError, setScheduleError] = useState('')
  const [scheduledInterview, setScheduledInterview] = useState(null)

  if (!application) return null

  const isScheduling = reviewStep === 'schedule'
  const interviewStatus = String(application.interview?.status || '').toLowerCase()
  const hasInterview = Boolean(application.interview)
  const canStartInterview = interviewStatus === 'confirmed' && Boolean(application.interview?.meetingUrl)
  const qualificationAnswers = application.questionAnswers
  const submittedAttachments = application.attachments.map(toSubmittedAttachment)

  async function startInterview() {
    if (!application.interview?.meetingUrl) return
    window.open(application.interview.meetingUrl, '_blank', 'noopener,noreferrer')
    setIsStartingInterview(true)
    setScheduleError('')
    try {
      await onStartInterview(application.id)
    } catch (error) {
      setScheduleError(error instanceof Error ? error.message : 'Could not start the interview.')
    } finally {
      setIsStartingInterview(false)
    }
  }

  async function scheduleInterview() {
    if (meetingOption === 'custom' && !customMeetingUrl.trim()) {
      setScheduleError('Enter the custom meeting link.')
      return
    }

    setIsSchedulingInterview(true)
    setScheduleError('')
    try {
      const result = await onScheduleInterview(application.id, {
        interviewType,
        interviewAt: new Date(`${interviewDate}T${interviewTime}:00`).toISOString(),
        durationMinutes: Number(interviewDuration),
        timezone: 'Africa/Nairobi',
        meetingOption: interviewType === 'audio' ? 'phone' : meetingOption,
        meetingUrl: meetingOption === 'custom' ? customMeetingUrl.trim() : undefined,
        note: interviewNote.trim() || undefined,
      })
      setScheduledInterview(result?.interview || result)
    } catch (error) {
      setScheduleError(error instanceof Error ? error.message : 'Could not schedule the interview.')
    } finally {
      setIsSchedulingInterview(false)
    }
  }

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
                  <p>{application.handle}</p>
                </div>
              </div>
              <div className="business-review-applicant-meta">
                <span><FiMapPin aria-hidden="true" /> {application.location}</span>
                <span><FiCalendar aria-hidden="true" /> Joined {application.joined}</span>
              </div>
              <p>{application.bio}</p>
              <dl className="business-review-applicant-stats">
                <div><dt>{application.score}/100</dt><dd>Zumbarl score</dd></div>
                <div><dt>{application.completedGigs}</dt><dd>Completed gigs</dd></div>
                <div><dt>{application.skills.length}</dt><dd>Verified skills</dd></div>
              </dl>
              <div className="business-review-applicant-platforms">
                <h4>Profile</h4>
                <span>{application.course}</span>
                <span>{application.campus}</span>
              </div>
            </section>

            <section className="business-profile-card business-review-applicant-mini-card">
              <header>
                <h3>Jobs Done</h3>
                <span>{application.completedGigs}</span>
              </header>
              <p>Completed Campaigns</p>
              <Link className="ui-button is-ghost" to="/business/applicant-profile">View Portfolio</Link>
            </section>

            <section className="business-profile-card business-review-applicant-score">
              <h3>Generally Competitiveness</h3>
              <div>
                <figure><span>{application.score}/100</span></figure>
                <p><StatusPill tone={application.score >= 70 ? 'green' : 'orange'}>{application.score >= 70 ? 'High' : 'Developing'}</StatusPill>Calculated from the student&apos;s current Zumbarl score.</p>
              </div>
              <button type="button">See how score is calculated</button>
            </section>
          </aside>

          {isScheduling ? (
            <section className="business-review-schedule-panel">
              <div className="business-review-schedule-notice">
                <FiCheckCircle aria-hidden="true" />
                <p>
                  <strong>{scheduledInterview ? `${application.creator} was shortlisted and notified.` : `${application.creator} will be moved to Shortlisted.`}</strong>
                  <span>{scheduledInterview ? 'The student can RSVP, suggest a new time, or cancel with a note.' : 'An email and in-app notification will be sent when you schedule.'}</span>
                </p>
              </div>

              {!scheduledInterview ? (
                <>
                <section className="business-review-schedule-section">
                <h3>1. Interview Type</h3>
                <div className="business-review-interview-type-grid">
                  <label className={interviewType === 'video' ? 'is-selected' : ''}>
                    <input type="radio" name="interview-type" checked={interviewType === 'video'} onChange={() => setInterviewType('video')} />
                    <span><FiVideo aria-hidden="true" /></span>
                    <strong>Video Call</strong>
                    <em>Generated room or custom meeting link</em>
                  </label>
                  <label className={interviewType === 'audio' ? 'is-selected' : ''}>
                    <input type="radio" name="interview-type" checked={interviewType === 'audio'} onChange={() => setInterviewType('audio')} />
                    <span><FiPhone aria-hidden="true" /></span>
                    <strong>Audio Call</strong>
                    <em>Phone call interview</em>
                  </label>
                </div>
              </section>

              <section className="business-review-schedule-section">
                <h3>2. Interview Details</h3>
                <div className="business-review-schedule-fields">
                  <label><span>Date</span><input type="date" required value={interviewDate} onChange={(event) => setInterviewDate(event.target.value)} /></label>
                  <label><span>Time</span><input type="time" required value={interviewTime} onChange={(event) => setInterviewTime(event.target.value)} /></label>
                  <label><span>Duration</span><select value={interviewDuration} onChange={(event) => setInterviewDuration(event.target.value)}><option value="15">15 mins</option><option value="30">30 mins</option><option value="45">45 mins</option><option value="60">60 mins</option></select></label>
                  <label><span>Time Zone</span><select value="Africa/Nairobi" disabled><option value="Africa/Nairobi">EAT (UTC+3)</option></select></label>
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

              {interviewType === 'video' ? (
                <section className="business-review-schedule-section">
                <h3>4. Meeting Link (Optional)</h3>
                <label className="business-review-radio-row"><input type="radio" name="meeting-link" checked={meetingOption === 'generated'} onChange={() => setMeetingOption('generated')} /> <span><strong>Generate secure video room</strong><em>A meeting link will be generated and shared.</em></span></label>
                <label className="business-review-radio-row"><input type="radio" name="meeting-link" checked={meetingOption === 'custom'} onChange={() => setMeetingOption('custom')} /> <span><strong>Add custom meeting link</strong></span></label>
                {meetingOption === 'custom' ? (
                  <label className="business-review-custom-meeting-link">
                    <span>Custom meeting URL</span>
                    <input type="url" required value={customMeetingUrl} placeholder="https://meet.google.com/..." onChange={(event) => setCustomMeetingUrl(event.target.value)} />
                  </label>
                ) : null}
                </section>
              ) : null}

              <section className="business-review-schedule-section">
                <h3>5. Add a Note (Optional)</h3>
                <textarea value={interviewNote} placeholder="Add preparation notes or interview context..." onChange={(event) => setInterviewNote(event.target.value)} />
              </section>
              {scheduleError ? <p className="business-review-schedule-error" role="alert">{scheduleError}</p> : null}
                </>
              ) : null}
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
                  <h4>Proposal</h4>
                  <p>{application.proposal || 'No proposal text was provided.'}</p>
                </li>
                <li>
                  <h4>Commercial offer</h4>
                  <p>{application.currency || 'KES'} {Number(application.bidAmount || 0).toLocaleString()} · {application.deliveryTime || 'Delivery time not specified'}</p>
                </li>
                {application.coverNote ? (
                  <li>
                    <h4>Message to the business</h4>
                    <p>{application.coverNote}</p>
                  </li>
                ) : null}
              </ol>

              {qualificationAnswers.length ? (
                <section className="business-review-qualification-answers">
                  <header>
                    <h3>Application Answers</h3>
                    <p>Answers to the questions configured for this opportunity.</p>
                  </header>
                  <div>
                    {qualificationAnswers.map((item, index) => (
                      <article key={`${item.question}-${index}`}>
                        <span aria-hidden="true"><FiCheckCircle /></span>
                        <div>
                          <h4>{item.question}</h4>
                          <p>{item.answer}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              {submittedAttachments.length ? (
                <section className="business-review-application-attachments">
                  <header>
                    <h3>Submitted Attachments</h3>
                    <p>Files and links saved with this application.</p>
                  </header>
                  <div>
                    {submittedAttachments.map((attachment) => (
                      <article key={attachment.id}>
                        <span aria-hidden="true">
                          {attachment.previewType === 'video' ? <FiVideo /> : attachment.previewType === 'image' ? <FiImage /> : <FiFileText />}
                        </span>
                        <div>
                          <h4>{attachment.title}</h4>
                          <p>{attachment.fileType} · {attachment.meta}</p>
                        </div>
                        <button type="button" onClick={() => setPreviewAttachment(attachment)}>
                          <FiEye aria-hidden="true" />
                          {attachment.previewLabel}
                        </button>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </section>
          )}
        </div>

        {previewAttachment ? (
          <section className="business-review-attachment-preview-modal" role="dialog" aria-modal="true" aria-labelledby="attachment-preview-title">
            <header>
              <div>
                <h3 id="attachment-preview-title">{previewAttachment.title}</h3>
                <p>{previewAttachment.fileType} attachment preview</p>
              </div>
              <button type="button" aria-label="Close attachment preview" onClick={() => setPreviewAttachment(null)}>
                <FiX aria-hidden="true" />
              </button>
            </header>
            <div>
              <AttachmentPreview attachment={previewAttachment} />
            </div>
            <footer>
              <a href={previewAttachment.src} target="_blank" rel="noreferrer">
                <FiDownload aria-hidden="true" />
                Open original
              </a>
              <Button tone="ghost" onClick={() => setPreviewAttachment(null)}>Close preview</Button>
            </footer>
          </section>
        ) : null}

        <footer>
          {isScheduling ? (
            <>
              <Button tone="ghost" onClick={onClose}>{scheduledInterview ? 'Close' : 'Cancel'}</Button>
              {!scheduledInterview ? (
                <>
                  <Button tone="ghost" onClick={() => setReviewStep('review')}>Back</Button>
                  <Button tone="brand" disabled={isSchedulingInterview} onClick={scheduleInterview}>
                    {isSchedulingInterview ? 'Scheduling...' : 'Shortlist & Schedule Interview'}
                  </Button>
                </>
              ) : null}
            </>
          ) : (
            <>
              <Button tone="ghost" onClick={onClose}>Close</Button>
              <Button className="business-review-modal-reject" tone="ghost">Reject</Button>
              {!hasInterview ? (
                <Button className="business-review-modal-shortlist" tone="ghost" onClick={() => setReviewStep('schedule')}>Shortlist</Button>
              ) : null}
              {interviewStatus === 'confirmed' ? (
                <Button tone="brand" disabled={!canStartInterview || isStartingInterview} onClick={startInterview}>
                  {isStartingInterview ? 'Starting...' : canStartInterview ? 'Start Interview' : 'Interview Confirmed'}
                </Button>
              ) : null}
              {interviewStatus === 'pending' ? (
                <Button tone="ghost" disabled>Awaiting RSVP</Button>
              ) : null}
              {interviewStatus === 'proposed_new_time' ? (
                <Button tone="brand" onClick={() => setReviewStep('schedule')}>Review Proposed Time</Button>
              ) : null}
              {interviewStatus === 'cancelled' ? (
                <Button tone="brand" onClick={() => setReviewStep('schedule')}>Reschedule Interview</Button>
              ) : null}
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

const DELIVERABLE_WORKFLOW_OPTIONS = [
  {
    value: 'file-assets',
    label: 'File Asset Deliverables',
    acceptedEvidence: 'PNG, JPG, PDF, SVG, MP4, MOV, AI, PSD, Figma link, or Canva link.',
    type: 'Type 1 - File Asset',
  },
  {
    value: 'code-development',
    label: 'Code & Development Deliverables',
    acceptedEvidence: 'GitHub repository, commit history, live URL, ZIP fallback, test evidence, or Loom walkthrough.',
    type: 'Type 2 - Code & Development',
  },
  {
    value: 'documents',
    label: 'Document Deliverables',
    acceptedEvidence: 'Google Docs link, PDF, DOCX, report, script, proposal, source notes, or originality evidence.',
    type: 'Type 3 - Document',
  },
  {
    value: 'stats-metrics',
    label: 'Stats & Metrics Deliverables',
    acceptedEvidence: 'Analytics screenshots, CSV export, dashboard link, before/after metrics, or verified platform report.',
    type: 'Type 4 - Stats & Metrics',
  },
  {
    value: 'proof-based',
    label: 'Proof-Based Deliverables',
    acceptedEvidence: 'Geo-tagged photos, timestamped screenshots, signed confirmation, location proof, or recipient proof.',
    type: 'Type 5 - Proof-Based',
  },
  {
    value: 'hybrid',
    label: 'Hybrid Deliverables',
    acceptedEvidence: 'A combined package of files, links, proof, metrics, and supporting notes needed for approval.',
    type: 'Type 6 - Hybrid',
  },
]

const NEW_DELIVERABLE_TEMPLATE = {
  acceptanceCriteria: 'No watermarks, follows brand assets, and includes editable source files for work above KES 5,000.',
  budget: '6,000',
  lockedUntilApproved: true,
  requirement: 'Design and upload the final campaign graphics plus editable source files.',
  title: 'Create branded social media assets',
  workflow: 'file-assets',
}

function getDeliverableWorkflow(workflowValue, deliverableType = '') {
  const matchedWorkflow = DELIVERABLE_WORKFLOW_OPTIONS.find((workflow) => workflow.value === workflowValue)
  if (matchedWorkflow) return matchedWorkflow

  const matchedType = DELIVERABLE_WORKFLOW_OPTIONS.find((workflow) => deliverableType.includes(workflow.type.replace(/^Type \d - /, '')))
  return matchedType || DELIVERABLE_WORKFLOW_OPTIONS[0]
}

function getDeliverablePaymentPercent(draft, drafts) {
  const totalBudget = drafts.reduce((sum, item) => sum + Number(String(item.budget).replace(/,/g, '') || 0), 0)
  const draftBudget = Number(String(draft.budget).replace(/,/g, '') || 0)

  if (!totalBudget) return Math.round(100 / drafts.length)

  return Math.round((draftBudget / totalBudget) * 100)
}

function createDeliverableDraft(index = 0) {
  return {
    ...NEW_DELIVERABLE_TEMPLATE,
    id: `draft-deliverable-${Date.now()}-${index}`,
    title: index ? `New Deliverable ${index + 1}` : NEW_DELIVERABLE_TEMPLATE.title,
  }
}

function DeliverableDetailsModal({ deliverable, onClose }) {
  if (!deliverable) return null

  const workflow = getDeliverableWorkflow(deliverable.workflow, deliverable.type)

  return (
    <div className="business-review-modal-backdrop" role="presentation">
      <section className="business-review-deliverable-details-modal" role="dialog" aria-modal="true" aria-labelledby="deliverable-details-title">
        <header>
          <div>
            <h2 id="deliverable-details-title">{deliverable.title}</h2>
            <p>Deliverable scope details from the opportunity setup.</p>
          </div>
          <button type="button" aria-label="Close deliverable details" onClick={onClose}>
            <FiX aria-hidden="true" />
          </button>
        </header>

        <div className="business-review-deliverable-details-body">
          <section>
            <h3>Deliverable Summary</h3>
            <dl>
              <div><dt>Workflow</dt><dd>{deliverable.workflowLabel || workflow.label}</dd></div>
              <div><dt>Accepted evidence</dt><dd>{deliverable.acceptedEvidence || workflow.acceptedEvidence}</dd></div>
              <div><dt>Budget</dt><dd>{deliverable.budget || 'Not assigned'}</dd></div>
              <div><dt>Payment %</dt><dd>{deliverable.paymentPercent || 'Calculated from budget'}</dd></div>
              <div><dt>Status</dt><dd><StatusPill tone={deliverable.tone}>{deliverable.status}</StatusPill></dd></div>
              <div><dt>Submission lock</dt><dd>{deliverable.lockedUntilApproved ? 'Locks later deliverables' : 'No sequencing lock'}</dd></div>
            </dl>
          </section>

          <section>
            <h3>Deliverable Requirement</h3>
            <p>{deliverable.requirement || deliverable.description}</p>
          </section>

          <section>
            <h3>Acceptance Criteria</h3>
            <p>{deliverable.acceptanceCriteria}</p>
          </section>

          <section>
            <h3>Student Submission Rules</h3>
            <p>{deliverable.lockedUntilApproved ? 'Later deliverable submissions stay locked until this deliverable is approved.' : 'Students can submit later deliverables without waiting for this one to be approved.'}</p>
          </section>
        </div>

        <footer>
          <Button tone="ghost" onClick={onClose}>Close</Button>
        </footer>
      </section>
    </div>
  )
}

function AddDeliverableModal({ isOpen, onClose, onCreate }) {
  const [activeTab, setActiveTab] = useState('deliverables')
  const [drafts, setDrafts] = useState(() => [createDeliverableDraft()])

  if (!isOpen) return null

  const totalBudget = drafts.reduce((sum, draft) => sum + Number(String(draft.budget).replace(/,/g, '') || 0), 0)

  function updateDraft(id, field, value) {
    setDrafts((items) => items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  function addDraft() {
    setDrafts((items) => [...items, createDeliverableDraft(items.length)])
  }

  function removeDraft(id) {
    setDrafts((items) => (items.length > 1 ? items.filter((item) => item.id !== id) : items))
  }

  function handleClose() {
    setActiveTab('deliverables')
    setDrafts([createDeliverableDraft()])
    onClose()
  }

  function handleCreate() {
    onCreate(drafts)
    handleClose()
  }

  return (
    <div className="business-review-modal-backdrop" role="presentation">
      <section className="business-review-add-deliverable-modal" role="dialog" aria-modal="true" aria-labelledby="add-deliverable-title">
        <header>
          <div>
            <h2 id="add-deliverable-title">Add Deliverables</h2>
            <p>{activeTab === 'deliverables' ? 'Add one or more deliverables for creators to submit.' : 'Review the deliverables before creating them.'}</p>
          </div>
          <button type="button" aria-label="Close add deliverable" onClick={handleClose}>
            <FiX aria-hidden="true" />
          </button>
        </header>

        <TabNav
          activeId={activeTab}
          ariaLabel="Add deliverable steps"
          className="business-review-add-tabs"
          items={[
            { id: 'deliverables', label: 'Deliverables' },
            { id: 'review', label: 'Review' },
          ]}
          onChange={setActiveTab}
        />

        <div className="business-review-add-deliverable-body">
          {activeTab === 'deliverables' ? (
            <>
              {drafts.map((draft, index) => (
                <section key={draft.id} className="business-review-add-draft-card">
                  <header>
                    <div>
                      <p>Deliverable {index + 1}</p>
                      <h3>{draft.title}</h3>
                    </div>
                    <button type="button" aria-label={`Remove deliverable ${index + 1}`} onClick={() => removeDraft(draft.id)}>
                      <FiX aria-hidden="true" />
                    </button>
                  </header>

                  <div className="business-review-add-two-column">
                    <label className="business-review-add-field">
                      <span>Deliverable Workflow</span>
                      <select value={draft.workflow} onChange={(event) => updateDraft(draft.id, 'workflow', event.target.value)}>
                        {DELIVERABLE_WORKFLOW_OPTIONS.map((workflow) => (
                          <option key={workflow.value} value={workflow.value}>{workflow.label}</option>
                        ))}
                      </select>
                      <small>{getDeliverableWorkflow(draft.workflow).acceptedEvidence}</small>
                    </label>
                    <label className="business-review-add-field">
                      <span>Title</span>
                      <input type="text" value={draft.title} onChange={(event) => updateDraft(draft.id, 'title', event.target.value)} />
                    </label>
                  </div>

                  <label className="business-review-add-field">
                    <span>Deliverable Requirement</span>
                    <textarea value={draft.requirement} onChange={(event) => updateDraft(draft.id, 'requirement', event.target.value)} />
                  </label>

                  <div className="business-review-add-two-column">
                    <label className="business-review-add-field">
                      <span>Budget (KES)</span>
                      <input type="text" value={draft.budget} onChange={(event) => updateDraft(draft.id, 'budget', event.target.value)} />
                    </label>
                    <label className="business-review-add-field">
                      <span>Payment %</span>
                      <input type="text" value={getDeliverablePaymentPercent(draft, drafts)} readOnly />
                      <small>Recalculates based on total deliverables</small>
                    </label>
                  </div>

                  <label className="business-review-add-field">
                    <span>Acceptance Criteria</span>
                    <textarea value={draft.acceptanceCriteria} onChange={(event) => updateDraft(draft.id, 'acceptanceCriteria', event.target.value)} />
                  </label>

                  <label className="business-review-add-lock">
                    <input
                      type="checkbox"
                      checked={draft.lockedUntilApproved}
                      onChange={(event) => updateDraft(draft.id, 'lockedUntilApproved', event.target.checked)}
                    />
                    <span>Lock later deliverable submissions until this deliverable is approved</span>
                  </label>
                </section>
              ))}
              <button type="button" className="business-review-add-more-deliverable" onClick={addDraft}>
                <FiPlus aria-hidden="true" />
                Add another deliverable
              </button>
            </>
          ) : null}

          {activeTab === 'review' ? (
            <section className="business-review-add-review">
              <h3>Review New Deliverables</h3>
              <p>{drafts.length} deliverable{drafts.length === 1 ? '' : 's'} will be created and added to this opportunity.</p>
              {drafts.map((draft, index) => (
                <article key={draft.id}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{draft.title}</strong>
                    <p>{getDeliverableWorkflow(draft.workflow).label} · {getDeliverableWorkflow(draft.workflow).acceptedEvidence}</p>
                    <em>{draft.requirement}</em>
                  </div>
                  <strong>{getDeliverablePaymentPercent(draft, drafts)}%</strong>
                  <b>KES {Number(String(draft.budget).replace(/,/g, '') || 0).toLocaleString()}</b>
                </article>
              ))}
              <footer><span>Total budget to approve</span><strong>KES {totalBudget.toLocaleString()}</strong></footer>
            </section>
          ) : null}
        </div>

        <footer>
          <Button tone="ghost" onClick={activeTab === 'deliverables' ? handleClose : () => setActiveTab('deliverables')}>{activeTab === 'deliverables' ? 'Cancel' : 'Back'}</Button>
          <Button tone="brand" onClick={activeTab === 'review' ? handleCreate : () => setActiveTab('review')}>
            {activeTab === 'deliverables' ? 'Review Deliverables' : 'Create Deliverables'}
          </Button>
        </footer>
      </section>
    </div>
  )
}

function PublishOpportunityModal({ isOpen, opportunity, type, onClose }) {
  const [publishStep, setPublishStep] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('wallet')
  const [selectedCardId, setSelectedCardId] = useState('visa-8421')

  if (!isOpen) return null

  const paymentMethods = {
    wallet: {
      actionLabel: 'Pay with Wallet',
      amountCopy: 'This amount will be deducted from your Zumbarl wallet balance and held in escrow.',
      detailCopy: 'Confirm that you want to fund this opportunity from your wallet.',
      detailTitle: 'Use your Zumbarl wallet balance',
      label: 'Zumbarl Wallet',
      meta: 'Available Balance: KES 32,450',
      nextLabel: 'Next: Wallet Confirmation',
      stepLabel: 'Wallet Confirmation',
      summary: 'Fund escrow instantly from your Zumbarl wallet.',
    },
    'mobile-money': {
      actionLabel: 'Send STK Push',
      amountCopy: 'This amount will be requested through M-Pesa STK push.',
      detailCopy: 'Enter your phone number to receive the payment request.',
      detailTitle: 'You will receive an STK push on your registered phone number',
      label: 'Mobile Money STK Push',
      meta: 'M-Pesa request sent to your phone',
      nextLabel: 'Next: STK Push',
      stepLabel: 'STK Push',
      summary: 'Complete payment from your phone.',
    },
    bank: {
      actionLabel: 'Confirm Bank Transfer',
      amountCopy: 'Transfer this amount to the Zumbarl escrow account and upload the payment reference.',
      detailCopy: 'Use the reference below so finance can match your transfer to this opportunity.',
      detailTitle: 'Make a bank transfer to Zumbarl escrow',
      label: 'Bank Transfer',
      meta: 'Manual transfer, reviewed by finance',
      nextLabel: 'Next: Bank Details',
      stepLabel: 'Bank Details',
      summary: 'Send payment directly to our bank account.',
    },
    card: {
      actionLabel: 'Pay with Card',
      amountCopy: 'Your card will be charged securely after confirmation.',
      detailCopy: 'Enter card details to complete escrow funding for this opportunity.',
      detailTitle: 'Pay securely with card',
      label: 'Card Payment',
      meta: 'Visa, Mastercard and supported cards',
      nextLabel: 'Next: Card Checkout',
      stepLabel: 'Card Checkout',
      summary: 'Complete payment with a debit or credit card.',
    },
  }
  const selectedPaymentMethod = paymentMethods[paymentMethod]
  const paymentScopeItems = getOpportunityPaymentScopeItems(opportunity)
  const scopedBudgetTotal = paymentScopeItems.reduce((total, item) => total + item.budgetAmount, 0)
  const fallbackBudgetTotal = getCurrencyAmount(opportunity.budget || opportunity.budgetAmount)
  const paymentBudgetTotal = scopedBudgetTotal || fallbackBudgetTotal
  const paymentBudgetLabel = formatKesAmount(paymentBudgetTotal)
  const skills = getSkillList(opportunity)
  const modalObjective = opportunity.opportunityType || type
  const modalDeadline = opportunity.deadline === 'Rolling' ? 'Rolling' : formatOpportunityDate(opportunity.deadline, 'Rolling')
  const savedCards = [
    { id: 'visa-8421', label: 'Visa ending 8421', meta: 'Expires 08/28', brand: 'Visa' },
    { id: 'mastercard-1134', label: 'Mastercard ending 1134', meta: 'Expires 11/27', brand: 'Mastercard' },
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
          <li className={publishStep === 3 ? 'is-active' : ''}><span>3</span><strong>{selectedPaymentMethod.stepLabel}</strong><em>Complete payment</em></li>
        </ol>

        <div className="business-review-publish-body">
          <section className="business-review-publish-summary">
            <h2>Opportunity Summary</h2>
            <div>
              <figure>
                <img src={getOpportunityCoverImage(opportunity)} alt={`${opportunity.title} cover`} style={getSplashCropStyle(opportunity.opportunitySplash) || undefined} />
                <figcaption>{opportunity.title}</figcaption>
              </figure>
              <dl>
                <div><dt>Type</dt><dd>{type}</dd></div>
                <div><dt>Objective</dt><dd>{modalObjective}</dd></div>
                <div><dt>Category</dt><dd>{opportunity.category || 'Education & Learning'}</dd></div>
              </dl>
              <dl>
                <div><dt>Engagement Mode</dt><dd>{opportunity.engagementMode || 'Remote'}</dd></div>
                <div><dt>Visibility</dt><dd>Visible to all creators</dd></div>
                <div><dt>Deadline</dt><dd>{modalDeadline}</dd></div>
              </dl>
              <dl>
                <div><dt>Budget</dt><dd>{paymentBudgetLabel}</dd></div>
                <div><dt>Skills</dt><dd>{skills.length ? skills.slice(0, 3).join(', ') : 'Not specified'}</dd></div>
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
                    <strong>You selected: {selectedPaymentMethod.label}</strong>
                    <em>{selectedPaymentMethod.meta}</em>
                  </div>
                  <section className="business-review-publish-amount">
                    <span>Amount to Pay</span>
                    <strong>{paymentBudgetLabel}</strong>
                    <p>{selectedPaymentMethod.amountCopy}</p>
                  </section>
                  {paymentMethod === 'wallet' ? (
                    <section className="business-review-publish-phone">
                      <header>
                        <FiCreditCard aria-hidden="true" />
                        <div>
                          <strong>{selectedPaymentMethod.detailTitle}</strong>
                          <p>{selectedPaymentMethod.detailCopy}</p>
                        </div>
                      </header>
                      <label>
                        <span>Wallet Balance</span>
                        <div><strong>KES</strong><input type="text" defaultValue="32,450" readOnly /><StatusPill tone="green">Enough funds</StatusPill></div>
                        <em>{paymentBudgetLabel} will move into escrow after confirmation.</em>
                      </label>
                    </section>
                  ) : paymentMethod === 'mobile-money' ? (
                    <section className="business-review-publish-phone">
                      <header>
                        <FiMessageSquare aria-hidden="true" />
                        <div>
                          <strong>{selectedPaymentMethod.detailTitle}</strong>
                          <p>{selectedPaymentMethod.detailCopy}</p>
                        </div>
                      </header>
                      <label>
                        <span>Phone Number</span>
                        <div><strong>KE</strong><input type="text" defaultValue="+254 712 345 678" /><StatusPill tone="green">Verified</StatusPill></div>
                        <em>Make sure this is the number registered with M-Pesa.</em>
                      </label>
                    </section>
                  ) : paymentMethod === 'bank' ? (
                    <section className="business-review-publish-phone">
                      <header>
                        <FiCreditCard aria-hidden="true" />
                        <div>
                          <strong>{selectedPaymentMethod.detailTitle}</strong>
                          <p>{selectedPaymentMethod.detailCopy}</p>
                        </div>
                      </header>
                      <label>
                        <span>Bank Reference</span>
                        <div><strong>REF</strong><input type="text" defaultValue={`ZMB-${String(opportunity.id || 'OPP').slice(-6).toUpperCase()}`} /><StatusPill tone="blue">Required</StatusPill></div>
                        <em>Bank: Zumbarl Escrow Account · Account: 123456789 · Branch: Nairobi</em>
                      </label>
                    </section>
                  ) : (
                    <section className="business-review-publish-phone">
                      <header>
                        <FiCreditCard aria-hidden="true" />
                        <div>
                          <strong>{selectedPaymentMethod.detailTitle}</strong>
                          <p>{selectedPaymentMethod.detailCopy}</p>
                        </div>
                      </header>
                      <div className="business-review-card-selector" role="radiogroup" aria-label="Saved cards">
                        {savedCards.map((card) => (
                          <label key={card.id} className={selectedCardId === card.id ? 'is-selected' : ''}>
                            <input
                              type="radio"
                              name="publish-saved-card"
                              checked={selectedCardId === card.id}
                              onChange={() => setSelectedCardId(card.id)}
                            />
                            <span><strong>{card.brand}</strong>{card.label}</span>
                            <em>{card.meta}</em>
                          </label>
                        ))}
                      </div>
                      <Link to="/business/settings#payment-methods" className="business-review-add-card-link">
                        <FiPlus aria-hidden="true" />
                        Add card in Settings
                      </Link>
                      <p className="business-review-card-note">Card details are managed in business settings and encrypted by the payment provider.</p>
                    </section>
                  )}
                </div>
                <aside className="business-review-publish-phone-preview" aria-label={`${selectedPaymentMethod.stepLabel} preview`}>
                  <div>
                    <span>{selectedPaymentMethod.stepLabel}</span>
                    <strong>Zumbarl<br />{paymentBudgetLabel}</strong>
                    <p>{selectedPaymentMethod.summary}</p>
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
                <label className={paymentMethod === 'wallet' ? 'is-selected' : ''}>
                  <input type="radio" name="publish-payment-method" checked={paymentMethod === 'wallet'} onChange={() => setPaymentMethod('wallet')} />
                  <span><FiCreditCard aria-hidden="true" /></span>
                  <strong>Pay with Wallet <em>(Recommended)</em></strong>
                  <small>Use your existing Zumbarl wallet balance.</small>
                  <b>Available Balance<br />KES 32,450</b>
                </label>
                <label className={paymentMethod === 'mobile-money' ? 'is-selected' : ''}>
                  <input type="radio" name="publish-payment-method" checked={paymentMethod === 'mobile-money'} onChange={() => setPaymentMethod('mobile-money')} />
                  <span><FiCreditCard aria-hidden="true" /></span>
                  <strong>Mobile Money STK Push</strong>
                  <small>Send an M-Pesa payment request to your phone.</small>
                  <b>Processing Time<br />Instant</b>
                </label>
                <label className={paymentMethod === 'bank' ? 'is-selected' : ''}>
                  <input type="radio" name="publish-payment-method" checked={paymentMethod === 'bank'} onChange={() => setPaymentMethod('bank')} />
                  <span><FiCreditCard aria-hidden="true" /></span>
                  <strong>Bank Transfer</strong>
                  <small>Make payment directly to our bank account.</small>
                  <b>Processing Time<br />1-2 hours</b>
                </label>
                <label className={paymentMethod === 'card' ? 'is-selected' : ''}>
                  <input type="radio" name="publish-payment-method" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                  <span><FiCreditCard aria-hidden="true" /></span>
                  <strong>Pay with Card</strong>
                  <small>Pay securely using Visa, Mastercard or other cards.</small>
                  <b>Processing Time<br />Instant</b>
                </label>
              </div>
              <aside>
                <FiMessageSquare aria-hidden="true" />
                <span>{selectedPaymentMethod.summary}</span>
              </aside>
            </section>
          ) : (
            <>
              <section className="business-review-publish-breakdown">
                <header>
                  <div>
                    <h2>Budget & Services Breakdown</h2>
                    <p>Review the payment schedule from this opportunity&apos;s saved scope and budget.</p>
                  </div>
                </header>
                <div className="business-review-publish-table">
                  <div className="business-review-publish-table-head">
                    <span>Milestone / Deliverable</span>
                    <span>Description</span>
                    <span>Type</span>
                    <span>Payment Split</span>
                    <span>Total (KES)</span>
                    <span />
                  </div>
                  {paymentScopeItems.length ? paymentScopeItems.map((service, index) => (
                    <article key={service.id} className="business-review-publish-table-row">
                      <div>
                        <DeliverableIcon icon="scope" />
                        <strong>{service.title}</strong>
                      </div>
                      <p>{service.description}</p>
                      <span>{service.typeLabel} {index + 1}</span>
                      <span>{service.paymentPercent ? `${service.paymentPercent}%` : 'Auto'}</span>
                      <strong>{service.budgetAmount.toLocaleString()}</strong>
                      <span />
                    </article>
                  )) : (
                    <article className="business-review-publish-table-row">
                      <div>
                        <DeliverableIcon icon="scope" />
                        <strong>{opportunity.title || 'Opportunity budget'}</strong>
                      </div>
                      <p>No scoped deliverables were found, so the saved opportunity budget is being used.</p>
                      <span>Budget</span>
                      <span>100%</span>
                      <strong>{paymentBudgetTotal.toLocaleString()}</strong>
                      <span />
                    </article>
                  )}
                </div>
                <footer>
                  <p><span>Subtotal</span><strong>{paymentBudgetLabel}</strong></p>
                </footer>
              </section>

              <section className="business-review-publish-total">
                <span>Total Budget</span>
                <strong>{paymentBudgetLabel}</strong>
                <p>This is derived from the opportunity&apos;s deliverable or milestone budgets.</p>
              </section>
            </>
          )}

          {publishStep === 3 ? (
            <section className="business-review-publish-next">
              <h2>What happens next?</h2>
              <div>
                <article><FiUsers aria-hidden="true" /><span><strong>1. {selectedPaymentMethod.stepLabel} Started</strong><em>{paymentMethod === 'wallet' ? 'We will reserve the amount from your wallet.' : paymentMethod === 'mobile-money' ? 'You will receive an STK push on your phone.' : paymentMethod === 'bank' ? 'Use the bank details and reference shown above.' : 'The secure card checkout is ready.'}</em></span></article>
                <article><FiLock aria-hidden="true" /><span><strong>2. Complete {selectedPaymentMethod.stepLabel}</strong><em>{paymentMethod === 'wallet' ? 'Confirm wallet deduction to fund escrow.' : paymentMethod === 'mobile-money' ? 'Enter your PIN to authorize the payment.' : paymentMethod === 'bank' ? 'Send the transfer and keep the reference visible.' : 'Confirm the secure card payment.'}</em></span></article>
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
          {publishStep === 3 ? <p><FiMessageSquare aria-hidden="true" /> {paymentMethod === 'bank' ? 'We will publish after the transfer is confirmed.' : paymentMethod === 'wallet' ? 'Your opportunity will publish after wallet escrow is funded.' : 'You will be redirected after successful payment.'}</p> : null}
          <Button tone="brand" onClick={() => setPublishStep(Math.min(3, publishStep + 1))}>
            {publishStep === 3 ? selectedPaymentMethod.actionLabel : publishStep === 2 ? selectedPaymentMethod.nextLabel : 'Next: Payment Method'}
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

function ApplicationsPanel({
  activeApplicationStatus,
  applications,
  applicationsError,
  isLoadingApplications,
  onChangeApplicationStatus,
  onScheduleApplicantInterview,
  onStartApplicantInterview,
}) {
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [initialReviewStep, setInitialReviewStep] = useState('review')
  const [searchQuery, setSearchQuery] = useState('')
  const [startError, setStartError] = useState('')
  const isShortlisted = activeApplicationStatus === 'shortlisted'
  const applicationRows = applications.map(toApplicationRow)
  const normalizedSearch = searchQuery.trim().toLowerCase()
  const filteredApplications = applicationRows.filter((application) => {
    if (activeApplicationStatus !== 'all' && application.statusId !== activeApplicationStatus) return false
    if (!normalizedSearch) return true
    return [
      application.creator,
      application.handle,
      application.course,
      application.campus,
      application.skills.join(' '),
    ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch))
  })
  const applicationCounts = applicationRows.reduce((counts, application) => ({
    ...counts,
    all: counts.all + 1,
    [application.statusId]: (counts[application.statusId] || 0) + 1,
  }), { all: 0, new: 0, shortlisted: 0, accepted: 0, rejected: 0 })

  function openApplicationReview(application, step = 'review') {
    setInitialReviewStep(step)
    setSelectedApplication(application)
  }

  async function handleInterviewAction(application) {
    const interviewStatus = String(application.interview?.status || '').toLowerCase()
    if (interviewStatus === 'confirmed' && application.interview?.meetingUrl) {
      window.open(application.interview.meetingUrl, '_blank', 'noopener,noreferrer')
      setStartError('')
      try {
        await onStartApplicantInterview(application.id)
      } catch (error) {
        setStartError(error instanceof Error ? error.message : 'Could not start the interview.')
      }
      return
    }
    openApplicationReview(application, 'schedule')
  }

  function getInterviewAction(application) {
    const interviewStatus = String(application.interview?.status || '').toLowerCase()
    if (interviewStatus === 'confirmed') {
      return {
        disabled: !application.interview?.meetingUrl,
        label: application.interview?.meetingUrl ? 'Start Interview' : 'Interview Confirmed',
      }
    }
    if (interviewStatus === 'pending') return { disabled: true, label: 'Awaiting RSVP' }
    if (interviewStatus === 'proposed_new_time') return { disabled: false, label: 'Review Proposed Time' }
    if (interviewStatus === 'cancelled') return { disabled: false, label: 'Reschedule Interview' }
    return { disabled: false, label: 'Schedule Interview' }
  }

  return (
    <section className="business-profile-card business-review-applications-card">
      <header>
        <div>
          <h2>All Applications</h2>
          <p>Review, evaluate and manage creator applications.</p>
        </div>
      </header>

      <TabNav
        activeId={activeApplicationStatus}
        ariaLabel="Application status filters"
        className="business-review-application-tabs"
        items={APPLICATION_FILTERS}
        onChange={onChangeApplicationStatus}
        renderTab={(filter) => (
          <>
            {filter.label}
            <span>{applicationCounts[filter.id] || 0}</span>
          </>
        )}
      />

      <div className={isShortlisted ? 'business-review-shortlisted-toolbar' : 'business-review-application-toolbar'}>
        <label>
          <FiSearch aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            placeholder="Search applicants by name, course, campus or skill..."
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>
        <select defaultValue={isShortlisted ? 'recently-shortlisted' : 'newest'} aria-label="Sort applications">
          <option value="newest">Sort by: Newest</option>
          <option value="recently-shortlisted">Sort by: Recently Shortlisted</option>
        </select>
        <button type="button">
          <FiFilter aria-hidden="true" />
          Filters
        </button>
      </div>

      {isLoadingApplications ? (
        <div className="business-review-applications-empty">
          <FiUsers aria-hidden="true" />
          <strong>Loading applicants...</strong>
          <p>Fetching applications saved for this opportunity.</p>
        </div>
      ) : applicationsError ? (
        <div className="business-review-applications-empty is-error" role="alert">
          <FiUsers aria-hidden="true" />
          <strong>Applicants could not be loaded</strong>
          <p>{applicationsError}</p>
        </div>
      ) : !filteredApplications.length ? (
        <div className="business-review-applications-empty">
          <FiUsers aria-hidden="true" />
          <strong>No matching applications</strong>
          <p>{applicationRows.length ? 'Try another status or search term.' : 'No students have applied for this opportunity yet.'}</p>
        </div>
      ) : isShortlisted ? (
        <div className="business-review-shortlisted-table">
          <div className="business-review-shortlisted-head">
            <span><input type="checkbox" aria-label="Select all shortlisted applications" /></span>
            <span>Applicant</span>
            <span>Course</span>
            <span>Campus</span>
            <span>Bid</span>
            <span>Submitted</span>
            <span>Actions</span>
          </div>
          {filteredApplications.map((row) => {
            const interviewAction = getInterviewAction(row)
            return (
            <article key={row.id} className="business-review-shortlisted-row">
              <span><input type="checkbox" aria-label={`Select ${row.creator}`} /></span>
              <PersonRow
                avatar={row.avatar}
                className="business-review-application-creator"
                name={row.creator}
                subtitle={row.handle}
                badge={row.status === 'New' ? <em>New</em> : null}
              />
              <span>{row.course}</span>
              <strong>{row.campus}</strong>
              <strong className="business-review-engagement-rate">{row.currency || 'KES'} {Number(row.bidAmount || 0).toLocaleString()}</strong>
              <time>{row.submitted}<span>{row.submittedAgo}</span></time>
              <div className="business-review-shortlisted-actions">
                <button type="button" onClick={() => openApplicationReview(row)}>Review</button>
                <button type="button" disabled={interviewAction.disabled} onClick={() => handleInterviewAction(row)}>
                  {interviewAction.label}
                </button>
                <button type="button" aria-label={`More actions for ${row.creator}`}><FiMoreVertical aria-hidden="true" /></button>
              </div>
            </article>
            )
          })}
        </div>
      ) : (
        <div className="business-review-application-table">
        <div className="business-review-application-head">
          <span><input type="checkbox" aria-label="Select all applications" /></span>
          <span>Applicant</span>
          <span>Course</span>
          <span>Campus</span>
          <span>Bid</span>
          <span>Submitted</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {filteredApplications.map((row) => (
          <article key={row.id} className="business-review-application-row">
            <span><input type="checkbox" aria-label={`Select ${row.creator}`} /></span>
            <PersonRow
              avatar={row.avatar}
              className="business-review-application-creator"
              name={row.creator}
              subtitle={row.handle}
              badge={row.status === 'New' ? <em>New</em> : null}
            />
            <span>{row.course}</span>
            <strong>{row.campus}</strong>
            <strong className="business-review-engagement-rate">{row.currency || 'KES'} {Number(row.bidAmount || 0).toLocaleString()}</strong>
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
        <p>Showing {filteredApplications.length} of {applicationRows.length} applications</p>
        {startError ? <span role="alert">{startError}</span> : null}
      </footer>
      <ApplicationReviewModal
        application={selectedApplication}
        initialStep={initialReviewStep}
        onClose={() => setSelectedApplication(null)}
        onScheduleInterview={onScheduleApplicantInterview}
        onStartInterview={onStartApplicantInterview}
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

function BusinessDeliverableMessagesPanel({ conversation = null, opportunity = null }) {
  const [activeCall, setActiveCall] = useState(null)
  const [callMessage, setCallMessage] = useState('')
  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState('')
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [messageError, setMessageError] = useState('')
  const [isSending, setIsSending] = useState(false)
  const opportunityId = conversation?.opportunityId || opportunity?.backendId || null
  const activeConversation = conversations.find((item) => item.id === activeConversationId) || conversations[0] || null

  async function loadOpportunityConversations(preferredConversation = conversation) {
    const response = await listConversations()
    const matching = (response?.data || []).filter((item) => (
      !opportunityId || item.opportunityId === opportunityId
    ))
    setConversations(matching)
    setActiveConversationId((current) => {
      const preferredId = preferredConversation
        ? `${preferredConversation.participant.id}:${preferredConversation.opportunityId || ''}`
        : ''
      if (preferredId && matching.some((item) => item.id === preferredId)) return preferredId
      if (matching.some((item) => item.id === current)) return current
      return matching[0]?.id || ''
    })
  }

  useEffect(() => {
    listConversations()
      .then((response) => {
        const matching = (response?.data || []).filter((item) => (
          !opportunityId || item.opportunityId === opportunityId
        ))
        setConversations(matching)
        const preferredId = conversation
          ? `${conversation.participant.id}:${conversation.opportunityId || ''}`
          : ''
        setActiveConversationId(
          matching.some((item) => item.id === preferredId) ? preferredId : matching[0]?.id || '',
        )
      })
      .catch((error) => setMessageError(error.message))
  }, [conversation?.participant?.id, opportunityId])

  useEffect(() => {
    if (!activeConversation) return
    listMessages({
      participantId: activeConversation.participant.id,
      opportunityId: activeConversation.opportunityId,
    })
      .then((response) => setMessages(response || []))
      .catch((error) => setMessageError(error.message))
  }, [activeConversation?.id])

  useEffect(() => {
    const handleMessage = (event) => {
      const message = event.detail
      loadOpportunityConversations().catch(() => {})
      if (
        activeConversation
        && message.senderId === activeConversation.participant.id
        && (message.opportunityId || null) === (activeConversation.opportunityId || null)
      ) {
        listMessages({
          participantId: activeConversation.participant.id,
          opportunityId: activeConversation.opportunityId,
        }).then((response) => setMessages(response || [])).catch(() => {})
      }
    }
    const handleReceipt = (event) => {
      setMessages((current) => current.map((message) => (
        message.id === event.detail.messageId
          ? { ...message, ...event.detail, isRead: Boolean(event.detail.readAt) }
          : message
      )))
    }
    window.addEventListener('zumbarl:message-created', handleMessage)
    window.addEventListener('zumbarl:message-receipt', handleReceipt)
    return () => {
      window.removeEventListener('zumbarl:message-created', handleMessage)
      window.removeEventListener('zumbarl:message-receipt', handleReceipt)
    }
  }, [activeConversation?.id, opportunityId])

  useEffect(() => {
    if (!activeCall?.id || activeCall.status !== 'ringing') return undefined
    playCallRingtone()
    const ringtoneIntervalId = window.setInterval(playCallRingtone, 2200)
    const intervalId = window.setInterval(async () => {
      try {
        const call = await readCall(activeCall.id)
        setActiveCall(call)
        if (call.status === 'accepted') {
          setActiveCall(null)
          setCallMessage('')
          openCallOverlay(call)
        } else if (call.status !== 'ringing') {
          setCallMessage(`Call ${call.status}.`)
        }
      } catch (error) {
        setCallMessage(error.message)
      }
    }, 1500)
    return () => {
      window.clearInterval(ringtoneIntervalId)
      window.clearInterval(intervalId)
    }
  }, [activeCall?.id, activeCall?.status])

  async function startCall(callType) {
    if (!activeConversation?.participant?.id) {
      setCallMessage('This conversation does not have a real recipient yet.')
      return
    }
    setCallMessage(`Starting ${callType} call…`)
    try {
      const call = await createCall({
        recipientId: activeConversation.participant.id,
        opportunityId: activeConversation.opportunityId,
        callType,
      })
      setActiveCall(call)
      setCallMessage(`Calling ${activeConversation.participant.name || 'student'}…`)
    } catch (error) {
      setCallMessage(error.message)
    }
  }

  async function stopCalling() {
    if (!activeCall?.id) return
    await cancelCall(activeCall.id).catch(() => {})
    setActiveCall(null)
    setCallMessage('Call cancelled.')
  }

  async function submitMessage(event) {
    event.preventDefault()
    const body = draft.trim()
    if (!body || !activeConversation || isSending) return
    setIsSending(true)
    setMessageError('')
    try {
      const message = await sendMessage({
        recipientId: activeConversation.participant.id,
        opportunityId: activeConversation.opportunityId,
        body,
      })
      setMessages((current) => [...current, message])
      setDraft('')
      playMessageSentSound()
      await loadOpportunityConversations()
    } catch (error) {
      setMessageError(error.message)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section className="business-review-messages-grid">
      <aside className="business-review-message-list">
        <h3>Messages</h3>
        <label>
          <FiMessageSquare aria-hidden="true" />
          <input type="search" placeholder="Search messages" />
        </label>
        {conversations.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === activeConversation?.id ? 'is-active' : ''}
            onClick={() => setActiveConversationId(item.id)}
          >
            <img src={item.participant.avatarUrl || '/assets/index/bee_nobg.png'} alt="" />
            <span>
              <strong>{item.participant.name}</strong>
              <em>{item.latestMessage.body}</em>
            </span>
            {item.unreadCount ? <small>{item.unreadCount}</small> : null}
          </button>
        ))}
        {!conversations.length ? <p>No real conversations for this opportunity yet.</p> : null}
      </aside>

      {activeConversation ? (
        <section className="business-review-chat">
          <header>
            <img src={activeConversation.participant.avatarUrl || '/assets/index/bee_nobg.png'} alt="" />
            <div>
              <h3>{activeConversation.participant.name || 'Student applicant'}</h3>
              <p>{opportunity?.title || 'Opportunity conversation'}</p>
            </div>
            <button type="button" aria-label="Call" onClick={() => startCall('audio')}><FiPhone aria-hidden="true" /></button>
            <button type="button" aria-label="Video call" onClick={() => startCall('video')}><FiVideo aria-hidden="true" /></button>
            <button type="button" aria-label="Thread info"><FiSettings aria-hidden="true" /></button>
          </header>

          <div className="business-review-chat-body">
            {callMessage ? (
              <div className="business-call-status" role="status">
                <span>{callMessage}</span>
                {activeCall?.status === 'ringing' ? <button type="button" onClick={stopCalling}>Cancel</button> : null}
              </div>
            ) : null}
            <p className="business-review-chat-start">
              This is the beginning of your conversation for {opportunity?.title || 'this opportunity'}.
            </p>
            {messages.map((message) => (
              <article key={message.id} className={message.senderId !== activeConversation.participant.id ? 'is-mine' : ''}>
                {message.senderId === activeConversation.participant.id ? <img src={activeConversation.participant.avatarUrl || '/assets/index/bee_nobg.png'} alt="" /> : null}
                <div>
                  <p>
                    <strong>{message.senderId !== activeConversation.participant.id ? 'You' : activeConversation.participant.name}</strong>
                    <span>
                      {new Date(message.createdAt).toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit' })}
                      {message.senderId !== activeConversation.participant.id
                        ? ` · ${message.isRead ? 'Read' : message.deliveredAt ? 'Delivered' : 'Sent'}`
                        : ''}
                    </span>
                  </p>
                  <div className="business-review-chat-bubble">{message.body}</div>
                </div>
              </article>
            ))}
          </div>
          <form onSubmit={submitMessage}>
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={`Message ${activeConversation.participant.name}`}
              aria-label="Opportunity message"
            />
            <button type="submit" className="business-profile-primary-btn" aria-label="Send opportunity message" disabled={!draft.trim() || isSending}>
              <FiSend aria-hidden="true" />
            </button>
          </form>
          {messageError ? <p className="business-message-error" role="alert">{messageError}</p> : null}
        </section>
      ) : (
        <section className="business-review-chat business-review-chat-empty">
          <FiMessageSquare aria-hidden="true" />
          <h3>No conversation selected</h3>
          <p>Start an interview or open Messages to begin a verified conversation.</p>
        </section>
      )}
    </section>
  )
}

function DeliverablesPanel({ onRequestPayment, opportunity }) {
  const [activeDeliverableTab, setActiveDeliverableTab] = useState('deliverables')
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [selectedDeliverable, setSelectedDeliverable] = useState(null)
  const [addedDeliverableRows, setAddedDeliverableRows] = useState([])
  const [isAddingDeliverable, setIsAddingDeliverable] = useState(false)
  const isSubmittedWork = activeDeliverableTab === 'submitted-work'
  const isFiles = activeDeliverableTab === 'files'
  const isMessages = activeDeliverableTab === 'messages'
  const deliverableRows = [...addedDeliverableRows, ...getOpportunityDeliverableRows(opportunity)]
  const deliverableCount = deliverableRows.length

  function getDeliverableIcon(type) {
    if (type.includes('Code')) return 'x'
    if (type.includes('Document')) return 'youtube'
    if (type.includes('Proof')) return 'tiktok'
    return 'instagram'
  }

  function createDeliverableRows(drafts) {
    const timestamp = Date.now()

    const rows = drafts.map((draft, index) => {
      const budgetValue = Number(String(draft.budget).replace(/,/g, '') || 0)
      const workflow = getDeliverableWorkflow(draft.workflow)
      const paymentPercent = getDeliverablePaymentPercent(draft, drafts)

      return {
        id: `added-deliverable-${timestamp}-${index}`,
        title: draft.title,
        required: true,
        type: workflow.type,
        description: draft.requirement,
        requirement: draft.requirement,
        workflow: draft.workflow,
        workflowLabel: workflow.label,
        acceptedEvidence: workflow.acceptedEvidence,
        dueDate: 'Scheduled after agreement',
        dueMeta: 'Payment approved',
        submissions: '0',
        status: 'Approved',
        tone: 'green',
        icon: getDeliverableIcon(workflow.type),
        acceptanceCriteria: draft.acceptanceCriteria,
        paymentPercent: `${paymentPercent}%`,
        lockedUntilApproved: draft.lockedUntilApproved,
        budget: `KES ${budgetValue.toLocaleString()}`,
      }
    })

    setAddedDeliverableRows((items) => [...rows, ...items])
    onRequestPayment?.()
  }

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

      <TabNav
        activeId={activeDeliverableTab}
        ariaLabel="Deliverable sections"
        className="business-review-application-tabs"
        items={DELIVERABLE_FILTERS}
        onChange={setActiveDeliverableTab}
        renderTab={(filter) => (
          <>
            {filter.label}
            <span>{filter.id === 'deliverables' ? deliverableCount : filter.count}</span>
          </>
        )}
      />

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

            {deliverableRows.map((row) => (
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
                  <button type="button" onClick={() => setSelectedDeliverable(row)}>View</button>
                  <button type="button" aria-label={`More actions for ${row.title}`}>
                    <FiMoreVertical aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>

          <footer className="business-review-deliverable-footer">
            Showing 1-{deliverableCount} of {deliverableCount} deliverables
          </footer>
        </>
      )}
      <DeliverableDetailsModal
        deliverable={selectedDeliverable}
        onClose={() => setSelectedDeliverable(null)}
      />
      <AddDeliverableModal
        isOpen={isAddingDeliverable}
        onClose={() => setIsAddingDeliverable(false)}
        onCreate={createDeliverableRows}
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

function DetailBlock({ items, title }) {
  return (
    <section className="business-review-detail-block">
      <h3>{title}</h3>
      <dl>
        {items.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value || 'Not set'}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function OverviewPanel({ opportunity, skills, type }) {
  const deadline = opportunity.deadline === 'Rolling' ? 'Rolling' : formatOpportunityDate(opportunity.deadline, 'Rolling')
  const paymentScopeItems = getOpportunityPaymentScopeItems(opportunity)
  const scopedBudgetTotal = paymentScopeItems.reduce((total, item) => total + item.budgetAmount, 0)
  const budget = formatKesAmount(scopedBudgetTotal || opportunity.budget || opportunity.budgetAmount)
  const upcomingInterviews = [
    { id: 'aisha-mwangi', icon: FiVideo, name: 'Aisha Mwangi', time: 'Today, 2:00 PM', note: 'Portfolio review', status: 'Needs link' },
    { id: 'brian-otieno', icon: FiPhone, name: 'Brian Otieno', time: 'Tomorrow, 10:30 AM', note: 'Phone screen', status: 'Confirmed' },
    { id: 'grace-wanjiku', icon: FiVideo, name: 'Grace Wanjiku', time: 'Friday, 4:00 PM', note: 'Final interview', status: 'Pending' },
  ]

  return (
    <section className="business-profile-card business-review-overview-readonly-card">
      <header>
        <div>
          <h2>Opportunity Overview</h2>
          <p>Read-only summary of the brief, applicant access and upcoming hiring actions.</p>
        </div>
        <div>
          <button type="button" className="business-profile-primary-btn">
            <FiSend aria-hidden="true" />
            Invite Applicants
          </button>
        </div>
      </header>

      <div className="business-review-overview-actions">
        <article>
          <FiUsers aria-hidden="true" />
          <span><strong>Invite qualified applicants</strong><em>18 matched students can be invited now</em></span>
          <button type="button">Invite applicants</button>
        </article>
        <article>
          <FiMessageSquare aria-hidden="true" />
          <span><strong>Accessibility notes</strong><em>Remote-friendly, flexible timing, interview accommodations available</em></span>
          <button type="button">Share notes</button>
        </article>
      </div>

      <section className="business-review-upcoming-interviews">
        <header>
          <div>
            <h3>Immediate Upcoming Interviews</h3>
            <p>Shortlist conversations that need attention this week.</p>
          </div>
          <button type="button">View schedule</button>
        </header>
        <div>
          {upcomingInterviews.map((interview) => {
            const InterviewIcon = interview.icon

            return (
              <article key={interview.id}>
                <span><InterviewIcon aria-hidden="true" /></span>
                <div>
                  <strong>{interview.name}</strong>
                  <em>{interview.note}</em>
                </div>
                <time>{interview.time}</time>
                <StatusPill tone={interview.status === 'Confirmed' ? 'green' : 'purple'}>{interview.status}</StatusPill>
              </article>
            )
          })}
        </div>
      </section>

      <div className="business-review-readonly-grid">
        <DetailBlock
          title="Brief Details"
          items={[
            { label: 'Opportunity title', value: opportunity.title },
            { label: 'Type', value: type },
            { label: 'Category', value: opportunity.category },
            { label: 'Engagement mode', value: opportunity.engagementMode || opportunity.mode || 'Remote' },
            { label: 'Visibility', value: 'Visible to all creators' },
            { label: 'Deadline', value: deadline },
          ]}
        />

        <section className="business-review-detail-block">
          <h3>Audience & Requirements</h3>
          <p>{opportunity.description || opportunity.summary || 'No summary provided.'}</p>
          <div className="business-review-interest-row" aria-label="Required skills">
            {skills.slice(0, 6).map((skill) => <span key={skill}>{skill}</span>)}
          </div>
          <dl>
            <div><dt>Location</dt><dd>Kenya</dd></div>
            <div><dt>Age range</dt><dd>18 - 28</dd></div>
            <div><dt>Gender</dt><dd>All</dd></div>
          </dl>
        </section>

        <section className="business-review-detail-block">
          <h3>Scope & Deliverables</h3>
          <ul>
            {paymentScopeItems.length ? paymentScopeItems.map((item, index) => (
              <li key={item.id}><span>{item.title}</span><strong>{item.paymentPercent ? `${item.paymentPercent}%` : `#${index + 1}`}</strong></li>
            )) : (
              <li><span>Scoped deliverables</span><strong>Not set</strong></li>
            )}
          </ul>
          <p>{opportunity.deliverables || 'Deliverables are listed in the scoped brief.'}</p>
        </section>

        <section className="business-review-detail-block">
          <h3>Budget & Compensation</h3>
          <dl>
            <div><dt>Total budget</dt><dd>{budget}</dd></div>
            <div><dt>Compensation model</dt><dd>{opportunity.paymentTerms || 'Pay per deliverable'}</dd></div>
            <div><dt>Duration</dt><dd>{opportunity.duration || 'Flexible'}</dd></div>
          </dl>
          <ul>
            {paymentScopeItems.length ? paymentScopeItems.map((item) => (
              <li key={item.id}><span>{item.title}</span><strong>{formatKesAmount(item.budgetAmount)}</strong><em>{item.paymentPercent ? `${item.paymentPercent}%` : 'Auto'}</em></li>
            )) : (
              <li><span>Saved budget</span><strong>{budget}</strong><em>100%</em></li>
            )}
          </ul>
        </section>

        <section className="business-review-detail-block business-review-accessibility-block">
          <h3>Applicant Accessibility</h3>
          <ul>
            <li><FiCheckCircle aria-hidden="true" /><span>Remote interview option available</span></li>
            <li><FiCheckCircle aria-hidden="true" /><span>Flexible scheduling before final selection</span></li>
            <li><FiCheckCircle aria-hidden="true" /><span>Applicants can request communication accommodations</span></li>
          </ul>
        </section>
      </div>
    </section>
  )
}

export function BusinessOpportunityReviewWorkspace({
  activeApplicationStatus,
  activeInterviewConversation,
  activeReviewTab,
  applications = [],
  applicationsError = '',
  isLoadingApplications = false,
  onBack,
  onChangeApplicationStatus,
  onChangeReviewTab,
  onPublishOpportunity,
  onScheduleApplicantInterview,
  onStartApplicantInterview,
  openPublishPayment = false,
  opportunity,
}) {
  const [isPublishingOpportunity, setIsPublishingOpportunity] = useState(openPublishPayment)

  if (!opportunity) return null

  const skills = getSkillList(opportunity)
  const type = opportunity.category === 'Social Media' ? 'Campaign' : opportunity.mode || 'Project'
  const reviewTabs = getReviewTabs(opportunity, applications.length)
  const canShowPerformance = opportunity.scopeMode === 'milestone'
  const coverImage = getOpportunityCoverImage(opportunity)
  const createdOn = formatOpportunityDate(opportunity.createdAt, 'Just now')
  const deadline = opportunity.deadline === 'Rolling' ? 'Rolling' : formatOpportunityDate(opportunity.deadline, 'Rolling')
  const objective = opportunity.opportunityType || type
  const skillSummary = skills.length ? `${skills.slice(0, 3).join(', ')}${skills.length > 3 ? ` +${skills.length - 3}` : ''}` : 'Not specified'

  function startPublishPayment() {
    if (opportunity.status === 'Draft') {
      onPublishOpportunity?.(opportunity)
    }
    setIsPublishingOpportunity(true)
  }

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
          <button type="button" className="business-profile-primary-btn" onClick={startPublishPayment}>
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
          <img src={coverImage} alt={`${opportunity.title} opportunity`} style={getSplashCropStyle(opportunity.opportunitySplash) || undefined} />
        </div>
        <dl>
          <div><dt>Type</dt><dd>{type}</dd></div>
          <div><dt>Objective</dt><dd>{objective}</dd></div>
          <div><dt>Category</dt><dd>{opportunity.category}</dd></div>
          <div><dt>Skills</dt><dd>{skillSummary}</dd></div>
        </dl>
        <dl>
          <div><dt>Budget</dt><dd>{opportunity.budget}</dd></div>
          <div><dt>Applications</dt><dd>{applications.length} ({applications.filter((application) => getApplicationStatus(application.status).id === 'new').length} new)</dd></div>
          <div><dt>Status</dt><dd><span>{opportunity.status}</span></dd></div>
          <div><dt>Deadline</dt><dd>{deadline}</dd></div>
        </dl>
        <dl>
          <div><dt>Created by</dt><dd>{opportunity.company || 'Business account'}</dd></div>
          <div><dt>Created on</dt><dd>{createdOn}</dd></div>
          <div><dt>Engagement Mode</dt><dd>{opportunity.engagementMode || 'Remote'}</dd></div>
          <div><dt>Visible to</dt><dd>{opportunity.visibility || 'All creators'}</dd></div>
        </dl>
      </section>

      <TabNav
        activeId={activeReviewTab}
        ariaLabel="Opportunity review sections"
        className="business-review-detail-tabs"
        items={reviewTabs}
        onChange={onChangeReviewTab}
        renderTab={(tab) => (
          <>
            {tab.label}
            {tab.count ? <span>{tab.count}</span> : null}
          </>
        )}
      />

      {activeReviewTab === 'applications' ? (
        <ApplicationsPanel
          activeApplicationStatus={activeApplicationStatus}
          applications={applications}
          applicationsError={applicationsError}
          isLoadingApplications={isLoadingApplications}
          onChangeApplicationStatus={onChangeApplicationStatus}
          onScheduleApplicantInterview={onScheduleApplicantInterview}
          onStartApplicantInterview={onStartApplicantInterview}
        />
      ) : activeReviewTab === 'deliverables' ? (
        <DeliverablesPanel onRequestPayment={startPublishPayment} opportunity={opportunity} />
      ) : activeReviewTab === 'payments' ? (
        <PaymentsPanel />
      ) : activeReviewTab === 'performance' && canShowPerformance ? (
        <PerformancePanel />
      ) : activeReviewTab === 'messages' ? (
        <section className="business-profile-card business-review-deliverables-card">
          <header>
            <div>
              <h2>Messages</h2>
              <p>Coordinate with creators around evidence, revisions and approvals.</p>
            </div>
          </header>
          <BusinessDeliverableMessagesPanel conversation={activeInterviewConversation} opportunity={opportunity} />
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
