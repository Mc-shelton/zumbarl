import {
  FiActivity,
  FiAlertCircle,
  FiArrowRight,
  FiAward,
  FiBarChart2,
  FiBell,
  FiBookOpen,
  FiBriefcase,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiDownload,
  FiExternalLink,
  FiFileText,
  FiHome,
  FiLink2,
  FiMapPin,
  FiMessageCircle,
  FiMoreVertical,
  FiPlus,
  FiSearch,
  FiSettings,
  FiShare2,
  FiStar,
  FiTrendingUp,
  FiUser,
  FiUsers,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import { BUSINESS_APPLICANT_PROFILE_SEO } from '../features/seo/constants'
import '../styles/business-profile.css'

const SIDEBAR_ITEMS = [
  { label: 'Dashboard', Icon: FiHome },
  { label: 'Opportunities', Icon: FiBriefcase },
  { label: 'Applicants', Icon: FiUser, active: true },
  { label: 'Pipeline', Icon: FiTrendingUp },
  { label: 'Talent Search', Icon: FiSearch },
  { label: 'Saved Talents', Icon: FiBookOpen },
  { label: 'Teams', Icon: FiUsers },
  { label: 'Messages', Icon: FiMessageCircle, badge: 6 },
  { label: 'Analytics', Icon: FiBarChart2 },
  { label: 'Transactions', Icon: FiActivity },
  { label: 'Company Profile', Icon: FiFileText },
  { label: 'Settings', Icon: FiSettings },
]

const PROFILE_TAGS = ['Social Media', 'Graphic Design', 'Canva', 'Copywriting', '+4']
const PROFILE_METRICS = [
  { label: 'Zumbarl Score', value: '74', sub: 'Tier 3 · Silver', trend: true },
  { label: 'Gigs Completed', value: '23', sub: '18 rated · 5 pending' },
  { label: 'Delivery Rate', value: '94%', sub: '22 of 23 on time' },
  { label: 'Avg. Rating', value: '4.6/5', sub: 'from 18 reviews' },
  { label: 'Repeat Clients', value: '7', sub: 'out of 12 clients' },
]

const PROFILE_TABS = ['Overview', 'Portfolio', 'Experience', 'Skills', 'Shop', 'Education', 'Reviews', 'Activity']

const SCORE_BREAKDOWN = [
  { label: 'Gig volume', value: 7, max: 10 },
  { label: 'Avg. rating', value: 9, max: 10 },
  { label: 'Delivery rate', value: 9, max: 10 },
  { label: 'Repeat clients', value: 5, max: 10 },
  { label: 'Endorsements', value: 3, max: 10 },
]

const PIPELINE_STEPS = [
  { label: 'Connected', date: 'Apr 5', status: 'done' },
  { label: 'Engaged', date: 'Apr 8', status: 'done' },
  { label: 'Working', date: 'Apr 15', status: 'done' },
  { label: 'Reviewing', date: 'Ongoing', status: 'active' },
  { label: 'Offer', date: '—', status: 'pending' },
]

const TOP_SKILLS = [
  { label: 'Social media', level: 'L4', progress: 92 },
  { label: 'Graphic design', level: 'L3', progress: 66 },
  { label: 'Copywriting', level: 'L3', progress: 58 },
  { label: 'Video editing', level: 'L2', progress: 42 },
  { label: 'Data entry', level: 'L1', progress: 26 },
]

const EARNINGS = [
  { label: 'This month', value: 'KSh 12,400' },
  { label: 'Last month', value: 'KSh 9,800' },
  { label: 'Total earned', value: 'KSh 74,200' },
  { label: 'Chama contribution', value: 'KSh 7,420' },
  { label: 'Avg. per gig', value: 'KSh 3,226' },
]

const WORK_HIGHLIGHTS = [
  {
    title: 'Instagram campaign',
    org: 'BrandMasters Agency',
    rating: '5.0',
    image: '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp',
  },
  {
    title: 'Brand poster set',
    org: 'NaiKreative Studio',
    rating: '4.5',
    image: '/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp',
  },
  {
    title: 'WhatsApp channel content',
    org: 'Pesaflow Fintech',
    rating: '4.8',
    image: '/assets/index/business_page_images/optimized/omar-lopez-1qfy-jDc_jo-unsplash.webp',
  },
  {
    title: 'Logo refresh',
    org: 'BrandMasters Agency',
    rating: '4.0',
    image: '/assets/index/bee_nobg.png',
  },
]

const ENDORSEMENTS = [
  {
    initials: 'BM',
    company: 'BrandMasters Agency',
    person: 'Sarah K. · Creative Director',
    quote: 'Aisha delivers high-quality work and understands our brand voice perfectly.',
    date: 'May 18, 2025',
    reward: '+12 EC',
  },
  {
    initials: 'JB',
    company: 'BrandMasters Agency',
    person: 'James O. · Founder',
    quote: 'Great turnaround, and always meets deadlines.',
    date: 'May 10, 2025',
    reward: '+12 EC',
  },
  {
    initials: 'PF',
    company: 'Pesaflow Fintech',
    person: 'Amina W. · Marketing Lead',
    quote: 'Aisha is proactive, creative and a great team player.',
    date: 'Apr 28, 2025',
    reward: '+12 EC',
  },
]

const ENGAGEMENT_SUMMARY = [
  { label: 'Last active', value: '2 hours ago' },
  { label: 'Response rate', value: '96%' },
  { label: 'Avg. response time', value: '1.2 hours' },
  { label: 'Jobs completed', value: '7' },
  { label: 'Jobs in progress', value: '1' },
]

const QUICK_ACTIONS = [
  { label: 'Send Message', Icon: FiMessageCircle },
  { label: 'Invite to Opportunity', Icon: FiBriefcase },
  { label: 'View Full Profile', Icon: FiExternalLink },
  { label: 'Download CV', Icon: FiDownload },
  { label: 'Share Profile', Icon: FiShare2 },
]

function BusinessApplicantProfilePage() {
  return (
    <main className="business-profile-page">
      <Seo
        title={BUSINESS_APPLICANT_PROFILE_SEO.title}
        description={BUSINESS_APPLICANT_PROFILE_SEO.description}
        path={BUSINESS_APPLICANT_PROFILE_SEO.path}
        keywords={BUSINESS_APPLICANT_PROFILE_SEO.keywords}
        jsonLd={[BUSINESS_APPLICANT_PROFILE_SEO.pageJsonLd]}
      />

      <div className="business-profile-shell">
        <aside className="business-profile-sidebar" aria-label="Business navigation">
          <div className="business-profile-logo-wrap">
            <Link to="/" className="business-profile-logo" aria-label="Zumbarl home">
              <span>zumbarl</span>
              <i aria-hidden="true">.</i>
            </Link>
            <p>Business</p>
          </div>

          <button type="button" className="business-profile-collapse" aria-label="Collapse navigation">
            <FiChevronLeft aria-hidden="true" />
          </button>

          <nav className="business-profile-nav">
            {SIDEBAR_ITEMS.map(({ label, Icon, active, badge }) => (
              <button key={label} type="button" className={`business-profile-nav-item${active ? ' is-active' : ''}`}>
                <Icon aria-hidden="true" />
                <span>{label}</span>
                {badge ? <em>{badge}</em> : null}
              </button>
            ))}
          </nav>

          <section className="business-profile-account">
            <img src="/assets/index/bee_nobg.png" alt="Zetech Studios" />
            <div>
              <p>Zetech Studios</p>
              <span>Business Account</span>
            </div>
            <FiChevronDown aria-hidden="true" />
          </section>

          <section className="business-profile-help">
            <FiAlertCircle aria-hidden="true" />
            <div>
              <p>Need help?</p>
              <span>Visit our Help Center</span>
            </div>
            <button type="button">Get Support <FiArrowRight aria-hidden="true" /></button>
          </section>
        </aside>

        <section className="business-profile-content">
          <header className="business-profile-topbar">
            <div className="business-profile-crumbs">
              <span>Applicants</span>
              <FiChevronRight aria-hidden="true" />
              <strong>Aisha Mwangi</strong>
            </div>

            <div className="business-profile-top-actions">
              <button type="button" className="business-profile-primary-btn">
                <FiPlus aria-hidden="true" />
                Create Opportunity
                <FiChevronDown aria-hidden="true" />
              </button>
              <button type="button" className="business-profile-icon-btn" aria-label="Open messages">
                <FiMessageCircle aria-hidden="true" />
                <b>6</b>
              </button>
              <button type="button" className="business-profile-icon-btn" aria-label="Open notifications">
                <FiBell aria-hidden="true" />
                <b>3</b>
              </button>
              <button type="button" className="business-profile-user-btn" aria-label="Open profile menu">ZS</button>
              <button type="button" className="business-profile-chevron-btn" aria-label="Expand user menu">
                <FiChevronDown aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="business-profile-body">
            <section className="business-profile-main">
              <article className="business-profile-hero-card">
                <div className="business-profile-hero-top">
                  <div className="business-profile-person">
                    <div className="business-profile-photo-wrap">
                      <img
                        className="business-profile-photo"
                        src="/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp"
                        alt="Aisha Mwangi"
                      />
                      <i aria-hidden="true" />
                    </div>

                    <div className="business-profile-person-copy">
                      <h1>
                        Aisha Mwangi
                        <span>Student</span>
                      </h1>
                      <p>Strathmore University · Year 3 · Marketing & Design</p>
                      <div className="business-profile-person-meta">
                        <span><FiMapPin aria-hidden="true" />Nairobi, Kenya</span>
                        <span><FiMessageCircle aria-hidden="true" />aisha.mwangi@gmail.com</span>
                      </div>
                      <div className="business-profile-tags">
                        {PROFILE_TAGS.map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="business-profile-hero-actions">
                    <button type="button" className="business-profile-ghost-btn">Message</button>
                    <button type="button" className="business-profile-primary-btn small">
                      Move Stage
                      <FiChevronDown aria-hidden="true" />
                    </button>
                    <button type="button" className="business-profile-dots-btn" aria-label="More profile actions">
                      <FiMoreVertical aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="business-profile-metrics-row">
                  {PROFILE_METRICS.map((item, index) => (
                    <article key={item.label} className="business-profile-metric">
                      <p>{item.label}</p>
                      <h3>{item.value}</h3>
                      <span>
                        {index === 0 ? <FiAward aria-hidden="true" /> : null}
                        {item.sub}
                      </span>
                    </article>
                  ))}
                </div>
              </article>

              <nav className="business-profile-tabs" aria-label="Profile tabs">
                {PROFILE_TABS.map((tab, index) => (
                  <button key={tab} type="button" className={`business-profile-tab${index === 0 ? ' is-active' : ''}`}>
                    {tab}
                  </button>
                ))}
              </nav>

              <article className="business-profile-card business-score-card">
                <header>
                  <div>
                    <h2>Zumbarl Score Breakdown</h2>
                    <p>How Aisha is performing across key areas</p>
                  </div>
                  <button type="button" className="business-link-btn">View details</button>
                </header>

                <div className="business-score-content">
                  <div className="business-score-ring" aria-hidden="true">
                    <div>
                      <strong>74</strong>
                      <span>Tier 3</span>
                      <span>Silver</span>
                    </div>
                  </div>

                  <div className="business-score-bars">
                    {SCORE_BREAKDOWN.map((item) => (
                      <div key={item.label} className="business-score-bar-row">
                        <p>{item.label}</p>
                        <div>
                          <span style={{ width: `${(item.value / item.max) * 100}%` }} />
                        </div>
                        <strong>{item.value}/{item.max}</strong>
                      </div>
                    ))}
                  </div>

                  <aside className="business-score-note">
                    <h3>What this means</h3>
                    <p>
                      Aisha is a reliable talent with strong delivery and good client satisfaction.
                      She&apos;s building consistent relationships and ready for more responsibility.
                    </p>
                  </aside>
                </div>
              </article>

              <article className="business-profile-card">
                <header>
                  <div>
                    <h2>Pipeline Relationship</h2>
                    <p>Your relationship with Aisha</p>
                  </div>
                </header>

                <div className="business-pipeline-head">
                  <div className="business-pipeline-account">
                    <span>BM</span>
                    <div>
                      <h3>BrandMasters Agency</h3>
                      <p>7 gigs · 2 endorsements</p>
                    </div>
                  </div>
                  <p className="business-pipeline-status">Pipeline active</p>
                  <span className="business-pipeline-date">Since Apr 8, 2025</span>
                  <button type="button" className="business-profile-icon-btn plain" aria-label="Open pipeline details">
                    <FiChevronRight aria-hidden="true" />
                  </button>
                </div>

                <div className="business-pipeline-track" aria-label="Pipeline journey">
                  {PIPELINE_STEPS.map((step) => (
                    <article key={step.label} className={`business-pipeline-step is-${step.status}`}>
                      <i aria-hidden="true">
                        {step.status === 'done' ? <FiCheckCircle aria-hidden="true" /> : step.status === 'active' ? '4' : <FiLock aria-hidden="true" />}
                      </i>
                      <h4>{step.label}</h4>
                      <p>{step.date}</p>
                    </article>
                  ))}
                </div>

                <div className="business-pipeline-note">
                  <FiLink2 aria-hidden="true" />
                  <p>
                    This talent is in an active pipeline with your company. Keep engaging to move closer to making an offer.
                  </p>
                </div>
              </article>

              <div className="business-profile-grid-2">
                <article className="business-profile-card">
                  <h2>Top Skills</h2>
                  <div className="business-skills-list">
                    {TOP_SKILLS.map((skill) => (
                      <div key={skill.label} className="business-skill-row">
                        <p>{skill.label}</p>
                        <div>
                          <span style={{ width: `${skill.progress}%` }} />
                        </div>
                        <strong>{skill.level}</strong>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="business-profile-card">
                  <h2>Earnings Summary</h2>
                  <div className="business-earnings-list">
                    {EARNINGS.map((entry) => (
                      <div key={entry.label}>
                        <p>{entry.label}</p>
                        <strong>{entry.value}</strong>
                      </div>
                    ))}
                  </div>
                </article>
              </div>

              <article className="business-profile-card">
                <header>
                  <h2>Recent Work Highlights</h2>
                  <button type="button" className="business-link-btn">View full portfolio</button>
                </header>
                <div className="business-highlights-grid">
                  {WORK_HIGHLIGHTS.map((item) => (
                    <article key={item.title} className="business-highlight-item">
                      <img src={item.image} alt={`${item.title} sample`} loading="lazy" />
                      <h4>{item.title}</h4>
                      <p>{item.org}</p>
                      <span>
                        <FiStar aria-hidden="true" /> {item.rating}
                      </span>
                    </article>
                  ))}
                  <button type="button" className="business-highlight-next" aria-label="View more highlights">
                    <FiChevronRight aria-hidden="true" />
                  </button>
                </div>
              </article>

              <article className="business-profile-card">
                <header>
                  <h2>Endorsements</h2>
                  <button type="button" className="business-link-btn">View all</button>
                </header>

                <div className="business-endorsement-list">
                  {ENDORSEMENTS.map((item) => (
                    <article key={`${item.company}-${item.date}`} className="business-endorsement-row">
                      <span>{item.initials}</span>
                      <div>
                        <h4>{item.company}</h4>
                        <p>{item.person}</p>
                        <blockquote>{item.quote}</blockquote>
                      </div>
                      <div>
                        <strong>{item.reward}</strong>
                        <p>{item.date}</p>
                      </div>
                    </article>
                  ))}
                </div>

                <footer className="business-endorsement-foot">
                  <p>Endorsement Currencies (EC) earned: <strong>36</strong></p>
                  <div>
                    <span style={{ width: '72%' }} />
                  </div>
                  <p>Next reward at 50 EC <strong>36/50</strong></p>
                </footer>
              </article>
            </section>

            <aside className="business-profile-rail">
              <article className="business-profile-card business-rail-stage">
                <header>
                  <h2>Talent Stage</h2>
                  <button type="button" className="business-profile-dots-btn" aria-label="Stage settings">
                    <FiMoreVertical aria-hidden="true" />
                  </button>
                </header>

                <div className="business-stage-status">
                  <p>
                    <FiCheckCircle aria-hidden="true" />
                    Pipeline Active
                  </p>
                  <span>Since Apr 8, 2025</span>
                  <small>This talent is actively working with your company.</small>
                </div>

                <h3>Stage actions</h3>
                <button type="button" className="business-stage-btn">Move to Next Stage <FiChevronRight aria-hidden="true" /></button>
                <button type="button" className="business-stage-btn">Add to Team <FiChevronRight aria-hidden="true" /></button>
                <button type="button" className="business-stage-btn danger">Remove from Pipeline <FiChevronRight aria-hidden="true" /></button>
              </article>

              <article className="business-profile-card">
                <h2>Engagement Summary</h2>
                <ul className="business-compact-list">
                  {ENGAGEMENT_SUMMARY.map((item) => (
                    <li key={item.label}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="business-profile-card">
                <header>
                  <h2>Notes</h2>
                  <button type="button" className="business-link-btn">View all</button>
                </header>
                <p className="business-note-copy">
                  Discussed social media strategy role. Impressed with creativity and communication.
                  Concern for long-term retainer.
                </p>
                <p className="business-note-meta">Sarah K. · May 15, 2025</p>
                <button type="button" className="business-note-add-btn">
                  <FiPlus aria-hidden="true" /> Add Note
                </button>
              </article>

              <article className="business-profile-card">
                <h2>Quick Actions</h2>
                <div className="business-quick-actions">
                  {QUICK_ACTIONS.map(({ label, Icon }) => (
                    <button key={label} type="button" className="business-quick-action-btn">
                      <Icon aria-hidden="true" />
                      <span>{label}</span>
                      <FiChevronRight aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </article>

              <article className="business-profile-card business-ai-card">
                <header>
                  <p><FiStar aria-hidden="true" /> AI Recommendation</p>
                  <span>Beta</span>
                </header>
                <h3>High potential talent</h3>
                <strong>94% match</strong>
                <ul>
                  <li>Social Media Manager</li>
                  <li>Content Creator</li>
                  <li>Marketing Assistant</li>
                  <li>Brand Designer</li>
                </ul>
                <button type="button">View Recommended Roles <FiArrowRight aria-hidden="true" /></button>
              </article>
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}

export default BusinessApplicantProfilePage
