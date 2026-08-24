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
import { Breadcrumb, StatusPill } from '../components/ui'
import { BusinessWorkspaceHeader } from '../features/business/components/BusinessWorkspaceHeader'
import { BusinessWorkspaceSidebar } from '../features/business/components/BusinessApplicantSidebar'
import {
  BROWSE_AVAILABILITY_FILTERS,
  BROWSE_QUICK_FILTERS,
  BROWSE_RELATIONSHIP_FILTERS,
  useBusinessBrowseStudents,
} from '../features/business/hooks/useBusinessBrowseStudents'
import '../styles/campus.css'
import '../styles/business.css'

const STUDENT_SERVICES = [
  {
    id: 'service-social-pack',
    title: 'Social campaign content pack',
    student: 'Wanjiru M.',
    meta: 'Reels, stories, captions and Canva source files',
    price: 'from KES 8,500',
    image: '/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp',
    tags: ['Social Media', 'Canva', 'Fast turnaround'],
  },
  {
    id: 'service-landing-page',
    title: 'Landing page UI audit',
    student: 'Brian Otieno',
    meta: 'UX review, wireframe notes and conversion fixes',
    price: 'from KES 12,000',
    image: '/assets/index/business_page_images/optimized/omar-lopez-1qfy-jDc_jo-unsplash.webp',
    tags: ['UI/UX', 'Figma', 'Conversion'],
  },
  {
    id: 'service-video-edit',
    title: 'Short-form video editing sprint',
    student: 'Study With Lynn',
    meta: 'TikTok, Reels and YouTube Shorts edits',
    price: 'from KES 6,000',
    image: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
    tags: ['Video Editing', 'TikTok', 'Analytics'],
  },
]

const BROWSE_CATEGORIES = [
  { id: 'all', label: 'All Categories', count: 248, icon: FiUsers },
  { id: 'design', label: 'Design & Creative', count: 44, icon: FiStar },
  { id: 'development', label: 'Development', count: 38, icon: FiZap },
  { id: 'marketing', label: 'Marketing', count: 52, icon: FiTrendingUp },
  { id: 'writing', label: 'Writing & Content', count: 31, icon: FiBriefcase },
  { id: 'video', label: 'Video & Animation', count: 29, icon: FiCheckCircle },
]

const PROFILE_STORIES = [
  {
    id: 'story-aisha',
    student: 'Aisha Mwangi',
    handle: '@aisha_creates',
    role: 'Brand content creator',
    location: 'Nairobi, Kenya',
    availability: 'Available',
    bio: 'Content creator helping brands communicate clearly with campus audiences.',
    tags: ['Social Media', 'Canva', 'Copywriting', '+2'],
    story: 'Completed 3 campaigns with Zetech Studios and kept revision cycles under 24 hours.',
    image: '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp',
    profileImage: '/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp',
    status: 'New',
  },
  {
    id: 'story-kevin',
    student: 'Kevin The Creator',
    handle: '@kevinthego',
    role: 'TikTok creator',
    location: 'Nairobi, Kenya',
    availability: 'Available',
    bio: 'Short-form creator and developer building clean product demos for businesses.',
    tags: ['TikTok', 'Video Editing', 'React', '+2'],
    story: 'Moved from applicant to repeat collaborator after a high-performing launch video.',
    image: '/assets/index/business_page_images/optimized/bruno-ngarukiye-IzEcrYJ1G34-unsplash.webp',
    profileImage: '/assets/index/business_page_images/optimized/bruno-ngarukiye-IzEcrYJ1G34-unsplash.webp',
    status: 'Repeat',
  },
  {
    id: 'story-grace',
    student: 'Grace Wanjiku',
    handle: '@grace.launch',
    role: 'Launch assistant',
    location: 'Mombasa, Kenya',
    availability: 'Available soon',
    bio: 'Launch assistant with strong proof collection, reporting and client communication.',
    tags: ['Activation', 'Reporting', 'Proof', '+1'],
    story: 'Strong delivery on hybrid workflows with clean proof, files and performance notes.',
    image: '/assets/index/business_page_images/optimized/annie-spratt-hCb3lIB8L8E-unsplash.webp',
    profileImage: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
    status: 'Reviewed',
  },
]

