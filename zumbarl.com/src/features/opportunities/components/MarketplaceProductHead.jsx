import { FiSave, FiShare2 } from 'react-icons/fi'
import { Breadcrumb } from '../../../components/ui'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'

function MarketplaceProductHead({ isOwner = false, item }) {
  const canSaveItem = hasAccess(ACCESS_KEYS.marketplace.buy)
  const isService = String(item.kind || item.listingType || '').toLowerCase() === 'service'

  return (
    <section className="opportunities-marketplace-product-head" aria-label="Product overview">
      <div>
        <Breadcrumb
          className="opportunities-breadcrumb opportunities-marketplace-product-breadcrumb"
          items={[
            { label: 'Opportunities', href: '/campus/opportunities' },
            { label: 'Marketplace', href: '/campus/opportunities/buy-sell' },
            { label: item.title },
          ]}
        />
        <h2>{item.title}</h2>
        <p>
          <span>{item.subtitle || (isService ? 'A campus service from a verified provider.' : 'A product from a verified campus seller.')}</span>
          {item.badge ? <em>{item.badge}</em> : null}
        </p>
      </div>

      <div className="opportunities-marketplace-product-head-actions">
        <button type="button">
          <FiShare2 aria-hidden="true" />
          Share
        </button>
        {canSaveItem && !isOwner ? (
          <button type="button">
            <FiSave aria-hidden="true" />
            Save
          </button>
        ) : null}
      </div>
    </section>
  )
}

export default MarketplaceProductHead
