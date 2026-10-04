import { FiArrowUpRight, FiClock, FiPlus } from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'

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
          <div className="campus-portfolio-services-title">
            <h3>My Services</h3>
            <span>{portfolioServices.length}</span>
          </div>
          <p>What clients can book from me.</p>
        </div>
        {canManagePortfolio ? (
          <button type="button" className="campus-portfolio-add-btn">
            <FiPlus aria-hidden="true" />
            Add service
          </button>
        ) : null}
      </header>

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
            <div className="campus-portfolio-service-media">
              <img
                className="campus-portfolio-service-thumb"
                src={image}
                alt=""
                loading="lazy"
              />
              <span>{category}</span>
            </div>
            <div className="campus-portfolio-service-body">
              <div className="campus-portfolio-service-title-row">
                <h4>{title}</h4>
                <FiArrowUpRight aria-hidden="true" />
              </div>
              <p className="campus-portfolio-service-description">{description}</p>
              <footer>
                <strong>{price}</strong>
                <span><FiClock aria-hidden="true" />{delivery}</span>
              </footer>
            </div>
          </article>
        ))}
        {!portfolioServices.length ? (
          <div className="campus-portfolio-services-empty">
            <span><FiPlus aria-hidden="true" /></span>
            <strong>Add your first service</strong>
            <p>Show clients what you offer and how much it costs.</p>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default ProfilePortfolioServicesPanel
