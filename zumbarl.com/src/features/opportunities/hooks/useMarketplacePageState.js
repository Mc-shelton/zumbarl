import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FEATURED_ITEMS,
  RECENT_ITEMS,
  TRENDING_ITEMS,
  getMarketplaceItemPath,
} from '../../../data/marketplace'

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

  const filteredFeaturedItems = useMemo(() => (
    filterByCategory(FEATURED_ITEMS, activeCategory)
  ), [activeCategory])
  const filteredRecentItems = useMemo(() => (
    applyRecentFilter(filterByCategory(RECENT_ITEMS, activeCategory), activeRecentFilter)
  ), [activeCategory, activeRecentFilter])
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
