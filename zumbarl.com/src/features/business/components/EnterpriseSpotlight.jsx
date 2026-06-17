import { FiArrowRight } from 'react-icons/fi'
import { FaPlayCircle } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import {
  EXPLAINER_VIDEO_SRC,
  QUOTE_AVATAR,
} from '../../home/constants'
import { BUSINESS_ENTERPRISE_SPOTLIGHT } from '../constants'

function EnterpriseSpotlight() {
  return (
    <div className="business-enterprise-spotlight">
      <div className="container business-enterprise-spotlight-grid">
        <article className="business-enterprise-copy">
          <h2>{BUSINESS_ENTERPRISE_SPOTLIGHT.title}</h2>
          <p>{BUSINESS_ENTERPRISE_SPOTLIGHT.description}</p>
          <Link
            to={BUSINESS_ENTERPRISE_SPOTLIGHT.ctaHref}
            className="business-enterprise-cta"
          >
            {BUSINESS_ENTERPRISE_SPOTLIGHT.ctaLabel}
            <FiArrowRight aria-hidden="true" />
          </Link>
        </article>

        <aside className="business-enterprise-testimonial">
          <p className="business-enterprise-quote">
            {BUSINESS_ENTERPRISE_SPOTLIGHT.quote}
          </p>
          <div className="business-enterprise-person">
            <img
              className="business-enterprise-avatar"
              src={QUOTE_AVATAR}
              alt="Zumbarl bee mark"
              loading="lazy"
            />
            <div>
              <p>{BUSINESS_ENTERPRISE_SPOTLIGHT.personName}</p>
              <span>{BUSINESS_ENTERPRISE_SPOTLIGHT.personRole}</span>
            </div>
          </div>
          <a
            className="business-enterprise-video"
            href={EXPLAINER_VIDEO_SRC}
            target="_blank"
            rel="noreferrer"
            aria-label={`${BUSINESS_ENTERPRISE_SPOTLIGHT.videoLabel} in a new tab`}
          >
            <FaPlayCircle aria-hidden="true" />
            {BUSINESS_ENTERPRISE_SPOTLIGHT.videoLabel}
            <FiArrowRight aria-hidden="true" />
          </a>
        </aside>
      </div>
    </div>
  )
}

export default EnterpriseSpotlight
