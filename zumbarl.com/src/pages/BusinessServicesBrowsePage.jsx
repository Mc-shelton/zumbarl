import { useEffect, useMemo, useState } from 'react'
import {
  FiArrowRight,
  FiBriefcase,
  FiFilter,
  FiMapPin,
  FiSearch,
  FiTag,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import { Breadcrumb, StatusPill } from '../components/ui'
import { BusinessWorkspaceHeader } from '../features/business/components/BusinessWorkspaceHeader'
import { BusinessWorkspaceSidebar } from '../features/business/components/BusinessApplicantSidebar'
import { listBusinessTalent } from '../features/business/services/readBusinessDashboard'
import '../styles/campus.css'
import '../styles/business.css'

const DEFAULT_SERVICE_IMAGE = '/assets/index/bee_nobg.png'

function formatPrice(service) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: service.currency || 'KES',
    maximumFractionDigits: 0,
  }).format(Number(service.priceAmount || 0))
}

function toServiceListings(students) {
  return students.flatMap((student) => (student.services || []).map((service) => ({
    ...service,
    avatar: student.image || DEFAULT_SERVICE_IMAGE,
    handle: student.handle,
    image: service.image || student.portfolio?.[0]?.image || student.image || DEFAULT_SERVICE_IMAGE,
    profileHref: `/business/applicant-profile/${encodeURIComponent(student.id)}`,
    student: student.name,
    tags: student.tags || [],
  })))
}

function BusinessServiceCard({ isSelected, onSelect, service }) {
  return (
    <article className={`business-service-card ${isSelected ? 'is-selected' : ''}`}>
      <button type="button" onClick={onSelect}>
        <img src={service.image} alt="" />
        <span>{service.category || 'Service'}</span>
      </button>
      <div>
        <header>
          <img src={service.avatar} alt={`${service.student} avatar`} />
          <div>
            <h3>{service.title}</h3>
            <p>{service.student}{service.handle ? ` · ${service.handle}` : ''}</p>
          </div>
        </header>
        <p>{service.description || 'Open the student profile to discuss the service scope.'}</p>
        <div className="business-service-card-meta">
          {service.location ? <span><FiMapPin aria-hidden="true" /> {service.location}</span> : null}
          <span>{formatPrice(service)}</span>
        </div>
        <footer>
          <button type="button" onClick={onSelect}>View details</button>
          <Link to={service.profileHref}>View student</Link>
        </footer>
      </div>
    </article>
  )
}

