import CampusSidebar from '../components/layout/CampusSidebar'
import Seo from '../components/Seo'
import CampusHeroPanel from '../features/campus/components/CampusHeroPanel'
import CampusHomeHeader from '../features/campus/components/CampusHomeHeader'
import CampusHomeRail from '../features/campus/components/CampusHomeRail'
import CampusQuickActions from '../features/campus/components/CampusQuickActions'
import CampusRecommendations from '../features/campus/components/CampusRecommendations'
import CampusSearchForm from '../features/campus/components/CampusSearchForm'
import CampusTrustStrip from '../features/campus/components/CampusTrustStrip'
import useCampusHomeState from '../features/campus/hooks/useCampusHomeState'
import { CAMPUS_SEO } from '../features/seo/constants'
import '../styles/campus.css'

function CampusPage() {
  const {
    activeMarketplaceHover,
    activeMarketplaceSlide,
    chatMessages,
    chatMode,
    discoveryChips,
    discoverySuggestions,
    focusPromptInput,
    handleBackToAi,
    handleMainScroll,
    handleMarketplaceHoverEnd,
    handleMarketplaceHoverStart,
    handlePromptSubmit,
    heroCardRef,
    mainScrollRef,
    openRecommendedGig,
    prompt,
    promptInputRef,
    promptPlaceholder,
    recommendationSections,
    resetChatSurface,
    setPrompt,
    showBackToAiButton,
  } = useCampusHomeState()

  return (
    <main className="campus-page">
      <Seo
        title={CAMPUS_SEO.title}
        description={CAMPUS_SEO.description}
        path={CAMPUS_SEO.path}
        keywords={CAMPUS_SEO.keywords}
        jsonLd={[CAMPUS_SEO.pageJsonLd]}
      />

      <div className="campus-stage">
        <div className="campus-shell">
          <CampusSidebar activeItemId="home" />

          <section
            className="campus-main"
            onScroll={handleMainScroll}
            ref={mainScrollRef}
          >
            <CampusHomeHeader
              onBackToAi={handleBackToAi}
              showBackToAiButton={showBackToAiButton}
            />
            <CampusHeroPanel
              chatMessages={chatMessages}
              chatMode={chatMode}
              discoveryChips={discoveryChips}
              discoverySuggestions={discoverySuggestions}
              heroCardRef={heroCardRef}
              onResetChat={resetChatSurface}
            />
            <CampusSearchForm
              chatMode={chatMode}
              onFocusPrompt={focusPromptInput}
              onPromptChange={setPrompt}
              onSubmit={handlePromptSubmit}
              prompt={prompt}
              promptInputRef={promptInputRef}
              promptPlaceholder={promptPlaceholder}
            />
            <CampusQuickActions />
            <CampusRecommendations
              activeMarketplaceHover={activeMarketplaceHover}
              activeMarketplaceSlide={activeMarketplaceSlide}
              onMarketplaceHoverEnd={handleMarketplaceHoverEnd}
              onMarketplaceHoverStart={handleMarketplaceHoverStart}
              onOpenRecommendedGig={openRecommendedGig}
              recommendationSections={recommendationSections}
            />
            <CampusTrustStrip />
          </section>

          <CampusHomeRail />
        </div>
      </div>
    </main>
  )
}

export default CampusPage
