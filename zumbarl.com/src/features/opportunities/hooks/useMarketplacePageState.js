import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FEATURED_ITEMS,
  RECENT_ITEMS,
  TRENDING_ITEMS,
  getMarketplaceItemPath,
} from '../../../data/marketplace'
import { listMarketplaceListings, mapMarketplaceApiListing } from '../services/marketplaceInteractionService'

const VIEWER_CAMPUS = 'Kenyatta University'

function filterByCategory(items, activeCategory) {
  if (activeCategory === 'All Items') {
    return items
  }

  return items.filter((item) => item.category === activeCategory)
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
  const [activeCategory, setActiveCategory] = useState('All Items')
  const [activeRecentFilter, setActiveRecentFilter] = useState('All')
  const [databaseItems, setDatabaseItems] = useState([])

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
    const byId = new Map(databaseItems.map((item) => [item.id, item]))
    const mergedFeatured = FEATURED_ITEMS.map((item) => byId.get(item.id) ? { ...item, ...byId.get(item.id) } : item)
    const featuredIds = new Set(mergedFeatured.map((item) => item.id))
    const mergedRecent = [
      ...databaseItems.filter((item) => !featuredIds.has(item.id)),
      ...RECENT_ITEMS.filter((item) => !byId.has(item.id)),
    ]
    return { featured: mergedFeatured, recent: mergedRecent }
  }, [databaseItems])

  const filteredFeaturedItems = useMemo(() => (
    filterByCategory(marketplaceItems.featured, activeCategory)
  ), [activeCategory, marketplaceItems.featured])
  const filteredRecentItems = useMemo(() => (
    applyRecentFilter(filterByCategory(marketplaceItems.recent, activeCategory), activeRecentFilter)
  ), [activeCategory, activeRecentFilter, marketplaceItems.recent])
  const filteredTrendingItems = useMemo(() => (
    filterByCategory(TRENDING_ITEMS, activeCategory)
  ), [activeCategory])

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

  return {
    activeCategory,
    activeRecentFilter,
    filteredFeaturedItems,
    filteredRecentItems,
    filteredTrendingItems,
    handleCardKeyDown,
    handleCategoryKeyDown,
    onCategoryChange: setActiveCategory,
    onOpenItemDetail: openItemDetail,
    onRecentFilterChange: setActiveRecentFilter,
  }
}

export default useMarketplacePageState
