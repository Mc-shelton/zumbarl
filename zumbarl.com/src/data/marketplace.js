export const MARKETPLACE_CATEGORIES = [
  { label: 'Everything', description: 'All campus offers', icon: 'grid', active: true },
  { label: 'Products', description: 'Buy and collect', icon: 'shopping-bag' },
  { label: 'Book a service', description: 'Choose a time slot', icon: 'calendar' },
  { label: 'Academic help', description: 'Tutors and study help', icon: 'book' },
  { label: 'Beauty & care', description: 'Barbers and wellness', icon: 'scissors' },
  { label: 'Tech & print', description: 'Repairs and printing', icon: 'tool' },
]

export const RECENT_FILTERS = ['All', 'Near You', 'New Today', 'Price: Low to High', 'Price: High to Low']

export function getMarketplaceItemPath(itemId) {
  return `/campus/opportunities/buy-sell/${encodeURIComponent(itemId)}`
}
