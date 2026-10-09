import { useEffect, useMemo, useState } from 'react'
import {
  FiArrowRight,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiFilter,
  FiMapPin,
  FiRadio,
  FiSearch,
  FiStar,
  FiTrendingUp,
  FiUsers,
  FiZap,
} from 'react-icons/fi'
import { Link, useSearchParams } from 'react-router-dom'
import Seo from '../components/Seo'
import { Breadcrumb, DEFAULT_PROFILE_AVATAR, ProfileAvatar, StatusPill } from '../components/ui'
import { BusinessWorkspaceHeader } from '../features/business/components/BusinessWorkspaceHeader'
import { BusinessWorkspaceSidebar } from '../features/business/components/BusinessApplicantSidebar'
import {
  BROWSE_AVAILABILITY_FILTERS,
  BROWSE_QUICK_FILTERS,
  BROWSE_RELATIONSHIP_FILTERS,
  useBusinessBrowseStudents,
} from '../features/business/hooks/useBusinessBrowseStudents'
import { listBusinessTalent } from '../features/business/services/readBusinessDashboard'
import '../styles/campus.css'
import '../styles/business.css'

const BROWSE_CATEGORIES = [
  { id: 'all', label: 'All Categories', icon: FiUsers },
  { id: 'design', label: 'Design & Creative', icon: FiStar },
  { id: 'development', label: 'Development', icon: FiZap },
  { id: 'marketing', label: 'Marketing', icon: FiTrendingUp },
  { id: 'writing', label: 'Writing & Content', icon: FiBriefcase },
  { id: 'video', label: 'Video & Animation', icon: FiCheckCircle },
]

function formatServicePrice(service) {
  const amount = Number(service.priceAmount)
  if (!Number.isFinite(amount)) return 'Price on request'
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: service.currency || 'KES',
    maximumFractionDigits: 0,
  }).format(amount)
}

function toBrowseStudent(student) {
  const portfolio = student.portfolio || []
  const services = student.services || []
  return {
    ...student,
    availability: student.availability || 'Availability not set',
    bio: student.bio || 'This student has not added a bio yet.',
    feature: portfolio[0]?.title || 'View student profile',
    featureMeta: portfolio.length
      ? `${portfolio.length} published portfolio item${portfolio.length === 1 ? '' : 's'}`
      : 'Profile',
    featureImage: portfolio[0]?.image || '/assets/index/bee_nobg.png',
    image: student.image,
    location: student.location || 'Location not set',
    match: `${Number(student.match || 0)}% match`,
    services: services.map((service) => `${service.title} · ${formatServicePrice(service)}`),
    tags: student.tags || [],
  }
}

function buildStudentGroups(students) {
  const normalized = students.map(toBrowseStudent)
  const workedBefore = normalized.filter((student) => ['Worked with you', 'Repeat'].includes(student.status))
  const newStudents = normalized.filter((student) => !['Worked with you', 'Repeat'].includes(student.status))

  return [
    {
      id: 'worked-before',
      title: 'Worked With Before',
      description: 'Students with delivery history recorded for your company.',
      icon: FiCheckCircle,
      students: workedBefore,
    },
    {
      id: 'best-matches',
      title: 'Best Matches For Your Opportunities',
      description: 'Available students ranked from current profile, skills, and company relationship signals.',
      icon: FiStar,
      students: newStudents.filter((student) => Number(student.score) >= 70),
    },
    {
      id: 'rising',
      title: 'Rising Students',
      description: 'New talent building profile strength, services, and published portfolio work.',
      icon: FiTrendingUp,
      students: newStudents.filter((student) => Number(student.score) < 70),
    },
  ].filter((group) => group.students.length)
}

function BusinessBrowseProfileSummary({
  availability,
  bio,
  handle,
  image,
  location,
  name,
  status,
  tags,
}) {
  return (
    <section className="business-browse-profile-summary">
      <header>
        <ProfileAvatar src={image} alt={`${name} avatar`} />
        <div>
          <h3>{name} <StatusPill tone="purple">{status}</StatusPill></h3>
          <p>{handle}</p>
        </div>
      </header>
      <div className="business-browse-profile-meta">
        <span><FiMapPin aria-hidden="true" /> {location}</span>
        <StatusPill tone="green">{availability}</StatusPill>
      </div>
      <p>{bio}</p>
      <div className="business-browse-student-tags">
        {tags.map((tag) => <span key={tag}>{tag}</span>)}
      </div>
    </section>
  )
}

