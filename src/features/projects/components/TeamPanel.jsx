import { FiMessageCircle, FiPlus } from 'react-icons/fi'
import { teamMembers } from '../data/mockWorkspace'

function TeamPanel() {
  return (
    <section className="team-members-panel">
      <div className="team-tab-tools">
        <label>
          <FiMessageCircle aria-hidden="true" />
          <input type="search" placeholder="Search team members..." />
        </label>
        <button type="button" className="project-soft-btn">Filter by: role</button>
        <button type="button" className="project-primary-btn">
          <FiPlus aria-hidden="true" />
          Invite Members
        </button>
      </div>
      <section className="project-card team-members-table">
        <div className="team-member-row is-head">
          <span>Member</span>
          <span>Role</span>
          <span>Tasks</span>
          <span>Workload</span>
          <span>Availability</span>
          <span>Status</span>
        </div>
        {teamMembers.map((member) => (
          <div key={member.name} className="team-member-row">
            <span>
              <img src="/assets/index/bee_nobg.png" alt="" />
              <strong>{member.name}</strong>
              <em>{member.role}</em>
            </span>
            <span>{member.role}</span>
            <span>{member.tasks}</span>
            <span>
              {member.workload}
              <i style={{ '--progress': member.workload }}><b /></i>
            </span>
            <span>{member.availability}</span>
            <span>...</span>
          </div>
        ))}
      </section>
    </section>
  )
}

export default TeamPanel
