import CampusSidebar from '../components/layout/CampusSidebar'
import Seo from '../components/Seo'
import MarketplaceCategories from '../features/opportunities/components/MarketplaceCategories'
import MarketplaceHeader from '../features/opportunities/components/MarketplaceHeader'
import MarketplaceItemSections from '../features/opportunities/components/MarketplaceItemSections'
import MarketplaceRail from '../features/opportunities/components/MarketplaceRail'
import MarketplaceWorkflowPanel from '../features/opportunities/components/MarketplaceWorkflowPanel'
import useMarketplacePageState from '../features/opportunities/hooks/useMarketplacePageState'
import { CAMPUS_BUY_SELL_SEO } from '../features/seo/constants'
import '../styles/campus.css'
import '../styles/opportunities.css'

function OpportunitiesBuySellPage() {
  const marketplaceState = useMarketplacePageState()

  return (
    <main className="campus-page opportunities-page opportunities-marketplace-page">
      <Seo
        title={CAMPUS_BUY_SELL_SEO.title}
        description={CAMPUS_BUY_SELL_SEO.description}
        path={CAMPUS_BUY_SELL_SEO.path}
        keywords={CAMPUS_BUY_SELL_SEO.keywords}
        jsonLd={[CAMPUS_BUY_SELL_SEO.pageJsonLd]}
      />

      <div className="campus-stage">
        <div className="campus-shell opportunities-marketplace-shell">
          <CampusSidebar activeItemId="opportunities" />

          <section className="campus-main opportunities-main opportunities-marketplace-main">
            <MarketplaceHeader />
            <MarketplaceCategories
              activeCategory={marketplaceState.activeCategory}
              onCategoryChange={marketplaceState.onCategoryChange}
              onCategoryKeyDown={marketplaceState.handleCategoryKeyDown}
            />
            <MarketplaceWorkflowPanel />
            <MarketplaceItemSections
              activeCategory={marketplaceState.activeCategory}
              filteredFeaturedItems={marketplaceState.filteredFeaturedItems}
              filteredRecentItems={marketplaceState.filteredRecentItems}
              onCardKeyDown={marketplaceState.handleCardKeyDown}
              onOpenItemDetail={marketplaceState.onOpenItemDetail}
            />
          </section>

          <MarketplaceRail
            activeCategory={marketplaceState.activeCategory}
            filteredTrendingItems={marketplaceState.filteredTrendingItems}
            onCardKeyDown={marketplaceState.handleCardKeyDown}
            onOpenItemDetail={marketplaceState.onOpenItemDetail}
          />
        </div>
      </div>
    </main>
  )
}

export default OpportunitiesBuySellPage