function BusinessStudentCard({ student }) {
  const profileHref = `/business/applicant-profile/${encodeURIComponent(student.id)}`

  return (
    <article className="business-browse-student-card">
      <Link className="business-browse-student-media" to={profileHref}>
        <img src={student.featureImage} alt="" />
        <span>Story</span>
        <strong>{student.feature}</strong>
        <em>{student.featureMeta}</em>
      </Link>
      <div>
        <BusinessBrowseProfileSummary
          availability={student.availability}
          bio={student.bio}
          handle={student.handle}
          image={student.image}
          location={student.location}
          name={student.name}
          status={student.status}
          tags={student.tags}
        />
        <section className="business-browse-student-services" aria-label={`${student.name} services offered`}>
          <h4>Services Offered</h4>
          <div>
            {student.services.map((service) => <span key={service}>{service}</span>)}
          </div>
        </section>
        <footer>
          <dl>
            <div><dt>Score</dt><dd>{student.score}</dd></div>
            <div><dt>Availability</dt><dd>{student.availability}</dd></div>
          </dl>
          <Link to={profileHref}>
            View profile
            <FiArrowRight aria-hidden="true" />
          </Link>
        </footer>
      </div>
    </article>
  )
}

function BusinessApplicantsBrowsePage() {
  const [searchParams] = useSearchParams()
  const sourceCampaignId = searchParams.get('campaignId') || ''
  const sourceCampaignTitle = searchParams.get('campaignTitle') || ''
  const [students, setStudents] = useState([])
  const [talentError, setTalentError] = useState('')
  const [isTalentLoading, setIsTalentLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const studentGroups = useMemo(() => buildStudentGroups(students), [students])
  const promotedServices = useMemo(() => students.flatMap((student) => (
    (student.services || []).map((service) => ({
      ...service,
      image: student.image || student.portfolio?.[0]?.image || DEFAULT_PROFILE_AVATAR,
      meta: student.bio || student.headline || 'Student service',
      profileHref: `/business/applicant-profile/${encodeURIComponent(student.id)}`,
      student: student.name,
      tags: student.tags || [],
    }))
  )).slice(0, 6), [students])
  const profileStories = useMemo(() => students.flatMap((student) => (
    (student.portfolio || []).map((portfolio) => ({
      ...student,
      id: portfolio.id,
      image: portfolio.image || student.image || DEFAULT_PROFILE_AVATAR,
      profileHref: `/business/applicant-profile/${encodeURIComponent(student.id)}`,
      profileImage: student.image || DEFAULT_PROFILE_AVATAR,
      role: student.headline || 'Student creator',
      story: portfolio.description || portfolio.title,
    }))
  )).slice(0, 6), [students])
  const browse = useBusinessBrowseStudents(studentGroups, {
    categoryId: searchParams.get('category') || 'all',
    quickFilters: searchParams.getAll('quick'),
  })

  useEffect(() => {
    let isMounted = true
    listBusinessTalent()
      .then((response) => {
        if (isMounted) setStudents(Array.isArray(response?.data) ? response.data : [])
      })
      .catch((error) => {
        if (isMounted) setTalentError(error.message || 'Students could not be loaded.')
      })
      .finally(() => {
        if (isMounted) setIsTalentLoading(false)
      })
    return () => { isMounted = false }
  }, [reloadKey])

  return (
    <main className="campus-page business-workspace-page business-applicants-browse-page">
      <Seo
        title="Browse Students | Zumbarl"
        description="Browse student profiles, promoted services, stories and talent groups from the Zumbarl business workspace."
        path="/business/applicants"
      />

      <div className="campus-stage">
        <div className="campus-shell business-workspace-shell business-applicants-browse-shell">
          <BusinessWorkspaceSidebar activeItemId="browse" />

          <section className="campus-main business-workspace-main business-applicants-browse-main">
            <Breadcrumb
              className="business-workspace-breadcrumb"
              items={[
                { label: 'Business workspace', href: '/business/workspace' },
                { label: 'Browse students' },
              ]}
            />

            <BusinessWorkspaceHeader
              title="Browse Students"
              description="Explore student profiles, promoted services and relationship history without leaving the business workspace."
              primaryActionHref="/business/opportunities/create"
              primaryActionLabel="Create Opportunity"
            />

            {isTalentLoading ? (
              <section className="business-profile-card" aria-live="polite">
                <p>Loading live student profiles…</p>
              </section>
            ) : null}
            {talentError ? (
              <section className="business-profile-card" role="alert">
                <h2>Student profiles are unavailable</h2>
                <p>{talentError}</p>
                <button type="button" className="business-link-btn" onClick={() => { setIsTalentLoading(true); setTalentError(''); setReloadKey((value) => value + 1) }}>Try again</button>
              </section>
            ) : null}

            {sourceCampaignId ? (
              <section className="business-profile-card business-browse-campaign-context">
                <span aria-hidden="true"><FiRadio /></span>
                <div>
                  <strong>Find creators for {sourceCampaignTitle || 'your campaign'}</strong>
                  <p>Marketing creators are prefiltered. Open a profile to review fit and availability.</p>
                </div>
                <Link to={`/business/marketing/${sourceCampaignId}`}>Back to campaign</Link>
              </section>
            ) : null}

            <section className="business-browse-categories" aria-labelledby="business-browse-categories-title">
              <header>
                <h2 id="business-browse-categories-title">Browse by Category</h2>
                <button type="button" onClick={() => browse.onCategoryChange('all')}>View all categories</button>
              </header>
              <div>
                {BROWSE_CATEGORIES.map((category) => {
                  const CategoryIcon = category.icon

                  return (
                    <button
                      key={category.id}
                      type="button"
                      className={browse.activeCategoryId === category.id ? 'is-active' : ''}
                      aria-pressed={browse.activeCategoryId === category.id}
                      onClick={() => browse.onCategoryChange(category.id)}
                    >
                      <span><CategoryIcon aria-hidden="true" /></span>
                      <strong>{category.label}</strong>
                      <em>{browse.categoryCounts[category.id] || 0} students</em>
                    </button>
                  )
                })}
              </div>
            </section>

            <section className="business-profile-card business-browse-discovery-card">
              <label>
                <FiSearch aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search students by skill, school, service, or availability..."
                  value={browse.query}
                  onChange={(event) => browse.onQueryChange(event.target.value)}
                />
              </label>
              <select
                value={browse.activeCategoryId}
                aria-label="Filter by category"
                onChange={(event) => browse.onCategoryChange(event.target.value)}
              >
                <option value="all">All categories</option>
                {BROWSE_CATEGORIES.filter((category) => category.id !== 'all').map((category) => (
                  <option key={category.id} value={category.id}>{category.label}</option>
                ))}
              </select>
              <select
                value={browse.sortBy}
                aria-label="Sort students"
                onChange={(event) => browse.onSortChange(event.target.value)}
              >
                <option value="recommended">Sort by: Recommended</option>
                <option value="score">Score</option>
                <option value="relationship">Relationship history</option>
              </select>
              <div>
                {BROWSE_QUICK_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={browse.activeQuickFilters.includes(filter) ? 'is-active' : ''}
                    aria-pressed={browse.activeQuickFilters.includes(filter)}
                    onClick={() => browse.onToggleQuickFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </section>

            <section className="business-profile-card business-browse-services">
              <header>
                <div>
                  <h2>Promoted Student Services</h2>
                  <p>Services students are actively offering to companies.</p>
                </div>
                <Link to="/business/services" className="business-link-btn">Browse services</Link>
              </header>
              <div>
                {promotedServices.map((service) => (
                  <article key={service.id}>
                    <img src={service.image} alt="" />
                    <div>
                      <h3><Link to={service.profileHref}>{service.title}</Link></h3>
                      <p>{service.student} · {service.meta}</p>
                      <strong>{formatServicePrice(service)}</strong>
                      <div>{service.tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div>
                    </div>
                  </article>
                ))}
                {!isTalentLoading && !talentError && !promotedServices.length ? <p>No students have published active services yet.</p> : null}
              </div>
            </section>

            <section className="business-profile-card business-browse-stories">
              <header>
                <div>
                  <h2>Profile Stories</h2>
                  <p>Relationship highlights from students your team has worked with or reviewed.</p>
                </div>
                <button type="button" className="business-workspace-filter">Recent stories</button>
              </header>
              <div>
                {profileStories.map((story) => (
                  <Link key={story.id} to={story.profileHref}>
                    <img src={story.image} alt="" />
                    <span>{story.role}</span>
                    <BusinessBrowseProfileSummary
                      availability={story.availability}
                      bio={story.bio}
                      handle={story.handle}
                      image={story.profileImage}
                      location={story.location}
                      name={story.name}
                      status={story.status}
                      tags={story.tags}
                    />
                    <strong>{story.story}</strong>
                  </Link>
                ))}
                {!isTalentLoading && !talentError && !profileStories.length ? <p>No published portfolio stories are available yet.</p> : null}
              </div>
            </section>

            <section className="business-browse-groups" aria-label="Student groups">
              {browse.visibleGroups.map((group) => {
                const GroupIcon = group.icon || FiUsers

                return (
                  <section key={group.id} className="business-profile-card business-browse-group-card">
                    <header>
                      <div>
                        <span><GroupIcon aria-hidden="true" /></span>
                        <div>
                          <h2>{group.title}</h2>
                          <p>{group.description}</p>
                        </div>
                      </div>
                      <span>{group.students.length} student{group.students.length === 1 ? '' : 's'}</span>
                    </header>
                    <div>
                      {group.students.map((student) => <BusinessStudentCard key={student.id} student={student} />)}
                    </div>
                  </section>
                )
              })}
              {!isTalentLoading && !talentError && !browse.visibleGroups.length ? (
                <section className="business-profile-card business-browse-group-card" aria-live="polite">
                  <header>
                    <div>
                      <span><FiUsers aria-hidden="true" /></span>
                      <div>
                        <h2>No students match these filters</h2>
                        <p>Try clearing a filter or searching for a different skill, school, or service.</p>
                      </div>
                    </div>
                    <button type="button" className="business-link-btn" onClick={browse.onClearFilters}>Clear filters</button>
                  </header>
                </section>
              ) : null}
            </section>
          </section>

          <aside className="campus-rail business-workspace-rail business-applicants-browse-rail">
            <section className="business-profile-card business-browse-filter-card">
              <header>
                <h2><FiFilter aria-hidden="true" /> Filters</h2>
                <button type="button" onClick={browse.onClearFilters}>Clear all</button>
              </header>
              <fieldset>
                <legend>Category</legend>
                {BROWSE_CATEGORIES.map((category) => (
                  <label key={category.id}>
                    <input
                      type="radio"
                      name="browse-category"
                      checked={browse.activeCategoryId === category.id}
                      onChange={() => browse.onCategoryChange(category.id)}
                    />
                    {category.label}
                  </label>
                ))}
              </fieldset>
              <fieldset>
                <legend>Availability</legend>
                {BROWSE_AVAILABILITY_FILTERS.map((filter) => (
                  <label key={filter}>
                    <input
                      type="checkbox"
                      checked={browse.availabilityFilters.includes(filter)}
                      onChange={() => browse.onToggleAvailability(filter)}
                    />
                    {' '}{filter}
                  </label>
                ))}
              </fieldset>
              <fieldset>
                <legend>Relationship</legend>
                {BROWSE_RELATIONSHIP_FILTERS.map((filter) => (
                  <label key={filter}>
                    <input
                      type="checkbox"
                      checked={browse.relationshipFilters.includes(filter)}
                      onChange={() => browse.onToggleRelationship(filter)}
                    />
                    {' '}{filter}
                  </label>
                ))}
              </fieldset>
            </section>

            <section className="business-profile-card">
              <header>
                <h2>Browse Summary</h2>
              </header>
              <dl>
                <div><dt><FiUsers aria-hidden="true" /> Matched students</dt><dd>{browse.summary.matchedStudents}</dd></div>
                <div><dt><FiBriefcase aria-hidden="true" /> Promoted services</dt><dd>{browse.summary.promotedServices}</dd></div>
                <div><dt><FiClock aria-hidden="true" /> Available this week</dt><dd>{browse.summary.availableThisWeek}</dd></div>
                <div><dt><FiZap aria-hidden="true" /> Worked with you</dt><dd>{browse.summary.workedWithYou}</dd></div>
              </dl>
            </section>

            <section className="business-profile-card business-browse-shortlist-card">
              <h2>Natural Grouping</h2>
              <p>Students are grouped by relationship history, match strength, availability, and promoted services so teams can browse without jumping out of the business workspace.</p>
              <Link to="/business/opportunities/create" className="business-profile-primary-btn">
                Create matching brief
                <FiArrowRight aria-hidden="true" />
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default BusinessApplicantsBrowsePage
