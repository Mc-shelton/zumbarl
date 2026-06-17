import { FiMessageCircle, FiMoreHorizontal, FiPlus } from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import { teamSprints } from '../data/mockWorkspace'

function TeamSprintsPanel({ onCreateSprint }) {
  const canCreateSprint = hasAccess(ACCESS_KEYS.projects.createSprint)

  return (
    <section className="team-sprints-panel">
      <div className="team-tab-tools">
        <label>
          <FiMessageCircle aria-hidden="true" />
          <input type="search" placeholder="Search sprints..." />
        </label>
        <button type="button" className="project-soft-btn">Filters</button>
        {canCreateSprint ? (
          <button type="button" className="project-primary-btn" onClick={onCreateSprint}>
            <FiPlus aria-hidden="true" />
            Create Sprint
          </button>
        ) : null}
      </div>
      {teamSprints.map((sprint, index) => (
        <article key={sprint.title} className="project-card team-sprint-row">
          <span className={index < 2 ? 'is-active' : ''} />
          <div>
            <small>Sprint {index + 1}</small>
            <h2>{sprint.title}</h2>
            <em>{sprint.status}</em>
            <p>{sprint.dates}</p>
          </div>
          <p>{sprint.goal}</p>
          <dl>
            <div><dt>Tasks</dt><dd>{sprint.tasks}</dd></div>
            <div><dt>Story Points</dt><dd>{sprint.points}</dd></div>
          </dl>
          <div>
            <strong>{sprint.progress}</strong>
            <i style={{ '--progress': sprint.progress }}><b /></i>
            <p>Key Deliverables</p>
          </div>
          <button type="button" className="project-icon-btn" aria-label={`More actions for ${sprint.title}`}>
            <FiMoreHorizontal aria-hidden="true" />
          </button>
        </article>
      ))}
    </section>
  )
}

export default TeamSprintsPanel
