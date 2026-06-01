import { useMemo, useState } from 'react'
import {
  FiArrowLeft,
  FiArrowRight,
  FiBell,
  FiBookOpen,
  FiBookmark,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiCreditCard,
  FiEdit3,
  FiFileText,
  FiHelpCircle,
  FiHome,
  FiMail,
  FiMapPin,
  FiPaperclip,
  FiShield,
  FiTruck,
  FiUploadCloud,
  FiUsers,
} from 'react-icons/fi'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Seo from '../components/Seo'
import { CAMPUS_PLACE_BID_SEO } from '../features/seo/constants'
import '../styles/campus.css'
import '../styles/opportunities.css'

const SIDEBAR_NAV_ITEMS = [
  { label: 'Home', Icon: FiHome, active: false, href: '/campus' },
  { label: 'Opportunities', Icon: FiBriefcase, active: true, href: '/campus/opportunities' },
  { label: 'Explore Campus', Icon: FiCalendar, active: false, href: '/campus/explore' },
  { label: 'Learn & Grow', Icon: FiBookOpen, active: false },
  { label: 'Community', Icon: FiUsers, active: false },
  { label: 'Finance', Icon: FiCreditCard, active: false },
  { label: 'Services', Icon: FiTruck, active: false },
  { label: 'Messages', Icon: FiMail, active: false },
  { label: 'Notifications', Icon: FiBell, active: false },
]

const PLACE_BID_FALLBACK_GIGS = {
  'social-media-manager': {
    id: 'social-media-manager',
    title: 'Social Media Manager',
    company: 'Rorac Cafe',
    domain: 'Marketing',
    type: 'Part-time',
    mode: 'On-campus',
    summary:
      'Manage social media pages, create engaging content and share weekly campaign performance updates.',
    postedOn: 'Posted 2h ago',
    budget: 'KSh 8,000 per month',
    experienceLevel: 'Intermediate',
    skills: ['Marketing', 'Content Creation', 'Canva', 'Analytics'],
  },
  'graphic-designer': {
    id: 'graphic-designer',
    title: 'Graphic Designer',
    company: 'Startup Wind',
    domain: 'Design',
    type: 'One-time',
    mode: 'Remote',
    summary: 'Design posters and social campaign creatives with fast turnaround and source-file handoff.',
    postedOn: 'Posted 5h ago',
    budget: 'KSh 3,500 fixed',
    experienceLevel: 'Entry Level',
    skills: ['Graphic Design', 'Illustrator', 'Photoshop'],
  },
  'brand-ambassador': {
    id: 'brand-ambassador',
    title: 'Campus Brand Ambassador',
    company: 'Viva Drinks',
    domain: 'Marketing',
    type: 'Part-time',
    mode: 'On-campus',
    summary: 'Represent the brand on campus and support events, demos and weekly insight reporting.',
    postedOn: 'Posted 1d ago',
    budget: 'KSh 6,000 per month',
    experienceLevel: 'Intermediate',
    skills: ['Communication', 'Events', 'Brand Activations'],
  },
  'delivery-rider': {
    id: 'delivery-rider',
    title: 'Food Delivery Rider',
    company: 'QuickBite',
    domain: 'Operations',
    type: 'Part-time',
    mode: 'Flexible',
    summary: 'Handle on-campus food deliveries during peak slots with punctual and professional service.',
    postedOn: 'Posted 1d ago',
    budget: 'KSh 150 per delivery',
    experienceLevel: 'Entry Level',
    skills: ['Riding', 'Customer Service', 'Route Planning'],
  },
  'web-developer': {
    id: 'web-developer',
    title: 'Website Developer',
    company: 'TechSquad',
    domain: 'Software',
    type: 'One-time',
    mode: 'Remote',
    summary: 'Build a responsive landing page with deployment handoff and basic analytics integration.',
    postedOn: 'Posted 2d ago',
    budget: 'KSh 10,000 fixed',
    experienceLevel: 'Intermediate',
    skills: ['React', 'Frontend', 'UI Engineering'],
  },
  default: {
    id: 'default',
    title: 'Junior Data Analyst',
    company: 'Zumbarl Agency',
    domain: 'Data & Analytics',
    type: 'Contract',
    mode: 'Remote',
    summary:
      'Collect, clean and analyze campaign data to support business decisions and growth tracking.',
    postedOn: 'May 20, 2026',
    budget: 'KSh 5,000 - 10,000',
    experienceLevel: 'Entry Level',
    skills: ['Excel', 'SQL', 'Data Analysis', 'Python'],
  },
}

