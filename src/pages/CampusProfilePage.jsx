import { useEffect, useState } from 'react'
import {
  FiAtSign,
  FiArrowRight,
  FiAward,
  FiBarChart2,
  FiBell,
  FiBookmark,
  FiBookOpen,
  FiBriefcase,
  FiCreditCard,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiDownload,
  FiEdit3,
  FiFilm,
  FiGrid,
  FiHeart,
  FiHome,
  FiImage,
  FiMail,
  FiMapPin,
  FiMessageCircle,
  FiInfo,
  FiMoreVertical,
  FiPackage,
  FiPlusCircle,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiSettings,
  FiShare2,
  FiShoppingBag,
  FiStar,
  FiTrendingUp,
  FiTruck,
  FiUsers,
  FiX,
} from 'react-icons/fi'
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa6'
import { Link, useSearchParams } from 'react-router-dom'
import Seo from '../components/Seo'
import { CAMPUS_PROFILE_SEO } from '../features/seo/constants'
import '../styles/campus.css'
import '../styles/profile.css'

const SIDEBAR_NAV_ITEMS = [
  { label: 'Home', Icon: FiHome, href: '/campus' },
  { label: 'Opportunities', Icon: FiBriefcase, href: '/campus/opportunities' },
  { label: 'Explore Campus', Icon: FiCalendar, href: '/campus/explore' },
  { label: 'Learn & Grow', Icon: FiBookOpen },
  { label: 'Community', Icon: FiUsers },
  { label: 'Finance', Icon: FiCreditCard },
  { label: 'Services', Icon: FiTruck },
  { label: 'Messages', Icon: FiMail },
  { label: 'Notifications', Icon: FiBell },
]

const PROFILE_TAGS = ['Social Media', 'Graphic Design', 'Canva', 'Copywriting', '+4']
const PROFILE_TABS = ['Overview', 'Portfolio', 'Experience', 'Skills', 'Shop', 'Education', 'Reviews', 'Activity']
const PROFILE_SCORE = 74

const PROFILE_METRICS = [
  { label: 'Zumbarl Score', value: '74', meta: 'Tier 3 · Silver', Icon: FiAward, tone: 'purple' },
  { label: 'Gigs Completed', value: '23', meta: '18 rated · 5 pending', Icon: FiBriefcase, tone: 'green' },
  { label: 'Delivery Rate', value: '94%', meta: '22 of 23 on time', Icon: FiTrendingUp, tone: 'mint' },
  { label: 'Avg. Rating', value: '4.6/5', meta: 'from 18 reviews', Icon: FiStar, tone: 'blue' },
  { label: 'Repeat Clients', value: '7', meta: 'out of 12 clients', Icon: FiUsers, tone: 'violet' },
]

const SCORE_BARS = [
  { label: 'Gig volume', value: 7, max: 10 },
  { label: 'Avg. rating', value: 9, max: 10 },
  { label: 'Delivery rate', value: 9, max: 10 },
  { label: 'Repeat clients', value: 5, max: 10 },
  { label: 'Endorsements', value: 3, max: 10 },
]

const SCORE_COLOR_MIN = { r: 164, g: 171, b: 189 }
const SCORE_COLOR_MAX = { r: 14, g: 122, b: 60 }

function getScoreFillColor(value, max) {
  if (max <= 0) {
    return `rgb(${SCORE_COLOR_MIN.r}, ${SCORE_COLOR_MIN.g}, ${SCORE_COLOR_MIN.b})`
  }

  const ratio = Math.min(1, Math.max(0, value / max))
  const r = Math.round(SCORE_COLOR_MIN.r + (SCORE_COLOR_MAX.r - SCORE_COLOR_MIN.r) * ratio)
  const g = Math.round(SCORE_COLOR_MIN.g + (SCORE_COLOR_MAX.g - SCORE_COLOR_MIN.g) * ratio)
  const b = Math.round(SCORE_COLOR_MIN.b + (SCORE_COLOR_MAX.b - SCORE_COLOR_MIN.b) * ratio)

  return `rgb(${r}, ${g}, ${b})`
}

const TOP_SKILLS = [
  { label: 'Social media', level: 'L4', value: 90 },
  { label: 'Graphic design', level: 'L3', value: 66 },
  { label: 'Copywriting', level: 'L3', value: 58 },
  { label: 'Video editing', level: 'L2', value: 40 },
  { label: 'Data entry', level: 'L1', value: 24 },
]

const EARNINGS_SUMMARY = [
  { label: 'This month', value: 'KSh 12,400' },
  { label: 'Last month', value: 'KSh 9,800' },
  { label: 'Total earned', value: 'KSh 74,200' },
  { label: 'Chama contribution', value: 'KSh 7,420' },
  { label: 'Avg. per gig', value: 'KSh 3,226' },
]

const PIPELINE_RELATIONSHIPS = [
  { initials: 'BM', name: 'BrandMasters Agency', meta: '7 gigs · 2 endorsements', status: 'Pipeline active' },
  { initials: 'PZ', name: 'Pesaflow Fintech', meta: '3 gigs · 1 endorsement', status: 'Warming up' },
  { initials: 'NK', name: 'NaiKreative Studio', meta: '1 gig · no endorsement', status: 'Early' },
]

const RECENT_ACTIVITY = [
  {
    title: 'Gig completed',
    detail: 'Instagram campaign',
    time: '2h ago',
    Icon: FiCheckCircle,
    tone: 'green',
  },
  {
    title: 'Payment received',
    detail: 'KSh 3,500 from BrandMasters',
    time: '5h ago',
    Icon: FiBriefcase,
    tone: 'teal',
  },
  {
    title: 'New endorsement',
    detail: '+12 EC from BrandMasters',
    time: '1 day ago',
    Icon: FiStar,
    tone: 'yellow',
  },
  {
    title: 'Review received',
    detail: '4.8/5 for WhatsApp content',
    time: '2 days ago',
    Icon: FiMessageCircle,
    tone: 'purple',
  },
]

const WORK_HIGHLIGHTS = [
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
    image: '/assets/index/business_page_images/justin-buisson-vIluu0IH6Ps-unsplash.jpg',
  },
]

const ENDORSEMENTS = [
  {
    initials: 'BM',
    company: 'BrandMasters Agency',
    person: 'Sarah K. · Creative Director',
    quote: 'Aisha delivers high-quality work and understands our brand voice.',
    reward: '+12 EC',
    date: 'May 18, 2025',
  },
  {
    initials: 'BM',
    company: 'BrandMasters Agency',
    person: 'James O. · Founder',
    quote: 'Great turnaround, and always meets deadlines.',
    reward: '+12 EC',
    date: 'May 10, 2025',
  },
  {
    initials: 'PZ',
    company: 'Pesaflow Fintech',
    person: 'Amina W. · Marketing Lead',
    quote: 'Aisha is proactive, creative and a great team player.',
    reward: '+12 EC',
    date: 'Apr 28, 2025',
  },
]

const ACHIEVEMENTS = [
  { title: 'Zumbarl Silver', subtitle: 'Score 50+', Icon: FiAward, tone: 'purple' },
  { title: 'Top Rated', subtitle: 'Maintain 4.5+ rating', Icon: FiStar, tone: 'yellow' },
  { title: 'Quick Responder', subtitle: '90% response rate', Icon: FiMessageCircle, tone: 'green' },
  { title: 'Consistent Performer', subtitle: '10 gigs completed', Icon: FiCheckCircle, tone: 'teal' },
]

const QUICK_ACTIONS = [
  { label: 'Edit Profile', Icon: FiEdit3 },
  { label: 'Add Portfolio Item', Icon: FiPlusCircle },
  { label: 'Upload Certificate', Icon: FiAward },
  { label: 'Share Profile', Icon: FiShare2 },
  { label: 'Download CV', Icon: FiDownload },
]

const EXPERIENCE_STAGES = [
  {
    step: 1,
    title: 'Explore & Foundation',
    description: 'Build core skills and explore career foundations',
    status: 'Completed',
    statusTone: 'complete',
    completion: '100%',
    projects: 3,
    companies: 2,
    Icon: FiBookOpen,
  },
  {
    step: 2,
    title: 'Build & Apply',
    description: 'Apply your skills to real projects and solve problems',
    status: 'Completed',
    statusTone: 'complete',
    completion: '100%',
    projects: 6,
    companies: 4,
    Icon: FiBriefcase,
  },
  {
    step: 3,
    title: 'Grow & Specialize',
    description: 'Deepen your expertise and take on complex work',
    status: 'In Progress',
    statusTone: 'progress',
    completion: '65%',
    projects: 5,
    companies: 3,
    Icon: FiTrendingUp,
  },
  {
    step: 4,
    title: 'Lead & Impact',
    description: 'Lead projects and create measurable impact',
    status: 'Locked',
    statusTone: 'locked',
    completion: '0%',
    projects: 0,
    companies: 0,
    Icon: FiAward,
  },
  {
    step: 5,
    title: 'Advance & Mentor',
    description: 'Advance your career and mentor others',
    status: 'Locked',
    statusTone: 'locked',
    completion: '0%',
    projects: 0,
    companies: 0,
    Icon: FiUsers,
  },
]

const EXPERIENCE_CURRENT_STAGE = {
  title: 'Grow & Specialize',
  status: 'In Progress',
  progress: 65,
  summary: "You're building advanced skills and taking on more responsibility. Keep going!",
}

const EXPERIENCE_STAGE_PROJECTS = [
  {
    title: 'Brand Poster Set for NaiKreative',
    company: 'NaiKreative Studio',
    date: 'May 8, 2025',
    status: 'Completed',
    statusTone: 'complete',
    rating: '4.5/5',
    image: '/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp',
  },
  {
    title: 'Instagram Campaign for BrandMasters',
    company: 'BrandMasters Agency',
    date: 'May 12, 2025',
    status: 'Completed',
    statusTone: 'complete',
    rating: '5.0/5',
    image: '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp',
  },
  {
    title: 'Website Banner Design for Pesaflow',
    company: 'Pesaflow Fintech',
    date: 'May 15, 2025',
    status: 'Completed',
    statusTone: 'complete',
    rating: '4.9/5',
    image: '/assets/index/business_page_images/optimized/sable-flow-T74mVg__F_k-unsplash.webp',
  },
  {
    title: 'Ebook Content for BrandMasters',
    company: 'BrandMasters Agency',
    date: 'May 20, 2025',
    status: 'In Review',
    statusTone: 'review',
    rating: null,
    image: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
  },
  {
    title: 'Social Media Content Series',
    company: 'Glow Jewelry',
    date: 'May 22, 2025',
    status: 'In Progress',
    statusTone: 'progress',
    rating: null,
    image: '/assets/index/business_page_images/optimized/alejandro-escamilla-BbQLHCpVUqA-unsplash.webp',
  },
]

const EXPERIENCE_PATH_CARD = {
  name: 'Marketing & Design',
  tags: ['Creative', 'Strategic', 'Impactful'],
  chosenDate: 'Jan 15, 2024',
  status: 'Active',
}

const EXPERIENCE_PROGRESS_SUMMARY = {
  percent: 53,
  completedStages: 2,
  inProgressStages: 1,
  lockedStages: 2,
}

const EXPERIENCE_OVERVIEW_METRICS = [
  { label: 'Total Projects Completed', value: '14', Icon: FiBriefcase, tone: 'green' },
  { label: 'Total Companies Worked With', value: '7', Icon: FiUsers, tone: 'teal' },
  { label: 'Total Gigs', value: '23', Icon: FiCheckCircle, tone: 'green' },
  { label: 'Total Hours Worked', value: '186h', Icon: FiClock, tone: 'purple' },
  { label: 'Repeat Clients', value: '5', Icon: FiAward, tone: 'purple' },
  { label: 'Average Project Rating', value: '4.6/5', Icon: FiStar, tone: 'yellow' },
]

const EXPERIENCE_RECENT_ACHIEVEMENTS = [
  {
    title: 'Advanced to Stage 3',
    detail: 'Reached Grow & Specialize stage',
    date: 'May 20, 2025',
    Icon: FiTrendingUp,
    tone: 'green',
  },
  {
    title: 'Top Rated Project',
    detail: 'Instagram Campaign for BrandMasters',
    date: 'May 12, 2025',
    Icon: FiAward,
    tone: 'purple',
  },
  {
    title: '5-Star Streak',
    detail: '3 projects in a row with 4.5+ rating',
    date: 'May 15, 2025',
    Icon: FiStar,
    tone: 'yellow',
  },
]

const SKILLS_CATEGORY_FILTERS = ['All Categories', 'Design', 'Marketing']
const SKILLS_LEVEL_FILTERS = ['All Levels', 'Expert', 'Advanced', 'Intermediate', 'Beginner']

const SKILLS_CORE = [
  {
    id: 'adobe-photoshop',
    iconLabel: 'Ps',
    iconTone: 'is-photoshop',
    name: 'Adobe Photoshop',
    category: 'Design',
    proficiency: 72,
    level: 'Advanced',
    score: 82,
    scoreTier: 'Advanced',
    scoreMeta: 'Top 20% of students',
    lastUsed: 'May 8, 2025',
    projects: '3 projects',
  },
  {
    id: 'adobe-illustrator',
    iconLabel: 'Ai',
    iconTone: 'is-illustrator',
    name: 'Adobe Illustrator',
    category: 'Design',
    proficiency: 46,
    level: 'Intermediate',
    score: 68,
    scoreTier: 'Intermediate',
    scoreMeta: 'Top 35% of students',
    lastUsed: 'Apr 28, 2025',
    projects: '2 projects',
  },
  {
    id: 'canva',
    iconLabel: 'Cv',
    iconTone: 'is-canva',
    name: 'Canva',
    category: 'Design',
    proficiency: 88,
    level: 'Expert',
    score: 91,
    scoreTier: 'Expert',
    scoreMeta: 'Top 10% of students',
    lastUsed: 'May 12, 2025',
    projects: '6 projects',
  },
  {
    id: 'figma',
    iconLabel: 'Fi',
    iconTone: 'is-figma',
    name: 'Figma',
    category: 'Design',
    proficiency: 46,
    level: 'Intermediate',
    score: 63,
    scoreTier: 'Intermediate',
    scoreMeta: 'Top 40% of students',
    lastUsed: 'Apr 20, 2025',
    projects: '1 project',
  },
  {
    id: 'copywriting',
    iconLabel: 'Cw',
    iconTone: 'is-copywriting',
    name: 'Copywriting',
    category: 'Marketing',
    proficiency: 65,
    level: 'Advanced',
    score: 77,
    scoreTier: 'Advanced',
    scoreMeta: 'Top 25% of students',
    lastUsed: 'May 10, 2025',
    projects: '4 projects',
  },
]

