import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FEATURED_ITEMS,
  RECENT_ITEMS,
  TRENDING_ITEMS,
  getMarketplaceItemPath,
} from '../../../data/marketplace'

function filterByCategory(items, activeCategory) {
  if (activeCategory === 'All Items') {
    return items
  }

  return items.filter((item) => item.category === activeCategory)
}

function useMarketplacePageState() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('All Items')

  const filteredFeaturedItems = useMemo(() => (
    filterByCategory(FEATURED_ITEMS, activeCategory)
  ), [activeCategory])
  const filteredRecentItems = useMemo(() => (
    filterByCategory(RECENT_ITEMS, activeCategory)
  ), [activeCategory])
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
    filteredFeaturedItems,
    filteredRecentItems,
    filteredTrendingItems,
    handleCardKeyDown,
    handleCategoryKeyDown,
    onCategoryChange: setActiveCategory,
    onOpenItemDetail: openItemDetail,
  }
}

export default useMarketplacePageState
