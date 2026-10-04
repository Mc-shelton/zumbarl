import {
  FiAward,
  FiDownload,
  FiEdit3,
  FiFilm,
  FiGrid,
  FiImage,
  FiPackage,
  FiPlusCircle,
  FiShare2,
} from 'react-icons/fi'
import { ACCESS_KEYS, filterByAccess } from '../auth/roleConfig'

const PROFILE_TAB_ITEMS = [
  { label: 'Overview', requiredAccess: ACCESS_KEYS.profile.viewOwn },
  { label: 'Marketing', requiredAccess: ACCESS_KEYS.profile.viewOwn },
  { label: 'Portfolio', requiredAccess: ACCESS_KEYS.profile.portfolio },
  { label: 'Experience', requiredAccess: ACCESS_KEYS.profile.experience },
  { label: 'Pages', requiredAccess: ACCESS_KEYS.profile.viewOwn },
  { label: 'Errands', requiredAccess: ACCESS_KEYS.profile.shop },
  { label: 'Education', requiredAccess: ACCESS_KEYS.profile.education },
  { label: 'Reviews', requiredAccess: ACCESS_KEYS.profile.reviews },
  { label: 'Activity', requiredAccess: ACCESS_KEYS.profile.activity },
]

const SCORE_COLOR_MIN = { r: 164, g: 171, b: 189 }
const SCORE_COLOR_MAX = { r: 14, g: 122, b: 60 }

export const PROFILE_TABS = filterByAccess(PROFILE_TAB_ITEMS).map((tab) => tab.label)

export const QUICK_ACTIONS = [
  { label: 'Edit Profile', Icon: FiEdit3, requiredAccess: ACCESS_KEYS.profile.editOwn },
  { label: 'Add Portfolio Item', Icon: FiPlusCircle, requiredAccess: ACCESS_KEYS.profile.managePortfolio },
  { label: 'Upload Certificate', Icon: FiAward, requiredAccess: ACCESS_KEYS.profile.certificates },
  { label: 'Share Profile', Icon: FiShare2, requiredAccess: ACCESS_KEYS.profile.share },
  { label: 'Download CV', Icon: FiDownload, requiredAccess: ACCESS_KEYS.profile.downloadCv },
]

export const SKILLS_CATEGORY_FILTERS = [
  'All Categories',
  'Marketing & Content',
  'Design & Product',
  'Events & Community',
  'Technology',
  'General',
]

export const SKILLS_LEVEL_FILTERS = [
  'All Levels',
  'Expert',
  'Advanced',
  'Intermediate',
  'Beginner',
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

export const PORTFOLIO_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'social', label: 'Social Media' },
  { key: 'design', label: 'Graphic Design' },
  { key: 'copy', label: 'Copywriting' },
  { key: 'brand', label: 'Branding' },
  { key: 'video', label: 'Video' },
  { key: 'other', label: 'Other' },
]

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

export function buildRadarPoints(scores, max = 5, radius = 84, center = 100) {
  if (!scores.length) return ''

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

export function getPortfolioDetail(item) {
  const projectScores = Array.isArray(item.projectScores) ? item.projectScores : []
  const averageScore = projectScores.length
    ? projectScores.reduce((sum, score) => sum + Number(score.score || 0), 0) / projectScores.length
    : Number(item.ratingValue || 0)

  return {
    pipelineStage: item.status === 'PUBLISHED' ? 'Published proof' : 'Private draft',
    pipelineNote: item.status === 'PUBLISHED'
      ? 'Visible on this portfolio'
      : 'Visible only to you until published',
    overallScore: averageScore ? `${averageScore.toFixed(1)}/5` : 'Not rated',
    projectScores,
    skillsDeveloped: Array.isArray(item.skillsDeveloped) ? item.skillsDeveloped : [],
    impact: Array.isArray(item.impactMetrics) ? item.impactMetrics : [],
    feedback: {
      quote: item.clientFeedback || 'No public client comment was provided for this project.',
      author: item.clientFeedback ? 'Verified client review' : '',
      role: item.clientFeedback && item.showClientName ? item.client : '',
    },
  }
}

export function getShopProductDetail(item) {
  const gallery = item.galleryImages || item.gallery || item.images || [item.image]
  const postsFeed = Array.isArray(item.postsFeed) ? item.postsFeed : []

  return {
    rating: Number(item.rating || item.averageRating || 0),
    reviews: Number(item.reviewCount || item.reviews || 0),
    sold: Number(item.soldCount || item.sold || 0),
    posts: postsFeed.length,
    summary: item.description || '',
    gallery: gallery.filter(Boolean),
    featureChips: Array.isArray(item.featureChips) ? item.featureChips : [],
    details: Array.isArray(item.details) ? item.details : [],
    colors: Array.isArray(item.colors) ? item.colors : [],
    postsFeed,
  }
}
