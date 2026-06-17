import { FiChevronRight, FiUsers } from 'react-icons/fi'
import { Breadcrumb } from '../../../components/ui'

function ExploreFeedHero({
  areStoriesVisible,
  filters,
  onPrepareProfile,
  onPublishStory,
  profileReady,
  stories,
  storyPublished,
}) {
  return (
    <section className="explore-campus-feed-hero" aria-label="Explore campus feed">
      <Breadcrumb
        className="explore-campus-breadcrumb"
        items={[
          { label: 'Campus' },
          { label: 'Explore Campus' },
          { label: 'Connect' },
        ]}
      />

      <header className="explore-campus-feed-hero-head">
        <div>
          <h1>Explore Campus</h1>
          <p>
            Zumbarl Connect lives here: stories, tagged posts, groups, and chamas that route into work, learning, and marketplace actions.
          </p>
        </div>
        <div className="explore-campus-feed-hero-actions">
          <button type="button" className="explore-campus-ghost-btn" disabled={storyPublished} onClick={onPublishStory}>
            <FiUsers aria-hidden="true" />
            {storyPublished ? 'Story live' : profileReady ? 'Publish story' : 'Prepare profile'}
          </button>
          <button type="button" className="explore-campus-ghost-btn" disabled={profileReady} onClick={onPrepareProfile}>
            <FiUsers aria-hidden="true" />
            Prepare Connect profile
          </button>
        </div>
      </header>

      <nav className="explore-campus-feed-tabs" aria-label="Explore campus feed filters">
        {filters.map((filter, index) => (
          <button key={filter} type="button" className={index === 0 ? 'is-active' : ''}>
            {filter}
          </button>
        ))}
      </nav>

      <section className={`explore-campus-stories${areStoriesVisible ? '' : ' is-hidden'}`} aria-label="Stories">
        <h2>Stories</h2>
        <div className="explore-campus-stories-row">
          {stories.map((story) => (
            <button
              key={story.id}
              type="button"
              className={`explore-campus-story-item${story.own && storyPublished ? ' is-live' : ''}`}
              onClick={() => {
                if (story.own) {
                  onPublishStory()
                }
              }}
            >
              <div className={`explore-campus-story-avatar${story.own ? ' is-own' : ''}${story.own && storyPublished ? ' is-published' : ''}`}>
                <img src={story.avatar} alt={story.name} loading="lazy" />
                {story.own ? <span className="explore-campus-story-plus">{storyPublished ? '✓' : '+'}</span> : null}
                {story.online ? <span className="explore-campus-story-online" /> : null}
              </div>
              <p>{story.own && storyPublished ? 'Your status' : story.name}</p>
            </button>
          ))}
          <button type="button" className="explore-campus-story-more" aria-label="More stories">
            <FiChevronRight aria-hidden="true" />
          </button>
        </div>
      </section>
    </section>
  )
}

export default ExploreFeedHero
