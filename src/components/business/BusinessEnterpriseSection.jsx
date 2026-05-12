import {
  FiArrowRight,
  FiHeart,
  FiShield,
  FiTarget,
  FiTrendingUp,
} from "react-icons/fi";
import { FaPlayCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
import {
  EXPLAINER_VIDEO_SRC,
  QUOTE_AVATAR,
} from "../../features/home/constants";
import {
  BUSINESS_ENTERPRISE_COLLAGE,
  BUSINESS_ENTERPRISE_SPOTLIGHT,
  BUSINESS_VALUE_ITEMS,
  BUSINESS_VALUES_PANEL,
} from "../../features/business/constants";

const valueIcons = {
  heart: FiHeart,
  target: FiTarget,
  shield: FiShield,
  growth: FiTrendingUp,
};

const collagePattern = [
  "hero",
  "tall",
  "wide",
  "square",
  "wide",
  "hero",
  "square",
  "tall",
  "wide",
  "square",
  "wide",
  "tall",
];

const collageTiles = Array.from({ length: 7 }, (_, repeatIndex) =>
  BUSINESS_ENTERPRISE_COLLAGE.map((tile, tileIndex) => ({
    ...tile,
    key: `${repeatIndex}-${tile.id}-${tileIndex}`,
    variant:
      collagePattern[
        (repeatIndex * BUSINESS_ENTERPRISE_COLLAGE.length + tileIndex) %
          collagePattern.length
      ],
  })),
).flat();

function BusinessEnterpriseSection() {
  return (
    <>
      <section
        className="business-enterprise"
        aria-label="Enterprise story and values"
      >
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
        <div className="business-enterprise-join">
          <p>Ready For <span className="x_wd_yellow_highlight_bold_05">Talent</span>?</p>
          <button
            type="button"
            className="event-link event-play-btn"
            onClick={() => alert(true)}
          >
            Try It Out ⟶
          </button>
        </div>
        <div className="business-enterprise-collage" aria-hidden="true">
          <div className="business-enterprise-collage-grid">
            {collageTiles.map((tile) => (
              <span
                key={tile.key}
                className={`business-collage-tile tone-${tile.tone} variant-${tile.variant}`}
              >
                <img src={tile.src} alt="" loading="lazy" />
              </span>
            ))}
          </div>
        </div>
      </section>
      <section className="business-values-section" aria-label="Business values">
        <div className="container business-values-wrap">
          <section className="business-values-panel">
            <header className="business-values-header">
              <h3>{BUSINESS_VALUES_PANEL.title}</h3>
              <i aria-hidden="true" />
            </header>

            <div className="business-values-grid">
              {BUSINESS_VALUE_ITEMS.map((item) => {
                const Icon = valueIcons[item.icon];

                return (
                  <article key={item.id} className="business-value-item">
                    <span className="business-value-icon" aria-hidden="true">
                      <Icon />
                    </span>
                    <div>
                      <h4>{item.title}</h4>
                      <p>{item.description}</p>
                    </div>
                  </article>
                );
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
    </>
  );
}

export default BusinessEnterpriseSection;
