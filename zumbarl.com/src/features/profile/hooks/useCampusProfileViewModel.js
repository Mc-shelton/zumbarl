import { useMemo } from 'react'
import {
  buildRadarPoints,
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
}, profileExperience = null) {
  const isPortfolioTab = activeTab === 'Portfolio'
  const isMarketingTab = activeTab === 'Marketing'
  const isExperienceTab = activeTab === 'Experience'
  const isPagesTab = activeTab === 'Pages'
  const isShopTab = activeTab === 'Shop'
  const apiPortfolioItems = useMemo(() => (
    (profileExperience?.portfolioItems || []).map((item) => ({
      ...item,
      date: item.date || 'From database',
      featured: item.featured ?? item.isFeatured,
      image: item.image || '/assets/business/campaign-workshop.jpg',
      rating: item.rating || 'Verified',
      source: 'backend',
    }))
  ), [profileExperience?.portfolioItems])
  const combinedPortfolioItems = useMemo(() => {
    return apiPortfolioItems
  }, [apiPortfolioItems])
  const portfolioServices = useMemo(() => {
    const services = (profileExperience?.services || []).map((service) => ({
      id: service.id,
      title: service.title,
      category: service.category || service.meta || 'Service',
      description: service.description,
      price: service.price || service.value,
      delivery: service.delivery || service.meta,
      image: service.image || service.thumbnail || '/assets/business/campaign-workshop.jpg',
    }))
    return services
  }, [profileExperience?.services])

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
      ? portfolioServices.find((service) => service.id === selectedPortfolioServiceId) || null
      : null
  ), [portfolioServices, selectedPortfolioServiceId])

  const shopProducts = useMemo(() => {
    const products = (profileExperience?.shopProducts || []).map((product) => ({
      ...product,
      uid: product.uid || product.id,
      seller: product.seller || profileExperience?.header?.name || 'Student seller',
      time: product.time || 'From database',
      image: product.image || product.thumbnail || '/assets/marketplace/poster-kit.jpg',
      badge: product.badge || 'Available',
      badgeTone: product.badgeTone || 'is-new',
      price: product.price || product.value,
      likes: product.likes || 0,
      comments: product.comments || 0,
      shares: product.shares || 0,
      filter: product.filter || 'products',
      badges: product.badges || product.tags || [],
    }))
    return products
  }, [profileExperience?.header?.name, profileExperience?.shopProducts])

  const selectedShopProduct = useMemo(() => (
    selectedShopProductUid
      ? shopProducts.find((item) => item.uid === selectedShopProductUid) || null
      : null
  ), [selectedShopProductUid, shopProducts])

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
    const backendSkills = (profileExperience?.skills || []).map((skill) => {
      const level = String(skill.level || 'BEGINNER').toLowerCase().replace(/^./, (letter) => letter.toUpperCase())
      const verifiedProjects = Number(skill.verifiedByGigs || 0)
      const levelProgress = { Beginner: 25, Intermediate: 55, Advanced: 75, Expert: 95 }
      const score = Math.max(0, Math.min(100, Number(skill.score ?? skill.zumbarlScore ?? (verifiedProjects ? 30 + (verifiedProjects * 8) : 0))))
      const iconLabel = String(skill.name || 'Skill').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

      return {
        id: skill.id,
        name: skill.name,
        category: skill.category || 'General',
        level,
        endorsements: verifiedProjects,
        iconLabel,
        iconTone: 'is-social',
        proficiency: Math.max(0, Math.min(100, Number(skill.proficiency ?? skill.score ?? levelProgress[level] ?? 0))),
        projects: `${verifiedProjects} verified project${verifiedProjects === 1 ? '' : 's'}`,
        score,
        scoreMeta: verifiedProjects ? `${verifiedProjects} verified project${verifiedProjects === 1 ? '' : 's'}` : 'No verified work yet',
        scoreTier: level,
        lastUsed: skill.lastUsed || 'Not yet',
      }
    })
    const nextCoreSkills = backendSkills.filter((skill) => (
      matchesSkillFilters(skill, normalizedSkillSearch, skillsCategoryFilter, skillsLevelFilter)
    ))
    const nextOtherSkills = []

    return {
      filteredCoreSkills: nextCoreSkills,
      filteredOtherSkills: nextOtherSkills,
      hasSkillsResults: nextCoreSkills.length > 0 || nextOtherSkills.length > 0,
    }
  }, [profileExperience?.skills, skillsCategoryFilter, skillsLevelFilter, skillsSearchQuery])

  const filteredShopProducts = useMemo(() => (
    activeShopFilter === 'all'
      ? shopProducts
      : shopProducts.filter((item) => (
        item.filter === activeShopFilter || item.badges.includes(activeShopFilter)
      ))
  ), [activeShopFilter, shopProducts])
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
    endorsements: profileExperience?.endorsements || [],
    achievements: profileExperience?.achievements || [],
    earningsSummary: profileExperience?.earningsSummary || [],
    hasSkillsResults,
    isExperienceTab,
    isMarketingTab,
    isPagesTab,
    isPortfolioDetailOpen,
    isPortfolioProjectDetailOpen,
    isPortfolioServiceDetailOpen,
    isPortfolioTab,
    isShopProductDetailOpen,
    isShopTab,
    normalizedShopDetailImageIndex,
    portfolioItems,
    portfolioServices,
    profileScore: profileExperience?.score || null,
    selectedPortfolioDetail,
    selectedPortfolioItem,
    selectedPortfolioScorePoints,
    selectedPortfolioService,
    selectedShopProduct,
    selectedShopProductDetail,
    shopDetailGallery,
    workHighlights,
  }
}

export default useCampusProfileViewModel
