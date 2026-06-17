import { FiArrowRight, FiMessageCircle, FiPlus } from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import { teamBoardColumns } from '../data/mockWorkspace'

function TeamBoardPanel({ onAddTask }) {
  const canCreateTask = hasAccess(ACCESS_KEYS.projects.createTask)

  return (
    <section className="team-board-panel">
      <div className="team-tab-tools">
        <label>
          <FiMessageCircle aria-hidden="true" />
          <input type="search" placeholder="Search tasks..." />
        </label>
        <button type="button" className="project-soft-btn">Filter</button>
        <button type="button" className="project-soft-btn">Group by: Status</button>
        {canCreateTask ? (
          <button type="button" className="project-primary-btn" onClick={onAddTask}>
            <FiPlus aria-hidden="true" />
            Add Task
          </button>
        ) : null}
      </div>
      <div className="team-board-columns">
        {teamBoardColumns.map((column) => (
          <section key={column.title} className={`team-board-column is-${column.tone}`}>
            <h2>{column.title} <span>{column.tasks.length}</span></h2>
            {column.tasks.map(([title, detail, badge]) => (
              <article key={title}>
                <strong>{title}</strong>
                <p>{detail}</p>
                <span>{badge}</span>
                <img src="/assets/index/bee_nobg.png" alt="" />
              </article>
            ))}
            {canCreateTask ? <button type="button" onClick={onAddTask}>+ Add task</button> : null}
          </section>
        ))}
      </div>
      <footer className="team-board-footer">
        <span>Total Tasks: 22</span>
        <strong>Completed: 6 (27%)</strong>
        <i><b /></i>
        <button type="button">View task analytics <FiArrowRight aria-hidden="true" /></button>
      </footer>
    </section>
  )
}

export default TeamBoardPanel
