import { FiChevronDown, FiMapPin, FiPackage, FiPlus, FiSearch } from 'react-icons/fi'
import CampusTopActions from '../../../components/layout/CampusTopActions'
import { Breadcrumb } from '../../../components/ui'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'

function MarketplaceHeader({ isOrdersOpen = false, onOpenOrders, onPostItem, showSearch = true }) {
  const canPostItem = hasAccess(ACCESS_KEYS.marketplace.sell)

  return (
    <>
      <header className="campus-header opportunities-header opportunities-marketplace-header">
        <div className="opportunities-head-copy">
          <Breadcrumb
            className="opportunities-breadcrumb"
            items={[
              { label: 'Opportunities' },
              { label: 'Marketplace' },
            ]}
          />
          <h1 className="opportunities-title">Campus Marketplace</h1>
          <p className="opportunities-subtitle">Shop products, book trusted services and order from campus businesses.</p>
        </div>

        <CampusTopActions
          className="campus-header-actions opportunities-marketplace-actions"
          primaryAction={<div className="opportunities-marketplace-primary-actions">
            <button type="button" className={`opportunities-marketplace-orders-btn${isOrdersOpen ? ' is-active' : ''}`} onClick={onOpenOrders}><FiPackage aria-hidden="true" /> My Orders</button>
            {canPostItem ? <button type="button" className="opportunities-marketplace-post-btn" onClick={onPostItem}><FiPlus aria-hidden="true" /> Create listing</button> : null}
          </div>}
          userButtonClassName="opportunities-user-btn"
        />
      </header>

      {showSearch ? (
        <section className="opportunities-marketplace-search-row" aria-label="Search marketplace products and services">
          <div className="opportunities-marketplace-search-field">
            <FiSearch aria-hidden="true" />
            <input type="search" placeholder="Search products, eateries, services or providers..." />
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
