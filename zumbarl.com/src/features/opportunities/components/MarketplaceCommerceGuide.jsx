import { FiArrowRight } from 'react-icons/fi'

function MarketplaceCommerceGuide({ onSelect }) {
  return (
    <section className="marketplace-commerce-guide" aria-labelledby="marketplace-commerce-title">
      <div className="marketplace-promo-copy">
        <span>Campus marketplace</span>
        <h2 id="marketplace-commerce-title">Find something useful today.</h2>
        <p>Discover student-made finds, trusted services, and fresh campus picks in one place.</p>
        <button type="button" onClick={() => onSelect('Everything')}>
          Browse featured <FiArrowRight aria-hidden="true" />
        </button>
      </div>
      <div className="marketplace-promo-accent" aria-hidden="true" />
    </section>
  )
}

export default MarketplaceCommerceGuide
