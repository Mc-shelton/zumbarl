import { useState } from 'react'
import {
  FiArrowRight,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiFilter,
  FiSearch,
  FiStar,
  FiUsers,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import { Breadcrumb, StatusPill } from '../components/ui'
import { BusinessWorkspaceHeader } from '../features/business/components/BusinessWorkspaceHeader'
import { BusinessWorkspaceSidebar } from '../features/business/components/BusinessApplicantSidebar'
import '../styles/campus.css'
import '../styles/business.css'

const SERVICE_CATEGORIES = ['All services', 'Social media', 'Design', 'Video', 'Development', 'Research']

const STUDENT_SERVICE_LISTINGS = [
  {
    id: 'social-content-pack',
    title: 'Social campaign content pack',
    student: 'Wanjiru M.',
    handle: '@wanjiru_creates',
    avatar: '/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp',
    image: '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp',
    category: 'Social media',
    price: 'KES 8,500',
    turnaround: '5-7 days',
    rating: '4.8',
    orders: '32 bookings',
    summary: 'Reels, stories, captions and Canva source files for a small campaign sprint.',
    includes: ['2 Instagram Reels', '3 Stories', 'Caption pack', 'Editable Canva source'],
    process: ['Share brand context', 'Approve content direction', 'Receive draft assets', 'Request revisions', 'Accept final files'],
  },
  {
    id: 'landing-page-audit',
    title: 'Landing page UI audit',
    student: 'Brian Otieno',
    handle: '@brian.creates',
    avatar: '/assets/index/business_page_images/optimized/omar-lopez-1qfy-jDc_jo-unsplash.webp',
    image: '/assets/index/business_page_images/optimized/alejandro-escamilla-BbQLHCpVUqA-unsplash.webp',
    category: 'Design',
    price: 'KES 12,000',
    turnaround: '3-4 days',
    rating: '4.9',
    orders: '18 bookings',
    summary: 'UX review, annotated screenshots, conversion recommendations and a quick wireframe pass.',
    includes: ['UX audit notes', 'Conversion checklist', 'Figma annotations', 'Priority fixes'],
    process: ['Share website link', 'Student reviews flow', 'Receive annotated audit', 'Discuss recommendations', 'Book follow-up work'],
  },
  {
    id: 'short-video-sprint',
    title: 'Short-form video editing sprint',
    student: 'Study With Lynn',
    handle: '@studywithlynn',
    avatar: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
    image: '/assets/index/business_page_images/optimized/justin-buisson-vIluu0IH6Ps-unsplash.webp',
    category: 'Video',
    price: 'KES 6,000',
    turnaround: '2-4 days',
    rating: '4.7',
    orders: '28 bookings',
    summary: 'Edit TikTok, Reels and YouTube Shorts from supplied clips, scripts or raw footage.',
    includes: ['3 short edits', 'Captions', 'Basic transitions', 'Exported MP4 files'],
    process: ['Upload raw footage', 'Confirm edit direction', 'Review first cut', 'Approve revisions', 'Download final videos'],
  },
  {
    id: 'api-integration-fix',
    title: 'Small API integration fix',
    student: 'Kevin The Creator',
    handle: '@kevinthego',
    avatar: '/assets/index/business_page_images/optimized/bruno-ngarukiye-IzEcrYJ1G34-unsplash.webp',
    image: '/assets/index/business_page_images/optimized/mapbox-ZT5v0puBjZI-unsplash.webp',
    category: 'Development',
    price: 'KES 15,000',
    turnaround: '1 week',
    rating: '4.9',
    orders: '14 bookings',
    summary: 'Small React or Node.js fixes for API connection, forms, dashboard data or integrations.',
    includes: ['Issue triage', 'Code fix', 'Test notes', 'Handoff summary'],
    process: ['Share repo or brief', 'Confirm access needs', 'Student fixes issue', 'Review staging result', 'Accept handoff'],
  },
]

function BusinessServiceCard({ isSelected, onSelect, service }) {
  return (
    <article className={`business-service-card ${isSelected ? 'is-selected' : ''}`}>
      <button type="button" onClick={onSelect}>
        <img src={service.image} alt="" />
        <span>{service.category}</span>
      </button>
      <div>
        <header>
          <img src={service.avatar} alt={`${service.student} avatar`} />
          <div>
            <h3>{service.title}</h3>
            <p>{service.student} · {service.handle}</p>
          </div>
        </header>
        <p>{service.summary}</p>
        <div className="business-service-card-meta">
          <span><FiStar aria-hidden="true" /> {service.rating}</span>
          <span><FiClock aria-hidden="true" /> {service.turnaround}</span>
          <span>{service.price}</span>
        </div>
        <footer>
          <button type="button" onClick={onSelect}>View details</button>
          <Link to="/business/applicant-profile">View student</Link>
        </footer>
      </div>
    </article>
  )
}

function BusinessServicesBrowsePage() {
  const [selectedServiceId, setSelectedServiceId] = useState(STUDENT_SERVICE_LISTINGS[0].id)
  const selectedService = STUDENT_SERVICE_LISTINGS.find((service) => service.id === selectedServiceId) || STUDENT_SERVICE_LISTINGS[0]

  return (
    <main className="campus-page business-workspace-page business-services-page">
      <Seo
        title="Browse Student Services | Zumbarl"
        description="Browse student services, review service details, and book work from the Zumbarl business workspace."
        path="/business/services"
      />

      <div className="campus-stage">
        <div className="campus-shell business-workspace-shell business-services-shell">
          <BusinessWorkspaceSidebar activeItemId="browse" />

          <section className="campus-main business-workspace-main business-services-main">
            <Breadcrumb
              className="business-workspace-breadcrumb"
              items={[
                { label: 'Business workspace', href: '/business/workspace' },
                { label: 'Browse students', href: '/business/applicants' },
                { label: 'Services' },
              ]}
            />

            <BusinessWorkspaceHeader
              title="Browse Services"
              description="Find student services your business can book directly, review what is included, and start a service order."
              primaryActionHref="/business/opportunities/create"
              primaryActionLabel="Create Opportunity"
            />

            <section className="business-profile-card business-services-toolbar">
              <label>
                <FiSearch aria-hidden="true" />
                <input type="search" placeholder="Search services by skill, student, category, or deliverable..." />
              </label>
              <select defaultValue="all" aria-label="Service category">
                {SERVICE_CATEGORIES.map((category) => <option key={category} value={category.toLowerCase()}>{category}</option>)}
              </select>
              <select defaultValue="recommended" aria-label="Sort services">
                <option value="recommended">Sort by: Recommended</option>
                <option value="rating">Rating</option>
                <option value="turnaround">Turnaround</option>
                <option value="price">Price</option>
              </select>
            </section>

            <section className="business-services-content">
              <div className="business-services-list">
                {STUDENT_SERVICE_LISTINGS.map((service) => (
                  <BusinessServiceCard
                    key={service.id}
                    isSelected={service.id === selectedService.id}
                    onSelect={() => setSelectedServiceId(service.id)}
                    service={service}
                  />
                ))}
              </div>

              <aside className="business-profile-card business-service-detail-card">
                <img src={selectedService.image} alt="" />
                <header>
                  <div>
                    <StatusPill tone="purple">{selectedService.category}</StatusPill>
                    <h2>{selectedService.title}</h2>
                    <p>{selectedService.summary}</p>
                  </div>
                </header>

                <dl>
                  <div><dt><FiCreditCard aria-hidden="true" /> Starting price</dt><dd>{selectedService.price}</dd></div>
                  <div><dt><FiCalendar aria-hidden="true" /> Turnaround</dt><dd>{selectedService.turnaround}</dd></div>
                  <div><dt><FiStar aria-hidden="true" /> Rating</dt><dd>{selectedService.rating}</dd></div>
                  <div><dt><FiUsers aria-hidden="true" /> Bookings</dt><dd>{selectedService.orders}</dd></div>
                </dl>

                <section>
                  <h3>What is included</h3>
                  <ul>
                    {selectedService.includes.map((item) => (
                      <li key={item}><FiCheckCircle aria-hidden="true" /> {item}</li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h3>Booking process</h3>
                  <ol>
                    {selectedService.process.map((item) => <li key={item}>{item}</li>)}
                  </ol>
                </section>

                <footer>
                  <button type="button" className="business-profile-primary-btn">
                    <FiBriefcase aria-hidden="true" />
                    Book Service
                  </button>
                  <Link to="/business/applicant-profile" className="business-profile-ghost-btn">
                    View student profile
                    <FiArrowRight aria-hidden="true" />
                  </Link>
                </footer>
              </aside>
            </section>
          </section>

          <aside className="campus-rail business-workspace-rail business-services-rail">
            <section className="business-profile-card business-browse-filter-card">
              <header>
                <h2><FiFilter aria-hidden="true" /> Filters</h2>
                <button type="button">Clear all</button>
              </header>
              <fieldset>
                <legend>Category</legend>
                {SERVICE_CATEGORIES.slice(0, 5).map((category, index) => (
                  <label key={category}>
                    <input type="checkbox" defaultChecked={index === 0} />
                    {category}
                  </label>
                ))}
              </fieldset>
              <fieldset>
                <legend>Service readiness</legend>
                <label><input type="checkbox" /> Bookable now</label>
                <label><input type="checkbox" /> Has repeat bookings</label>
                <label><input type="checkbox" /> Worked with your company</label>
              </fieldset>
              <fieldset>
                <legend>Budget</legend>
                <label><input type="checkbox" /> Under KES 10,000</label>
                <label><input type="checkbox" /> KES 10,000 - 20,000</label>
                <label><input type="checkbox" /> Custom quote</label>
              </fieldset>
            </section>

            <section className="business-profile-card business-services-booking-note">
              <h2>Booking Services</h2>
              <p>Service bookings create a scoped work order with files, messages, milestones and payment tracking once the student accepts.</p>
              <Link to="/business/applicants" className="business-dashboard-link">
                Back to Browse
                <FiArrowRight aria-hidden="true" />
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default BusinessServicesBrowsePage