const STUDENT_GROUPS = [
  {
    id: 'worked-before',
    title: 'Worked With Before',
    description: 'Students who already have relationship history, reviews or delivery proof with your company.',
    icon: FiCheckCircle,
    students: [
      {
        id: 'aisha-mwangi',
        name: 'Aisha Mwangi',
        handle: '@aisha_creates',
        headline: 'Social media creator · Kenyatta University',
        location: 'Nairobi, Kenya',
        bio: 'Social media creator helping brands communicate clearly with campus audiences.',
        status: 'Worked with you',
        score: '82',
        match: '96% match',
        availability: 'Available this week',
        image: '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp',
        feature: 'Campus brand launch story',
        featureMeta: '0:45',
        tags: ['Social Media', 'Copywriting', 'Canva'],
        services: ['Content calendar · KES 5,000', 'Reels pack · KES 8,500'],
        tone: 'green',
      },
      {
        id: 'kevin-creator',
        name: 'Kevin The Creator',
        handle: '@kevinthego',
        headline: 'Video storyteller · USIU Africa',
        location: 'Nairobi, Kenya',
        bio: 'Full-stack developer and creator building modern web demos and launch content.',
        status: 'Repeat',
        score: '78',
        match: '91% match',
        availability: 'Open to interviews',
        image: '/assets/index/business_page_images/optimized/bruno-ngarukiye-IzEcrYJ1G34-unsplash.webp',
        feature: 'TikTok product demo reel',
        featureMeta: '0:38',
        tags: ['TikTok', 'Video Editing', 'Campus Events'],
        services: ['Video edit · KES 6,000', 'Launch reel · KES 9,000'],
        tone: 'purple',
      },
    ],
  },
  {
    id: 'best-matches',
    title: 'Best Matches For Your Opportunities',
    description: 'Students whose skills, availability and portfolio align with your active briefs.',
    icon: FiStar,
    students: [
      {
        id: 'wanjiru-m',
        name: 'Wanjiru M.',
        handle: '@wanjiru_creates',
        headline: 'Instagram creator · Nairobi, Kenya',
        location: 'Nairobi, Kenya',
        bio: 'UI/UX designer passionate about creating beautiful, user-centered digital experiences.',
        status: 'New',
        score: '74',
        match: '94% match',
        availability: 'Shortlist ready',
        image: '/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp',
        feature: 'Instagram growth process',
        featureMeta: '0:52',
        tags: ['Instagram', 'Analytics', 'Brand Voice'],
        services: ['Social audit · KES 4,500', 'Content pack · KES 8,500'],
        tone: 'blue',
      },
      {
        id: 'study-with-lynn',
        name: 'Study With Lynn',
        handle: '@studywithlynn',
        headline: 'Education creator · Marketing & Design',
        location: 'Nakuru, Kenya',
        bio: 'Content writer and researcher helping brands communicate clearly and effectively.',
        status: 'New',
        score: '77',
        match: '89% match',
        availability: 'Available in 3 days',
        image: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
        feature: 'Education content sprint',
        featureMeta: '0:41',
        tags: ['Education', 'Short-form Video', 'Reporting'],
        services: ['Script pack · KES 3,500', 'Shorts edit · KES 6,000'],
        tone: 'green',
      },
    ],
  },
  {
    id: 'rising',
    title: 'Rising Students',
    description: 'Newer talent with strong response speed, portfolio quality and campus engagement signals.',
    icon: FiTrendingUp,
    students: [
      {
        id: 'mindset-mentor',
        name: 'Mindset Mentor',
        handle: '@mindset.mentor',
        headline: 'Wellness and campus growth creator',
        location: 'Mombasa, Kenya',
        bio: 'Digital marketer helping brands grow their presence and reach the right audience.',
        status: 'Rising',
        score: '69',
        match: '83% match',
        availability: 'Needs first interview',
        image: '/assets/index/business_page_images/optimized/0xk-y5n-nhkRd7U-unsplash.webp',
        feature: 'Wellness content series',
        featureMeta: '0:50',
        tags: ['Wellness', 'TikTok', 'Community'],
        services: ['Community post set · KES 4,000', 'TikTok idea bank · KES 5,500'],
        tone: 'orange',
      },
      {
        id: 'campus-talks',
        name: 'Campus Talks KE',
        handle: '@campustalks.ke',
        headline: 'Campus news and activation team',
        location: 'Eldoret, Kenya',
        bio: 'Campus activation team creating event stories, proof and brand visibility.',
        status: 'Team',
        score: '72',
        match: '87% match',
        availability: 'Team available',
        image: '/assets/index/business_page_images/optimized/annie-spratt-hCb3lIB8L8E-unsplash.webp',
        feature: 'Campus activation recap',
        featureMeta: '0:28',
        tags: ['Activation', 'Events', 'YouTube'],
        services: ['Event recap · KES 10,000', 'Campus activation · KES 15,000'],
        tone: 'purple',
      },
    ],
  },
]

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
        <img src={image} alt={`${name} avatar`} />
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
  return (
    <article className="business-browse-student-card">
      <Link className="business-browse-student-media" to="/business/applicant-profile">
        <img src={student.image} alt="" />
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
          <Link to="/business/applicant-profile">
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
  const browse = useBusinessBrowseStudents(STUDENT_GROUPS, {
    categoryId: searchParams.get('category') || 'all',
    quickFilters: searchParams.getAll('quick'),
  })

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
                {STUDENT_SERVICES.map((service) => (
                  <article key={service.id}>
                    <img src={service.image} alt="" />
                    <div>
                      <h3>{service.title}</h3>
                      <p>{service.student} · {service.meta}</p>
                      <strong>{service.price}</strong>
                      <div>{service.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                    </div>
                  </article>
                ))}
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
                {PROFILE_STORIES.map((story) => (
                  <Link key={story.id} to="/business/applicant-profile">
                    <img src={story.image} alt="" />
                    <span>{story.role}</span>
                    <BusinessBrowseProfileSummary
                      availability={story.availability}
                      bio={story.bio}
                      handle={story.handle}
                      image={story.profileImage}
                      location={story.location}
                      name={story.student}
                      status={story.status}
                      tags={story.tags}
                    />
                    <strong>{story.story}</strong>
                  </Link>
                ))}
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
                      <Link to="/business/applicant-profile" className="business-link-btn">View group</Link>
                    </header>
                    <div>
                      {group.students.map((student) => <BusinessStudentCard key={student.id} student={student} />)}
                    </div>
                  </section>
                )
              })}
              {!browse.visibleGroups.length ? (
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