function toBidGig(opportunity, invite) {
  const safeTags = Array.isArray(opportunity?.tags) ? opportunity.tags.filter((tag) => !tag.startsWith('+')) : []
  const [type = 'Contract', mode = 'Flexible'] = typeof opportunity?.meta === 'string'
    ? opportunity.meta.split('·').map((item) => item.trim())
    : ['Contract', 'Flexible']

  return {
    id: opportunity?.id || invite?.opportunityId || 'default',
    title: opportunity?.title || invite?.title || PLACE_BID_FALLBACK_GIGS.default.title,
    company: opportunity?.company || invite?.company || PLACE_BID_FALLBACK_GIGS.default.company,
    domain: safeTags[0] || invite?.tags?.[0] || PLACE_BID_FALLBACK_GIGS.default.domain,
    type,
    mode,
    summary: opportunity?.overview || opportunity?.description || invite?.detail || PLACE_BID_FALLBACK_GIGS.default.summary,
    postedOn: opportunity?.posted || invite?.posted || PLACE_BID_FALLBACK_GIGS.default.postedOn,
    budget: opportunity?.pay ? `${opportunity.pay} ${opportunity.unit || ''}`.trim() : (invite?.pay || PLACE_BID_FALLBACK_GIGS.default.budget),
    experienceLevel: safeTags.length > 3 ? 'Intermediate' : 'Entry Level',
    skills: safeTags.length ? safeTags : (invite?.tags || PLACE_BID_FALLBACK_GIGS.default.skills),
  }
}

