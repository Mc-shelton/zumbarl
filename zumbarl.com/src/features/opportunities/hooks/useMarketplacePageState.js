import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  getMarketplaceItemPath,
} from '../../../data/marketplace'
import { listMarketplaceListings, mapMarketplaceApiListing } from '../services/marketplaceInteractionService'

const VIEWER_CAMPUS = 'Kenyatta University'
const SAVED_ITEMS_KEY = 'zumbarl.marketplace.saved-items.v1'

function readSavedItemIds() {
  if (typeof window === 'undefined') return []
  try {
    const value = JSON.parse(window.localStorage.getItem(SAVED_ITEMS_KEY))
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function isService(item) {
  return String(item.kind || item.listingType || '').toLowerCase() === 'service'
}

function matchesMarketplaceLane(item, activeCategory) {
  if (activeCategory === 'Everything') return true
  if (activeCategory === 'Products') return !isService(item)
  if (!isService(item)) return false

  const searchable = `${item.category || ''} ${item.title || ''}`.toLowerCase()
  if (activeCategory === 'Food & drink') return item.serviceMode === 'order_ahead' || /food|meal|eatery|restaurant|cafe|coffee|snack|baker/.test(searchable)
  if (activeCategory === 'Academic help') return /academic|tutor|lesson|study|notes|research|assignment/.test(searchable)
  if (activeCategory === 'Beauty & care') return /barber|salon|beauty|nail|wellness|massage|hair/.test(searchable)
  if (activeCategory === 'Tech & print') return /tech|repair|print|computer|phone|design|website/.test(searchable)
  return activeCategory === 'Book a service'
}

function filterByCategory(items, activeCategory) {
  return items.filter((item) => matchesMarketplaceLane(item, activeCategory))
}

function getItemPriceAmount(item) {
  return Number(String(item.price || '').replace(/[^\d]/g, '')) || 0
}

function isPostedToday(item) {
  return /(\d+\s*(m|h)\b|min|hour|just now|today)/i.test(String(item.posted || ''))
}

function applyRecentFilter(items, recentFilter) {
  if (recentFilter === 'Near You') {
    return items.filter((item) => String(item.location || '').includes(VIEWER_CAMPUS))
  }
  if (recentFilter === 'New Today') {
    return items.filter(isPostedToday)
  }
  if (recentFilter === 'Price: Low to High') {
    return [...items].sort((a, b) => getItemPriceAmount(a) - getItemPriceAmount(b))
  }
  if (recentFilter === 'Price: High to Low') {
    return [...items].sort((a, b) => getItemPriceAmount(b) - getItemPriceAmount(a))
  }

  return items
}

function useMarketplacePageState() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestedMode = searchParams.get('mode')
  const [activeCategory, setActiveCategory] = useState(requestedMode === 'services' ? 'Book a service' : 'Everything')
  const [activeRecentFilter, setActiveRecentFilter] = useState('All')
  const [databaseItems, setDatabaseItems] = useState([])
  const [savedItemIds, setSavedItemIds] = useState(readSavedItemIds)

  useEffect(() => {
    window.localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(savedItemIds))
  }, [savedItemIds])

  useEffect(() => {
    let cancelled = false
    listMarketplaceListings()
      .then((response) => {
        if (!cancelled) setDatabaseItems((response?.data || []).map(mapMarketplaceApiListing).filter(Boolean))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const marketplaceItems = useMemo(() => {
    const serviceListings = databaseItems.filter(isService)
    const mergedFeatured = [
      ...serviceListings.slice(0, 4),
      ...databaseItems.filter((item) => !isService(item)).slice(0, 4),
    ].filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index)
    const featuredIds = new Set(mergedFeatured.map((item) => item.id))
    const mergedRecent = databaseItems.filter((item) => !featuredIds.has(item.id))
    return { featured: mergedFeatured, recent: mergedRecent }
  }, [databaseItems])

  const filteredFeaturedItems = useMemo(() => (
    filterByCategory(marketplaceItems.featured, activeCategory)
  ), [activeCategory, marketplaceItems.featured])
  const filteredRecentItems = useMemo(() => (
    applyRecentFilter(filterByCategory(marketplaceItems.recent, activeCategory), activeRecentFilter)
  ), [activeCategory, activeRecentFilter, marketplaceItems.recent])
  const filteredTrendingItems = useMemo(() => (
    filterByCategory(marketplaceItems.featured
      .map((item) => ({ ...item, trend: item.trend || item.viewCount || item.savedCount || 0 }))
      .filter((item) => item.trend > 0), activeCategory).slice(0, 5)
  ), [activeCategory, marketplaceItems.featured])

  const openItemDetail = (itemId) => {
    navigate(getMarketplaceItemPath(itemId))
  }

  const handleCardKeyDown = (event, itemId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openItemDetail(itemId)
    }
  }

  const handleCategoryKeyDown = (event, categoryLabel) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setActiveCategory(categoryLabel)
    }
  }

  const toggleSavedItem = (itemId) => {
    setSavedItemIds((current) => current.includes(itemId)
      ? current.filter((id) => id !== itemId)
      : [...current, itemId])
  }

  return {
    activeCategory,
    activeRecentFilter,
    savedItemIds,
    filteredFeaturedItems,
    filteredRecentItems,
    filteredTrendingItems,
    handleCardKeyDown,
    handleCategoryKeyDown,
    onCategoryChange: setActiveCategory,
    onOpenItemDetail: openItemDetail,
    onRecentFilterChange: setActiveRecentFilter,
    onToggleSavedItem: toggleSavedItem,
  }
}

export default useMarketplacePageState
