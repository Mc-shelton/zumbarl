import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CampusSidebar from '../components/layout/CampusSidebar'
import Seo from '../components/Seo'
import { Breadcrumb, ConfirmDialog } from '../components/ui'
import { BusinessWorkspaceHeader } from '../features/business/components/BusinessWorkspaceHeader'
import { BusinessWorkspaceSidebar } from '../features/business/components/BusinessApplicantSidebar'
import ProfileHero from '../features/profile/components/ProfileHero'
import ProfileShopEditor from '../features/profile/components/ProfileShopEditor'
import ProfileMetrics from '../features/profile/components/ProfileMetrics'
import ProfilePortfolioProjectRail from '../features/profile/components/ProfilePortfolioProjectRail'
import ProfilePortfolioServiceRail from '../features/profile/components/ProfilePortfolioServiceRail'
import ProfileSideRail from '../features/profile/components/ProfileSideRail'
import ProfileTabContent from '../features/profile/components/ProfileTabContent'
import ProfileTabs from '../features/profile/components/ProfileTabs'
import ProfileTopBar from '../features/profile/components/ProfileTopBar'
import {
  PROFILE_TABS,
  SHOP_PRODUCTS_WITH_UID,
  SHOP_TAB_FILTERS,
  SKILLS_CATEGORY_FILTERS,
  SKILLS_LEVEL_FILTERS,
} from '../features/profile/constants'
import useCampusProfileState from '../features/profile/hooks/useCampusProfileState'
import useCampusProfileViewModel from '../features/profile/hooks/useCampusProfileViewModel'
import { readMyStudentProfileExperience, readStudentProfileExperience, updateMyStudentProfile } from '../features/campus/services/readCampusExperience'
import { getAuthUserSnapshot, hydrateAuthUserFromBackend, refreshAuthUserFromBackend } from '../features/auth/services/authUserService'
import { readProfileRelationship, setProfileRelationship } from '../features/profile/services/profileRelationshipService'
import { CAMPUS_PROFILE_SEO } from '../features/seo/constants'
import { decideMarketplaceOffer, readMyMarketplaceInventory, readMyMarketplaceSales, readMyPendingMarketplaceOffers, updateMarketplaceSaleStatus, updateMyMarketplaceShop } from '../features/opportunities/services/marketplaceInteractionService'
import '../styles/campus.css'
import '../styles/profile.css'

