import CampusSidebar from '../components/layout/CampusSidebar'
import Seo from '../components/Seo'
import ExploreDefaultRail from '../features/explore/components/ExploreDefaultRail'
import ExploreFeed from '../features/explore/components/ExploreFeed'
import ExploreFeedHero from '../features/explore/components/ExploreFeedHero'
import ExploreMediaModal from '../features/explore/components/ExploreMediaModal'
import ExploreProductRail from '../features/explore/components/ExploreProductRail'
import ExploreSearchResults from '../features/explore/components/ExploreSearchResults'
import ExploreSearchSummary from '../features/explore/components/ExploreSearchSummary'
import ExploreTopBar from '../features/explore/components/ExploreTopBar'
import {
  CAMPUS_ANNOUNCEMENTS,
  CAMPUS_FEED_FILTERS,
  CAMPUS_STORIES,
  EXPLORE_PRODUCT_DETAILS,
  FEED_COMMENTS,
  FEED_POSTS,
  MARKETPLACE_ITEMS,
  MARKETPLACE_RESULTS,
  PEOPLE_WHO_CAN_HELP,
  PEOPLE_YOU_MAY_KNOW,
  SEARCH_HINTS,
  SEARCH_TABS,
  TOP_LEARNING_RESOURCES,
  UPCOMING_EVENTS,
} from '../features/explore/constants'
import useExploreCampusState from '../features/explore/hooks/useExploreCampusState'
import useExploreConnectWorkflow from '../features/explore/hooks/useExploreConnectWorkflow'
import { CAMPUS_EXPLORE_SEO } from '../features/seo/constants'
import '../styles/campus.css'
import '../styles/connect.css'
import '../styles/explore-campus.css'

function ExploreCampusPage() {
  const connect = useExploreConnectWorkflow()
  const {
    activeMediaComments,
    activeMediaImage,
    activeMediaIndex,
    activeMediaPost,
    activeQuery,
    activeRailProduct,
    activeRailProductGallery,
    activeRailProductImage,
    activeRailProductTab,
    areStoriesVisible,
    closeMediaViewer,
    handleClearSearch,
    handleSearchInputChange,
    handleSearchSubmit,
    handleStepRailProductImage,
    handleViewProduct,
    isSearchMode,
    mainScrollContainerRef,
    normalizedRailProductImageIndex,
    openMediaViewer,
    resetRailProduct,
    searchInput,
    setActiveRailProductImageIndex,
    setActiveRailProductTab,
    stepMediaViewer,
  } = useExploreCampusState({
    feedComments: FEED_COMMENTS,
    feedPosts: FEED_POSTS,
    productDetails: EXPLORE_PRODUCT_DETAILS,
  })

  return (
    <main className="campus-page explore-campus-page">
      <Seo
        title={CAMPUS_EXPLORE_SEO.title}
        description={CAMPUS_EXPLORE_SEO.description}
        path={CAMPUS_EXPLORE_SEO.path}
        keywords={CAMPUS_EXPLORE_SEO.keywords}
        jsonLd={[CAMPUS_EXPLORE_SEO.pageJsonLd]}
      />

      <div className="campus-stage">
        <div className={`campus-shell explore-campus-shell${activeRailProduct ? ' is-product-detail-open' : ''}`}>
          <CampusSidebar activeItemId="explore" />

          <section ref={mainScrollContainerRef} className="campus-main explore-campus-main">
            <div className="explore-campus-sticky-head">
              <ExploreTopBar
                onClearSearch={handleClearSearch}
                onSearchInputChange={handleSearchInputChange}
                onSearchSubmit={handleSearchSubmit}
                searchInput={searchInput}
              />

              {isSearchMode ? (
                <ExploreSearchSummary activeQuery={activeQuery} hints={SEARCH_HINTS} tabs={SEARCH_TABS} />
              ) : (
                <ExploreFeedHero
                  areStoriesVisible={areStoriesVisible}
                  filters={CAMPUS_FEED_FILTERS}
                  onPrepareProfile={connect.handlePrepareProfile}
                  onPublishStory={connect.handlePublishStory}
                  profileReady={connect.state.profileReady}
                  stories={CAMPUS_STORIES}
                  storyPublished={connect.state.storyPublished}
                />
              )}
            </div>

            {isSearchMode ? (
              <ExploreSearchResults
                marketplaceResults={MARKETPLACE_RESULTS}
                people={PEOPLE_WHO_CAN_HELP}
                resources={TOP_LEARNING_RESOURCES}
              />
            ) : (
              <>
                
                <ExploreFeed
                  onComposerPost={connect.handleComposerPost}
                  onOpenMediaViewer={openMediaViewer}
                  onViewProduct={handleViewProduct}
                  posts={FEED_POSTS}
                  profileReady={connect.state.profileReady}
                />

              </>
            )}
          </section>

          <aside className="campus-rail explore-campus-rail" aria-label="Explore campus side panels">
            {activeRailProduct ? (
              <ExploreProductRail
                activeRailProduct={activeRailProduct}
                activeRailProductGallery={activeRailProductGallery}
                activeRailProductImage={activeRailProductImage}
                activeRailProductTab={activeRailProductTab}
                normalizedRailProductImageIndex={normalizedRailProductImageIndex}
                onClose={resetRailProduct}
                onSelectImage={setActiveRailProductImageIndex}
                onSetTab={setActiveRailProductTab}
                onStepImage={handleStepRailProductImage}
              />
            ) : (
              <ExploreDefaultRail
                announcements={CAMPUS_ANNOUNCEMENTS}
                events={UPCOMING_EVENTS}
                marketplaceItems={MARKETPLACE_ITEMS}
                people={PEOPLE_YOU_MAY_KNOW}
              />
            )}
          </aside>

          <ExploreMediaModal
            activeMediaComments={activeMediaComments}
            activeMediaImage={activeMediaImage}
            activeMediaIndex={activeMediaIndex}
            activeMediaPost={activeMediaPost}
            onClose={closeMediaViewer}
            onStep={stepMediaViewer}
          />
        </div>
      </div>
    </main>
  )
}

export default ExploreCampusPage