const SKILLS_OTHER = [
  {
    id: 'social-media-marketing',
    iconLabel: 'SM',
    iconTone: 'is-social',
    name: 'Social Media Marketing',
    category: 'Marketing',
    proficiency: 66,
    level: 'Advanced',
    score: 74,
    scoreTier: 'Advanced',
    scoreMeta: 'Top 25% of students',
    lastUsed: 'May 12, 2025',
    projects: '5 projects',
  },
  {
    id: 'brand-identity-design',
    iconLabel: 'BI',
    iconTone: 'is-branding',
    name: 'Brand Identity Design',
    category: 'Design',
    proficiency: 47,
    level: 'Intermediate',
    score: 66,
    scoreTier: 'Intermediate',
    scoreMeta: 'Top 35% of students',
    lastUsed: 'Apr 25, 2025',
    projects: '2 projects',
  },
  {
    id: 'typography',
    iconLabel: 'Aa',
    iconTone: 'is-typography',
    name: 'Typography',
    category: 'Design',
    proficiency: 47,
    level: 'Intermediate',
    score: 61,
    scoreTier: 'Intermediate',
    scoreMeta: 'Top 45% of students',
    lastUsed: 'Apr 18, 2025',
    projects: '1 project',
  },
]

const SKILLS_SUMMARY = [
  { label: 'TT', value: '12' },
  { label: 'Adv.', value: '5' },
  { label: 'Int.', value: '4' },
  { label: 'Beg.', value: '3' },
]

const SKILLS_TOP_LIST = [
  { label: 'Canva', score: 91 },
  { label: 'Adobe Photoshop', score: 82 },
  { label: 'Copywriting', score: 77 },
  { label: 'Social Media Marketing', score: 74 },
  { label: 'Adobe Illustrator', score: 68 },
]

const SKILLS_PROGRESS_TIMELINE = [
  { month: 'Dec 2024', value: 58 },
  { month: 'Jan 2025', value: 62 },
  { month: 'Feb 2025', value: 67 },
  { month: 'Mar 2025', value: 71 },
  { month: 'Apr 2025', value: 76 },
  { month: 'May 2025', value: 76 },
]

const SKILLS_RECENT_ACHIEVEMENTS = [
  { id: 'achievement-photoshop', badge: 'PS', tone: 'is-photoshop', skill: 'Adobe Photoshop', detail: 'Reached Advanced level', date: 'May 8, 2025' },
  { id: 'achievement-copywriting', badge: 'CW', tone: 'is-copywriting', skill: 'Copywriting', detail: 'Improved by 12 points', date: 'May 5, 2025' },
  { id: 'achievement-canva', badge: 'CV', tone: 'is-canva', skill: 'Canva', detail: 'Reached Expert level', date: 'Apr 30, 2025' },
]

const SHOP_TAB_FILTERS = [
  { key: 'all', label: 'All Products' },
  { key: 'new-arrivals', label: 'New Arrivals' },
  { key: 'best-sellers', label: 'Best Sellers' },
  { key: 'hair-accessories', label: 'Hair Accessories' },
  { key: 'electronics', label: 'Electronics' },
  { key: 'jewelry', label: 'Jewelry' },
  { key: 'lifestyle', label: 'Lifestyle' },
  { key: 'bundles', label: 'Bundles & Deals' },
]

const SHOP_COMPOSER_TOOLS = [
  { label: 'Photo/Video', Icon: FiImage },
  { label: 'Product', Icon: FiPackage },
  { label: 'Carousel', Icon: FiGrid },
  { label: 'Reel/Video', Icon: FiFilm },
  { label: 'Write', Icon: FiEdit3 },
]

const SHOP_PRODUCTS = [
  {
    id: 'wireless-earbuds',
    filter: 'electronics',
    badges: ['new-arrivals', 'best-sellers'],
    seller: 'Aisha Mwangi',
    time: '2h ago',
    badge: 'New Arrival',
    badgeTone: 'is-primary',
    title: 'Wireless Earbuds',
    price: 'KES 2,499',
    description: 'High quality sound, long battery life and noise cancellation for your everyday vibe.',
    image: '/assets/index/business_page_images/optimized/leeder-bose-ne0gCdlSoew-unsplash.webp',
    likes: 128,
    comments: 24,
    shares: 12,
  },
  {
    id: 'hair-clips-set',
    filter: 'hair-accessories',
    badges: ['new-arrivals', 'best-sellers'],
    seller: 'Aisha Mwangi',
    time: '1d ago',
    badge: 'Best Seller',
    badgeTone: 'is-orange',
    title: 'Aesthetic Hair Clips (Set of 4)',
    price: 'KES 650',
    description: 'Trendy and durable clips perfect for every outfit. Includes 4 stylish clips.',
    image: '/assets/index/business_page_images/optimized/sable-flow-T74mVg__F_k-unsplash.webp',
    likes: 95,
    comments: 18,
    shares: 7,
  },
  {
    id: 'gold-jewelry-set',
    filter: 'jewelry',
    badges: ['best-sellers'],
    seller: 'Aisha Mwangi',
    time: '3d ago',
    badge: 'Limited Stock',
    badgeTone: 'is-danger',
    title: 'Gold Plated Jewelry Set',
    price: 'KES 1,299',
    description: 'Elegant and timeless pieces to elevate your everyday look.',
    image: '/assets/index/business_page_images/optimized/toa-heftiba-O3ymvT7Wf9U-unsplash.webp',
    likes: 76,
    comments: 14,
    shares: 9,
  },
  {
    id: 'soft-scrunchies-pack',
    filter: 'hair-accessories',
    badges: ['new-arrivals', 'lifestyle'],
    seller: 'Aisha Mwangi',
    time: 'May 10',
    badge: 'New',
    badgeTone: 'is-primary',
    title: 'Soft Scrunchies Pack',
    price: 'KES 420',
    description: 'Comfortable everyday scrunchies in neutral tones for quick styling.',
    image: '/assets/index/business_page_images/optimized/annie-spratt-hCb3lIB8L8E-unsplash.webp',
    likes: 54,
    comments: 11,
    shares: 4,
  },
  {
    id: 'portable-speaker',
    filter: 'electronics',
    badges: ['bundles'],
    seller: 'Aisha Mwangi',
    time: 'May 8',
    badge: 'Hot Deal',
    badgeTone: 'is-orange',
    title: 'Portable Speaker',
    price: 'KES 2,850',
    description: 'Clear audio, strong bass and compact design for your home or outdoors.',
    image: '/assets/index/business_page_images/optimized/product-school-XZkk5xT8Xrk-unsplash.webp',
    likes: 41,
    comments: 8,
    shares: 5,
  },
  {
    id: 'canvas-tote-bag',
    filter: 'lifestyle',
    badges: ['new-arrivals', 'bundles'],
    seller: 'Aisha Mwangi',
    time: 'May 5',
    badge: 'New Arrival',
    badgeTone: 'is-primary',
    title: 'Canvas Tote Bag',
    price: 'KES 980',
    description: 'Roomy eco-friendly tote bag for classes, errands and weekend plans.',
    image: '/assets/index/business_page_images/optimized/igor-rodrigues-Wn932wwnpSE-unsplash.webp',
    likes: 63,
    comments: 10,
    shares: 6,
  },
  {
    id: 'canvas-tote-bag',
    filter: 'lifestyle',
    badges: ['new-arrivals', 'bundles'],
    seller: 'Aisha Mwangi',
    time: 'May 5',
    badge: 'New Arrival',
    badgeTone: 'is-primary',
    title: 'Canvas Tote Bag',
    price: 'KES 980',
    description: 'Roomy eco-friendly tote bag for classes, errands and weekend plans.',
    image: '/assets/index/business_page_images/optimized/igor-rodrigues-Wn932wwnpSE-unsplash.webp',
    likes: 63,
    comments: 10,
    shares: 6,
  },
  {
    id: 'canvas-tote-bag',
    filter: 'lifestyle',
    badges: ['new-arrivals', 'bundles'],
    seller: 'Aisha Mwangi',
    time: 'May 5',
    badge: 'New Arrival',
    badgeTone: 'is-primary',
    title: 'Canvas Tote Bag',
    price: 'KES 980',
    description: 'Roomy eco-friendly tote bag for classes, errands and weekend plans.',
    image: '/assets/index/business_page_images/optimized/igor-rodrigues-Wn932wwnpSE-unsplash.webp',
    likes: 63,
    comments: 10,
    shares: 6,
  },
  {
    id: 'canvas-tote-bag',
    filter: 'lifestyle',
    badges: ['new-arrivals', 'bundles'],
    seller: 'Aisha Mwangi',
    time: 'May 5',
    badge: 'New Arrival',
    badgeTone: 'is-primary',
    title: 'Canvas Tote Bag',
    price: 'KES 980',
    description: 'Roomy eco-friendly tote bag for classes, errands and weekend plans.',
    image: '/assets/index/business_page_images/optimized/igor-rodrigues-Wn932wwnpSE-unsplash.webp',
    likes: 63,
    comments: 10,
    shares: 6,
  },
  {
    id: 'canvas-tote-bag',
    filter: 'lifestyle',
    badges: ['new-arrivals', 'bundles'],
    seller: 'Aisha Mwangi',
    time: 'May 5',
    badge: 'New Arrival',
    badgeTone: 'is-primary',
    title: 'Canvas Tote Bag',
    price: 'KES 980',
    description: 'Roomy eco-friendly tote bag for classes, errands and weekend plans.',
    image: '/assets/index/business_page_images/optimized/igor-rodrigues-Wn932wwnpSE-unsplash.webp',
    likes: 63,
    comments: 10,
    shares: 6,
  },
  {
    id: 'canvas-tote-bag',
    filter: 'lifestyle',
    badges: ['new-arrivals', 'bundles'],
    seller: 'Aisha Mwangi',
    time: 'May 5',
    badge: 'New Arrival',
    badgeTone: 'is-primary',
    title: 'Canvas Tote Bag',
    price: 'KES 980',
    description: 'Roomy eco-friendly tote bag for classes, errands and weekend plans.',
    image: '/assets/index/business_page_images/optimized/igor-rodrigues-Wn932wwnpSE-unsplash.webp',
    likes: 63,
    comments: 10,
    shares: 6,
  },
  {
    id: 'canvas-tote-bag',
    filter: 'lifestyle',
    badges: ['new-arrivals', 'bundles'],
    seller: 'Aisha Mwangi',
    time: 'May 5',
    badge: 'New Arrival',
    badgeTone: 'is-primary',
    title: 'Canvas Tote Bag',
    price: 'KES 980',
    description: 'Roomy eco-friendly tote bag for classes, errands and weekend plans.',
    image: '/assets/index/business_page_images/optimized/igor-rodrigues-Wn932wwnpSE-unsplash.webp',
    likes: 63,
    comments: 10,
    shares: 6,
  },
  {
    id: 'canvas-tote-bag',
    filter: 'lifestyle',
    badges: ['new-arrivals', 'bundles'],
    seller: 'Aisha Mwangi',
    time: 'May 5',
    badge: 'New Arrival',
    badgeTone: 'is-primary',
    title: 'Canvas Tote Bag',
    price: 'KES 980',
    description: 'Roomy eco-friendly tote bag for classes, errands and weekend plans.',
    image: '/assets/index/business_page_images/optimized/igor-rodrigues-Wn932wwnpSE-unsplash.webp',
    likes: 63,
    comments: 10,
    shares: 6,
  },
  {
    id: 'canvas-tote-bag',
    filter: 'lifestyle',
    badges: ['new-arrivals', 'bundles'],
    seller: 'Aisha Mwangi',
    time: 'May 5',
    badge: 'New Arrival',
    badgeTone: 'is-primary',
    title: 'Canvas Tote Bag',
    price: 'KES 980',
    description: 'Roomy eco-friendly tote bag for classes, errands and weekend plans.',
    image: '/assets/index/business_page_images/optimized/igor-rodrigues-Wn932wwnpSE-unsplash.webp',
    likes: 63,
    comments: 10,
    shares: 6,
  },
  {
    id: 'canvas-tote-bag',
    filter: 'lifestyle',
    badges: ['new-arrivals', 'bundles'],
    seller: 'Aisha Mwangi',
    time: 'May 5',
    badge: 'New Arrival',
    badgeTone: 'is-primary',
    title: 'Canvas Tote Bag',
    price: 'KES 980',
    description: 'Roomy eco-friendly tote bag for classes, errands and weekend plans.',
    image: '/assets/index/business_page_images/optimized/igor-rodrigues-Wn932wwnpSE-unsplash.webp',
    likes: 63,
    comments: 10,
    shares: 6,
  },
  {
    id: 'canvas-tote-bag',
    filter: 'lifestyle',
    badges: ['new-arrivals', 'bundles'],
    seller: 'Aisha Mwangi',
    time: 'May 5',
    badge: 'New Arrival',
    badgeTone: 'is-primary',
    title: 'Canvas Tote Bag',
    price: 'KES 980',
    description: 'Roomy eco-friendly tote bag for classes, errands and weekend plans.',
    image: '/assets/index/business_page_images/optimized/igor-rodrigues-Wn932wwnpSE-unsplash.webp',
    likes: 63,
    comments: 10,
    shares: 6,
  },
  {
    id: 'canvas-tote-bag',
    filter: 'lifestyle',
    badges: ['new-arrivals', 'bundles'],
    seller: 'Aisha Mwangi',
    time: 'May 5',
    badge: 'New Arrival',
    badgeTone: 'is-primary',
    title: 'Canvas Tote Bag',
    price: 'KES 980',
    description: 'Roomy eco-friendly tote bag for classes, errands and weekend plans.',
    image: '/assets/index/business_page_images/optimized/igor-rodrigues-Wn932wwnpSE-unsplash.webp',
    likes: 63,
    comments: 10,
    shares: 6,
  },
  {
    id: 'canvas-tote-bag',
    filter: 'lifestyle',
    badges: ['new-arrivals', 'bundles'],
    seller: 'Aisha Mwangi',
    time: 'May 5',
    badge: 'New Arrival',
    badgeTone: 'is-primary',
    title: 'Canvas Tote Bag',
    price: 'KES 980',
    description: 'Roomy eco-friendly tote bag for classes, errands and weekend plans.',
    image: '/assets/index/business_page_images/optimized/igor-rodrigues-Wn932wwnpSE-unsplash.webp',
    likes: 63,
    comments: 10,
    shares: 6,
  },
]

