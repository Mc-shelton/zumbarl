import {
  FiArrowRight,
  FiHeart,
  FiShield,
  FiTarget,
  FiTrendingUp,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { BUSINESS_VALUE_ITEMS, BUSINESS_VALUES_PANEL } from '../constants'

const VALUE_ICON_BY_ID = {
  growth: FiTrendingUp,
  heart: FiHeart,
  shield: FiShield,
  target: FiTarget,
}

function BusinessValuesPanel() {
  return (
    <section className="business-values-section" aria-label="Business values">
      <div className="container business-values-wrap">
        <section className="business-values-panel">
          <header className="business-values-header">
            <h3>{BUSINESS_VALUES_PANEL.title}</h3>
            <i aria-hidden="true" />
          </header>

          <div className="business-values-grid">
            {BUSINESS_VALUE_ITEMS.map((item) => {
              const Icon = VALUE_ICON_BY_ID[item.icon]

              return (
                <article key={item.id} className="business-value-item">
                  <span className="business-value-icon" aria-hidden="true">
                    {Icon ? <Icon /> : null}
                  </span>
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                  </div>
                </article>
              )
            })}
          </div>

          <Link
            to={BUSINESS_VALUES_PANEL.ctaHref}
            className="business-values-cta"
          >
            {BUSINESS_VALUES_PANEL.ctaLabel}
            <FiArrowRight aria-hidden="true" />
          </Link>
        </section>
      </div>
    </section>
  )
}

export default BusinessValuesPanel
