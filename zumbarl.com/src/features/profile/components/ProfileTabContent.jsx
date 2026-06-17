import ProfileExperiencePanel from './ProfileExperiencePanel'
import ProfileOverviewPanel from './ProfileOverviewPanel'
import ProfilePlaceholderPanel from './ProfilePlaceholderPanel'
import ProfilePortfolioPanel from './ProfilePortfolioPanel'
import ProfileShopPanel from './ProfileShopPanel'
import ProfileSkillsPanel from './ProfileSkillsPanel'

function ProfileTabContent({ activeTab, handlers, profileState, viewModel }) {
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
        selectedPortfolioId={profileState.selectedPortfolioId}
        selectedPortfolioServiceId={profileState.selectedPortfolioServiceId}
      />
    )
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
    return (
      <ProfileShopPanel
        activeShopFilter={profileState.activeShopFilter}
        filteredShopProducts={viewModel.filteredShopProducts}
        onProductSelect={profileState.handleShopProductSelect}
        onShopFilterChange={handlers.onShopFilterChange}
        selectedShopProductUid={profileState.selectedShopProductUid}
      />
    )
  }

  return <ProfilePlaceholderPanel activeTab={activeTab} />
}

export default ProfileTabContent
