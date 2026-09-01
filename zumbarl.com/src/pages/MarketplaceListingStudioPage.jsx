import { FiCheckCircle, FiShoppingBag, FiShield } from 'react-icons/fi'
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
              <div className="marketplace-studio-header-copy">
                <Breadcrumb items={[{ label: 'Marketplace', href: '/campus/opportunities/buy-sell' }, { label: studio.isEdit ? 'Edit listing' : 'Create listing' }]} />
                <div className="marketplace-studio-kicker"><FiShoppingBag aria-hidden="true" /><span>{studio.foodMode ? 'Campus menu studio' : studio.vendorMode ? 'Vendor inventory studio' : 'Marketplace seller studio'}</span></div>
                <h1>{studio.isEdit ? 'Edit your listing' : studio.foodMode ? 'Add a menu item' : studio.vendorMode ? 'Add vendor inventory' : 'Create a marketplace listing'}</h1>
                <p>{studio.foodMode ? 'List today’s food and edibles for campus pickup — students order ahead and collect from your spot.' : `Give campus buyers everything they need to discover, trust, and order your ${studio.vendorMode ? 'vendor offering' : 'listing'}.`}</p>
                <div className="marketplace-studio-trust-row"><span><FiShield /> Protected transactions</span><span><FiCheckCircle /> Campus-ready publishing</span></div>
              </div>
              <aside className="marketplace-studio-header-side">
                <CampusTopActions scope="campus" />
                <div className="marketplace-studio-step-status"><span>Listing progress</span><strong>Step {studio.activeStep} of {studio.steps.length}</strong><div><i style={{ width: `${(studio.activeStep / studio.steps.length) * 100}%` }} /></div></div>
              </aside>
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
