import { FiChevronDown, FiMapPin, FiPlus, FiSearch } from 'react-icons/fi'
import CampusTopActions from '../../../components/layout/CampusTopActions'
import { Breadcrumb } from '../../../components/ui'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'

function MarketplaceHeader({ showSearch = true }) {
  const canPostItem = hasAccess(ACCESS_KEYS.marketplace.sell)

  return (
    <>
      <header className="campus-header opportunities-header opportunities-marketplace-header">
        <div className="opportunities-head-copy">
          <Breadcrumb
            className="opportunities-breadcrumb"
            items={[
              { label: 'Opportunities' },
              { label: 'Buy & Sell' },
            ]}
          />
          <h1 className="opportunities-title">Buy &amp; Sell</h1>
          <p className="opportunities-subtitle">Student marketplace for products, services and more.</p>
        </div>

        <CampusTopActions
          className="campus-header-actions opportunities-marketplace-actions"
          primaryAction={canPostItem ? (
            <button type="button" className="opportunities-marketplace-post-btn">
              <FiPlus aria-hidden="true" />
              Post an Item
            </button>
          ) : null}
          userButtonClassName="opportunities-user-btn"
        />
      </header>

      {showSearch ? (
        <section className="opportunities-marketplace-search-row" aria-label="Search marketplace items">
          <div className="opportunities-marketplace-search-field">
            <FiSearch aria-hidden="true" />
            <input type="search" placeholder="Search items, brands or categories..." />
          </div>

          <button type="button" className="opportunities-location-btn opportunities-marketplace-location-btn">
            <FiMapPin aria-hidden="true" />
            All locations
            <FiChevronDown aria-hidden="true" />
          </button>

          <button type="button" className="opportunities-search-btn opportunities-marketplace-search-btn">Search</button>
        </section>
      ) : null}
    </>
  )
}

export default MarketplaceHeader
