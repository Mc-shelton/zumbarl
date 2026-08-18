import ProfileExperiencePanel from './ProfileExperiencePanel'
import ProfileMarketingPanel from './ProfileMarketingPanel'
import ProfileOverviewPanel from './ProfileOverviewPanel'
import ProfilePlaceholderPanel from './ProfilePlaceholderPanel'
import ProfilePortfolioPanel from './ProfilePortfolioPanel'
import ProfileShopPanel from './ProfileShopPanel'
import ProfileShopOrders from './ProfileShopOrders'
import ProfileSkillsPanel from './ProfileSkillsPanel'

function ProfileTabContent({ activeTab, canManageMarketing = false, canManageShop = false, handlers, isShopOrdersOpen = false, pendingShopOffers = [], profileState, sellerOrders = [], sellerOrdersError = '', sellerOrdersLoading = false, shop, shopOfferDecisionId = '', updatingOrderId = '', viewModel }) {
  if (activeTab === 'Overview') {
    return <ProfileOverviewPanel endorsements={viewModel.endorsements} workHighlights={viewModel.workHighlights} />
  }

  if (activeTab === 'Portfolio') {
    return (
      <ProfilePortfolioPanel
        activePortfolioFilter={profileState.activePortfolioFilter}
        onFilterChange={handlers.onPortfolioFilterChange}
        onPortfolioItemSelect={handlers.onPortfolioItemSelect}
        onPortfolioServiceSelect={handlers.onPortfolioServiceSelect}
        portfolioItems={viewModel.portfolioItems}
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
    return <ProfileExperiencePanel />
  }

  if (viewModel.isSkillsTab) {
    return (
      <ProfileSkillsPanel
        filteredCoreSkills={viewModel.filteredCoreSkills}
        filteredOtherSkills={viewModel.filteredOtherSkills}
        hasSkillsResults={viewModel.hasSkillsResults}
        onCategoryFilterChange={profileState.setSkillsCategoryFilter}
        onLevelFilterChange={profileState.setSkillsLevelFilter}
        onSearchQueryChange={profileState.setSkillsSearchQuery}
        skillsCategoryFilter={profileState.skillsCategoryFilter}
        skillsLevelFilter={profileState.skillsLevelFilter}
        skillsSearchQuery={profileState.skillsSearchQuery}
      />
    )
  }

  if (viewModel.isShopTab) {
    if (canManageShop && isShopOrdersOpen) return <ProfileShopOrders error={sellerOrdersError} isLoading={sellerOrdersLoading} orders={sellerOrders} onBack={handlers.onCloseOrders} onMessageBuyer={handlers.onMessageBuyer} onRefresh={handlers.onRefreshOrders} onUpdateStatus={handlers.onUpdateOrderStatus} updatingOrderId={updatingOrderId} />
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
