import CampusSidebar from '../components/layout/CampusSidebar'
import CampusTopActions from '../components/layout/CampusTopActions'
import Seo from '../components/Seo'
import { Breadcrumb } from '../components/ui'
import MarketplaceListingForm from '../features/opportunities/components/MarketplaceListingForm'
import MarketplaceListingRail from '../features/opportunities/components/MarketplaceListingRail'
import MarketplaceListingSteps from '../features/opportunities/components/MarketplaceListingSteps'
import useMarketplaceListingStudio from '../features/opportunities/hooks/useMarketplaceListingStudio'
import '../styles/campus.css'
import '../styles/marketplace-listing-studio.css'

function MarketplaceListingStudioPage() {
  const studio = useMarketplaceListingStudio()

  return (
    <main className="campus-page marketplace-studio-page">
      <Seo title={`${studio.isEdit ? 'Edit' : 'Create'} Marketplace Listing | Zumbarl`} description="Create a clear, trusted marketplace listing for the Zumbarl campus community." path="/campus/marketplace/listings/new" />
      <div className="campus-stage">
        <div className="campus-shell marketplace-studio-shell">
          <CampusSidebar activeItemId="marketplace" />
          <section className="campus-main marketplace-studio-main">
            <header className="marketplace-studio-header">
              <div>
                <Breadcrumb items={[{ label: 'Marketplace', href: '/campus/opportunities/buy-sell' }, { label: studio.isEdit ? 'Edit listing' : 'Create listing' }]} />
                <span>Seller workspace</span>
                <h1>{studio.isEdit ? 'Edit your listing' : 'Create a marketplace listing'}</h1>
                <p>Build a complete buyer-ready listing, from the first photo through safe campus fulfilment.</p>
              </div>
              <CampusTopActions scope="campus" />
            </header>
            <MarketplaceListingSteps activeStep={studio.activeStep} onStepChange={studio.goToStep} steps={studio.steps} />
            {studio.isLoading ? <section className="marketplace-studio-loading" role="status">Loading your listing studio…</section> : <MarketplaceListingForm studio={studio} />}
          </section>
          <MarketplaceListingRail studio={studio} />
        </div>
      </div>
    </main>
  )
}

export default MarketplaceListingStudioPage
