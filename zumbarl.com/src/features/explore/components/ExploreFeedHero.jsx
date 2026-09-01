import { useState } from 'react'
import { FiSliders } from 'react-icons/fi'
import { Breadcrumb } from '../../../components/ui'

function ExploreFeedHero({
  activeFilter,
  areStoriesVisible,
  filters,
  isHome = false,
  onOpenStory,
  onSelectFilter,
  onPrepareProfile,
  onPublishStory,
  stories,
}) {
  const [storyFilter, setStoryFilter] = useState('all')
  const orderedStories = [...stories].filter((story) => storyFilter === 'all' || story.storyCategory === storyFilter).sort((first, second) => {
    if (first.own !== second.own) return first.own ? -1 : 1
    const firstHasUnseen = first.items?.some((item) => !item.isViewed)
    const secondHasUnseen = second.items?.some((item) => !item.isViewed)
    const unseenPriority = Number(secondHasUnseen) - Number(firstHasUnseen)
    if (unseenPriority) return unseenPriority
    return Number(second.isSameCampus) - Number(first.isSameCampus)
  })

  return (
    <section className="explore-campus-feed-hero" aria-label={isHome ? 'Zumbarl home feed' : 'Explore campus feed'}>
      {!isHome ? (
        <Breadcrumb
          className="explore-campus-breadcrumb"
          items={[
            { label: 'Campus' },
            { label: 'Explore Campus' },
            { label: 'Connect' },
          ]}
        />
      ) : null}

      <header className="explore-campus-feed-hero-head">
        <div>
          <h1>Explore Campus</h1>
          <p>
            {isHome
              ? 'Catch up with your people, discover what is happening, and turn campus connections into real opportunities.'
              : 'Discover stories, people, groups, and campus moments beyond the accounts you already follow.'}
          </p>
        </div>
        <div className="explore-campus-feed-hero-actions">
          <button type="button" className="explore-campus-ghost-btn" onClick={onPrepareProfile}>
            <FiSliders aria-hidden="true" />
            Tune my feed
          </button>
        </div>
      </header>

      <nav className="explore-campus-feed-tabs" aria-label="Explore campus feed filters">
        {filters.map((filter) => (
          <button key={filter} type="button" className={activeFilter === filter ? 'is-active' : ''} aria-pressed={activeFilter === filter} onClick={() => onSelectFilter(filter)}>
            {filter}
          </button>
        ))}
      </nav>

      <section className={`explore-campus-stories${areStoriesVisible ? '' : ' is-hidden'}`} aria-label="Stories">
        <header className="explore-story-directory-head"><h2>Stories</h2><nav aria-label="Story categories">{[['all', 'All'], ['people', 'People'], ['pages', 'Pages'], ['groups', 'Groups'], ['libraries', 'Libraries']].map(([id, label]) => <button type="button" key={id} className={storyFilter === id ? 'is-active' : ''} onClick={() => setStoryFilter(id)}>{label}</button>)}</nav></header>
        <div className="explore-campus-stories-row">
          <button type="button" className="explore-campus-story-item explore-campus-story-add" onClick={onPublishStory} aria-label="Add a story">
            <div className="explore-campus-story-avatar is-own"><span className="explore-campus-story-add-icon">+</span><span className="explore-campus-story-plus">+</span></div>
            <p>Add story</p>
          </button>
          <div className="explore-campus-stories-scroll" aria-label="Active stories">
            {orderedStories.filter((story) => story.items?.length).map((story) => (
              <button
                key={story.id}
                type="button"
                className={`explore-campus-story-item${story.items.some((item) => !item.isViewed) ? ' is-unseen' : ' is-viewed'}${story.own ? ' is-live' : ''}`}
                onClick={() => onOpenStory(story.id)}
                aria-label={`View ${story.shortName || story.name}'s stories`}
              >
                <div className={`explore-campus-story-avatar${story.own ? ' is-own is-published' : ''}`}>
                  <img src={story.avatar} alt={story.name} loading="lazy" />
                  {story.own ? <span className="explore-campus-story-plus">✓</span> : null}
                  {story.online ? <span className="explore-campus-story-online" /> : null}
                </div>
                <p>{story.own ? 'Your story' : (story.shortName || story.name)}</p>
              </button>
            ))}
          </div>
        </div>
      </section>
    </section>
  )
}

export default ExploreFeedHero
