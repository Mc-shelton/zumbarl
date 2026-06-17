import { useMemo } from 'react'
import useEarnFlowState from '../../earn/hooks/useEarnFlowState'
import {
  PORTFOLIO_ITEMS,
  PORTFOLIO_SERVICES,
  SHOP_PRODUCTS_WITH_UID,
  SKILLS_CORE,
  SKILLS_OTHER,
  SKILLS_PROGRESS_TIMELINE,
  buildRadarPoints,
  buildSkillsTrendCoordinates,
  getPortfolioDetail,
  getShopProductDetail,
} from '../constants'

function matchesSkillFilters(skill, normalizedSearch, categoryFilter, levelFilter) {
  const matchesSearch = !normalizedSearch
    || skill.name.toLowerCase().includes(normalizedSearch)
    || skill.category.toLowerCase().includes(normalizedSearch)
  const matchesCategory = categoryFilter === 'All Categories' || skill.category === categoryFilter
  const matchesLevel = levelFilter === 'All Levels' || skill.level === levelFilter

  return matchesSearch && matchesCategory && matchesLevel
}

function useCampusProfileViewModel({
  activePortfolioFilter,
  activeShopDetailImageIndex,
  activeShopFilter,
  activeTab,
  selectedPortfolioId,
  selectedPortfolioServiceId,
  selectedShopProductUid,
  skillsCategoryFilter,
  skillsLevelFilter,
  skillsSearchQuery,
}) {
  const isPortfolioTab = activeTab === 'Portfolio'
  const isExperienceTab = activeTab === 'Experience'
  const isSkillsTab = activeTab === 'Skills'
  const isShopTab = activeTab === 'Shop'
  const earnFlow = useEarnFlowState()
  const portfolioEvidenceItems = useMemo(() => earnFlow.portfolioEvidence.map((item) => ({
    ...item,
    source: 'earn-flow',
  })), [earnFlow.portfolioEvidence])
  const endorsementItems = useMemo(() => (
    earnFlow.endorsements.map((item) => ({ ...item, source: 'earn-flow' }))
  ), [earnFlow.endorsements])
  const combinedPortfolioItems = useMemo(() => (
    [...portfolioEvidenceItems, ...PORTFOLIO_ITEMS]
  ), [portfolioEvidenceItems])

  const portfolioItems = useMemo(() => (
    activePortfolioFilter === 'all'
      ? combinedPortfolioItems
      : combinedPortfolioItems.filter((item) => item.filter === activePortfolioFilter)
  ), [activePortfolioFilter, combinedPortfolioItems])

  const selectedPortfolioItem = useMemo(() => (
    selectedPortfolioId
      ? combinedPortfolioItems.find((item) => item.id === selectedPortfolioId) || null
      : null
  ), [combinedPortfolioItems, selectedPortfolioId])

  const selectedPortfolioService = useMemo(() => (
    selectedPortfolioServiceId
      ? PORTFOLIO_SERVICES.find((service) => service.id === selectedPortfolioServiceId) || null
      : null
  ), [selectedPortfolioServiceId])

  const selectedShopProduct = useMemo(() => (
    selectedShopProductUid
      ? SHOP_PRODUCTS_WITH_UID.find((item) => item.uid === selectedShopProductUid) || null
      : null
  ), [selectedShopProductUid])

  const selectedShopProductDetail = useMemo(() => (
    selectedShopProduct ? getShopProductDetail(selectedShopProduct) : null
  ), [selectedShopProduct])

  const shopDetailGallery = useMemo(() => {
    if (selectedShopProductDetail?.gallery?.length) {
      return selectedShopProductDetail.gallery
    }

    return selectedShopProduct ? [selectedShopProduct.image] : []
  }, [selectedShopProduct, selectedShopProductDetail])

  const normalizedShopDetailImageIndex = shopDetailGallery.length
    ? Math.min(activeShopDetailImageIndex, shopDetailGallery.length - 1)
    : 0
  const activeShopDetailImage = shopDetailGallery[normalizedShopDetailImageIndex] || selectedShopProduct?.image

  const selectedPortfolioDetail = useMemo(() => (
    selectedPortfolioItem ? getPortfolioDetail(selectedPortfolioItem) : null
  ), [selectedPortfolioItem])

  const selectedPortfolioScorePoints = useMemo(() => (
    selectedPortfolioDetail
      ? buildRadarPoints(selectedPortfolioDetail.projectScores.map((item) => item.score))
      : ''
  ), [selectedPortfolioDetail])

  const {
    filteredCoreSkills,
    filteredOtherSkills,
    hasSkillsResults,
  } = useMemo(() => {
    const normalizedSkillSearch = skillsSearchQuery.trim().toLowerCase()
    const nextCoreSkills = SKILLS_CORE.filter((skill) => (
      matchesSkillFilters(skill, normalizedSkillSearch, skillsCategoryFilter, skillsLevelFilter)
    ))
    const nextOtherSkills = SKILLS_OTHER.filter((skill) => (
      matchesSkillFilters(skill, normalizedSkillSearch, skillsCategoryFilter, skillsLevelFilter)
    ))

    return {
      filteredCoreSkills: nextCoreSkills,
      filteredOtherSkills: nextOtherSkills,
      hasSkillsResults: nextCoreSkills.length > 0 || nextOtherSkills.length > 0,
    }
  }, [skillsCategoryFilter, skillsLevelFilter, skillsSearchQuery])

  const {
    skillsTrendCoordinates,
    skillsTrendFillPoints,
    skillsTrendPoints,
  } = useMemo(() => {
    const coordinates = buildSkillsTrendCoordinates(SKILLS_PROGRESS_TIMELINE)
    const points = coordinates.map((point) => `${point.x},${point.y}`).join(' ')
    const fillPoints = coordinates.length
      ? `${coordinates[0].x},98 ${points} ${coordinates[coordinates.length - 1].x},98`
      : ''

    return {
      skillsTrendCoordinates: coordinates,
      skillsTrendFillPoints: fillPoints,
      skillsTrendPoints: points,
    }
  }, [])

  const filteredShopProducts = useMemo(() => (
    activeShopFilter === 'all'
      ? SHOP_PRODUCTS_WITH_UID
      : SHOP_PRODUCTS_WITH_UID.filter((item) => (
        item.filter === activeShopFilter || item.badges.includes(activeShopFilter)
      ))
  ), [activeShopFilter])
  const workHighlights = useMemo(() => (
    portfolioItems.slice(0, 4).map((item) => ({
      image: item.image,
      org: item.client,
      rating: item.rating,
      title: item.title,
    }))
  ), [portfolioItems])

  const isPortfolioProjectDetailOpen = isPortfolioTab && Boolean(selectedPortfolioItem)
  const isPortfolioServiceDetailOpen = isPortfolioTab && Boolean(selectedPortfolioService)
  const isPortfolioDetailOpen = isPortfolioProjectDetailOpen || isPortfolioServiceDetailOpen
  const isShopProductDetailOpen = isShopTab && Boolean(selectedShopProduct)

  return {
    activeShopDetailImage,
    filteredCoreSkills,
    filteredOtherSkills,
    filteredShopProducts,
    endorsements: endorsementItems,
    hasSkillsResults,
    isExperienceTab,
    isPortfolioDetailOpen,
    isPortfolioProjectDetailOpen,
    isPortfolioServiceDetailOpen,
    isPortfolioTab,
    isShopProductDetailOpen,
    isShopTab,
    isSkillsTab,
    normalizedShopDetailImageIndex,
    portfolioItems,
    selectedPortfolioDetail,
    selectedPortfolioItem,
    selectedPortfolioScorePoints,
    selectedPortfolioService,
    selectedShopProduct,
    selectedShopProductDetail,
    shopDetailGallery,
    workHighlights,
    skillsTrendCoordinates,
    skillsTrendFillPoints,
    skillsTrendPoints,
  }
}

export default useCampusProfileViewModel
