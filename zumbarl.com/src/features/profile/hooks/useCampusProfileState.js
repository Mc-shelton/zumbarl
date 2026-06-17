import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

function getShopProductByQuery(queryProduct, shopProducts) {
  if (!queryProduct) {
    return null
  }

  return shopProducts.find((item) => item.uid === queryProduct)
    || shopProducts.find((item) => item.id === queryProduct)
    || null
}

function useCampusProfileState({
  profileTabs,
  shopProducts,
  shopTabFilters,
  skillsCategoryFilters,
  skillsLevelFilters,
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryTab = (searchParams.get('tab') || '').trim().toLowerCase()
  const queryProduct = (searchParams.get('product') || '').trim()
  const queryShopProduct = getShopProductByQuery(queryProduct, shopProducts)
  const hasShopTab = profileTabs.includes('Shop')
  const fallbackTab = profileTabs[0] || 'Overview'
  const queryActiveTab = queryShopProduct && hasShopTab
    ? 'Shop'
    : profileTabs.find((tab) => tab.toLowerCase() === queryTab)
  const [activeTab, setActiveTabState] = useState(queryActiveTab || fallbackTab)
  const [activePortfolioFilter, setActivePortfolioFilter] = useState('all')
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(null)
  const [selectedPortfolioServiceId, setSelectedPortfolioServiceId] = useState(null)
  const [selectedShopProductUid, setSelectedShopProductUid] = useState(
    hasShopTab ? queryShopProduct?.uid || null : null
  )
  const [activeShopDetailImageIndex, setActiveShopDetailImageIndex] = useState(0)
  const [activeShopDetailTab, setActiveShopDetailTab] = useState('details')
  const [skillsSearchQuery, setSkillsSearchQuery] = useState('')
  const [skillsCategoryFilter, setSkillsCategoryFilter] = useState(skillsCategoryFilters[0])
  const [skillsLevelFilter, setSkillsLevelFilter] = useState(skillsLevelFilters[0])
  const [activeShopFilter, setActiveShopFilter] = useState(
    queryShopProduct && hasShopTab ? 'all' : shopTabFilters[0].key
  )

  const setActiveTab = (tab) => {
    setActiveTabState(tab)

    if (queryTab || queryProduct) {
      setSearchParams(new URLSearchParams(), { replace: true })
    }
  }

  const handleShopProductSelect = (uid) => {
    setSelectedShopProductUid(uid)
    setActiveShopDetailImageIndex(0)
    setActiveShopDetailTab('details')
  }

  return {
    activePortfolioFilter,
    activeShopDetailImageIndex,
    activeShopDetailTab,
    activeShopFilter,
    activeTab,
    handleShopProductSelect,
    selectedPortfolioId,
    selectedPortfolioServiceId,
    selectedShopProductUid,
    setActivePortfolioFilter,
    setActiveShopDetailImageIndex,
    setActiveShopDetailTab,
    setActiveShopFilter,
    setActiveTab,
    setSelectedPortfolioId,
    setSelectedPortfolioServiceId,
    setSelectedShopProductUid,
    setSkillsCategoryFilter,
    setSkillsLevelFilter,
    setSkillsSearchQuery,
    skillsCategoryFilter,
    skillsLevelFilter,
    skillsSearchQuery,
  }
}

export default useCampusProfileState
