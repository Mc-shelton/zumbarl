import { FiPlus } from 'react-icons/fi'
import { teamMembers } from '../data/mockWorkspace'

function TeamCreateSprintPanel({ onCancel }) {
  return (
    <section className="team-create-sprint-panel">
      <header>
        <h1>Create Sprint</h1>
        <p>Set up a new sprint to plan, track and deliver your work.</p>
      </header>
      <section className="team-create-sprint-layout">
        <div className="team-create-sprint-main">
          <section className="project-card team-create-section">
            <h2><span>1</span> Sprint Details</h2>
            <div className="team-form-grid">
              <label>Sprint Name *<input defaultValue="Sprint 5: Engagement & Growth" /></label>
              <label>Sprint Goal *<textarea defaultValue="Increase content engagement and grow our audience across Instagram, LinkedIn and blog." /></label>
              <label>Start Date *<input defaultValue="Jun 2, 2024" /></label>
              <label>End Date *<input defaultValue="Jun 15, 2024" /></label>
              <label>Sprint Duration<input defaultValue="14 days" /></label>
              <label>Project *<select defaultValue="Social Media Content Creation"><option>Social Media Content Creation</option></select></label>
              <label>Sprint Owner *<select defaultValue="Mercy Wanjiku"><option>Mercy Wanjiku</option></select></label>
              <label>Sprint Type *<select defaultValue="Development"><option>Development</option></select></label>
              <label className="is-wide">Sprint Description (Optional)<textarea defaultValue="This sprint focuses on creating high-value content, running engagement campaigns and analyzing performance to improve reach and audience interaction." /></label>
            </div>
          </section>
          <section className="project-card team-create-section">
            <h2><span>2</span> Select Team</h2>
            <div className="team-create-members">
              {teamMembers.slice(0, 4).map((member) => (
                <p key={member.name}>
                  <img src="/assets/index/bee_nobg.png" alt="" />
                  <strong>{member.name}</strong>
                  <em>{member.role}</em>
                  <button type="button">×</button>
                </p>
              ))}
              <button type="button" className="project-soft-btn"><FiPlus aria-hidden="true" /> Add Member</button>
            </div>
          </section>
          <section className="project-card team-create-section">
            <h2><span>3</span> Add Sprint Backlog</h2>
            <div className="team-create-backlog">
              {['Create Instagram Reel on productivity tips', 'Design 3 Instagram post templates', 'Write LinkedIn article on student freelancing', 'Run Instagram engagement campaign', 'Analyze content performance (May)'].map((task, index) => (
                <label key={task}>
                  <input type="checkbox" defaultChecked={index < 3} />
                  <strong>{task}</strong>
                  <span>To Do</span>
                  <em>{index % 2 === 0 ? 'High' : 'Medium'}</em>
                  <b>{index + 2}</b>
                  <img src="/assets/index/bee_nobg.png" alt="" />
                </label>
              ))}
            </div>
          </section>
        </div>
        <aside className="team-create-rail">
          <section className="project-card">
            <h3>Sprint Summary</h3>
            <p><strong>Sprint Name</strong> Sprint 5: Engagement & Growth</p>
            <p><strong>Project</strong> Social Media Content Creation</p>
            <p><strong>Dates</strong> Jun 2, 2024 - Jun 15, 2024</p>
            <p><strong>Duration</strong> 14 days</p>
            <p><strong>Tasks</strong> 3 tasks selected</p>
          </section>
          <section className="project-card">
            <h3>Sprint Capacity</h3>
            <i><b /></i>
            <p>Capacity 14 points · Committed 10 points · Remaining 4 points</p>
          </section>
          <button type="button" className="project-primary-btn">Create Sprint</button>
          <button type="button" className="project-soft-btn" onClick={onCancel}>Cancel</button>
        </aside>
      </section>
    </section>
  )
}

export default TeamCreateSprintPanel
