import { getMarketplaceItemPath } from '../data/marketplace'
import CampusSidebar from '../components/layout/CampusSidebar'
import Seo from '../components/Seo'
import MarketplaceHeader from '../features/opportunities/components/MarketplaceHeader'
import MarketplaceProductDetails from '../features/opportunities/components/MarketplaceProductDetails'
import MarketplaceProductHead from '../features/opportunities/components/MarketplaceProductHead'
import MarketplaceProductRail from '../features/opportunities/components/MarketplaceProductRail'
import MarketplaceProductRelated from '../features/opportunities/components/MarketplaceProductRelated'
import useMarketplaceProductState from '../features/opportunities/hooks/useMarketplaceProductState'
import { CAMPUS_BUY_SELL_SEO } from '../features/seo/constants'
import '../styles/campus.css'
import '../styles/opportunities.css'

function OpportunitiesBuySellProductPage() {
  const productState = useMarketplaceProductState()

  return (
    <main className="campus-page opportunities-page opportunities-marketplace-page opportunities-marketplace-product-page">
      <Seo
        title={`${productState.item.title} | Zumbarl Buy & Sell`}
        description={productState.item.subtitle || productState.item.description || CAMPUS_BUY_SELL_SEO.description}
        path={getMarketplaceItemPath(productState.item.id)}
        keywords={`${CAMPUS_BUY_SELL_SEO.keywords}, ${productState.item.title}, ${productState.item.category}`}
        jsonLd={[CAMPUS_BUY_SELL_SEO.pageJsonLd]}
      />

      <div className="campus-stage">
        <div className="campus-shell opportunities-marketplace-shell">
          <CampusSidebar activeItemId="opportunities" />

          <section className="campus-main opportunities-main opportunities-marketplace-main opportunities-marketplace-product-main">
            <MarketplaceHeader showSearch={false} />
            <MarketplaceProductHead item={productState.item} />
            <MarketplaceProductDetails
              activeImage={productState.activeImage}
              activeImageIndex={productState.activeImageIndex}
              galleryImages={productState.galleryImages}
              item={productState.item}
              onImageSelect={productState.onImageSelect}
              onStepImage={productState.onStepImage}
              overflowCount={productState.overflowCount}
              showThumbOverflow={productState.showThumbOverflow}
              visibleThumbs={productState.visibleThumbs}
            />
            <MarketplaceProductRelated
              onCardKeyDown={productState.handleCardKeyDown}
              onOpenItemDetail={productState.onOpenItemDetail}
              relatedItems={productState.relatedItems}
            />
          </section>

          <MarketplaceProductRail
            item={productState.item}
            onCardKeyDown={productState.handleCardKeyDown}
            onOpenItemDetail={productState.onOpenItemDetail}
            suggestedItems={productState.suggestedItems}
          />
        </div>
      </div>
    </main>
  )
}

export default OpportunitiesBuySellProductPage
