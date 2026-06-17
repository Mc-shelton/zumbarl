import {
  FiBriefcase,
  FiDownload,
  FiExternalLink,
  FiMessageCircle,
  FiShare2,
} from 'react-icons/fi'
import { ACCESS_KEYS, filterByAccess } from '../auth/roleConfig'

export const BUSINESS_APPLICANT_PROFILE = {
  name: 'Aisha Mwangi',
  role: 'Student',
  school: 'Strathmore University',
  year: 'Year 3',
  focus: 'Marketing & Design',
  location: 'Nairobi, Kenya',
  email: 'aisha.mwangi@gmail.com',
  avatar: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
  company: 'Zetech Studios',
}

export const BUSINESS_APPLICANT_TAGS = ['Social Media', 'Graphic Design', 'Canva', 'Copywriting', '+4']

export const BUSINESS_APPLICANT_METRICS = [
  { label: 'Zumbarl Score', value: '74', sub: 'Tier 3 - Silver', award: true },
  { label: 'Gigs Completed', value: '23', sub: '18 rated - 5 pending' },
  { label: 'Delivery Rate', value: '94%', sub: '22 of 23 on time' },
  { label: 'Avg. Rating', value: '4.6/5', sub: 'from 18 reviews' },
  { label: 'Repeat Clients', value: '7', sub: 'out of 12 clients' },
]

export const BUSINESS_APPLICANT_TAB_CONFIG = [
  {
    label: 'Overview',
    requiredAccess: [ACCESS_KEYS.business.applicantProfiles, ACCESS_KEYS.business.applicantProfilesLimited],
  },
  { label: 'Portfolio', requiredAccess: ACCESS_KEYS.business.applicantProfiles },
  { label: 'Experience', requiredAccess: ACCESS_KEYS.business.applicantProfiles },
  { label: 'Skills', requiredAccess: ACCESS_KEYS.business.applicantProfiles },
  { label: 'Shop', requiredAccess: ACCESS_KEYS.business.applicantProfiles },
  { label: 'Education', requiredAccess: ACCESS_KEYS.business.applicantProfiles },
  { label: 'Reviews', requiredAccess: ACCESS_KEYS.business.applicantProfiles },
  { label: 'Activity', requiredAccess: ACCESS_KEYS.business.applicantProfiles },
]
export const BUSINESS_APPLICANT_TABS = filterByAccess(BUSINESS_APPLICANT_TAB_CONFIG).map((tab) => tab.label)

export const BUSINESS_APPLICANT_SCORE_BREAKDOWN = [
  { label: 'Gig volume', value: 7, max: 10 },
  { label: 'Avg. rating', value: 9, max: 10 },
  { label: 'Delivery rate', value: 9, max: 10 },
  { label: 'Repeat clients', value: 5, max: 10 },
  { label: 'Endorsements', value: 3, max: 10 },
]

export const BUSINESS_APPLICANT_TOP_SKILLS = [
  { label: 'Social media', level: 'L4', progress: 92 },
  { label: 'Graphic design', level: 'L3', progress: 66 },
  { label: 'Copywriting', level: 'L3', progress: 58 },
  { label: 'Video editing', level: 'L2', progress: 42 },
  { label: 'Data entry', level: 'L1', progress: 26 },
]

export const BUSINESS_APPLICANT_EARNINGS = [
  { label: 'This month', value: 'KSh 12,400' },
  { label: 'Last month', value: 'KSh 9,800' },
  { label: 'Total earned', value: 'KSh 74,200' },
  { label: 'Chama contribution', value: 'KSh 7,420' },
  { label: 'Avg. per gig', value: 'KSh 3,226' },
]

export const BUSINESS_APPLICANT_EDUCATION = [
  { label: 'Institution', value: 'Strathmore University' },
  { label: 'Program', value: 'Marketing & Design' },
  { label: 'Year', value: 'Year 3' },
  { label: 'Career track', value: 'Brand growth and digital campaigns' },
]

export const BUSINESS_APPLICANT_SHOP_ITEMS = [
  { label: 'Campaign content package', value: 'KES 6,500' },
  { label: 'Canva poster kit', value: 'KES 2,800' },
  { label: 'WhatsApp launch copy', value: 'KES 3,200' },
]

export const BUSINESS_APPLICANT_WORK_HIGHLIGHTS = [
  {
    title: 'Instagram campaign',
    org: 'BrandMasters Agency',
    rating: '5.0',
    image: '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp',
  },
  {
    title: 'Brand poster set',
    org: 'NaiKreative Studio',
    rating: '4.5',
    image: '/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp',
  },
  {
    title: 'WhatsApp channel content',
    org: 'Pesaflow Fintech',
    rating: '4.8',
    image: '/assets/index/business_page_images/optimized/omar-lopez-1qfy-jDc_jo-unsplash.webp',
  },
  {
    title: 'Logo refresh',
    org: 'BrandMasters Agency',
    rating: '4.0',
    image: '/assets/index/bee_nobg.png',
  },
]

export const BUSINESS_APPLICANT_ENDORSEMENTS = [
  {
    initials: 'BM',
    company: 'BrandMasters Agency',
    person: 'Sarah K. - Creative Director',
    quote: 'Aisha delivers high-quality work and understands our brand voice perfectly.',
    date: 'May 18, 2025',
    reward: '+12 EC',
  },
  {
    initials: 'JB',
    company: 'BrandMasters Agency',
    person: 'James O. - Founder',
    quote: 'Great turnaround, and always meets deadlines.',
    date: 'May 10, 2025',
    reward: '+12 EC',
  },
  {
    initials: 'PF',
    company: 'Pesaflow Fintech',
    person: 'Amina W. - Marketing Lead',
    quote: 'Aisha is proactive, creative and a great team player.',
    date: 'Apr 28, 2025',
    reward: '+12 EC',
  },
]

export const BUSINESS_APPLICANT_ENGAGEMENT_SUMMARY = [
  { label: 'Last active', value: '2 hours ago' },
  { label: 'Response rate', value: '96%' },
  { label: 'Avg. response time', value: '1.2 hours' },
  { label: 'Jobs completed', value: '7' },
  { label: 'Jobs in progress', value: '1' },
]

export const BUSINESS_APPLICANT_QUICK_ACTION_CONFIG = [
  { label: 'Send Message', Icon: FiMessageCircle, requiredAccess: ACCESS_KEYS.business.messages },
  { label: 'Invite to Opportunity', Icon: FiBriefcase, requiredAccess: ACCESS_KEYS.business.postOpportunities },
  {
    label: 'View Full Profile',
    Icon: FiExternalLink,
    requiredAccess: [ACCESS_KEYS.business.applicantProfiles, ACCESS_KEYS.business.applicantProfilesLimited],
  },
  { label: 'Download CV', Icon: FiDownload, requiredAccess: ACCESS_KEYS.business.applicantProfiles },
  {
    label: 'Share Profile',
    Icon: FiShare2,
    requiredAccess: [ACCESS_KEYS.business.applicantProfiles, ACCESS_KEYS.business.applicantProfilesLimited],
  },
]
export const BUSINESS_APPLICANT_QUICK_ACTIONS = filterByAccess(BUSINESS_APPLICANT_QUICK_ACTION_CONFIG)
