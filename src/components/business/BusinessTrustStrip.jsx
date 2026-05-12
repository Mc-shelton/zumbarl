import { HiOutlineChevronRight } from 'react-icons/hi2'
import { Link } from 'react-router-dom'
import {
  BUSINESS_CUSTOMER_STORIES_LINK,
  BUSINESS_TRUST_BRANDS,
} from '../../features/business/constants'

function BusinessTrustStrip() {
  return (
    <section className="business-trust-strip" aria-label="Brands and customer stories">
      <div className="container business-trust-inner">
        <p className="business-trust-label">
          Brands that <span className="business-trust-label-brush">trust us</span>
        </p>

        <div className="business-trust-logos" role="list">
          {BUSINESS_TRUST_BRANDS.map((brand) => {
            return (
              <span key={brand.id} className={`business-trust-logo tone-${brand.id}`} role="listitem" aria-label={brand.label}>
                {brand.id === 'amazon' ? (
                  <span className="business-brand-amazon" aria-hidden="true">
                    amazon
                  </span>
                ) : null}

                {brand.id === 'kpmg' ? (
                  <span className="business-brand-kpmg" aria-hidden="true">
                    KPMG
                  </span>
                ) : null}

                {brand.id === 'renault' ? <span className="business-brand-renault" aria-hidden="true" /> : null}

                {brand.id === 'netflix' ? (
                  <span className="business-brand-netflix" aria-hidden="true">
                    NETFLIX
                  </span>
                ) : null}

                {brand.id === 'hp' ? (
                  <span className="business-brand-hp" aria-hidden="true">
                    hp
                  </span>
                ) : null}

                {brand.id === 'facebook' ? (
                  <span className="business-brand-facebook" aria-hidden="true">
                    f
                  </span>
                ) : null}
              </span>
            )
          })}
        </div>

        <Link to={BUSINESS_CUSTOMER_STORIES_LINK.href} className="business-trust-link">
          {BUSINESS_CUSTOMER_STORIES_LINK.label}
          <HiOutlineChevronRight aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}

export default BusinessTrustStrip