const SHOP_PRODUCTS_WITH_UID = SHOP_PRODUCTS.map((item, index) => ({
  ...item,
  uid: `${item.id}-${index}`,
}))

const SHOP_FILTER_LABEL_MAP = SHOP_TAB_FILTERS.reduce((acc, item) => {
  acc[item.key] = item.label
  return acc
}, {})

const SHOP_ABOUT_STATS = [
  { label: 'Followers', value: '1.2K' },
  { label: 'Products', value: '28' },
  { label: 'Orders', value: '156' },
  { label: 'Rating', value: '4.9' },
]

const SHOP_SOCIAL_LINKS = [
  { label: 'Instagram', Icon: FaInstagram },
  { label: 'TikTok', Icon: FaTiktok },
  { label: 'WhatsApp', Icon: FaWhatsapp },
  { label: 'Facebook', Icon: FaFacebookF },
]

const SHOP_HIGHLIGHTS = [
  { title: 'Quality You Can Trust', description: 'Carefully chosen, tested and loved.', Icon: FiAward },
  { title: 'Fast & Reliable Delivery', description: 'We deliver to you, on time.', Icon: FiTruck },
  { title: 'Easy Returns', description: 'Hassle-free returns within 7 days.', Icon: FiRefreshCw },
  { title: 'Secure Payments', description: 'Pay safely using Zumbarl.', Icon: FiCreditCard },
]

const SHOP_TOP_PRODUCTS = [
  {
    id: 'top-wireless-earbuds',
    name: 'Wireless Earbuds',
    price: 'KES 2,499',
    rating: '4.8',
    reviews: 32,
    image: '/assets/index/business_page_images/optimized/leeder-bose-ne0gCdlSoew-unsplash.webp',
  },
  {
    id: 'top-hair-clips-set',
    name: 'Aesthetic Hair Clips (Set of 4)',
    price: 'KES 650',
    rating: '4.9',
    reviews: 48,
    image: '/assets/index/business_page_images/optimized/sable-flow-T74mVg__F_k-unsplash.webp',
  },
  {
    id: 'top-gold-jewelry-set',
    name: 'Gold Plated Jewelry Set',
    price: 'KES 1,299',
    rating: '4.9',
    reviews: 27,
    image: '/assets/index/business_page_images/optimized/toa-heftiba-O3ymvT7Wf9U-unsplash.webp',
  },
]

const PORTFOLIO_SERVICE_COMPOSER_TOOLS = [
  { label: 'Photo/Video', Icon: FiImage },
  { label: 'Service', Icon: FiBriefcase },
  { label: 'Carousel', Icon: FiGrid },
  { label: 'Write', Icon: FiEdit3 },
]

const PORTFOLIO_SERVICES = [
  {
    id: 'service-programming',
    title: 'Website Development',
    category: 'Programming',
    description: 'I build responsive websites and landing pages for students and small businesses.',
    price: 'From KES 12,000',
    delivery: '4-7 days',
    image: '/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp',
    responseTime: 'Replies within 8 hours',
    revisions: '2 revision rounds',
    completed: '16 completed gigs',
    satisfaction: '4.9/5 client satisfaction',
    includes: ['Responsive layout', 'SEO-ready pages', 'Hosting setup support', 'Deployment checklist'],
    workflow: [
      'Quick discovery call to define pages, content and goals.',
      'Design + build phase with milestone updates every 48 hours.',
      'Final QA, deployment handover and 7-day post-launch support.',
    ],
  },
  {
    id: 'service-ledger-review',
    title: 'Ledger Book Review',
    category: 'Finance',
    description: 'I review your ledger entries, reconcile records and prepare clear correction notes.',
    price: 'From KES 3,500',
    delivery: '2-3 days',
    image: '/assets/index/business_page_images/optimized/product-school-XZkk5xT8Xrk-unsplash.webp',
    responseTime: 'Replies within 6 hours',
    revisions: '1 revision round',
    completed: '22 completed gigs',
    satisfaction: '4.8/5 client satisfaction',
    includes: ['Ledger cleanup', 'Error highlights', 'Reconciliation notes', 'Summary report'],
    workflow: [
      'You share ledger files and review objectives.',
      'I audit entries, reconcile balances and flag corrections.',
      'You receive a report with actionable fixes and final notes.',
    ],
  },
  {
    id: 'service-social-content',
    title: 'Social Media Content Kit',
    category: 'Marketing',
    description: 'I create branded post packs with captions and a ready-to-use posting calendar.',
    price: 'From KES 4,800',
    delivery: '3-5 days',
    image: '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp',
    responseTime: 'Replies within 12 hours',
    revisions: '2 revision rounds',
    completed: '29 completed gigs',
    satisfaction: '4.9/5 client satisfaction',
    includes: ['Post designs', 'Caption bank', '30-day calendar', 'Hashtag recommendations'],
    workflow: [
      'Brand intake and target audience alignment.',
      'Draft content pack delivery for review and feedback.',
      'Final asset delivery with organized posting schedule.',
    ],
  },
]

const PORTFOLIO_SUMMARY = [
  { label: 'Total Projects', value: '24', Icon: FiBriefcase, tone: 'purple' },
  { label: 'Avg. Project Rating', value: '4.8/5', Icon: FiStar, tone: 'orange' },
  { label: 'Happy Clients', value: '14', Icon: FiUsers, tone: 'blue' },
  { label: 'Featured Projects', value: '3', Icon: FiAward, tone: 'green' },
]

const PORTFOLIO_FILTERS = [
  { key: 'all', label: 'All (24)' },
  { key: 'social', label: 'Social Media (8)' },
  { key: 'design', label: 'Graphic Design (6)' },
  { key: 'copy', label: 'Copywriting (5)' },
  { key: 'brand', label: 'Branding (3)' },
  { key: 'video', label: 'Video (2)' },
]

const PORTFOLIO_ITEMS = [
  {
    id: 'insta-campaign-brandmasters',
    category: 'Social Media',
    filter: 'social',
    title: 'Instagram Campaign for BrandMasters',
    description: 'Created a 2-week Instagram campaign that increased engagement by 45%.',
    client: 'BrandMasters Agency',
    initials: 'BM',
    rating: '5.0',
    date: 'May 12, 2025',
    featured: true,
    image: '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp',
  },
  {
    id: 'brand-poster-naikreative',
    category: 'Graphic Design',
    filter: 'design',
    title: 'Brand Poster Set for NaiKreative',
    description: "Designed a series of posters for a startup's product launch.",
    client: 'NaiKreative Studio',
    initials: 'NK',
    rating: '4.5',
    date: 'May 8, 2025',
    featured: true,
    image: '/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp',
  },
  {
    id: 'whatsapp-content-pesaflow',
    category: 'Social Media',
    filter: 'social',
    title: 'WhatsApp Content Series for Pesaflow',
    description: 'Created engaging WhatsApp content series to educate users.',
    client: 'Pesaflow Fintech',
    initials: 'PZ',
    rating: '4.8',
    date: 'May 5, 2025',
    featured: true,
    image: '/assets/index/business_page_images/optimized/omar-lopez-1qfy-jDc_jo-unsplash.webp',
  },
  {
    id: 'logo-refresh-brandmasters',
    category: 'Branding',
    filter: 'brand',
    title: 'Logo Refresh for BrandMasters',
    description: 'Refreshed the BrandMasters logo to improve modern brand identity.',
    client: 'BrandMasters Agency',
    initials: 'BM',
    rating: '4.0',
    date: 'Apr 28, 2025',
    image: '/assets/index/business_page_images/setengah-limasore-qUcZ3TUlgnM-unsplash.jpg',
  },
  {
    id: 'strategy-document',
    category: 'Copywriting',
    filter: 'copy',
    title: 'Digital Marketing Strategy Document',
    description: 'Wrote a comprehensive strategy document for a new product.',
    client: 'Pesaflow Fintech',
    initials: 'PZ',
    rating: '4.7',
    date: 'Apr 20, 2025',
    image: '/assets/index/business_page_images/optimized/0xk-y5n-nhkRd7U-unsplash.webp',
  },
  {
    id: 'glow-social-content',
    category: 'Social Media',
    filter: 'social',
    title: 'Social Media Content for Glow Jewelry',
    description: 'Created content calendar and posts for product launch.',
    client: 'Glow Jewelry',
    initials: 'GJ',
    rating: '4.6',
    date: 'Apr 18, 2025',
    image: '/assets/index/business_page_images/optimized/alejandro-escamilla-BbQLHCpVUqA-unsplash.webp',
  },
  {
    id: 'banner-design-pesaflow',
    category: 'Graphic Design',
    filter: 'design',
    title: 'Website Banner Design for Pesaflow',
    description: 'Designed website banners for their new features.',
    client: 'Pesaflow Fintech',
    initials: 'PZ',
    rating: '4.9',
    date: 'Apr 15, 2025',
    image: '/assets/index/business_page_images/optimized/sable-flow-T74mVg__F_k-unsplash.webp',
  },
  {
    id: 'ebook-brandmasters',
    category: 'Copywriting',
    filter: 'copy',
    title: 'Ebook Content for BrandMasters',
    description: 'Wrote and structured ebook content for their finance guide.',
    client: 'BrandMasters Agency',
    initials: 'BM',
    rating: '5.0',
    date: 'Apr 10, 2025',
    image: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
  },
  {
    id: 'ebook-brandmasters',
    category: 'Copywriting',
    filter: 'copy',
    title: 'Ebook Content for BrandMasters',
    description: 'Wrote and structured ebook content for their finance guide.',
    client: 'BrandMasters Agency',
    initials: 'BM',
    rating: '5.0',
    date: 'Apr 10, 2025',
    image: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
  },
  {
    id: 'ebook-brandmasters',
    category: 'Copywriting',
    filter: 'copy',
    title: 'Ebook Content for BrandMasters',
    description: 'Wrote and structured ebook content for their finance guide.',
    client: 'BrandMasters Agency',
    initials: 'BM',
    rating: '5.0',
    date: 'Apr 10, 2025',
    image: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
  },
  {
    id: 'ebook-brandmasters',
    category: 'Copywriting',
    filter: 'copy',
    title: 'Ebook Content for BrandMasters',
    description: 'Wrote and structured ebook content for their finance guide.',
    client: 'BrandMasters Agency',
    initials: 'BM',
    rating: '5.0',
    date: 'Apr 10, 2025',
    image: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
  },
  {
    id: 'ebook-brandmasters',
    category: 'Copywriting',
    filter: 'copy',
    title: 'Ebook Content for BrandMasters',
    description: 'Wrote and structured ebook content for their finance guide.',
    client: 'BrandMasters Agency',
    initials: 'BM',
    rating: '5.0',
    date: 'Apr 10, 2025',
    image: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
  },
  {
    id: 'ebook-brandmasters',
    category: 'Copywriting',
    filter: 'copy',
    title: 'Ebook Content for BrandMasters',
    description: 'Wrote and structured ebook content for their finance guide.',
    client: 'BrandMasters Agency',
    initials: 'BM',
    rating: '5.0',
    date: 'Apr 10, 2025',
    image: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
  },
  {
    id: 'ebook-brandmasters',
    category: 'Copywriting',
    filter: 'copy',
    title: 'Ebook Content for BrandMasters',
    description: 'Wrote and structured ebook content for their finance guide.',
    client: 'BrandMasters Agency',
    initials: 'BM',
    rating: '5.0',
    date: 'Apr 10, 2025',
    image: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
  },
  {
    id: 'ebook-brandmasters',
    category: 'Copywriting',
    filter: 'copy',
    title: 'Ebook Content for BrandMasters',
    description: 'Wrote and structured ebook content for their finance guide.',
    client: 'BrandMasters Agency',
    initials: 'BM',
    rating: '5.0',
    date: 'Apr 10, 2025',
    image: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
  },
  {
    id: 'ebook-brandmasters',
    category: 'Copywriting',
    filter: 'copy',
    title: 'Ebook Content for BrandMasters',
    description: 'Wrote and structured ebook content for their finance guide.',
    client: 'BrandMasters Agency',
    initials: 'BM',
    rating: '5.0',
    date: 'Apr 10, 2025',
    image: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
  },
  {
    id: 'ebook-brandmasters',
    category: 'Copywriting',
    filter: 'copy',
    title: 'Ebook Content for BrandMasters',
    description: 'Wrote and structured ebook content for their finance guide.',
    client: 'BrandMasters Agency',
    initials: 'BM',
    rating: '5.0',
    date: 'Apr 10, 2025',
    image: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
  },
  {
    id: 'ebook-brandmasters',
    category: 'Copywriting',
    filter: 'copy',
    title: 'Ebook Content for BrandMasters',
    description: 'Wrote and structured ebook content for their finance guide.',
    client: 'BrandMasters Agency',
    initials: 'BM',
    rating: '5.0',
    date: 'Apr 10, 2025',
    image: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
  },
  {
    id: 'ebook-brandmasters',
    category: 'Copywriting',
    filter: 'copy',
    title: 'Ebook Content for BrandMasters',
    description: 'Wrote and structured ebook content for their finance guide.',
    client: 'BrandMasters Agency',
    initials: 'BM',
    rating: '5.0',
    date: 'Apr 10, 2025',
    image: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
  },
]

const PORTFOLIO_DETAIL_OVERRIDES = {
  'brand-poster-naikreative': {
    pipelineStage: 'Warming Up -> Active',
    pipelineNote: 'Now an active pipeline relationship',
    overallScore: '4.5/5',
    projectScores: [
      { label: 'Communication', score: 4.7 },
      { label: 'Time Management', score: 4.6 },
      { label: 'Skills & Technical Ability', score: 4.5 },
      { label: 'Delivery Quality', score: 4.6 },
      { label: 'Creativity & Innovation', score: 4.3 },
      { label: 'Professionalism', score: 4.6 },
    ],
    skillsDeveloped: [
      { name: 'Poster Design', level: 'Advanced' },
      { name: 'Visual Storytelling', level: 'Advanced' },
      { name: 'Typography', level: 'Advanced' },
      { name: 'Brand Identity', level: 'Intermediate' },
      { name: 'Color Theory', level: 'Intermediate' },
      { name: 'Layout Design', level: 'Advanced' },
    ],
    impact: [
      { value: '+45%', label: 'Engagement Increase' },
      { value: '12.5K', label: 'Reach Achieved' },
      { value: '8', label: 'Posters Delivered' },
      { value: '5.0/5', label: 'Client Satisfaction' },
    ],
    feedback: {
      quote:
        'Aisha delivered beyond our expectations. The posters were creative, on-brand and perfectly captured our vision.',
      author: 'James O.',
      role: 'Founder, NaiKreative Studio',
    },
  },
}