function BusinessServicesBrowsePage() {
  const [services, setServices] = useState([])
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isMounted = true
    listBusinessTalent()
      .then((response) => {
        if (!isMounted) return
        const listings = toServiceListings(Array.isArray(response?.data) ? response.data : [])
        setServices(listings)
        setSelectedServiceId((current) => (
          listings.some((service) => service.id === current) ? current : listings[0]?.id || ''
        ))
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError.message || 'Student services could not be loaded.')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })
    return () => { isMounted = false }
  }, [reloadKey])

  const categories = useMemo(() => (
    [...new Set(services.map((service) => service.category).filter(Boolean))].sort()
  ), [services])

  const visibleServices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return services
      .filter((service) => category === 'all' || service.category === category)
      .filter((service) => !normalizedQuery || [
        service.title,
        service.description,
        service.category,
        service.student,
        service.handle,
        service.tags.join(' '),
      ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery)))
      .sort((first, second) => {
        if (sortBy === 'price-low') return Number(first.priceAmount) - Number(second.priceAmount)
        if (sortBy === 'price-high') return Number(second.priceAmount) - Number(first.priceAmount)
        return new Date(second.updatedAt || 0) - new Date(first.updatedAt || 0)
      })
  }, [category, query, services, sortBy])

  const selectedService = visibleServices.find((service) => service.id === selectedServiceId)
    || visibleServices[0]
    || null

  return (
    <main className="campus-page business-workspace-page business-services-page">
      <Seo
        title="Browse Student Services | Zumbarl"
        description="Browse active student service listings and open the provider profile from the Zumbarl business workspace."
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
              description="Find active services published by students, review the real listing details, and open the provider profile."
              primaryActionHref="/business/opportunities/create"
              primaryActionLabel="Create Opportunity"
            />

            {isLoading ? <section className="business-profile-card" aria-live="polite"><p>Loading active student services…</p></section> : null}
            {error ? <section className="business-profile-card" role="alert"><h2>Services are unavailable</h2><p>{error}</p><button type="button" className="business-link-btn" onClick={() => { setIsLoading(true); setError(''); setReloadKey((value) => value + 1) }}>Try again</button></section> : null}

            <section className="business-profile-card business-services-toolbar">
              <label>
                <FiSearch aria-hidden="true" />
                <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search services by skill, student, category, or deliverable..." />
              </label>
              <select value={category} aria-label="Service category" onChange={(event) => setCategory(event.target.value)}>
                <option value="all">All services</option>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select value={sortBy} aria-label="Sort services" onChange={(event) => setSortBy(event.target.value)}>
                <option value="recent">Sort by: Recently updated</option>
                <option value="price-low">Price: Low to high</option>
                <option value="price-high">Price: High to low</option>
              </select>
            </section>

            {!isLoading && !error && !visibleServices.length ? (
              <section className="business-profile-card">
                <h2>No active services found</h2>
                <p>{services.length ? 'Try a different search or category.' : 'Students have not published active service listings yet.'}</p>
              </section>
            ) : null}

            {selectedService ? (
              <section className="business-services-content">
                <div className="business-services-list">
                  {visibleServices.map((service) => (
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
                      <StatusPill tone="purple">{selectedService.category || 'Service'}</StatusPill>
                      <h2>{selectedService.title}</h2>
                      <p>{selectedService.description || 'The provider has not added a service description.'}</p>
                    </div>
                  </header>

                  <dl>
                    <div><dt><FiBriefcase aria-hidden="true" /> Published by</dt><dd>{selectedService.student}</dd></div>
                    <div><dt><FiTag aria-hidden="true" /> Price</dt><dd>{formatPrice(selectedService)}</dd></div>
                    {selectedService.location ? <div><dt><FiMapPin aria-hidden="true" /> Location</dt><dd>{selectedService.location}</dd></div> : null}
                  </dl>

                  {selectedService.deliveryOptions?.length ? (
                    <section>
                      <h3>Delivery options</h3>
                      <ul>{selectedService.deliveryOptions.map((item) => <li key={item}>{item}</li>)}</ul>
                    </section>
                  ) : null}

                  {selectedService.tags.length ? (
                    <section>
                      <h3>Provider skills</h3>
                      <ul>{selectedService.tags.map((item) => <li key={item}>{item}</li>)}</ul>
                    </section>
                  ) : null}

                  <footer>
                    <Link to="/business/opportunities/create" className="business-profile-primary-btn">
                      <FiBriefcase aria-hidden="true" />
                      Create scoped opportunity
                    </Link>
                    <Link to={selectedService.profileHref} className="business-profile-ghost-btn">
                      View student profile
                      <FiArrowRight aria-hidden="true" />
                    </Link>
                  </footer>
                </aside>
              </section>
            ) : null}
          </section>

          <aside className="campus-rail business-workspace-rail business-services-rail">
            <section className="business-profile-card business-browse-filter-card">
              <header>
                <h2><FiFilter aria-hidden="true" /> Live inventory</h2>
              </header>
              <p>{services.length} active student service{services.length === 1 ? '' : 's'} available.</p>
              <p>Prices, descriptions, providers, and availability come directly from published marketplace listings.</p>
            </section>

            <section className="business-profile-card business-services-booking-note">
              <h2>Commissioning work</h2>
              <p>Create a scoped opportunity for the service you need, then invite the provider from the applicant workspace.</p>
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
