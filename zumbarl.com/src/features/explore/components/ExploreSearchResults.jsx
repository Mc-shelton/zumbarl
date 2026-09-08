import { Link } from 'react-router-dom'
import { FiBookOpen, FiBriefcase, FiFileText, FiLayers, FiSearch, FiShoppingBag, FiUsers } from 'react-icons/fi'

const SECTION_CONFIG = {
  people: { label: 'People', Icon: FiUsers, limit: 8 },
  pages: { label: 'Pages and communities', Icon: FiLayers, limit: 8 },
  marketplace: { label: 'Marketplace', Icon: FiShoppingBag, limit: 8 },
  posts: { label: 'Posts', Icon: FiFileText, limit: 6 },
  projects: { label: 'Work and opportunities', Icon: FiBriefcase, limit: 6 },
  resources: { label: 'Learning resources', Icon: FiBookOpen, limit: 8 },
}

function Highlight({ text, query }) {
  const source = String(text || '')
  const words = String(query || '').trim().split(/\s+/).filter((word) => word.length > 1)
  if (!source || !words.length) return source
  const escaped = words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const parts = source.split(new RegExp(`(${escaped})`, 'ig'))
  return parts.map((part, index) => words.some((word) => part.toLowerCase() === word.toLowerCase()) ? <mark key={`${part}-${index}`}>{part}</mark> : part)
}

function ResultHead({ item, query }) {
  return <><h3><Highlight text={item.name || item.title} query={query} /></h3>{item.subtitle || item.meta ? <p><Highlight text={item.subtitle || item.meta} query={query} /></p> : null}</>
}

function PeopleResults({ items, query }) {
  return <div className="explore-campus-search-directory-grid">{items.map((person) => (
    <Link to={person.href} className="explore-campus-search-person" key={person.id}>
      <img src={person.avatar} alt="" loading="lazy" />
      <div><ResultHead item={person} query={query} />{person.handle ? <span>{person.handle}</span> : null}</div>
      <strong>{person.isSelf ? 'Your profile' : 'View profile'}</strong>
    </Link>
  ))}</div>
}

function PageResults({ items, query }) {
  return <div className="explore-campus-search-directory-grid">{items.map((page) => (
    <Link to={page.href} className="explore-campus-search-person" key={page.href || page.id}>
      <img src={page.avatar} alt="" loading="lazy" />
      <div><ResultHead item={page} query={query} />{page.handle ? <span>{page.handle}</span> : null}</div>
      <strong>Open page</strong>
    </Link>
  ))}</div>
}

function MarketplaceResults({ items, query }) {
  return <div className="explore-campus-market-grid is-search-results">{items.map((item) => (
    <Link to={item.href} key={item.id} className="explore-campus-market-result">
      <img src={item.image} alt="" loading="lazy" />
      <h3><Highlight text={item.title} query={query} /></h3>
      <p className="explore-campus-market-meta"><Highlight text={item.category || item.description} query={query} /></p>
      <p className="explore-campus-market-price">{item.price}</p>
      <div className="explore-campus-market-owner">
        <img src={item.ownerAvatar} alt="" loading="lazy" />
        <div><strong>{item.ownerName}</strong><span>{item.school || item.condition || 'Campus marketplace'}</span></div>
      </div>
    </Link>
  ))}</div>
}

function ListResults({ items, query, kind }) {
  return <div className="explore-campus-search-list">{items.map((item) => (
    <Link to={item.href} className="explore-campus-search-list-item" key={item.id}>
      {item.image ? <img src={item.image} alt="" loading="lazy" /> : <span className={`is-${kind}`} aria-hidden="true">{kind === 'resources' ? <FiBookOpen /> : kind === 'projects' ? <FiBriefcase /> : <FiFileText />}</span>}
      <div><ResultHead item={item} query={query} />{kind === 'projects' ? <strong>{item.budget || 'View opportunity'}</strong> : null}</div>
    </Link>
  ))}</div>
}

function SearchSection({ activeTab, group, items, onSelectTab, query }) {
  const config = SECTION_CONFIG[group]
  const visibleItems = activeTab === 'all' ? items.slice(0, config.limit) : items
  if (!visibleItems.length) return null
  const Content = group === 'people' ? PeopleResults : group === 'pages' ? PageResults : group === 'marketplace' ? MarketplaceResults : ListResults
  return (
    <section className="explore-campus-results-card" aria-label={`${config.label} results`}>
      <header className="explore-campus-results-head">
        <h2><config.Icon aria-hidden="true" />{config.label}<span>{items.length}</span></h2>
        {activeTab === 'all' && items.length > config.limit ? <button type="button" className="campus-link-btn" onClick={() => onSelectTab(group)}>See all {items.length}</button> : null}
      </header>
      <Content items={visibleItems} query={query} kind={group} />
    </section>
  )
}

function ExploreSearchResults({ activeTab, data, error, loading, onSelectTab, query }) {
  if (loading) return <section className="explore-campus-search-status" role="status"><span className="explore-campus-search-spinner" /><h2>Searching the campus…</h2><p>Checking people, pages, posts, marketplace, work, and learning.</p></section>
  if (error) return <section className="explore-campus-search-status is-error" role="alert"><FiSearch /><h2>Search could not finish</h2><p>{error}</p></section>
  const groups = activeTab === 'all' ? Object.keys(SECTION_CONFIG) : [activeTab]
  const visibleCount = groups.reduce((sum, group) => sum + (data.groups[group]?.length || 0), 0)
  if (!visibleCount) return <section className="explore-campus-search-status"><FiSearch /><h2>No matches for “{query}”</h2><p>Try a name, username, skill, page, product, course, topic, or a shorter phrase.</p></section>
  return groups.map((group) => <SearchSection key={group} activeTab={activeTab} group={group} items={data.groups[group] || []} onSelectTab={onSelectTab} query={query} />)
}

export default ExploreSearchResults
