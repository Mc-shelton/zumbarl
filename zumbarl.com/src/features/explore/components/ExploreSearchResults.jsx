import { FiBookOpen, FiBriefcase, FiChevronRight, FiHeart, FiUsers } from 'react-icons/fi'

function ExploreSearchResults({ marketplaceResults, people, resources }) {
  return (
    <>
      <section className="explore-campus-results-card" aria-label="Marketplace results">
        <header className="explore-campus-results-head">
          <h2>
            <FiBriefcase aria-hidden="true" />
            Marketplace
          </h2>
          <button type="button" className="campus-link-btn">See all 42</button>
        </header>
        <div className="explore-campus-market-grid">
          {marketplaceResults.map((item) => (
            <article key={item.id} className="explore-campus-market-result">
              <button type="button" className="explore-campus-wishlist-btn" aria-label={`Save ${item.title}`}>
                <FiHeart aria-hidden="true" />
              </button>
              <img src={item.image} alt={item.title} loading="lazy" />
              <h3>{item.title}</h3>
              <p className="explore-campus-market-meta">{item.spec}</p>
              <p className="explore-campus-market-price">{item.price}</p>
              <p className="explore-campus-market-condition">{item.condition}</p>
              <div className="explore-campus-market-owner">
                <img src="/assets/index/bee_nobg.png" alt={item.seller} loading="lazy" />
                <div>
                  <strong>{item.seller}</strong>
                  <span>{item.school}</span>
                </div>
              </div>
            </article>
          ))}
          <button type="button" className="explore-campus-market-next" aria-label="More marketplace results">
            <FiChevronRight aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="explore-campus-results-card" aria-label="People who can help">
        <header className="explore-campus-results-head">
          <h2>
            <FiUsers aria-hidden="true" />
            People who can help
          </h2>
          <button type="button" className="campus-link-btn">See all 16</button>
        </header>
        <div className="explore-campus-help-grid">
          {people.map((person) => (
            <article key={person.id} className="explore-campus-help-card">
              <div className="explore-campus-help-head">
                <div className="explore-campus-help-avatar">
                  <img src={person.avatar} alt={person.name} loading="lazy" />
                  {person.isOnline ? <span aria-label="Online" /> : null}
                </div>
                <div>
                  <h3>{person.name}</h3>
                  <p>{person.role}</p>
                  <span>{person.school}</span>
                </div>
              </div>
              <div className="explore-campus-help-skills">
                {person.skills.map((skill) => (
                  <em key={`${person.id}-${skill}`}>{skill}</em>
                ))}
              </div>
              <button type="button" className="explore-campus-connect-btn">Connect</button>
            </article>
          ))}
        </div>
      </section>

      <section className="explore-campus-results-card" aria-label="Top learning resources">
        <header className="explore-campus-results-head">
          <h2>
            <FiBookOpen aria-hidden="true" />
            Top learning resources
          </h2>
          <button type="button" className="campus-link-btn">See all 12</button>
        </header>
        <div className="explore-campus-resource-grid">
          {resources.map((resource) => (
            <article key={resource.id} className="explore-campus-resource-card">
              <img src={resource.image} alt={resource.title} loading="lazy" />
              <div>
                <h3>{resource.title}</h3>
                <p>{resource.meta}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

export default ExploreSearchResults