function OpportunityPlaceBidPage() {
  const { opportunityId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [isBidSuccessOpen, setIsBidSuccessOpen] = useState(false)

  const selectedGig = useMemo(() => {
    if (location.state?.opportunity || location.state?.invite) {
      return toBidGig(location.state?.opportunity, location.state?.invite)
    }
    if (opportunityId && PLACE_BID_FALLBACK_GIGS[opportunityId]) {
      return PLACE_BID_FALLBACK_GIGS[opportunityId]
    }
    return PLACE_BID_FALLBACK_GIGS.default
  }, [location.state, opportunityId])

  const handleSubmitProposal = () => {
    setIsBidSuccessOpen(true)
  }

  const handleContinueDiscovery = () => {
    setIsBidSuccessOpen(false)
    navigate('/campus/opportunities')
  }

  const handleOpenMyBids = () => {
    setIsBidSuccessOpen(false)
    navigate('/campus/opportunities?tab=bids')
  }

  return (
    <main className="campus-page opportunities-page opportunities-bid-page">
      <Seo
        title={CAMPUS_PLACE_BID_SEO.title}
        description={CAMPUS_PLACE_BID_SEO.description}
        path={CAMPUS_PLACE_BID_SEO.path}
        keywords={CAMPUS_PLACE_BID_SEO.keywords}
        jsonLd={[CAMPUS_PLACE_BID_SEO.pageJsonLd]}
      />

      <div className="campus-stage">
        <div className="campus-shell opportunities-bid-shell">
          <aside className="campus-sidebar" aria-label="Student portal navigation">
            <Link className="campus-brand" to="/" aria-label="Zumbarl logo">
              <img className="campus-brand-logo" src="/assets/index/bee_nobg.png" alt="Zumbarl bee logo" />
              <span className="campus-brand-text">zumbarl.</span>
            </Link>

            <nav className="campus-nav">
              {SIDEBAR_NAV_ITEMS.map(({ label, Icon, active, href }) =>
                href ? (
                  <Link
                    key={label}
                    to={href}
                    className={`campus-nav-item${active ? ' is-active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                ) : (
                  <button
                    key={label}
                    type="button"
                    className={`campus-nav-item${active ? ' is-active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                )
              )}
            </nav>

            <Link className="campus-profile-card" to="/campus/profile" aria-label="Student profile">
              <img className="campus-avatar" src="/assets/index/bee_nobg.png" alt="Brian Mwangi" />
              <div>
                <p className="campus-profile-name">Brian Mwangi</p>
                <p className="campus-profile-meta meta-category">Student</p>
                <p className="campus-profile-meta">Kenyatta University</p>
              </div>
              <FiChevronRight aria-hidden="true" />
            </Link>
          </aside>

          <section className="campus-main opportunities-main opportunities-bid-main">
            <section className="opportunities-bid-breadcrumb-wrap" aria-label="Breadcrumb">
              <nav className="opportunities-bid-breadcrumb">
                <Link to="/campus/opportunities">Opportunities</Link>
                <FiChevronRight aria-hidden="true" />
                <Link to="/campus/opportunities">Jobs &amp; Gigs</Link>
                <FiChevronRight aria-hidden="true" />
                <strong>bid</strong>
              </nav>
            </section>

            <header className="opportunities-bid-header">
              <div>
                <h1>{selectedGig.title}</h1>
                <p>{selectedGig.company} · {selectedGig.domain}</p>
                <span>{selectedGig.summary}</span>
              </div>

              <div className="opportunities-bid-top-actions">
                <button type="button" className="opportunities-bid-ghost-btn">
                  <FiBookmark aria-hidden="true" />
                  Save Gig
                </button>
                <button
                  type="button"
                  className="opportunities-bid-ghost-btn"
                  onClick={() => navigate('/campus/opportunities')}
                >
                  <FiArrowLeft aria-hidden="true" />
                  Back to Gig
                </button>
              </div>
            </header>

            <section className="opportunities-bid-form-card" aria-label="Submit proposal">
              <header>
                <h2>Submit Your Proposal</h2>
                <p>Tell the client why you are the best fit for this gig.</p>
              </header>

              <div className="opportunities-bid-field">
                <div className="opportunities-bid-field-head">
                  <label htmlFor="bid-proposal">Your Proposal</label>
                  <button type="button" className="opportunities-bid-mini-btn">
                    <FiEdit3 aria-hidden="true" />
                    Use AI to improve
                  </button>
                </div>

                <p className="opportunities-bid-field-hint">
                  Describe your approach, relevant experience and why the client should choose you.
                </p>

                <div className="opportunities-bid-editor">
                  <div className="opportunities-bid-editor-toolbar" aria-hidden="true">
                    <button type="button">B</button>
                    <button type="button">I</button>
                    <button type="button">U</button>
                    <button type="button">•</button>
                    <button type="button">1.</button>
                    <button type="button">
                      <FiPaperclip />
                    </button>
                  </div>
                  <textarea id="bid-proposal" placeholder="Write your proposal here..." maxLength={1500} />
                  <p className="opportunities-bid-counter">0 / 1500</p>
                </div>
              </div>

              <div className="opportunities-bid-field">
                <label htmlFor="bid-price">Your Price</label>
                <p className="opportunities-bid-field-hint">Set your price for this gig.</p>

                <div className="opportunities-bid-price-row">
                  <select defaultValue="KES" aria-label="Currency">
                    <option value="KES">KES</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                  <input id="bid-price" type="text" placeholder="Enter your price" />
                  <select defaultValue="Fixed Price" aria-label="Pricing type">
                    <option>Fixed Price</option>
                    <option>Per Hour</option>
                    <option>Per Day</option>
                    <option>Per Month</option>
                  </select>
                </div>
              </div>

              <div className="opportunities-bid-field opportunities-bid-delivery-field">
                <label htmlFor="bid-delivery-time">Delivery Time</label>
                <p className="opportunities-bid-field-hint">How long will it take to complete this gig?</p>

                <div className="opportunities-bid-delivery-row">
                  <FiCalendar aria-hidden="true" />
                  <select id="bid-delivery-time" defaultValue="Select delivery time">
                    <option>Select delivery time</option>
                    <option>1 day</option>
                    <option>2-3 days</option>
                    <option>4-7 days</option>
                    <option>1-2 weeks</option>
                  </select>
                </div>
              </div>

              <div className="opportunities-bid-field">
                <label htmlFor="bid-attachments">Attachments (Optional)</label>
                <p className="opportunities-bid-field-hint">
                  Add relevant samples or documents that support your proposal.
                </p>

                <label className="opportunities-bid-dropzone" htmlFor="bid-attachments">
                  <FiUploadCloud aria-hidden="true" />
                  <strong>Drag &amp; drop files here or click to upload</strong>
                  <span>PDF, DOC, DOCX, PPT, XLS, PNG, JPG (Max 10MB)</span>
                  <input id="bid-attachments" type="file" multiple />
                </label>
              </div>

              <div className="opportunities-bid-field">
                <label htmlFor="bid-message">Add a Message (Optional)</label>
                <p className="opportunities-bid-field-hint">Add a brief message to the client.</p>
                <textarea id="bid-message" placeholder="Type your message here..." maxLength={500} />
                <p className="opportunities-bid-counter">0 / 500</p>
              </div>

              <footer className="opportunities-bid-form-foot">
                <button type="button" className="opportunities-detail-bid-btn" onClick={handleSubmitProposal}>
                  Submit Proposal
                  <FiArrowRight aria-hidden="true" />
                </button>
                <p>You can only submit one proposal for this gig.</p>
              </footer>
            </section>
          </section>

          <aside className="campus-rail opportunities-rail opportunities-bid-summary-rail" aria-label="Gig summary">
            <section className="campus-rail-card opportunities-bid-summary-card">
              <header>
                <h3>Gig Summary</h3>
              </header>

              <article className="opportunities-bid-summary-head">
                <div className="opportunities-bid-summary-logo">
                  <img src="/assets/index/bee_nobg.png" alt={`${selectedGig.company} logo`} loading="lazy" />
                </div>
                <div>
                  <h4>{selectedGig.title}</h4>
                  <p>{selectedGig.company}</p>
                  <span>
                    <FiMapPin aria-hidden="true" />
                    {selectedGig.mode}
                  </span>
                </div>
              </article>

              <section className="opportunities-bid-summary-block">
                <h4>About this Gig</h4>
                <p>{selectedGig.summary}</p>
              </section>

              <section className="opportunities-bid-summary-meta">
                <article>
                  <p>
                    <FiBriefcase aria-hidden="true" />
                    Category
                  </p>
                  <strong>{selectedGig.domain}</strong>
                </article>
                <article>
                  <p>
                    <FiFileText aria-hidden="true" />
                    Type
                  </p>
                  <strong>{selectedGig.type}</strong>
                </article>
                <article>
                  <p>
                    <FiClock aria-hidden="true" />
                    Posted on
                  </p>
                  <strong>{selectedGig.postedOn}</strong>
                </article>
                <article>
                  <p>
                    <FiCreditCard aria-hidden="true" />
                    Budget
                  </p>
                  <strong>{selectedGig.budget}</strong>
                </article>
                <article>
                  <p>
                    <FiCheckCircle aria-hidden="true" />
                    Experience
                  </p>
                  <strong>{selectedGig.experienceLevel}</strong>
                </article>
              </section>

              <section className="opportunities-bid-summary-skills">
                <h4>Skills</h4>
                <div>
                  {selectedGig.skills.map((item) => (
                    <span key={`${selectedGig.id}-${item}`}>{item}</span>
                  ))}
                </div>
              </section>
            </section>

            <section className="campus-rail-card opportunities-bid-info-card">
              <div className="opportunities-bid-info-icon">
                <FiShield aria-hidden="true" />
              </div>
              <div>
                <h4>Your proposal is safe</h4>
                <p>Do not share personal contact information. All communication happens securely on Zumbarl.</p>
              </div>
            </section>

            <section className="campus-rail-card opportunities-bid-info-card">
              <div className="opportunities-bid-info-icon">
                <FiHelpCircle aria-hidden="true" />
              </div>
              <div>
                <h4>Need help?</h4>
                <p>Visit our Help Center for tips on writing a winning proposal.</p>
                <Link to="/help" className="opportunities-bid-help-link">
                  Visit Help Center
                  <FiArrowRight aria-hidden="true" />
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {isBidSuccessOpen ? (
        <div className="opportunities-bid-success-overlay" role="presentation">
          <section
            className="opportunities-bid-success-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bid-success-title"
            aria-describedby="bid-success-description"
          >
            <div className="opportunities-bid-success-icon" aria-hidden="true">
              <FiCheckCircle />
            </div>
            <h2 id="bid-success-title">Proposal submitted successfully</h2>
            <p id="bid-success-description">
              Your bid has been sent to {selectedGig.company}. You can continue exploring opportunities or track this in My Bids.
            </p>
            <div className="opportunities-bid-success-actions">
              <button type="button" className="campus-link-btn" onClick={handleContinueDiscovery}>
                Continue discovery
              </button>
              <button type="button" className="opportunities-detail-bid-btn" onClick={handleOpenMyBids}>
                My Bids
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}

export default OpportunityPlaceBidPage
