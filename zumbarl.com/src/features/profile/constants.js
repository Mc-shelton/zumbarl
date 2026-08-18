import { FiAward, FiBookOpen, FiBriefcase, FiCheckCircle, FiClock, FiCreditCard, FiDownload, FiEdit3, FiFilm, FiGrid, FiImage, FiMessageCircle, FiPackage, FiPlusCircle, FiRefreshCw, FiShare2, FiStar, FiTrendingUp, FiTruck, FiUsers } from 'react-icons/fi'
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa6'
import { ACCESS_KEYS, filterByAccess } from '../auth/roleConfig'

export const PROFILE_TAGS = ['Social Media', 'Graphic Design', 'Canva', 'Copywriting', '+4']
export const PROFILE_TAB_ITEMS = [
  { label: 'Overview', requiredAccess: ACCESS_KEYS.profile.viewOwn },
  { label: 'Marketing', requiredAccess: ACCESS_KEYS.profile.viewOwn },
  { label: 'Portfolio', requiredAccess: ACCESS_KEYS.profile.portfolio },
  { label: 'Experience', requiredAccess: ACCESS_KEYS.profile.experience },
  { label: 'Skills', requiredAccess: ACCESS_KEYS.profile.skills },
  { label: 'Shop', requiredAccess: ACCESS_KEYS.profile.shop },
  { label: 'Education', requiredAccess: ACCESS_KEYS.profile.education },
  { label: 'Reviews', requiredAccess: ACCESS_KEYS.profile.reviews },
  { label: 'Activity', requiredAccess: ACCESS_KEYS.profile.activity },
]
export const PROFILE_TABS = filterByAccess(PROFILE_TAB_ITEMS).map((tab) => tab.label)
export const PROFILE_SCORE = 74
export const PROFILE_TOP_VIEWER = {
  name: 'Brian',
  avatar: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
}

export const PROFILE_METRICS = [
  { label: 'Zumbarl Score', value: '74', meta: 'Tier 3 · Silver', Icon: FiAward, tone: 'purple' },
  { label: 'Gigs Completed', value: '23', meta: '18 rated · 5 pending', Icon: FiBriefcase, tone: 'green' },
  { label: 'Delivery Rate', value: '94%', meta: '22 of 23 on time', Icon: FiTrendingUp, tone: 'mint' },
  { label: 'Avg. Rating', value: '4.6/5', meta: 'from 18 reviews', Icon: FiStar, tone: 'blue' },
  { label: 'Repeat Clients', value: '7', meta: 'out of 12 clients', Icon: FiUsers, tone: 'violet' },
]

export const SCORE_BARS = [
  { label: 'Gig volume', value: 7, max: 10 },
  { label: 'Avg. rating', value: 9, max: 10 },
  { label: 'Delivery rate', value: 9, max: 10 },
  { label: 'Repeat clients', value: 5, max: 10 },
  { label: 'Endorsements', value: 3, max: 10 },
]

export const SCORE_COLOR_MIN = { r: 164, g: 171, b: 189 }
export const SCORE_COLOR_MAX = { r: 14, g: 122, b: 60 }

export function getScoreFillColor(value, max) {
  if (max <= 0) {
    return `rgb(${SCORE_COLOR_MIN.r}, ${SCORE_COLOR_MIN.g}, ${SCORE_COLOR_MIN.b})`
  }

  const ratio = Math.min(1, Math.max(0, value / max))
  const r = Math.round(SCORE_COLOR_MIN.r + (SCORE_COLOR_MAX.r - SCORE_COLOR_MIN.r) * ratio)
  const g = Math.round(SCORE_COLOR_MIN.g + (SCORE_COLOR_MAX.g - SCORE_COLOR_MIN.g) * ratio)
  const b = Math.round(SCORE_COLOR_MIN.b + (SCORE_COLOR_MAX.b - SCORE_COLOR_MIN.b) * ratio)

  return `rgb(${r}, ${g}, ${b})`
}

export const TOP_SKILLS = [
  { label: 'Social media', level: 'L4', value: 90 },
  { label: 'Graphic design', level: 'L3', value: 66 },
  { label: 'Copywriting', level: 'L3', value: 58 },
  { label: 'Video editing', level: 'L2', value: 40 },
  { label: 'Data entry', level: 'L1', value: 24 },
]