const PORTFOLIO_SCORE_ICONS = [
  FiMessageCircle,
  FiClock,
  FiSettings,
  FiCheckCircle,
  FiStar,
  FiAward,
]

function buildRadarPoints(scores, max = 5, radius = 84, center = 100) {
  return scores
    .map((score, index) => {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / scores.length
      const scoreRadius = (score / max) * radius
      const x = center + scoreRadius * Math.cos(angle)
      const y = center + scoreRadius * Math.sin(angle)
      return `${x},${y}`
    })
    .join(' ')
}

function buildRadarRingPoints(steps, ring, radius = 84, center = 100) {
  return Array.from({ length: steps }, (_, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / steps
    const ringRadius = (ring / 5) * radius
    const x = center + ringRadius * Math.cos(angle)
    const y = center + ringRadius * Math.sin(angle)
    return `${x},${y}`
  }).join(' ')
}

function buildSkillsTrendCoordinates(points, width = 344, height = 112, inset = 14) {
  if (!points.length) {
    return []
  }

  const values = points.map((point) => point.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const range = Math.max(1, maxValue - minValue)

  return points.map((point, index) => {
    const x = inset + (index * (width - inset * 2)) / Math.max(1, points.length - 1)
    const yRatio = (point.value - minValue) / range
    const y = height - inset - yRatio * (height - inset * 2)

    return {
      ...point,
      x,
      y,
    }
  })
}

function getPortfolioDetail(item) {
  const override = PORTFOLIO_DETAIL_OVERRIDES[item.id]
  if (override) {
    return override
  }

  const baseScore = Number.parseFloat(item.rating) || 4.5
  return {
    pipelineStage: 'Warming Up -> Active',
    pipelineNote: 'Now an active pipeline relationship',
    overallScore: `${baseScore.toFixed(1)}/5`,
    projectScores: [
      { label: 'Communication', score: Math.min(5, baseScore + 0.1) },
      { label: 'Time Management', score: Math.min(5, baseScore) },
      { label: 'Skills & Technical Ability', score: Math.max(3.8, baseScore - 0.1) },
      { label: 'Delivery Quality', score: Math.min(5, baseScore) },
      { label: 'Creativity & Innovation', score: Math.max(3.8, baseScore - 0.2) },
      { label: 'Professionalism', score: Math.min(5, baseScore + 0.1) },
    ],
    skillsDeveloped: [
      { name: 'Communication', level: 'Advanced' },
      { name: 'Project Planning', level: 'Intermediate' },
      { name: 'Execution', level: 'Advanced' },
      { name: 'Client Feedback', level: 'Intermediate' },
      { name: 'Team Workflow', level: 'Advanced' },
      { name: 'Quality Control', level: 'Advanced' },
    ],
    impact: [
      { value: '+32%', label: 'Engagement Increase' },
      { value: '9.7K', label: 'Reach Achieved' },
      { value: '6', label: 'Deliverables' },
      { value: item.rating, label: 'Client Satisfaction' },
    ],
    feedback: {
      quote: `${item.title} delivered strong outcomes and clear quality improvements for the project.`,
      author: 'Project Lead',
      role: item.client,
    },
  }
}

function getPortfolioScoreIcon(index) {
  return PORTFOLIO_SCORE_ICONS[index % PORTFOLIO_SCORE_ICONS.length]
}

function getShopProductDetail(item) {
  const base = {
    rating: '4.8',
    reviews: 32,
    sold: 156,
    posts: 8,
    summary: 'Experience crystal clear sound with deep bass and active noise cancellation. These earbuds are perfect for music, calls and everyday use.',
    gallery: [
      item.image,
      '/assets/index/business_page_images/optimized/leeder-bose-ne0gCdlSoew-unsplash.webp',
      '/assets/index/business_page_images/optimized/product-school-XZkk5xT8Xrk-unsplash.webp',
      '/assets/index/business_page_images/optimized/justin-buisson-vIluu0IH6Ps-unsplash.webp',
    ],
    featureChips: [
      { label: 'Bluetooth', value: '5.3' },
      { label: 'Battery', value: '24H' },
      { label: 'Noise Control', value: 'ANC' },
      { label: 'Touch', value: 'Smart' },
    ],
    details: [
      'Bluetooth 5.3 for faster connection',
      'Up to 24 hours total playtime with charging case',
      'Touch control for music and calls',
      'Sweat and water resistant (IPX4)',
      'USB-C fast charging',
    ],
    colors: ['#4a30eb', '#1f274b', '#ffffff', '#f38ca9', '#8bd4c3'],
    postsFeed: [
      {
        id: `${item.id}-post-1`,
        title: 'Launch Post',
        date: item.time,
        caption: 'New stock is in. Check the full sound test and unboxing clips on my feed.',
        image: item.image,
        likes: item.likes,
        comments: item.comments,
        shares: item.shares,
      },
      {
        id: `${item.id}-post-2`,
        title: 'Quick Reel',
        date: '1d ago',
        caption: 'Battery test and mic quality sample for everyday use.',
        image: '/assets/index/business_page_images/optimized/product-school-XZkk5xT8Xrk-unsplash.webp',
        likes: 64,
        comments: 11,
        shares: 9,
      },
      {
        id: `${item.id}-post-3`,
        title: 'Customer Review',
        date: '3d ago',
        caption: 'Real buyer feedback after one week of use.',
        image: '/assets/index/business_page_images/optimized/justin-buisson-vIluu0IH6Ps-unsplash.webp',
        likes: 42,
        comments: 8,
        shares: 5,
      },
    ],
  }

  if (item.filter === 'jewelry') {
    return {
      ...base,
      rating: '4.9',
      reviews: 27,
      sold: 118,
      summary: 'Elegant plated jewelry crafted for everyday wear and special moments, with a finish that keeps its shine.',
      gallery: [
        item.image,
        '/assets/index/business_page_images/optimized/toa-heftiba-O3ymvT7Wf9U-unsplash.webp',
        '/assets/index/business_page_images/optimized/setengah-limasore-qUcZ3TUlgnM-unsplash.webp',
        '/assets/index/business_page_images/optimized/mapbox-ZT5v0puBjZI-unsplash.webp',
      ],
      featureChips: [
        { label: 'Material', value: 'Plated' },
        { label: 'Skin Safe', value: 'Yes' },
        { label: 'Waterproof', value: 'Light' },
        { label: 'Warranty', value: '30D' },
      ],
      details: [
        'Lightweight set suitable for daily wear',
        'Fade-resistant gold plated finish',
        'Smooth edges for comfortable all-day use',
        'Gift-ready packaging included',
        'Wipe with soft cloth after use',
      ],
      colors: ['#f5c45d', '#e5d8be', '#ffffff', '#d39f7d', '#b97840'],
      postsFeed: [
        {
          id: `${item.id}-post-1`,
          title: 'Styled Shoot',
          date: item.time,
          caption: 'How to style this set for both casual and formal looks.',
          image: item.image,
          likes: item.likes,
          comments: item.comments,
          shares: item.shares,
        },
        {
          id: `${item.id}-post-2`,
          title: 'Close-up Reel',
          date: '2d ago',
          caption: 'A closer look at the finish and details.',
          image: '/assets/index/business_page_images/optimized/setengah-limasore-qUcZ3TUlgnM-unsplash.webp',
          likes: 38,
          comments: 7,
          shares: 4,
        },
      ],
    }
  }

  if (item.filter === 'hair-accessories') {
    return {
      ...base,
      rating: '4.8',
      reviews: 18,
      sold: 93,
      summary: 'Comfortable, non-slip accessories designed for quick everyday styling with a clean, aesthetic finish.',
      gallery: [
        item.image,
        '/assets/index/business_page_images/optimized/sable-flow-T74mVg__F_k-unsplash.webp',
        '/assets/index/business_page_images/optimized/annie-spratt-hCb3lIB8L8E-unsplash.webp',
        '/assets/index/business_page_images/optimized/vlad-hilitanu-1FI2QAYPa-Y-unsplash.webp',
      ],
      featureChips: [
        { label: 'Set Size', value: 'x4' },
        { label: 'Grip', value: 'Strong' },
        { label: 'Finish', value: 'Matte' },
        { label: 'Comfort', value: 'Soft' },
      ],
      details: [
        'Set includes four durable clips',
        'Non-slip hold for different hair types',
        'Rounded teeth reduce hair breakage',
        'Lightweight for daily comfort',
        'Easy to clean and reuse',
      ],
      colors: ['#c9a77a', '#7e5e47', '#f2decf', '#f3b7b0', '#d8c0a4'],
      postsFeed: [
        {
          id: `${item.id}-post-1`,
          title: 'Everyday Looks',
          date: item.time,
          caption: 'Simple clips that hold throughout the day.',
          image: item.image,
          likes: item.likes,
          comments: item.comments,
          shares: item.shares,
        },
        {
          id: `${item.id}-post-2`,
          title: 'Color Set Demo',
          date: '4d ago',
          caption: 'Mix and match neutral tones for different outfits.',
          image: '/assets/index/business_page_images/optimized/annie-spratt-hCb3lIB8L8E-unsplash.webp',
          likes: 29,
          comments: 5,
          shares: 3,
        },
      ],
    }
  }

  return base
}

function CampusProfilePage() {
  const [searchParams] = useSearchParams()
  const queryTab = (searchParams.get('tab') || '').trim().toLowerCase()
  const queryProduct = (searchParams.get('product') || '').trim()
  const [activeTab, setActiveTab] = useState('Overview')
  const [activePortfolioFilter, setActivePortfolioFilter] = useState('all')
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(null)
  const [selectedPortfolioServiceId, setSelectedPortfolioServiceId] = useState(null)
  const [selectedShopProductUid, setSelectedShopProductUid] = useState(null)
  const [activeShopDetailImageIndex, setActiveShopDetailImageIndex] = useState(0)
  const [activeShopDetailTab, setActiveShopDetailTab] = useState('details')
  const [skillsSearchQuery, setSkillsSearchQuery] = useState('')
  const [skillsCategoryFilter, setSkillsCategoryFilter] = useState(SKILLS_CATEGORY_FILTERS[0])
  const [skillsLevelFilter, setSkillsLevelFilter] = useState(SKILLS_LEVEL_FILTERS[0])
  const [activeShopFilter, setActiveShopFilter] = useState(SHOP_TAB_FILTERS[0].key)

  useEffect(() => {
    if (!queryTab && !queryProduct) {
      return
    }

    const resolvedTab = PROFILE_TABS.find((tab) => tab.toLowerCase() === queryTab)
    if (resolvedTab) {
      setActiveTab(resolvedTab)
    }

    if (!queryProduct) {
      return
    }

    const resolvedProduct = SHOP_PRODUCTS_WITH_UID.find((item) => item.uid === queryProduct)
      || SHOP_PRODUCTS_WITH_UID.find((item) => item.id === queryProduct)

    if (!resolvedProduct) {
      return
    }

    setActiveTab('Shop')
    setActiveShopFilter('all')
    setSelectedShopProductUid((currentUid) => (currentUid === resolvedProduct.uid ? currentUid : resolvedProduct.uid))
    setActiveShopDetailImageIndex(0)
    setActiveShopDetailTab('details')
  }, [queryTab, queryProduct])

  const profileScoreColor = getScoreFillColor(PROFILE_SCORE, 100)
  const isPortfolioTab = activeTab === 'Portfolio'
  const isExperienceTab = activeTab === 'Experience'
  const isSkillsTab = activeTab === 'Skills'
  const isShopTab = activeTab === 'Shop'
  const portfolioItems = activePortfolioFilter === 'all'
    ? PORTFOLIO_ITEMS
    : PORTFOLIO_ITEMS.filter((item) => item.filter === activePortfolioFilter)
  const selectedPortfolioItem = selectedPortfolioId
    ? PORTFOLIO_ITEMS.find((item) => item.id === selectedPortfolioId) || null
    : null
  const selectedPortfolioService = selectedPortfolioServiceId
    ? PORTFOLIO_SERVICES.find((service) => service.id === selectedPortfolioServiceId) || null
    : null
  const selectedShopProduct = selectedShopProductUid
    ? SHOP_PRODUCTS_WITH_UID.find((item) => item.uid === selectedShopProductUid) || null
    : null
  const selectedShopProductDetail = selectedShopProduct ? getShopProductDetail(selectedShopProduct) : null
  const shopDetailGallery = selectedShopProductDetail?.gallery?.length
    ? selectedShopProductDetail.gallery
    : selectedShopProduct
      ? [selectedShopProduct.image]
      : []
  const normalizedShopDetailImageIndex = shopDetailGallery.length
    ? Math.min(activeShopDetailImageIndex, shopDetailGallery.length - 1)
    : 0
  const activeShopDetailImage = shopDetailGallery[normalizedShopDetailImageIndex] || selectedShopProduct?.image
  const isPortfolioProjectDetailOpen = isPortfolioTab && Boolean(selectedPortfolioItem)
  const isPortfolioServiceDetailOpen = isPortfolioTab && Boolean(selectedPortfolioService)
  const isPortfolioDetailOpen = isPortfolioProjectDetailOpen || isPortfolioServiceDetailOpen
  const isShopProductDetailOpen = isShopTab && Boolean(selectedShopProduct)
  const selectedPortfolioDetail = selectedPortfolioItem ? getPortfolioDetail(selectedPortfolioItem) : null
  const selectedPortfolioScorePoints = selectedPortfolioDetail
    ? buildRadarPoints(selectedPortfolioDetail.projectScores.map((item) => item.score))
    : ''
  const normalizedSkillSearch = skillsSearchQuery.trim().toLowerCase()
  const filteredCoreSkills = SKILLS_CORE.filter((skill) => {
    const matchesSearch = !normalizedSkillSearch
      || skill.name.toLowerCase().includes(normalizedSkillSearch)
      || skill.category.toLowerCase().includes(normalizedSkillSearch)
    const matchesCategory = skillsCategoryFilter === 'All Categories' || skill.category === skillsCategoryFilter
    const matchesLevel = skillsLevelFilter === 'All Levels' || skill.level === skillsLevelFilter
    return matchesSearch && matchesCategory && matchesLevel
  })
  const filteredOtherSkills = SKILLS_OTHER.filter((skill) => {
    const matchesSearch = !normalizedSkillSearch
      || skill.name.toLowerCase().includes(normalizedSkillSearch)
      || skill.category.toLowerCase().includes(normalizedSkillSearch)
    const matchesCategory = skillsCategoryFilter === 'All Categories' || skill.category === skillsCategoryFilter
    const matchesLevel = skillsLevelFilter === 'All Levels' || skill.level === skillsLevelFilter
    return matchesSearch && matchesCategory && matchesLevel
  })
  const skillsTrendCoordinates = buildSkillsTrendCoordinates(SKILLS_PROGRESS_TIMELINE)
  const skillsTrendPoints = skillsTrendCoordinates.map((point) => `${point.x},${point.y}`).join(' ')
  const skillsTrendFillPoints = skillsTrendCoordinates.length
    ? `${skillsTrendCoordinates[0].x},98 ${skillsTrendPoints} ${skillsTrendCoordinates[skillsTrendCoordinates.length - 1].x},98`
    : ''
  const filteredShopProducts = activeShopFilter === 'all'
    ? SHOP_PRODUCTS_WITH_UID
    : SHOP_PRODUCTS_WITH_UID.filter((item) => item.filter === activeShopFilter || item.badges.includes(activeShopFilter))
  const handleShopProductSelect = (uid) => {
    setSelectedShopProductUid(uid)
    setActiveShopDetailImageIndex(0)
    setActiveShopDetailTab('details')
  }
  const hasSkillsResults = filteredCoreSkills.length > 0 || filteredOtherSkills.length > 0
  const renderSkillsRows = (skills, groupName) => (
    skills.map((skill) => (
      <article key={`${groupName}-${skill.id}`} className="campus-skills-row">
        <div className="campus-skills-name-cell">
          <span className={`campus-skills-icon ${skill.iconTone}`}>{skill.iconLabel}</span>
          <div>
            <h4>{skill.name}</h4>
            <p>{skill.category}</p>
          </div>
        </div>

        <div className="campus-skills-proficiency-cell">
          <div className="campus-skills-proficiency-track">
            <span style={{ width: `${skill.proficiency}%` }} />
          </div>
          {/* <strong>{skill.level}</strong> */}
        </div>

        <div className="campus-skills-score-cell">
          <div
            className="campus-skills-score-ring"
            style={{ '--skills-score-angle': `${Math.round((skill.score / 100) * 360)}deg` }}
          >
            <span>{skill.score}</span>
          </div>
          <div>
            <p>{skill.scoreTier}</p>
            <strong>{skill.scoreMeta}</strong>
          </div>
        </div>

        <div className="campus-skills-last-used-cell">
          <p>{skill.lastUsed}</p>
          <strong>{skill.projects}</strong>
        </div>

        <button type="button" className="campus-skills-row-menu" aria-label={`More actions for ${skill.name}`}>
          <FiMoreVertical aria-hidden="true" />
        </button>
      </article>
    ))
  )

  return (
    <main className="campus-page campus-profile-page">
      <Seo
        title={CAMPUS_PROFILE_SEO.title}
        description={CAMPUS_PROFILE_SEO.description}
        path={CAMPUS_PROFILE_SEO.path}
        keywords={CAMPUS_PROFILE_SEO.keywords}
        jsonLd={[CAMPUS_PROFILE_SEO.pageJsonLd]}
      />

      <div className="campus-stage">
        <div className={`campus-shell campus-profile-shell${isPortfolioTab ? ' is-portfolio-tab' : ''}${isPortfolioDetailOpen ? ' is-portfolio-detail-open' : ''}${isShopProductDetailOpen ? ' is-shop-detail-open' : ''}`}>
          <aside className="campus-sidebar" aria-label="Student portal navigation">
            <Link className="campus-brand" to="/" aria-label="Zumbarl logo">
              <img className="campus-brand-logo" src="/assets/index/bee_nobg.png" alt="Zumbarl bee logo" />
              <span className="campus-brand-text">zumbarl.</span>
            </Link>

            <nav className="campus-nav">
              {SIDEBAR_NAV_ITEMS.map(({ label, Icon, href }) =>
                href ? (
                  <Link key={label} to={href} className="campus-nav-item">
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                ) : (
                  <button key={label} type="button" className="campus-nav-item">
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                )
              )}
            </nav>

            <Link className="campus-profile-card is-current" to="/campus/profile" aria-current="page" aria-label="Student profile">
              <img className="campus-avatar" src="/assets/index/bee_nobg.png" alt="Brian Mwangi" />
              <div>
                <p className="campus-profile-name">Brian Mwangi</p>
                <p className="campus-profile-meta meta-category">Student</p>
                <p className="campus-profile-meta">Kenyatta University</p>
              </div>
              <FiChevronRight aria-hidden="true" />
            </Link>

            <section className="campus-sidebar-card">
              <h3>Invite your friends</h3>
              <p>Bring your squad and earn rewards together.</p>
              <button type="button" className="campus-pill-btn">
                Invite Now
                <FiArrowRight aria-hidden="true" />
              </button>
            </section>
          </aside>

          <section className="campus-main campus-profile-main">
            <header className="campus-profile-topbar">
              <div className="campus-profile-breadcrumb">
                <span>My Profile</span>
                <FiChevronRight aria-hidden="true" />
                <strong>{activeTab}</strong>
              </div>
              <div className="campus-profile-top-actions">
                <Link to="/campus/opportunities" className="campus-profile-find-btn">
                  <FiPlusCircle aria-hidden="true" />
                  Find Opportunities
                  <FiChevronDown aria-hidden="true" />
                </Link>
                <button type="button" className="campus-icon-btn" aria-label="Open messages">
                  <FiMessageCircle aria-hidden="true" />
                  <span className="campus-badge">6</span>
                </button>
                <button type="button" className="campus-icon-btn" aria-label="Open notifications">
                  <FiBell aria-hidden="true" />
                  <span className="campus-badge">3</span>
                </button>
                <button type="button" className="campus-profile-user-btn" aria-label="Open profile menu">
                  <img src="/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp" alt="Brian" />
                </button>
              </div>
            </header>

            <article className="campus-profile-surface campus-profile-hero">
              <div className="campus-profile-identity">
                <div className="campus-profile-photo-wrap">
                  <img
                    src="/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp"
                    alt="Brian Mwangi"
                  />
                  <span aria-hidden="true" />
                </div>

                <div className="campus-profile-identity-copy">
                  <h1>
                    Brian Mwangi
                    <em>Student</em>
                  </h1>
                  <p>Kenyatta University · Year 3 · Marketing & Design</p>
                  <div className="campus-profile-identity-meta">
                    <span>
                      <FiMapPin aria-hidden="true" />
                      Nairobi, Kenya
                    </span>
                    <span>
                      <FiAtSign aria-hidden="true" />
                      brian_mwangi
                    </span>
                  </div>
                  <div className="campus-profile-tag-row" aria-label="Skills">
                    {PROFILE_TAGS.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="campus-profile-hero-actions">
                <button type="button" className="campus-profile-ghost-btn">Edit Profile</button>
                <button type="button" className="campus-profile-ghost-icon" aria-label="Profile settings">
                  <FiSettings aria-hidden="true" />
                </button>
              </div>
            </article>

            {!isShopTab ? (
              <section className="campus-profile-metrics" aria-label="Profile metrics">
                {PROFILE_METRICS.map(({ label, value, meta, Icon, tone }) => (
                  <article key={label} className={`campus-profile-surface campus-profile-metric-card is-${tone}`}>
                    <div className="campus-profile-metric-icon">
                      <Icon aria-hidden="true" />
                    </div >
                    <div className='campus-profile-metric-tab'>
                    <p>{label}</p>
                    <h3>{value}</h3>
                    <span>{meta}</span>
                    </div>
                  </article>
                ))}
              </section>
            ) : null}

            <section className="campus-profile-tabs-wrap">
              <nav className="campus-profile-tabs" aria-label="Profile tabs">
                {PROFILE_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={activeTab === tab ? 'is-active' : ''}
                    aria-selected={activeTab === tab}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </section>

            {activeTab === 'Overview' ? (
              <>
                <div className="campus-profile-overview-top-grid">
                  <article className="campus-profile-surface campus-profile-score-card">
                    <header className="campus-profile-card-head">
                      <div>
                        <h2>Zumbarl Score Breakdown</h2>
                        <p>Your overall performance across key areas</p>
                      </div>
                      <button type="button" className="campus-link-btn">What is this?</button>
                    </header>

                    <div className="campus-profile-score-grid">
                    <div
                      className="campus-profile-score-ring"
                      style={{
                        '--score-angle': `${Math.round((PROFILE_SCORE / 100) * 360)}deg`,
                        '--score-color': profileScoreColor,
                      }}
                    >
                        <div>
                          <strong>{PROFILE_SCORE}</strong>
                          <span>Tier 3</span>
                        </div>
                      </div>

                      <div className="campus-profile-score-bars">
                        {SCORE_BARS.map((item) => (
                          <div key={item.label} className="campus-profile-score-row">
                            <p>{item.label}</p>
                            <div>
                              <span
                                style={{
                                  width: `${(item.value / item.max) * 100}%`,
                                  backgroundColor: getScoreFillColor(item.value, item.max),
                                }}
                              />
                            </div>
                            <strong>{item.value}/{item.max}</strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    <footer className="campus-profile-score-foot">
                      <p>Score refreshes in 11 days</p>
                      <p>Next tier: Gold (26 pts to go)</p>
                    </footer>
                  </article>

                  <article className="campus-profile-surface campus-profile-endorsement-card">
                    <header className="campus-profile-card-head">
                      <h2>Endorsements</h2>
                      <button type="button" className="campus-link-btn">View all</button>
                    </header>

                    <div className="campus-profile-endorsement-list">
                      {ENDORSEMENTS.map((item) => (
                        <article key={`${item.company}-${item.date}`} className="campus-profile-endorsement-item">
                          <img src={`/assets/index/bee_nobg.png`} alt={`${item.company} logo`} />
                          <div>
                            <h3>{item.company}</h3>
                            <p>{item.person}</p>
                            <blockquote>{item.quote}</blockquote>
                          </div>
                          <div>
                            <strong>{item.reward}</strong>
                            <p>{item.date}</p>
                          </div>
                        </article>
                      ))}
                    </div>

                    <footer className="campus-profile-endorsement-foot">
                      <p>Endorsement Currencies (EC) earned: <strong>36</strong></p>
                      <div>
                        <span style={{ width: '72%' }} />
                      </div>
                      <p>Next reward at 50 EC <strong>36/50</strong></p>
                    </footer>
                  </article>
                </div>

                <div className="campus-profile-dual-grid">
                  <article className="campus-profile-surface">
                    <header className="campus-profile-card-head">
                      <h2>Achievements</h2>
                      <button type="button" className="campus-link-btn">View all</button>
                    </header>

                    <div className="campus-profile-achievement-list">
                      {ACHIEVEMENTS.map(({ title, subtitle, Icon, tone }) => (
                        <article key={title}>
                          <div className={`campus-profile-achievement-icon is-${tone}`}>
                            <Icon aria-hidden="true" />
                          </div>
                          <div>
                            <h3>{title}</h3>
                            <p>{subtitle}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </article>

                  <article className="campus-profile-surface">
                    <header className="campus-profile-card-head">
                      <h2>Earnings Summary</h2>
                      <FiBarChart2 aria-hidden="true" />
                    </header>
                    <div className="campus-profile-earnings-list">
                      {EARNINGS_SUMMARY.map((entry) => (
                        <div key={entry.label}>
                          <p>{entry.label}</p>
                          <strong>{entry.value}</strong>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="campus-profile-surface">
                    <header className="campus-profile-card-head">
                      <h2>Top Skills</h2>
                      <button type="button" className="campus-link-btn">View all</button>
                    </header>
                    <div className="campus-profile-skill-chip-list">
                      {TOP_SKILLS.map((skill) => (
                        <span key={skill.label} className="campus-profile-skill-chip">
                          {skill.label}
                          <em>{skill.level}</em>
                        </span>
                      ))}
                    </div>
                  </article>
                </div>

                <article className="campus-profile-surface campus-profile-work-card">
                  <header className="campus-profile-card-head">
                    <h2>Recent Work Highlights</h2>
                    <button type="button" className="campus-link-btn">View full portfolio</button>
                  </header>

                  <div className="campus-profile-work-grid">
                    {WORK_HIGHLIGHTS.map((item) => (
                      <article key={item.title} className="campus-profile-work-item">
                        <img src={item.image} alt={`${item.title} sample`} loading="lazy" />
                        <p>{item.title}</p>
                        <span>{item.org}</span>
                        <strong>
                          <FiStar aria-hidden="true" />
                          {item.rating}
                        </strong>
                      </article>
                    ))}
                  </div>
                </article>

              </>
            ) : activeTab === 'Portfolio' ? (
              <>
                <section className="campus-profile-surface campus-portfolio-services-panel">
                  <header className="campus-portfolio-services-head">
                    <div>
                      <h3>My Services</h3>
                      <p>Services I can provide to clients and businesses.</p>
                    </div>
                    <button type="button" className="campus-portfolio-add-btn">
                      <FiPlusCircle aria-hidden="true" />
                      Add Service
                    </button>
                  </header>

                  <article className="campus-portfolio-service-composer">
                    <div className="campus-portfolio-service-composer-head">
                      <img
                        src="/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp"
                        alt="Aisha Mwangi"
                      />
                      <p>What service do you want to offer next?</p>
                    </div>
                    <footer className="campus-portfolio-service-composer-foot">
                      <div className="campus-portfolio-service-tools">
                        {PORTFOLIO_SERVICE_COMPOSER_TOOLS.map(({ label, Icon }) => (
                          <button key={label} type="button">
                            <Icon aria-hidden="true" />
                            {label}
                          </button>
                        ))}
                      </div>
                      <button type="button" className="campus-shop-post-btn">Post</button>
                    </footer>
                  </article>

                  <div className="campus-portfolio-service-grid">
                    {PORTFOLIO_SERVICES.map(({ id, title, category, description, price, delivery, image }) => (
                      <article
                        key={id}
                        className={`campus-portfolio-service-card${selectedPortfolioServiceId === id ? ' is-selected' : ''}`}
                        role="button"
                        tabIndex={0}
                        aria-pressed={selectedPortfolioServiceId === id}
                        onClick={() => {
                          setSelectedPortfolioServiceId(id)
                          setSelectedPortfolioId(null)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            setSelectedPortfolioServiceId(id)
                            setSelectedPortfolioId(null)
                          }
                        }}
                      >
                        <img
                          className="campus-portfolio-service-thumb"
                          src={image}
                          alt={`${title} thumbnail`}
                          loading="lazy"
                        />
                        <p className="campus-portfolio-service-category">{category}</p>
                        <h4>{title}</h4>
                        <p className="campus-portfolio-service-description">{description}</p>
                        <footer>
                          <strong>{price}</strong>
                          <span>{delivery}</span>
                        </footer>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="campus-profile-surface campus-portfolio-panel">
                  <div className="campus-portfolio-sticky-head">
                    <header className="campus-portfolio-head">
                      <div>
                        <h2>My Portfolio</h2>
                        <p>A collection of my best work across different categories.</p>
                      </div>
                    </header>

                    <div className="campus-portfolio-toolbar">
                      <div className="campus-portfolio-filter-row">
                        {PORTFOLIO_FILTERS.map(({ key, label }) => (
                          <button
                            key={key}
                            type="button"
                            className={`campus-portfolio-filter-chip${activePortfolioFilter === key ? ' is-active' : ''}`}
                            onClick={() => {
                              setActivePortfolioFilter(key)
                              if (key !== 'all' && selectedPortfolioItem && selectedPortfolioItem.filter !== key) {
                                setSelectedPortfolioId(null)
                              }
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <button type="button" className="campus-portfolio-sort-btn">
                        Most Recent
                        <FiChevronDown aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="campus-portfolio-grid">
                    {portfolioItems.map((item) => (
                      <article
                        key={item.id}
                        className={`campus-portfolio-item${selectedPortfolioId === item.id ? ' is-selected' : ''}`}
                        role="button"
                        tabIndex={0}
                        aria-pressed={selectedPortfolioId === item.id}
                        onClick={() => {
                          setSelectedPortfolioId(item.id)
                          setSelectedPortfolioServiceId(null)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            setSelectedPortfolioId(item.id)
                            setSelectedPortfolioServiceId(null)
                          }
                        }}
                      >
                        <div className="campus-portfolio-thumb">
                          {item.featured ? <span className="campus-portfolio-featured">Featured</span> : null}
                          <button type="button" className="campus-portfolio-more" aria-label="Project actions">
                            <FiMoreVertical aria-hidden="true" />
                          </button>
                          <img src={item.image} alt={`${item.title} preview`} loading="lazy" />
                        </div>
                        <div className="campus-portfolio-item-body">
                          <p className="campus-portfolio-category">{item.category}</p>
                          <h3>{item.title}</h3>
                          <p className="campus-portfolio-description">{item.description}</p>
                          <div className="campus-portfolio-item-foot">
                            <div className="campus-portfolio-client">
                              <img src={`/assets/index/bee_nobg.png`} alt={`${item.client} logo`} />
                              <div>
                                <strong>{item.client}</strong>
                                <p>
                                  <FiStar aria-hidden="true" />
                                  {item.rating}
                                </p>
                              </div>
                            </div>
                            <time>{item.date}</time>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="campus-profile-surface campus-portfolio-case-study">
                  <div className="campus-portfolio-case-head">
                    <div>
                      <p>
                        <FiStar aria-hidden="true" />
                        Featured Case Study
                      </p>
                      <h3>Media Campaigns</h3>
                      <span>Social Media · May 12, 2025</span>
                    </div>
                    <button type="button" className="campus-portfolio-case-btn">
                      View Case Study
                      <FiArrowRight aria-hidden="true" />
                    </button>
                  </div>

                  <div className="campus-portfolio-case-body">
                    <div className="campus-portfolio-case-metrics">
                      <article>
                        <strong>45%</strong>
                        <p>Engagement Increase</p>
                      </article>
                      <article>
                        <strong>2.3K</strong>
                        <p>New Followers</p>
                      </article>
                      <article>
                        <strong>12.5K</strong>
                        <p>Reach</p>
                      </article>
                      <article>
                        <strong>5.0/5</strong>
                        <p>Client Rating</p>
                      </article>
                    </div>
                  </div>
                </section>
              </>
            ) : isExperienceTab ? (
              <section className="campus-profile-surface campus-experience-panel">
                <header className="campus-experience-head">
                  <div>
                    <h2>Career Pipeline & Experience</h2>
                    <p>Your journey in the Marketing & Design career path</p>
                  </div>
                  <div className="campus-experience-head-actions">
                    <button type="button" className="campus-experience-outline-btn">
                      View Full Roadmap
                      <FiArrowRight aria-hidden="true" />
                    </button>
                    <button type="button" className="campus-experience-outline-btn">
                      <FiDownload aria-hidden="true" />
                      Download Progress
                    </button>
                  </div>
                </header>

                <div className="campus-experience-layout">
                  <section className="campus-experience-stage-list" aria-label="Career pipeline stages">
                    {EXPERIENCE_STAGES.map(({ step, title, description, status, statusTone, completion, projects, companies, Icon }, index) => (
                      <article key={title} className={`campus-experience-stage-item is-${statusTone}`}>
                        <div className="campus-experience-stage-rail" aria-hidden="true">
                          <div className="campus-experience-stage-icon">
                            <Icon />
                          </div>
                          {index < EXPERIENCE_STAGES.length - 1 ? <span className="campus-experience-stage-line" /> : null}
                        </div>

                        <div className="campus-experience-stage-body">
                          <div className="campus-experience-stage-head">
                            <div>
                              <h3>{step}. {title}</h3>
                              <p>{description}</p>
                            </div>
                            <div className="campus-experience-stage-status-block">
                              <em className={`campus-experience-stage-status is-${statusTone}`}>{status}</em>
                              <strong>{completion}</strong>
                            </div>
                          </div>
                          <p className="campus-experience-stage-foot">{projects} Projects · {companies} Companies</p>
                        </div>
                      </article>
                    ))}
                  </section>

                  <div className="campus-experience-divider" aria-hidden="true">
                    <span className="campus-experience-divider-dot is-top" />
                    <span className="campus-experience-divider-dot is-active" />
                    <span className="campus-experience-divider-dot is-bottom" />
                  </div>

                  <section className="campus-experience-current-card">
                    <header className="campus-experience-current-head">
                      <h2>
                        Current Stage: {EXPERIENCE_CURRENT_STAGE.title}
                        <em>{EXPERIENCE_CURRENT_STAGE.status}</em>
                      </h2>
                      <strong>{EXPERIENCE_CURRENT_STAGE.progress}% Complete</strong>
                    </header>

                    <div className="campus-experience-progress-bar" role="img" aria-label={`${EXPERIENCE_CURRENT_STAGE.progress}% complete`}>
                      <span style={{ width: `${EXPERIENCE_CURRENT_STAGE.progress}%` }} />
                    </div>

                    <p className="campus-experience-current-summary">{EXPERIENCE_CURRENT_STAGE.summary}</p>

                    <div className="campus-experience-project-list">
                      {EXPERIENCE_STAGE_PROJECTS.map(({ title, company, date, status, statusTone, rating, image }) => (
                        <article key={`${title}-${date}`}>
                          <img src={image} alt={`${title} preview`} loading="lazy" />
                          <div>
                            <h4>{title}</h4>
                            <p>{company}</p>
                            <time>{date}</time>
                          </div>
                          <div className="campus-experience-project-meta">
                            <em className={`campus-experience-stage-status is-${statusTone}`}>{status}</em>
                            <strong>{rating ? <><FiStar aria-hidden="true" /> {rating}</> : '–'}</strong>
                          </div>
                        </article>
                      ))}
                    </div>

                    <button type="button" className="campus-experience-project-btn">
                      View all 5 projects in this stage
                      <FiArrowRight aria-hidden="true" />
                    </button>
                  </section>
                </div>
              </section>
            ) : isSkillsTab ? (
              <section className="campus-profile-surface campus-skills-panel">
                <div className="campus-skills-sticky-head">
                  <header className="campus-skills-head">
                    <div>
                      <h2>My Skills</h2>
                      <p>Your skills, their proficiency level, and how you&apos;re growing.</p>
                    </div>
                    <button type="button" className="campus-skills-add-btn">
                      <FiPlusCircle aria-hidden="true" />
                      Add Skill
                    </button>
                  </header>

                  <div className="campus-skills-toolbar">
                    <label className="campus-skills-search-field" htmlFor="campus-skills-search">
                      <FiSearch aria-hidden="true" />
                      <input
                        id="campus-skills-search"
                        type="text"
                        placeholder="Search skills..."
                        value={skillsSearchQuery}
                        onChange={(event) => setSkillsSearchQuery(event.target.value)}
                      />
                    </label>

                    <select
                      aria-label="Filter by category"
                      value={skillsCategoryFilter}
                      onChange={(event) => setSkillsCategoryFilter(event.target.value)}
                    >
                      {SKILLS_CATEGORY_FILTERS.map((filter) => (
                        <option key={filter} value={filter}>{filter}</option>
                      ))}
                    </select>

                    <select
                      aria-label="Filter by level"
                      value={skillsLevelFilter}
                      onChange={(event) => setSkillsLevelFilter(event.target.value)}
                    >
                      {SKILLS_LEVEL_FILTERS.map((filter) => (
                        <option key={filter} value={filter}>{filter}</option>
                      ))}
                    </select>

                    <button type="button" className="campus-skills-retake-btn">
                      <FiRefreshCw aria-hidden="true" />
                      Retake Skill Assessments
                    </button>
                  </div>
                </div>

                <section className="campus-skills-table">
                  <header className="campus-skills-table-head" aria-hidden="true">
                    <span />
                    <p>Proficiency Level</p>
                    <p>Zumbarl Score</p>
                    <p>Last Used</p>
                    <span />
                  </header>

                  {hasSkillsResults ? (
                    <>
                      {filteredCoreSkills.length ? (
                        <>
                          <h3 className="campus-skills-group-title">Core Skills</h3>
                          <div className="campus-skills-group-list">
                            {renderSkillsRows(filteredCoreSkills, 'core')}
                          </div>
                        </>
                      ) : null}

                      {filteredOtherSkills.length ? (
                        <>
                          <h3 className="campus-skills-group-title">Other Skills</h3>
                          <div className="campus-skills-group-list">
                            {renderSkillsRows(filteredOtherSkills, 'other')}
                          </div>
                        </>
                      ) : null}
                    </>
                  ) : (
                    <p className="campus-skills-empty-state">
                      No skills match your current filters. Try another search term or reset filters.
                    </p>
                  )}
                </section>

                <button type="button" className="campus-skills-show-more-btn">
                  Show More Skills
                  <FiChevronDown aria-hidden="true" />
                </button>
              </section>
            ) : isShopTab ? (
              <section className="campus-profile-surface campus-shop-panel">
                <div className="campus-shop-sticky-head">
                  <header className="campus-shop-head">
                    <div>
                      <h2>
                        <FiShoppingBag aria-hidden="true" />
                        My Product Shop
                      </h2>
                      <p>Handpicked, stylish and quality products you&apos;ll love.</p>
                    </div>
                    <button type="button" className="campus-shop-catalogue-btn">
                      <FiGrid aria-hidden="true" />
                      View Catalogue
                    </button>
                  </header>

                  <article className="campus-shop-composer">
                    <div className="campus-shop-composer-head">
                      <img
                        src="/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp"
                        alt="Aisha Mwangi"
                      />
                      <p>What&apos;s new in your shop?</p>
                    </div>
                    <footer className="campus-shop-composer-foot">
                      <div className="campus-shop-composer-tools">
                        {SHOP_COMPOSER_TOOLS.map(({ label, Icon }) => (
                          <button key={label} type="button">
                            <Icon aria-hidden="true" />
                            {label}
                          </button>
                        ))}
                      </div>
                      <button type="button" className="campus-shop-post-btn">Post</button>
                    </footer>
                  </article>

                  <div className="campus-shop-filter-bar">
                    <div className="campus-shop-filter-list">
                      {SHOP_TAB_FILTERS.map(({ key, label }) => (
                        <button
                          key={key}
                          type="button"
                          className={activeShopFilter === key ? 'is-active' : ''}
                          onClick={() => {
                            setActiveShopFilter(key)
                            if (selectedShopProduct && key !== 'all' && selectedShopProduct.filter !== key && !selectedShopProduct.badges.includes(key)) {
                              setSelectedShopProductUid(null)
                              setActiveShopDetailImageIndex(0)
                              setActiveShopDetailTab('details')
                            }
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <button type="button" className="campus-shop-sort-btn">
                      Most Recent
                      <FiChevronDown aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <section className="campus-shop-product-grid">
                  {filteredShopProducts.map((item) => (
                    <article
                      key={item.uid}
                      className={`campus-shop-product-card${selectedShopProductUid === item.uid ? ' is-selected' : ''}`}
                      role="button"
                      tabIndex={0}
                      aria-pressed={selectedShopProductUid === item.uid}
                      onClick={() => handleShopProductSelect(item.uid)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          handleShopProductSelect(item.uid)
                        }
                      }}
                    >
                      <header className="campus-shop-product-top">
                        <div>
                          <img
                            src="/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp"
                            alt={`${item.seller} avatar`}
                          />
                          <p>{item.seller}</p>
                          <span>{item.time}</span>
                        </div>
                        <button
                          type="button"
                          aria-label={`More actions for ${item.title}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <FiMoreVertical aria-hidden="true" />
                        </button>
                      </header>

                      <div className="campus-shop-product-image-wrap">
                        <img src={item.image} alt={`${item.title} preview`} loading="lazy" />
                        <em className={`campus-shop-product-badge ${item.badgeTone}`}>{item.badge}</em>
                      </div>

                      <div className="campus-shop-product-body">
                        <p className="campus-shop-product-title-row">
                          <strong>{item.title}</strong>
                          <span>{item.price}</span>
                        </p>
                        <p className="campus-shop-product-description">{item.description}</p>
                      </div>

                      <footer className="campus-shop-product-foot">
                        <p>
                          <FiHeart aria-hidden="true" />
                          {item.likes}
                        </p>
                        <p>
                          <FiMessageCircle aria-hidden="true" />
                          {item.comments}
                        </p>
                        <p>
                          <FiSend aria-hidden="true" />
                          {item.shares}
                        </p>
                        <button
                          type="button"
                          aria-label={`Save ${item.title}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <FiBookmark aria-hidden="true" />
                        </button>
                      </footer>
                    </article>
                  ))}
                </section>
              </section>
            ) : (
              <section className="campus-profile-surface campus-profile-tab-panel">
                <header className="campus-profile-card-head">
                  <h2>{activeTab}</h2>
                  <button type="button" className="campus-link-btn">View all</button>
                </header>
                <p className="campus-profile-tab-copy">
                  {activeTab} content is now active. This tab is wired and ready for the dedicated {activeTab.toLowerCase()} module.
                </p>
              </section>
            )}
          </section>

          {isPortfolioProjectDetailOpen && selectedPortfolioItem && selectedPortfolioDetail ? (
            <aside className="campus-rail campus-portfolio-detail-rail" aria-label={`${selectedPortfolioItem.title} details`}>
              <section className="campus-rail-card campus-portfolio-detail-panel">
                <header className="campus-portfolio-detail-head">
                  <img src={selectedPortfolioItem.image} alt={`${selectedPortfolioItem.title} preview`} />
                  <div>
                    <h3>{selectedPortfolioItem.title}</h3>
                    <p>
                      <span>{selectedPortfolioItem.category}</span>
                      <span>{selectedPortfolioItem.date}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    className="campus-portfolio-detail-close"
                    aria-label="Close project details"
                    onClick={() => setSelectedPortfolioId(null)}
                  >
                    <FiX aria-hidden="true" />
                  </button>
                </header>

                <section className="campus-portfolio-detail-client-grid">
                  <article>
                    <h4>Client</h4>
                    <div className="campus-portfolio-detail-client-row">
                      <img src={`/assets/index/bee_nobg.png`} alt={`${selectedPortfolioItem.client} logo`} />
                      <strong>{selectedPortfolioItem.client}</strong>
                    </div>
                  </article>
                  <article>
                    <h4>Pipeline Stage Achieved</h4>
                    <strong>{selectedPortfolioDetail.pipelineStage}</strong>
                    <p>{selectedPortfolioDetail.pipelineNote}</p>
                  </article>
                </section>

                <section className="campus-portfolio-detail-score-block">
                  <header>
                    <div>
                      <h4>Project Scores</h4>
                      <p>Scores are based on client review and platform data.</p>
                    </div>
                    {/* <p className="campus-portfolio-detail-overall">
                      Overall Score
                      <FiStar aria-hidden="true" />
                      <strong>{selectedPortfolioDetail.overallScore}</strong>
                    </p> */}
                  </header>

                  <div className="campus-portfolio-detail-score-grid">
                    <div className="campus-portfolio-radar-panel">
                      <div className="campus-portfolio-radar-wrap">
                        <svg viewBox="0 0 200 200" role="img" aria-label="Project score radar">
                          {[1, 2, 3, 4, 5].map((ring) => (
                            <polygon
                              key={ring}
                              points={buildRadarRingPoints(6, ring)}
                              className="campus-portfolio-radar-ring"
                            />
                          ))}
                          {Array.from({ length: 6 }).map((_, index) => {
                            const angle = -Math.PI / 2 + (index * 2 * Math.PI) / 6
                            const x = 100 + 84 * Math.cos(angle)
                            const y = 100 + 84 * Math.sin(angle)
                            return <line key={index} x1="100" y1="100" x2={x} y2={y} className="campus-portfolio-radar-axis" />
                          })}
                          <polygon points={selectedPortfolioScorePoints} className="campus-portfolio-radar-shape" />
                        </svg>
                      </div>
                      <div className="campus-portfolio-radar-labels" aria-hidden="true">
                        {selectedPortfolioDetail.projectScores.map((score, index) => (
                          <div key={`${selectedPortfolioItem.id}-radar-label-${score.label}`} className={`campus-portfolio-radar-label is-pos-${index}`}>
                            <p>{score.label}</p>
                            <strong>{score.score.toFixed(1)}/5</strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="campus-portfolio-score-list">
                      {selectedPortfolioDetail.projectScores.map((score) => {
                        return (
                        <article key={`${selectedPortfolioItem.id}-${score.label}`}>
                          <p>
                            {score.label}
                          </p>
                          <strong>{score.score.toFixed(1)}/5</strong>
                        </article>
                        )
                      })}
                    </div>
                  </div>

                  <p className="campus-portfolio-score-note">
                    <FiInfo aria-hidden="true" />
                    Scores are from client review after project completion.
                  </p>
                </section>

                <section className="campus-portfolio-detail-skills">
                  <h4>Skills Developed</h4>
                  <p>Skills and competencies you strengthened by working on this project.</p>
                  <div className="campus-portfolio-detail-skill-chips">
                    {selectedPortfolioDetail.skillsDeveloped.map((skill) => (
                      <span key={`${selectedPortfolioItem.id}-${skill.name}`}>
                        {skill.name}
                        <em>{skill.level}</em>
                      </span>
                    ))}
                  </div>
                </section>

                <section className="campus-portfolio-detail-impact">
                  <h4>Evidence & Impact</h4>
                  <div className="campus-portfolio-detail-impact-grid">
                    {selectedPortfolioDetail.impact.map((item) => (
                      <article key={`${selectedPortfolioItem.id}-${item.label}`}>
                        <strong>{item.value}</strong>
                        <p>{item.label}</p>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="campus-portfolio-detail-feedback">
                  <h4>Client Feedback</h4>
                  <blockquote>“{selectedPortfolioDetail.feedback.quote}”</blockquote>
                  <p>
                    <strong>{selectedPortfolioDetail.feedback.author}</strong>
                    <span>{selectedPortfolioDetail.feedback.role}</span>
                  </p>
                  <div className="campus-portfolio-detail-actions">
                    <button type="button" className="campus-portfolio-detail-action-btn is-ghost">View Project Files</button>
                    <button type="button" className="campus-portfolio-detail-action-btn is-primary">Share Project</button>
                  </div>
                </section>
              </section>
            </aside>
          ) : isPortfolioServiceDetailOpen && selectedPortfolioService ? (
            <aside className="campus-rail campus-portfolio-detail-rail" aria-label={`${selectedPortfolioService.title} service details`}>
              <section className="campus-rail-card campus-portfolio-detail-panel campus-service-detail-panel">
                <header className="campus-service-detail-head">
                  <img
                    className="campus-service-detail-thumb"
                    src={selectedPortfolioService.image}
                    alt={`${selectedPortfolioService.title} thumbnail`}
                    loading="lazy"
                  />
                  <div>
                    <h3>{selectedPortfolioService.title}</h3>
                    <p>
                      <span>{selectedPortfolioService.category}</span>
                      <span>{selectedPortfolioService.delivery}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    className="campus-portfolio-detail-close"
                    aria-label="Close service details"
                    onClick={() => setSelectedPortfolioServiceId(null)}
                  >
                    <FiX aria-hidden="true" />
                  </button>
                </header>

                <section className="campus-portfolio-detail-client-grid campus-service-detail-meta-grid">
                  <article>
                    <h4>Starting Price</h4>
                    <strong>{selectedPortfolioService.price}</strong>
                    <p>{selectedPortfolioService.revisions}</p>
                  </article>
                  <article>
                    <h4>Service Health</h4>
                    <strong>{selectedPortfolioService.satisfaction}</strong>
                    <p>{selectedPortfolioService.completed}</p>
                  </article>
                </section>

                <section className="campus-service-detail-copy">
                  <h4>Service Summary</h4>
                  <p>{selectedPortfolioService.description}</p>
                </section>

                <section className="campus-portfolio-detail-skills">
                  <h4>What Clients Get</h4>
                  <p>Deliverables included in this service package.</p>
                  <div className="campus-portfolio-detail-skill-chips">
                    {selectedPortfolioService.includes.map((item) => (
                      <span key={`${selectedPortfolioService.id}-${item}`}>
                        {item}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="campus-service-detail-workflow">
                  <h4>Delivery Workflow</h4>
                  <ol>
                    {selectedPortfolioService.workflow.map((item) => (
                      <li key={`${selectedPortfolioService.id}-${item}`}>{item}</li>
                    ))}
                  </ol>
                </section>

                <section className="campus-portfolio-detail-impact">
                  <h4>Service Stats</h4>
                  <div className="campus-portfolio-detail-impact-grid">
                    <article>
                      <strong>{selectedPortfolioService.delivery}</strong>
                      <p>Typical Delivery</p>
                    </article>
                    <article>
                      <strong>{selectedPortfolioService.responseTime}</strong>
                      <p>Response Time</p>
                    </article>
                    <article>
                      <strong>{selectedPortfolioService.revisions}</strong>
                      <p>Revision Policy</p>
                    </article>
                    <article>
                      <strong>{selectedPortfolioService.price}</strong>
                      <p>Starting Price</p>
                    </article>
                  </div>
                </section>

                <section className="campus-portfolio-detail-actions">
                  <button type="button" className="campus-portfolio-detail-action-btn is-ghost">Edit Service</button>
                  <button type="button" className="campus-portfolio-detail-action-btn is-primary">Share Service</button>
                </section>
              </section>
            </aside>
          ) : null}

          {!isPortfolioTab ? (
            <aside className={`campus-rail campus-profile-rail${isSkillsTab ? ' is-skills-rail' : ''}${isShopTab ? ' is-shop-rail' : ''}${isShopProductDetailOpen ? ' is-shop-detail-open' : ''}`}>
              {isExperienceTab ? (
                <>
                  <article className="campus-rail-card campus-profile-side-card campus-experience-side-card">
                    <header className="campus-profile-card-head">
                      <h2>Career Path</h2>
                      <button type="button" className="campus-link-btn">Edit Path</button>
                    </header>

                    <div className="campus-experience-path-block">
                        <img src={`/assets/index/bee_nobg.png`} alt={`${EXPERIENCE_PATH_CARD.name} logo`} className='campus-experience-path-icon' />
                      <div>
                        <h3>{EXPERIENCE_PATH_CARD.name}</h3>
                        <p>{EXPERIENCE_PATH_CARD.tags.join(' · ')}</p>
                        <span>Last Edited: {EXPERIENCE_PATH_CARD.chosenDate}</span>
                      </div>
                      <em className="campus-experience-pill is-complete">{EXPERIENCE_PATH_CARD.status}</em>
                    </div>
                  </article>

                  <article className="campus-rail-card campus-profile-side-card campus-experience-side-card">
                    <header className="campus-profile-card-head">
                      <h2>Overall Pipeline Progress</h2>
                    </header>

                    <div className="campus-experience-progress-overview">
                      <div
                        className="campus-experience-progress-ring"
                        style={{ '--experience-progress': `${Math.round((EXPERIENCE_PROGRESS_SUMMARY.percent / 100) * 360)}deg` }}
                      >
                        <strong>{EXPERIENCE_PROGRESS_SUMMARY.percent}<span>%</span></strong>
                      </div>
                      <p>
                        Completed {EXPERIENCE_PROGRESS_SUMMARY.completedStages} of 5 stages
                        <span>Keep going! You&apos;re on track.</span>
                      </p>
                    </div>

                    <div className="campus-experience-side-list">
                      <article>
                        <p>Completed Stages</p>
                        <strong>{EXPERIENCE_PROGRESS_SUMMARY.completedStages}</strong>
                      </article>
                      <article>
                        <p>In Progress</p>
                        <strong>{EXPERIENCE_PROGRESS_SUMMARY.inProgressStages}</strong>
                      </article>
                      <article>
                        <p>Locked</p>
                        <strong>{EXPERIENCE_PROGRESS_SUMMARY.lockedStages}</strong>
                      </article>
                    </div>
                  </article>

                  <article className="campus-rail-card campus-profile-side-card campus-experience-side-card">
                    <header className="campus-profile-card-head">
                      <h2>Experience Overview</h2>
                      <button type="button" className="campus-experience-filter-btn">
                        This Year
                        <FiChevronDown aria-hidden="true" />
                      </button>
                    </header>

                    <div className="campus-experience-overview-list">
                      {EXPERIENCE_OVERVIEW_METRICS.map(({ label, value, Icon, tone }) => (
                        <article key={label}>
                          <p>
                            <span className={`campus-experience-overview-icon is-${tone}`}>
                              <Icon aria-hidden="true" />
                            </span>
                            {label}
                          </p>
                          <strong>{value}</strong>
                        </article>
                      ))}
                    </div>
                  </article>

                  <article className="campus-rail-card campus-profile-side-card campus-experience-side-card">
                    <header className="campus-profile-card-head">
                      <h2>Recent Achievements</h2>
                      <button type="button" className="campus-link-btn">View all</button>
                    </header>

                    <div className="campus-experience-achievement-list">
                      {EXPERIENCE_RECENT_ACHIEVEMENTS.map(({ title, detail, date, Icon, tone }) => (
                        <article key={`${title}-${date}`}>
                          <span className={`campus-experience-overview-icon is-${tone}`}>
                            <Icon aria-hidden="true" />
                          </span>
                          <div>
                            <h3>{title}</h3>
                            <p>{detail}</p>
                          </div>
                          <time>{date}</time>
                        </article>
                      ))}
                    </div>
                  </article>
                </>
              ) : isSkillsTab ? (
                <>
                  <article className="campus-rail-card campus-profile-side-card campus-skills-rail-card">
                    <header className="campus-skills-rail-head">
                      <h2>Overall Skills Score</h2>
                      <FiInfo aria-hidden="true" />
                    </header>

                    <div className="campus-skills-rail-score-block">
                      <div
                        className="campus-skills-rail-score-ring"
                        style={{ '--skills-overall-angle': `${Math.round((76 / 100) * 360)}deg` }}
                      >
                        <strong>
                          76
                        </strong>
                      </div>
                      <div className="campus-skills-rail-score-copy">
                        <h3>Advanced</h3>
                        <p>You&apos;re performing better than 72% of students on Zumbarl</p>
                        <div>
                          <em>+ 8 points</em>
                          <span>from last month</span>
                        </div>
                      </div>
                    </div>
                  </article>

                  <article className="campus-rail-card campus-profile-side-card campus-skills-rail-card">
                    <header className="campus-skills-rail-subhead">
                      <h2>Skills Summary</h2>
                    </header>
                    <div className="campus-skills-summary-grid">
                      {SKILLS_SUMMARY.map((item) => (
                        <article key={item.label}>
                          <strong>{item.value}</strong>
                          <p>{item.label}</p>
                        </article>
                      ))}
                    </div>
                  </article>

                  {/* <article className="campus-rail-card campus-profile-side-card campus-skills-rail-card">
                    <header className="campus-skills-rail-subhead">
                      <h2>Top Skills</h2>
                      <button type="button" className="campus-link-btn">View all (12)</button>
                    </header>
                    <div className="campus-skills-top-list">
                      {SKILLS_TOP_LIST.map((skill) => (
                        <article key={skill.label}>
                          <p>{skill.label}</p>
                          <div>
                            <span style={{ width: `${skill.score}%` }} />
                          </div>
                          <strong>{skill.score}/100</strong>
                        </article>
                      ))}
                    </div>
                  </article> */}

                  <article className="campus-rail-card campus-profile-side-card campus-skills-rail-card">
                    <header className="campus-skills-rail-subhead">
                      <h2>Skills Progress Over Time</h2>
                      <button type="button" className="campus-link-btn">View full report</button>
                    </header>
                    <div className="campus-skills-chart-wrap">
                      <svg viewBox="0 0 344 112" role="img" aria-label="Skills progress line chart">
                        <line x1="14" y1="14" x2="330" y2="14" className="campus-skills-chart-grid-line" />
                        <line x1="14" y1="42" x2="330" y2="42" className="campus-skills-chart-grid-line" />
                        <line x1="14" y1="70" x2="330" y2="70" className="campus-skills-chart-grid-line" />
                        <line x1="14" y1="98" x2="330" y2="98" className="campus-skills-chart-grid-line" />
                        {skillsTrendFillPoints ? <polygon points={skillsTrendFillPoints} className="campus-skills-chart-area" /> : null}
                        {skillsTrendPoints ? <polyline points={skillsTrendPoints} className="campus-skills-chart-line" /> : null}
                        {skillsTrendCoordinates.map((point) => (
                          <g key={point.month}>
                            <circle cx={point.x} cy={point.y} r="3.2" className="campus-skills-chart-point" />
                            <text x={point.x} y={point.y - 8} textAnchor="middle" className="campus-skills-chart-point-label">{point.value}</text>
                          </g>
                        ))}
                      </svg>
                      <div className="campus-skills-chart-months">
                        {SKILLS_PROGRESS_TIMELINE.map((point) => (
                          <span key={point.month}>{point.month}</span>
                        ))}
                      </div>
                    </div>
                  </article>

                  <article className="campus-rail-card campus-profile-side-card campus-skills-rail-card">
                    <header className="campus-skills-rail-subhead">
                      <h2>Recent Skill Achievements</h2>
                      <button type="button" className="campus-link-btn">View all</button>
                    </header>
                    <div className="campus-skills-achievements-list">
                      {SKILLS_RECENT_ACHIEVEMENTS.map((item) => (
                        <article key={item.id}>
                          <span className={`campus-skills-achievement-badge ${item.tone}`}>{item.badge}</span>
                          <div>
                            <h3>{item.skill}</h3>
                            <p>{item.detail}</p>
                          </div>
                          <time>{item.date}</time>
                        </article>
                      ))}
                    </div>

                    <button type="button" className="campus-skills-resources-btn">
                      Browse Skill Learning Resources
                      <FiArrowRight aria-hidden="true" />
                    </button>
                  </article>
                </>
              ) : isShopTab ? (
                isShopProductDetailOpen && selectedShopProduct ? (
                  <article className="campus-rail-card campus-profile-side-card campus-shop-rail-card campus-shop-detail-card">
                    <header className="campus-shop-detail-topbar">
                      {/* <h2>{selectedShopProduct.title}</h2> */}
                      <div>
                        <button
                          type="button"
                          className="campus-shop-detail-more-btn"
                          onClick={() => setActiveShopDetailTab('details')}
                        >
                          More details
                        </button>
                        <button
                          type="button"
                          aria-label="Previous product image"
                          onClick={() => {
                            if (!shopDetailGallery.length) return
                            setActiveShopDetailImageIndex((prev) => (prev - 1 + shopDetailGallery.length) % shopDetailGallery.length)
                          }}
                        >
                          <FiChevronLeft aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label="Next product image"
                          onClick={() => {
                            if (!shopDetailGallery.length) return
                            setActiveShopDetailImageIndex((prev) => (prev + 1) % shopDetailGallery.length)
                          }}
                        >
                          <FiChevronRight aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="campus-portfolio-detail-close"
                          aria-label="Close product details"
                          onClick={() => {
                            setSelectedShopProductUid(null)
                            setActiveShopDetailImageIndex(0)
                            setActiveShopDetailTab('details')
                          }}
                        >
                          <FiX aria-hidden="true" />
                        </button>
                      </div>
                    </header>

                    <section className="campus-shop-detail-gallery">
                      <div className="campus-shop-detail-thumb-strip">
                        {(selectedShopProductDetail?.gallery || []).map((image, index) => (
                          <button
                            key={`${selectedShopProduct.uid}-thumb-${index}`}
                            type="button"
                            className={normalizedShopDetailImageIndex === index ? 'is-active' : ''}
                            aria-label={`Preview image ${index + 1}`}
                            onClick={() => setActiveShopDetailImageIndex(index)}
                          >
                            <img src={image} alt={`${selectedShopProduct.title} thumbnail ${index + 1}`} loading="lazy" />
                          </button>
                        ))}
                      </div>

                      <div className="campus-shop-detail-hero">
                        <img src={activeShopDetailImage} alt={`${selectedShopProduct.title} preview`} loading="lazy" />
                        <em className={`campus-shop-detail-badge ${selectedShopProduct.badgeTone}`}>{selectedShopProduct.badge}</em>
                        <span>{normalizedShopDetailImageIndex + 1}/{selectedShopProductDetail?.gallery?.length || 1}</span>
                      </div>
                    </section>

                    <div className="campus-shop-detail-title-row">
                      <h3>{selectedShopProduct.title}</h3>
                      <strong>{selectedShopProduct.price}</strong>
                    </div>

                    <p className="campus-shop-detail-rating">
                      <FiStar aria-hidden="true" />
                      {selectedShopProductDetail?.rating || '4.8'} ({selectedShopProductDetail?.reviews || 0} reviews) · {selectedShopProductDetail?.sold || 0} sold
                    </p>

                    <p className="campus-shop-detail-description">{selectedShopProduct.description}</p>

                    <div className="campus-shop-detail-chip-grid">
                      {(selectedShopProductDetail?.featureChips || []).map((item) => (
                        <article key={`${selectedShopProduct.uid}-${item.label}`}>
                          <p>{item.label}</p>
                          <strong>{item.value}</strong>
                        </article>
                      ))}
                    </div>

                    <div className="campus-shop-detail-actions">
                      <button type="button" className="campus-shop-detail-action-btn is-primary">
                        <FiShoppingBag aria-hidden="true" />
                        Add to Cart
                      </button>
                      <button type="button" className="campus-shop-detail-action-btn is-ghost">Buy Now</button>
                    </div>

                    <div className="campus-shop-detail-switcher">
                      <button
                        type="button"
                        className={activeShopDetailTab === 'details' ? 'is-active' : ''}
                        onClick={() => setActiveShopDetailTab('details')}
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        className={activeShopDetailTab === 'posts' ? 'is-active' : ''}
                        onClick={() => setActiveShopDetailTab('posts')}
                      >
                        Posts ({selectedShopProductDetail?.posts || 0})
                      </button>
                    </div>

                    {activeShopDetailTab === 'details' ? (
                      <section className="campus-shop-detail-copy">
                        <h4>Product Details</h4>
                        <p>{selectedShopProductDetail?.summary}</p>
                        <ul>
                          {(selectedShopProductDetail?.details || []).map((item) => (
                            <li key={`${selectedShopProduct.uid}-${item}`}>{item}</li>
                          ))}
                        </ul>

                        <h4>Available Colors</h4>
                        <div className="campus-shop-detail-color-row">
                          {(selectedShopProductDetail?.colors || []).map((color) => (
                            <span key={`${selectedShopProduct.uid}-${color}`} style={{ background: color }} />
                          ))}
                        </div>
                      </section>
                    ) : (
                      <section className="campus-shop-detail-posts">
                        {(selectedShopProductDetail?.postsFeed || []).map((post) => (
                          <article key={post.id}>
                            <img src={post.image} alt={`${post.title} preview`} loading="lazy" />
                            <div>
                              <h4>{post.title}</h4>
                              <p>{post.caption}</p>
                              <span>{post.date}</span>
                            </div>
                            <footer>
                              <p>
                                <FiHeart aria-hidden="true" />
                                {post.likes}
                              </p>
                              <p>
                                <FiMessageCircle aria-hidden="true" />
                                {post.comments}
                              </p>
                              <p>
                                <FiSend aria-hidden="true" />
                                {post.shares}
                              </p>
                            </footer>
                          </article>
                        ))}
                      </section>
                    )}

                    <footer className="campus-shop-detail-footer">
                      <p>
                        <FiMapPin aria-hidden="true" />
                        Ships from Nairobi, Kenya
                      </p>
                      <p>
                        <FiRefreshCw aria-hidden="true" />
                        7-day easy returns
                      </p>
                    </footer>
                  </article>
                ) : (
                <>
                  <article className="campus-rail-card campus-profile-side-card campus-shop-rail-card">
                    <header className="campus-shop-rail-head">
                      <h2>About My Shop</h2>
                      <button type="button" className="campus-link-btn">Edit</button>
                    </header>
                    <p className="campus-shop-about-copy">
                      Curated products that blend style, quality and everyday practicality. Thank you for supporting my small business!
                    </p>

                    <div className="campus-shop-about-stats">
                      {SHOP_ABOUT_STATS.map((item) => (
                        <article key={item.label}>
                          <p>{item.label}</p>
                          <strong>
                            {item.value}
                            {/* {item.label === 'Rating' ? <><FiStar aria-hidden="true" /> </> : null} */}
                          </strong>
                        </article>
                      ))}
                    </div>

                    <div className="campus-shop-social-list">
                      {SHOP_SOCIAL_LINKS.map(({ label, Icon }) => (
                        <button key={label} type="button" aria-label={label}>
                          <Icon aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  </article>

                  <article className="campus-rail-card campus-profile-side-card campus-shop-rail-card">
                    <header className="campus-shop-rail-head">
                      <h2>Shop Highlights</h2>
                    </header>
                    <div className="campus-shop-highlight-list">
                      {SHOP_HIGHLIGHTS.map(({ title, description, Icon }) => (
                        <article key={title}>
                          <span>
                            <Icon aria-hidden="true" />
                          </span>
                          <div>
                            <h3>{title}</h3>
                            <p>{description}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </article>

                  <article className="campus-rail-card campus-profile-side-card campus-shop-rail-card">
                    <header className="campus-shop-rail-head">
                      <h2>Top Products</h2>
                      <button type="button" className="campus-link-btn">View all</button>
                    </header>
                    <div className="campus-shop-top-product-list">
                      {SHOP_TOP_PRODUCTS.map((item) => (
                        <article key={item.id}>
                          <img src={item.image} alt={`${item.name} preview`} loading="lazy" />
                          <div>
                            <h3>{item.name}</h3>
                            <p>{item.price}</p>
                          </div>
                          <strong>
                            {item.rating}
                            <FiStar aria-hidden="true" />
                            <span>({item.reviews})</span>
                          </strong>
                        </article>
                      ))}
                    </div>
                  </article>

                  <article className="campus-rail-card campus-profile-side-card campus-shop-rail-card">
                    <header className="campus-shop-rail-head">
                      <h2>Current Offer</h2>
                      <button type="button" className="campus-link-btn">Edit</button>
                    </header>

                    <div className="campus-shop-offer-card">
                      <div>
                        <h3>Free Delivery Weekend!</h3>
                        <p>Get free delivery on all orders above KES 2,000 this weekend only.</p>
                        <strong>Valid till May 26, 2025</strong>
                      </div>
                      <span aria-hidden="true">🛍️</span>
                    </div>
                  </article>
                </>
                )
              ) : (
                <>
                  <article className="campus-rail-card campus-profile-side-card">
                    <header className="campus-profile-card-head">
                      <h2>Relationships</h2>
                      <button type="button" className="campus-link-btn">View all</button>
                    </header>

                    <div className="campus-profile-pipeline-list">
                      {PIPELINE_RELATIONSHIPS.map((item) => (
                        <article key={item.name}>
                          <img src={`/assets/index/bee_nobg.png`} alt={`${item.name} logo`} />
                          <div>
                            <h3>{item.name}</h3>
                            <p>{item.meta}</p>
                          </div>
                          <em>{item.status}</em>
                        </article>
                      ))}
                    </div>

                    <p className="campus-profile-pipeline-note">
                      <FiClock aria-hidden="true" />
                      Transition mode unlocks in 14 months at current pace.
                    </p>
                  </article>

                  <article className="campus-rail-card campus-profile-side-card">
                    <header className="campus-profile-card-head">
                      <h2>Recent Activity</h2>
                      <button type="button" className="campus-link-btn">View all</button>
                    </header>

                    <div className="campus-profile-activity-list">
                      {RECENT_ACTIVITY.map(({ title, detail, time, Icon, tone }) => (
                        <article key={`${title}-${time}`}>
                          <div className={`campus-profile-activity-icon is-${tone}`}>
                            <Icon aria-hidden="true" />
                          </div>
                          <div>
                            <h3>{title}</h3>
                            <p>{detail}</p>
                          </div>
                          <span>{time}</span>
                        </article>
                      ))}
                    </div>
                  </article>

                  <article className="campus-rail-card campus-profile-side-card">
                    <header className="campus-profile-card-head">
                      <h2>Quick Actions</h2>
                    </header>

                    <div className="campus-profile-quick-list">
                      {QUICK_ACTIONS.map(({ label, Icon }) => (
                        <button key={label} type="button">
                          <span>
                            <Icon aria-hidden="true" />
                            {label}
                          </span>
                          <FiChevronRight aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  </article>
                </>
              )}
            </aside>
          ) : null}
        </div>
      </div>
    </main>
  )
}

export default CampusProfilePage
