import CampusSidebar from '../components/layout/CampusSidebar'
import Seo from '../components/Seo'
import ProfileHero from '../features/profile/components/ProfileHero'
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
import { CAMPUS_PROFILE_SEO } from '../features/seo/constants'
import '../styles/campus.css'
import '../styles/profile.css'

function CampusProfilePage() {
  const profileState = useCampusProfileState({
    profileTabs: PROFILE_TABS,
    shopProducts: SHOP_PRODUCTS_WITH_UID,
    shopTabFilters: SHOP_TAB_FILTERS,
    skillsCategoryFilters: SKILLS_CATEGORY_FILTERS,
    skillsLevelFilters: SKILLS_LEVEL_FILTERS,
  })
  const viewModel = useCampusProfileViewModel(profileState)

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

  const tabHandlers = {
    onPortfolioFilterChange: handlePortfolioFilterChange,
    onPortfolioItemSelect: handlePortfolioItemSelect,
    onPortfolioServiceSelect: handlePortfolioServiceSelect,
    onShopFilterChange: handleShopFilterChange,
  }

  const shellClasses = [
    'campus-shell campus-profile-shell',
    viewModel.isPortfolioTab ? 'is-portfolio-tab' : '',
    viewModel.isPortfolioDetailOpen ? 'is-portfolio-detail-open' : '',
    viewModel.isShopProductDetailOpen ? 'is-shop-detail-open' : '',
  ].filter(Boolean).join(' ')

  return (
    <main className="campus-page campus-profile-page">
      <Seo
        title={CAMPUS_PROFILE_SEO.title}
        description={CAMPUS_PROFILE_SEO.description}
        path={CAMPUS_PROFILE_SEO.path}
        keywords={CAMPUS_PROFILE_SEO.keywords}
        jsonLd={[CAMPUS_PROFILE_SEO.pageJsonLd]}
      />

      <div className="campus-stage">
        <div className={shellClasses}>
          <CampusSidebar isProfileCurrent />

          <section className="campus-main campus-profile-main">
            <ProfileTopBar activeTab={profileState.activeTab} />
            <ProfileHero />
            {!viewModel.isShopTab ? <ProfileMetrics /> : null}
            <ProfileTabs
              activeTab={profileState.activeTab}
              onTabChange={profileState.setActiveTab}
              tabs={PROFILE_TABS}
            />
            <ProfileTabContent
              activeTab={profileState.activeTab}
              handlers={tabHandlers}
              profileState={profileState}
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

          {!viewModel.isPortfolioTab ? (
            <ProfileSideRail
              activeShopDetailImage={viewModel.activeShopDetailImage}
              activeShopDetailTab={profileState.activeShopDetailTab}
              isExperienceTab={viewModel.isExperienceTab}
              isShopProductDetailOpen={viewModel.isShopProductDetailOpen}
              isShopTab={viewModel.isShopTab}
              isSkillsTab={viewModel.isSkillsTab}
              normalizedShopDetailImageIndex={viewModel.normalizedShopDetailImageIndex}
              onCloseShopDetail={handleCloseShopDetail}
              onDetailImageChange={profileState.setActiveShopDetailImageIndex}
              onDetailTabChange={profileState.setActiveShopDetailTab}
              onNextShopImage={handleNextShopImage}
              onPreviousShopImage={handlePreviousShopImage}
              selectedShopProduct={viewModel.selectedShopProduct}
              selectedShopProductDetail={viewModel.selectedShopProductDetail}
              skillsTrendCoordinates={viewModel.skillsTrendCoordinates}
              skillsTrendFillPoints={viewModel.skillsTrendFillPoints}
              skillsTrendPoints={viewModel.skillsTrendPoints}
            />
          ) : null}
        </div>
      </div>
    </main>
  )
}

export default CampusProfilePage
