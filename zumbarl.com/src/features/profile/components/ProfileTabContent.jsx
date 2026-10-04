import ProfileMarketingPanel from './ProfileMarketingPanel'
import ProfileOverviewPanel from './ProfileOverviewPanel'
import ProfilePagesPanel from './ProfilePagesPanel'
import ProfilePlaceholderPanel from './ProfilePlaceholderPanel'
import ProfilePortfolioPanel from './ProfilePortfolioPanel'
import ProfileShopPanel from './ProfileShopPanel'
import ProfileShopOrders from './ProfileShopOrders'
import ProfileSkillsPanel from './ProfileSkillsPanel'
import ProfileErrandsPanel from './ProfileErrandsPanel'
import CareerProgressionPanel from './CareerProgressionPanel'

function ProfileTabContent({ activeTab, canManageMarketing = false, canManageShop = false, handlers, initialOrderId = '', isOwnProfile = false, isShopOrdersOpen = false, onOpenKnowledgeHub, pendingShopOffers = [], profileName = '', profileState, profileStudentId = '', sellerOrders = [], sellerOrdersError = '', sellerOrdersLoading = false, shop, shopOfferDecisionId = '', updatingOrderId = '', viewModel }) {
  if (activeTab === 'Overview') {
    return (
      <>
        <CareerProgressionPanel
          isOwnProfile={isOwnProfile}
          onModeChange={handlers.onProgressionModeChange}
          progression={viewModel.progression}
        />
        <ProfileOverviewPanel achievements={viewModel.achievements} earningsSummary={viewModel.earningsSummary} endorsements={viewModel.endorsements} onOpenPortfolio={() => profileState.setActiveTab('Portfolio')} score={viewModel.profileScore} workHighlights={viewModel.workHighlights} />
        <ProfileSkillsPanel
          canManage={isOwnProfile}
          embedded
          filteredCoreSkills={viewModel.filteredCoreSkills}
          filteredOtherSkills={viewModel.filteredOtherSkills}
          hasSkillsResults={viewModel.hasSkillsResults}
          onCategoryFilterChange={profileState.setSkillsCategoryFilter}
          onAddSkill={handlers.onAddSkill}
          onLevelFilterChange={profileState.setSkillsLevelFilter}
          onSearchQueryChange={profileState.setSkillsSearchQuery}
          skillsCategoryFilter={profileState.skillsCategoryFilter}
          skillsLevelFilter={profileState.skillsLevelFilter}
          skillsSearchQuery={profileState.skillsSearchQuery}
        />
      </>
    )
  }

  if (activeTab === 'Portfolio') {
    return (
      <ProfilePortfolioPanel
        activePortfolioFilter={profileState.activePortfolioFilter}
        isOwnProfile={isOwnProfile}
        onEditPortfolioItem={handlers.onEditPortfolioItem}
        onFilterChange={handlers.onPortfolioFilterChange}
        onPortfolioItemSelect={handlers.onPortfolioItemSelect}
        onPortfolioServiceSelect={handlers.onPortfolioServiceSelect}
        portfolioItems={viewModel.portfolioItems}
        portfolioFilterCounts={viewModel.portfolioFilterCounts}
        portfolioServices={viewModel.portfolioServices}
        selectedPortfolioId={profileState.selectedPortfolioId}
        selectedPortfolioServiceId={profileState.selectedPortfolioServiceId}
      />
    )
  }

  if (viewModel.isMarketingTab && canManageMarketing) {
    return <ProfileMarketingPanel />
  }

  if (viewModel.isExperienceTab) {
    return <ProfilePlaceholderPanel activeTab="Experience" />
  }

  if (canManageShop && isShopOrdersOpen) {
    return <ProfileShopOrders error={sellerOrdersError} initialOrderId={initialOrderId} isLoading={sellerOrdersLoading} orders={sellerOrders} onBack={handlers.onCloseOrders} onMessageBuyer={handlers.onMessageBuyer} onRefresh={handlers.onRefreshOrders} onUpdateStatus={handlers.onUpdateOrderStatus} updatingOrderId={updatingOrderId} />
  }

  if (viewModel.isPagesTab) {
    return (
      <ProfilePagesPanel
        isOwnProfile={isOwnProfile}
        onOpenKnowledgeHub={onOpenKnowledgeHub}
        profileName={profileName}
        profileStudentId={profileStudentId}
      />
    )
  }

  if (viewModel.isErrandsTab && isOwnProfile) {
    return <ProfileErrandsPanel />
  }

  if (viewModel.isShopTab) {
    return (
      <ProfileShopPanel
        activeShopFilter={profileState.activeShopFilter}
        canManageShop={canManageShop}
        filteredShopProducts={viewModel.filteredShopProducts}
        onCreateListing={handlers.onCreateListing}
        onEditListing={handlers.onEditListing}
        onOpenOffer={handlers.onOpenOffer}
        onDecideOffer={handlers.onDecideOffer}
        onProductSelect={profileState.handleShopProductSelect}
        onOpenOrders={handlers.onOpenOrders}
        onShopFilterChange={handlers.onShopFilterChange}
        selectedShopProductUid={profileState.selectedShopProductUid}
        pendingOffers={pendingShopOffers}
        offerDecisionId={shopOfferDecisionId}
        shop={shop}
      />
    )
  }

  return <ProfilePlaceholderPanel activeTab={activeTab} />
}

export default ProfileTabContent