export const EARNINGS_SUMMARY = [
  { label: 'This month', value: 'KSh 12,400' },
  { label: 'Last month', value: 'KSh 9,800' },
  { label: 'Total earned', value: 'KSh 74,200' },
  { label: 'Chama contribution', value: 'KSh 7,420' },
  { label: 'Avg. per gig', value: 'KSh 3,226' },
]

export const PIPELINE_RELATIONSHIPS = [
  { initials: 'BM', name: 'BrandMasters Agency', meta: '7 gigs · 2 endorsements', status: 'Pipeline active' },
  { initials: 'PZ', name: 'Pesaflow Fintech', meta: '3 gigs · 1 endorsement', status: 'Warming up' },
  { initials: 'NK', name: 'NaiKreative Studio', meta: '1 gig · no endorsement', status: 'Early' },
]

export const RECENT_ACTIVITY = [
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

export const WORK_HIGHLIGHTS = [
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

export const ENDORSEMENTS = [
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

export const ACHIEVEMENTS = [
  { title: 'Zumbarl Silver', subtitle: 'Score 50+', Icon: FiAward, tone: 'purple' },
  { title: 'Top Rated', subtitle: 'Maintain 4.5+ rating', Icon: FiStar, tone: 'yellow' },
  { title: 'Quick Responder', subtitle: '90% response rate', Icon: FiMessageCircle, tone: 'green' },
  { title: 'Consistent Performer', subtitle: '10 gigs completed', Icon: FiCheckCircle, tone: 'teal' },
]

export const QUICK_ACTIONS = [
  { label: 'Edit Profile', Icon: FiEdit3, requiredAccess: ACCESS_KEYS.profile.editOwn },
  { label: 'Add Portfolio Item', Icon: FiPlusCircle, requiredAccess: ACCESS_KEYS.profile.managePortfolio },
  { label: 'Upload Certificate', Icon: FiAward, requiredAccess: ACCESS_KEYS.profile.certificates },
  { label: 'Share Profile', Icon: FiShare2, requiredAccess: ACCESS_KEYS.profile.share },
  { label: 'Download CV', Icon: FiDownload, requiredAccess: ACCESS_KEYS.profile.downloadCv },
]

export const EXPERIENCE_STAGES = [
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

export const EXPERIENCE_CURRENT_STAGE = {
  title: 'Grow & Specialize',
  status: 'In Progress',
  progress: 65,
  summary: "You're building advanced skills and taking on more responsibility. Keep going!",
}

export const EXPERIENCE_STAGE_PROJECTS = [
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

export const EXPERIENCE_PATH_CARD = {
  name: 'Marketing & Design',
  tags: ['Creative', 'Strategic', 'Impactful'],
  chosenDate: 'Jan 15, 2024',
  status: 'Active',
}

export const EXPERIENCE_PROGRESS_SUMMARY = {
  percent: 53,
  completedStages: 2,
  inProgressStages: 1,
  lockedStages: 2,
}

export const EXPERIENCE_OVERVIEW_METRICS = [
  { label: 'Total Projects Completed', value: '14', Icon: FiBriefcase, tone: 'green' },
  { label: 'Total Companies Worked With', value: '7', Icon: FiUsers, tone: 'teal' },
  { label: 'Total Gigs', value: '23', Icon: FiCheckCircle, tone: 'green' },
  { label: 'Total Hours Worked', value: '186h', Icon: FiClock, tone: 'purple' },
  { label: 'Repeat Clients', value: '5', Icon: FiAward, tone: 'purple' },
  { label: 'Average Project Rating', value: '4.6/5', Icon: FiStar, tone: 'yellow' },
]

export const EXPERIENCE_RECENT_ACHIEVEMENTS = [
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

export const SKILLS_CATEGORY_FILTERS = ['All Categories', 'Design', 'Marketing']
export const SKILLS_LEVEL_FILTERS = ['All Levels', 'Expert', 'Advanced', 'Intermediate', 'Beginner']

export const SKILLS_CORE = [
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

export const SKILLS_OTHER = [
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

export const SKILLS_SUMMARY = [
  { label: 'TT', value: '12' },
  { label: 'Adv.', value: '5' },
  { label: 'Int.', value: '4' },
  { label: 'Beg.', value: '3' },
]

export const SKILLS_PROGRESS_TIMELINE = [
  { month: 'Dec 2024', value: 58 },
  { month: 'Jan 2025', value: 62 },
  { month: 'Feb 2025', value: 67 },
  { month: 'Mar 2025', value: 71 },
  { month: 'Apr 2025', value: 76 },
  { month: 'May 2025', value: 76 },
]

export const SKILLS_RECENT_ACHIEVEMENTS = [
  { id: 'achievement-photoshop', badge: 'PS', tone: 'is-photoshop', skill: 'Adobe Photoshop', detail: 'Reached Advanced level', date: 'May 8, 2025' },
  { id: 'achievement-copywriting', badge: 'CW', tone: 'is-copywriting', skill: 'Copywriting', detail: 'Improved by 12 points', date: 'May 5, 2025' },
  { id: 'achievement-canva', badge: 'CV', tone: 'is-canva', skill: 'Canva', detail: 'Reached Expert level', date: 'Apr 30, 2025' },
]

export const SHOP_TAB_FILTERS = [
  { key: 'all', label: 'All Products' },
  { key: 'new-arrivals', label: 'New Arrivals' },
  { key: 'best-sellers', label: 'Best Sellers' },
  { key: 'hair-accessories', label: 'Hair Accessories' },
  { key: 'electronics', label: 'Electronics' },
  { key: 'jewelry', label: 'Jewelry' },
  { key: 'lifestyle', label: 'Lifestyle' },
  { key: 'bundles', label: 'Bundles & Deals' },
]

export const SHOP_COMPOSER_TOOLS = [
  { label: 'Photo/Video', Icon: FiImage },
  { label: 'Product', Icon: FiPackage },
  { label: 'Carousel', Icon: FiGrid },
  { label: 'Reel/Video', Icon: FiFilm },
  { label: 'Write', Icon: FiEdit3 },
]

export const SHOP_PRODUCTS = [
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

export const SHOP_PRODUCTS_WITH_UID = SHOP_PRODUCTS.map((item, index) => ({
  ...item,
  uid: `${item.id}-${index}`,
}))

export const SHOP_ABOUT_STATS = [
  { label: 'Followers', value: '1.2K' },
  { label: 'Products', value: '28' },
  { label: 'Orders', value: '156' },
  { label: 'Rating', value: '4.9' },
]

export const SHOP_SOCIAL_LINKS = [
  { label: 'Instagram', Icon: FaInstagram },
  { label: 'TikTok', Icon: FaTiktok },
  { label: 'WhatsApp', Icon: FaWhatsapp },
  { label: 'Facebook', Icon: FaFacebookF },
]

export const SHOP_HIGHLIGHTS = [
  { title: 'Quality You Can Trust', description: 'Carefully chosen, tested and loved.', Icon: FiAward },
  { title: 'Fast & Reliable Delivery', description: 'We deliver to you, on time.', Icon: FiTruck },
  { title: 'Easy Returns', description: 'Hassle-free returns within 7 days.', Icon: FiRefreshCw },
  { title: 'Secure Payments', description: 'Pay safely using Zumbarl.', Icon: FiCreditCard },
]

export const SHOP_TOP_PRODUCTS = [
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

export const PORTFOLIO_SERVICE_COMPOSER_TOOLS = [
  { label: 'Photo/Video', Icon: FiImage },
  { label: 'Service', Icon: FiBriefcase },
  { label: 'Carousel', Icon: FiGrid },
  { label: 'Write', Icon: FiEdit3 },
]

export const PORTFOLIO_SERVICES = [
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

export const PORTFOLIO_FILTERS = [
  { key: 'all', label: 'All (24)' },
  { key: 'social', label: 'Social Media (8)' },
  { key: 'design', label: 'Graphic Design (6)' },
  { key: 'copy', label: 'Copywriting (5)' },
  { key: 'brand', label: 'Branding (3)' },
  { key: 'video', label: 'Video (2)' },
]

export const PORTFOLIO_ITEMS = [
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

export const PORTFOLIO_DETAIL_OVERRIDES = {
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

export function buildRadarPoints(scores, max = 5, radius = 84, center = 100) {
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

export function buildRadarRingPoints(steps, ring, radius = 84, center = 100) {
  return Array.from({ length: steps }, (_, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / steps
    const ringRadius = (ring / 5) * radius
    const x = center + ringRadius * Math.cos(angle)
    const y = center + ringRadius * Math.sin(angle)
    return `${x},${y}`
  }).join(' ')
}

export function buildSkillsTrendCoordinates(points, width = 344, height = 112, inset = 14) {
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

export function getPortfolioDetail(item) {
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

export function getShopProductDetail(item) {
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