function CampusProfilePage({ viewContext = 'campus' }) {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const isBusinessView = viewContext === 'business'
  const isPublicStudentView = Boolean(studentId)
  const [viewerStudentId, setViewerStudentId] = useState(() => getAuthUserSnapshot()?.student?.id || '')
  const [profileExperience, setProfileExperience] = useState(null)
  const targetStudentId = profileExperience?.header?.id || studentId || ''
  const isOwnProfile = !isBusinessView && (!studentId || Boolean(viewerStudentId && viewerStudentId === targetStudentId))
  const profileTabs = isOwnProfile ? PROFILE_TABS : PROFILE_TABS.filter((tab) => tab !== 'Marketing')
  const [relationship, setRelationship] = useState({ isConnected: false, isFollowing: false })
  const [relationshipPending, setRelationshipPending] = useState('')
  const [pendingShopOffers, setPendingShopOffers] = useState([])
  const [shopOfferDecisionId, setShopOfferDecisionId] = useState('')
  const [shop, setShop] = useState(null)
  const [isShopOrdersOpen, setIsShopOrdersOpen] = useState(false)
  const [sellerOrders, setSellerOrders] = useState([])
  const [sellerOrdersLoading, setSellerOrdersLoading] = useState(false)
  const [sellerOrdersError, setSellerOrdersError] = useState('')
  const [updatingOrderId, setUpdatingOrderId] = useState('')
  const [orderUnableToFulfil, setOrderUnableToFulfil] = useState(null)
  const [isShopEditorOpen, setIsShopEditorOpen] = useState(false)
  const profileState = useCampusProfileState({
    profileTabs,
    shopProducts: SHOP_PRODUCTS_WITH_UID,
    shopTabFilters: SHOP_TAB_FILTERS,
    skillsCategoryFilters: SKILLS_CATEGORY_FILTERS,
    skillsLevelFilters: SKILLS_LEVEL_FILTERS,
  })
  const viewModel = useCampusProfileViewModel(profileState, profileExperience)
  const contactUserId = profileExperience?.header?.userId || ''

  function openProfileContact(mode) {
    if (!contactUserId || isOwnProfile) return
    const params = new URLSearchParams({
      participantId: contactUserId,
      participantName: profileExperience?.header?.name || 'Student',
      participantStudentId: profileExperience?.header?.id || studentId || '',
    })
    if (profileExperience?.header?.avatar) params.set('participantAvatar', profileExperience.header.avatar)
    if (mode === 'audio' || mode === 'video') params.set('call', mode)
    navigate(`/messages?${params.toString()}`)
  }

  useEffect(() => {
    let isMounted = true
    hydrateAuthUserFromBackend().then((snapshot) => {
      if (isMounted) setViewerStudentId(snapshot?.student?.id || '')
    }).catch(() => {})
    return () => { isMounted = false }
  }, [])

  useEffect(() => {
    if (!targetStudentId || isBusinessView || isOwnProfile) return undefined
    let isMounted = true
    readProfileRelationship(targetStudentId).then((result) => {
      if (isMounted) setRelationship(result)
    }).catch(() => {})
    return () => { isMounted = false }
  }, [isBusinessView, isOwnProfile, targetStudentId])

  async function handleToggleRelationship(type, active) {
    if (!targetStudentId || relationshipPending) return
    setRelationshipPending(type)
    try {
      const updatedRelationship = await setProfileRelationship(targetStudentId, type, active)
      if (type === 'follow' && updatedRelationship.isFollowing !== relationship.isFollowing) {
        setProfileExperience((current) => current ? {
          ...current,
          socialStats: {
            ...(current.socialStats || {}),
            followers: Math.max(0, Number(current.socialStats?.followers || 0) + (updatedRelationship.isFollowing ? 1 : -1)),
          },
        } : current)
      }
      setRelationship(updatedRelationship)
    } finally {
      setRelationshipPending('')
    }
  }

  async function handleSaveProfile(payload) {
    const header = await updateMyStudentProfile(payload)
    await refreshAuthUserFromBackend()
    setProfileExperience((current) => ({
      ...current,
      header,
      skills: (header.tags || []).map((name, index) => ({
        id: `${header.id}-${index}`,
        name,
        category: 'General',
        level: 'BEGINNER',
        verifiedByGigs: 0,
      })),
    }))
  }

  useEffect(() => {
    let isMounted = true
    const readProfile = isPublicStudentView
      ? readStudentProfileExperience(studentId)
      : readMyStudentProfileExperience()
    readProfile
      .then((experience) => {
        if (isMounted) setProfileExperience(experience)
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [isPublicStudentView, studentId])

  useEffect(() => {
    if (!isOwnProfile) return undefined
    let isMounted = true
    readMyPendingMarketplaceOffers()
      .then((response) => {
        if (isMounted) setPendingShopOffers(response.offers || [])
      })
      .catch(() => {})
    return () => { isMounted = false }
  }, [isOwnProfile])

  useEffect(() => {
    if (!isOwnProfile) return undefined
    let isMounted = true
    readMyMarketplaceInventory().then((response) => { if (isMounted) setShop(response.shop) }).catch(() => {})
    return () => { isMounted = false }
  }, [isOwnProfile])

  const handlePortfolioFilterChange = (key) => {
    profileState.setActivePortfolioFilter(key)

    if (
      key !== 'all'
      && viewModel.selectedPortfolioItem
      && viewModel.selectedPortfolioItem.filter !== key
    ) {
      profileState.setSelectedPortfolioId(null)
    }
  }

  const handlePortfolioItemSelect = (id) => {
    profileState.setSelectedPortfolioId(id)
    profileState.setSelectedPortfolioServiceId(null)
  }

  const handlePortfolioServiceSelect = (id) => {
    profileState.setSelectedPortfolioServiceId(id)
    profileState.setSelectedPortfolioId(null)
  }

  const handleShopFilterChange = (key) => {
    profileState.setActiveShopFilter(key)

    if (
      viewModel.selectedShopProduct
      && key !== 'all'
      && viewModel.selectedShopProduct.filter !== key
      && !viewModel.selectedShopProduct.badges.includes(key)
    ) {
      profileState.setSelectedShopProductUid(null)
      profileState.setActiveShopDetailImageIndex(0)
      profileState.setActiveShopDetailTab('details')
    }
  }

  const handleCloseShopDetail = () => {
    profileState.setSelectedShopProductUid(null)
    profileState.setActiveShopDetailImageIndex(0)
    profileState.setActiveShopDetailTab('details')
  }

  const handlePreviousShopImage = () => {
    if (!viewModel.shopDetailGallery.length) {
      return
    }

    profileState.setActiveShopDetailImageIndex((prev) => (
      (prev - 1 + viewModel.shopDetailGallery.length) % viewModel.shopDetailGallery.length
    ))
  }

  const handleNextShopImage = () => {
    if (!viewModel.shopDetailGallery.length) {
      return
    }

    profileState.setActiveShopDetailImageIndex((prev) => (
      (prev + 1) % viewModel.shopDetailGallery.length
    ))
  }

  const openCreateListing = () => {
    navigate('/campus/marketplace/listings/new')
  }

  const openEditListing = (listing) => {
    navigate(`/campus/marketplace/listings/${encodeURIComponent(listing.id)}/edit`)
  }

  const tabHandlers = {
    onPortfolioFilterChange: handlePortfolioFilterChange,
    onPortfolioItemSelect: handlePortfolioItemSelect,
    onPortfolioServiceSelect: handlePortfolioServiceSelect,
    onShopFilterChange: handleShopFilterChange,
    onCreateListing: openCreateListing,
    onEditListing: openEditListing,
    onOpenOrders: () => setIsShopOrdersOpen(true),
    onCloseOrders: () => setIsShopOrdersOpen(false),
    onRefreshOrders: async () => {
      setSellerOrdersLoading(true)
      setSellerOrdersError('')
      try {
        const response = await readMyMarketplaceSales()
        setSellerOrders(response.items || response.orders || [])
      } catch (error) {
        setSellerOrdersError(error?.message || 'We could not load your orders. Please try again.')
      } finally { setSellerOrdersLoading(false) }
    },
    onUpdateOrderStatus: async (order, fulfillmentStatus) => {
      if (updatingOrderId) return
      if (fulfillmentStatus === 'cannot_fulfil') {
        setOrderUnableToFulfil(order)
        return
      }
      setUpdatingOrderId(order.id)
      setSellerOrdersError('')
      try {
        const updated = await updateMarketplaceSaleStatus(order.id, fulfillmentStatus)
        setSellerOrders((current) => current.map((item) => item.id === order.id ? { ...item, ...updated } : item))
      } catch (error) { setSellerOrdersError(error?.message || 'The order could not be updated.') }
      finally { setUpdatingOrderId('') }
    },
    onMessageBuyer: (order) => navigate(order.buyerUserId ? `/messages?participantId=${encodeURIComponent(order.buyerUserId)}` : '/messages'),
    onOpenOffer: (offer) => navigate(`/messages?participantId=${encodeURIComponent(offer.buyer.id)}`),
    onDecideOffer: async (offer, decision) => {
      if (shopOfferDecisionId) return
      setShopOfferDecisionId(offer.id)
      try {
        await decideMarketplaceOffer(offer.id, decision)
        setPendingShopOffers((current) => current.filter((item) => item.id !== offer.id))
        if (decision === 'accepted') navigate(`/messages?participantId=${encodeURIComponent(offer.buyer.id)}`)
      } finally {
        setShopOfferDecisionId('')
      }
    },
  }

  useEffect(() => {
    if (!isOwnProfile || !isShopOrdersOpen) return
    tabHandlers.onRefreshOrders()
    // Opening the workspace is the fetch boundary; status updates mutate local data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwnProfile, isShopOrdersOpen])

  const shellClasses = [
    'campus-shell campus-profile-shell',
    isBusinessView ? 'business-workspace-shell business-student-profile-shell' : '',
    viewModel.isPortfolioTab ? 'is-portfolio-tab' : '',
    viewModel.isPortfolioDetailOpen ? 'is-portfolio-detail-open' : '',
    viewModel.isShopProductDetailOpen ? 'is-shop-detail-open' : '',
    viewModel.isMarketingTab ? 'is-marketing-tab' : '',
  ].filter(Boolean).join(' ')
  const pageClasses = [
    'campus-page campus-profile-page',
    isBusinessView ? 'business-workspace-page business-student-profile-page' : '',
  ].filter(Boolean).join(' ')
  const mainClasses = [
    'campus-main campus-profile-main',
    isBusinessView ? 'business-workspace-main business-student-profile-main' : '',
  ].filter(Boolean).join(' ')

  return (
    <main className={pageClasses}>
      <Seo
        title={CAMPUS_PROFILE_SEO.title}
        description={CAMPUS_PROFILE_SEO.description}
        path={CAMPUS_PROFILE_SEO.path}
        keywords={CAMPUS_PROFILE_SEO.keywords}
        jsonLd={[CAMPUS_PROFILE_SEO.pageJsonLd]}
      />

      <div className="campus-stage">
        <div className={shellClasses}>
          {isBusinessView ? (
            <BusinessWorkspaceSidebar activeItemId="browse" />
          ) : (
            <CampusSidebar isProfileCurrent={!isPublicStudentView} />
          )}

          <section className={mainClasses}>
            {isBusinessView ? (
              <>
                <Breadcrumb
                  className="business-workspace-breadcrumb"
                  items={[
                    { label: 'Business workspace', href: '/business/workspace' },
                    { label: 'Browse students', href: '/business/applicants' },
                    { label: profileExperience?.header?.name || 'Student profile' },
                  ]}
                />
                <BusinessWorkspaceHeader
                  title="Student Profile"
                  description="Browse student portfolio, work history, ratings and relationship context without leaving the business workspace."
                  primaryActionHref="/business/opportunities"
                  primaryActionLabel="Invite to Opportunity"
                />
              </>
            ) : (
              <ProfileTopBar activeTab={profileState.activeTab} />
            )}
            <ProfileHero activeTab={profileState.activeTab} canRelate={!isBusinessView && Boolean(studentId) && !isOwnProfile} isOwnProfile={isOwnProfile} onEditShop={() => setIsShopEditorOpen(true)} onSaveProfile={handleSaveProfile} onToggleRelationship={handleToggleRelationship} profileHeader={profileExperience?.header} relationship={relationship} relationshipPending={relationshipPending} />
          {profileState.activeTab === 'Overview' ? <ProfileMetrics metrics={profileExperience?.metrics} /> : null}
            <ProfileTabs
              activeTab={profileState.activeTab}
              onTabChange={profileState.setActiveTab}
              tabs={profileTabs}
            />
            <ProfileTabContent
              activeTab={profileState.activeTab}
              canManageMarketing={isOwnProfile}
              canManageShop={isOwnProfile}
              handlers={tabHandlers}
              isOwnProfile={isOwnProfile}
              isShopOrdersOpen={isShopOrdersOpen}
              onOpenKnowledgeHub={(tab = 'resources') => navigate(`/campus/learn?view=knowledge&tab=${tab}`)}
              pendingShopOffers={pendingShopOffers}
              profileName={profileExperience?.header?.name}
              shop={shop}
              shopOfferDecisionId={shopOfferDecisionId}
              sellerOrders={sellerOrders}
              sellerOrdersError={sellerOrdersError}
              sellerOrdersLoading={sellerOrdersLoading}
              updatingOrderId={updatingOrderId}
              profileState={profileState}
              profileStudentId={targetStudentId}
              viewModel={viewModel}
            />
          </section>

          {viewModel.isPortfolioProjectDetailOpen
          && viewModel.selectedPortfolioItem
          && viewModel.selectedPortfolioDetail ? (
            <ProfilePortfolioProjectRail
              onClose={() => profileState.setSelectedPortfolioId(null)}
              selectedPortfolioDetail={viewModel.selectedPortfolioDetail}
              selectedPortfolioItem={viewModel.selectedPortfolioItem}
              selectedPortfolioScorePoints={viewModel.selectedPortfolioScorePoints}
            />
            ) : null}

          {viewModel.isPortfolioServiceDetailOpen && viewModel.selectedPortfolioService ? (
            <ProfilePortfolioServiceRail
              onClose={() => profileState.setSelectedPortfolioServiceId(null)}
              selectedPortfolioService={viewModel.selectedPortfolioService}
            />
          ) : null}

          {!viewModel.isPortfolioTab && !viewModel.isMarketingTab ? (
            <ProfileSideRail
              activeShopDetailImage={viewModel.activeShopDetailImage}
              activeShopDetailTab={profileState.activeShopDetailTab}
              canContact={!isOwnProfile && Boolean(contactUserId)}
              contactName={profileExperience?.header?.name}
              isExperienceTab={viewModel.isExperienceTab}
              isFollowedByViewer={!isOwnProfile && Boolean(relationship.isFollowing)}
              isOwnProfile={isOwnProfile}
              isShopProductDetailOpen={viewModel.isShopProductDetailOpen}
              isShopTab={viewModel.isShopTab}
              normalizedShopDetailImageIndex={viewModel.normalizedShopDetailImageIndex}
              onCloseShopDetail={handleCloseShopDetail}
              onAudioCall={() => openProfileContact('audio')}
              onDetailImageChange={profileState.setActiveShopDetailImageIndex}
              onDetailTabChange={profileState.setActiveShopDetailTab}
              onNextShopImage={handleNextShopImage}
              onEditListing={openEditListing}
              onMessage={() => openProfileContact('message')}
              onPreviousShopImage={handlePreviousShopImage}
              onVideoCall={() => openProfileContact('video')}
              profileExperience={profileExperience}
              shop={shop}
              selectedShopProduct={viewModel.selectedShopProduct}
              selectedShopProductDetail={viewModel.selectedShopProductDetail}
            />
          ) : null}
          {isOwnProfile && isShopEditorOpen ? <ProfileShopEditor shop={shop} onClose={() => setIsShopEditorOpen(false)} onSave={async (payload) => { const updated = await updateMyMarketplaceShop(payload); setShop(updated); setIsShopEditorOpen(false) }} /> : null}
        </div>
      </div>
      <ConfirmDialog
        confirmLabel="Cancel order"
        description="This will cancel the order and send the buyer's held payment to Zumbarl administrators for refund review under company policy. No funds have been released to you. This action cannot be undone."
        isOpen={Boolean(orderUnableToFulfil)}
        isPending={Boolean(orderUnableToFulfil && updatingOrderId === orderUnableToFulfil.id)}
        onCancel={() => setOrderUnableToFulfil(null)}
        onConfirm={async () => {
          const order = orderUnableToFulfil
          if (!order || updatingOrderId) return
          setUpdatingOrderId(order.id)
          setSellerOrdersError('')
          try {
            const updated = await updateMarketplaceSaleStatus(order.id, 'cannot_fulfil')
            setSellerOrders((current) => current.map((item) => item.id === order.id ? { ...item, ...updated } : item))
            setOrderUnableToFulfil(null)
          } catch (error) { setSellerOrdersError(error?.message || 'The order could not be updated.') }
          finally { setUpdatingOrderId('') }
        }}
        title={orderUnableToFulfil ? `Unable to fulfil order #${orderUnableToFulfil.id.slice(-8).toUpperCase()}?` : 'Unable to fulfil order?'}
      />
    </main>
  )
}

export default CampusProfilePage
