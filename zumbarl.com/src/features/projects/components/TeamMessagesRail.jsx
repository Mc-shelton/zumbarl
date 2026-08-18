import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'

function TeamMessagesRail({ participants = [] }) {
  return (
    <aside className="campus-rail project-workspace-rail team-project-rail" aria-label="Project messaging details">
      <section className="campus-rail-card team-rail-card team-message-rail-card">
        <h3>Project participants</h3>
        {participants.length ? participants.map((participant) => (
          <article key={participant.userId}>
            <img src={normalizeZumbarlFileUrl(participant.avatarUrl) || '/assets/index/bee_nobg.png'} alt="" />
            <span>
              <strong>{participant.name}</strong>
              <small>{participant.role || 'Project participant'}</small>
            </span>
          </article>
        )) : <p className="team-message-rail-empty">No other participants are available yet.</p>}
      </section>
      <section className="campus-rail-card team-rail-card team-message-rail-note">
        <h3>Project conversation</h3>
        <p>Use the project group for the whole team, or select a participant for a private project conversation.</p>
      </section>
    </aside>
  )
}

export default TeamMessagesRail
