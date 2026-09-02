import { FiPlusCircle } from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import {
  PORTFOLIO_SERVICE_COMPOSER_TOOLS,
} from '../constants'

function handleKeyboardActivation(event, onActivate) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onActivate()
  }
}

function ProfilePortfolioServicesPanel({
  onPortfolioServiceSelect,
  portfolioServices = [],
  selectedPortfolioServiceId,
}) {
  const canManagePortfolio = hasAccess(ACCESS_KEYS.profile.managePortfolio)

  return (
    <section className="campus-profile-surface campus-portfolio-services-panel">
      <header className="campus-portfolio-services-head">
        <div>
          <h3>My Services</h3>
          <p>Services I can provide to clients and businesses.</p>
        </div>
        {canManagePortfolio ? (
          <button type="button" className="campus-portfolio-add-btn">
            <FiPlusCircle aria-hidden="true" />
            Add Service
          </button>
        ) : null}
      </header>

      {canManagePortfolio ? (
        <article className="campus-portfolio-service-composer">
          <div className="campus-portfolio-service-composer-head">
            <img
              src="/assets/index/bee_nobg.png"
              alt="Profile placeholder"
            />
            <p>What service do you want to offer next?</p>
          </div>
          <footer className="campus-portfolio-service-composer-foot">
            <div className="campus-portfolio-service-tools">
              {PORTFOLIO_SERVICE_COMPOSER_TOOLS.map(({ label, Icon }) => (
                <button key={label} type="button">
                  <Icon aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
            <button type="button" className="campus-shop-post-btn">Post</button>
          </footer>
        </article>
      ) : null}

      <div className="campus-portfolio-service-grid">
        {portfolioServices.map(({ id, title, category, description, price, delivery, image }) => (
          <article
            key={id}
            className={`campus-portfolio-service-card${selectedPortfolioServiceId === id ? ' is-selected' : ''}`}
            role="button"
            tabIndex={0}
            aria-pressed={selectedPortfolioServiceId === id}
            onClick={() => onPortfolioServiceSelect(id)}
            onKeyDown={(event) => handleKeyboardActivation(event, () => onPortfolioServiceSelect(id))}
          >
            <img
              className="campus-portfolio-service-thumb"
              src={image}
              alt={`${title} thumbnail`}
              loading="lazy"
            />
            <p className="campus-portfolio-service-category">{category}</p>
            <h4>{title}</h4>
            <p className="campus-portfolio-service-description">{description}</p>
            <footer>
              <strong>{price}</strong>
              <span>{delivery}</span>
            </footer>
          </article>
        ))}
        {!portfolioServices.length ? <p>No services added yet.</p> : null}
      </div>
    </section>
  )
}

export default ProfilePortfolioServicesPanel
