import { FiCheck, FiUserPlus, FiX } from 'react-icons/fi'

function TeamInviteResponseCard({ invite, isResponding = false, error = '', onRespond }) {
  if (!invite) return null

  return (
    <section className="project-team-invite-response" aria-labelledby="project-team-invite-title">
      <span aria-hidden="true"><FiUserPlus /></span>
      <div>
        <h2 id="project-team-invite-title">You have been invited to this project</h2>
        <p>
          <strong>{invite.inviterName}</strong> invited you to join as <strong>{invite.role}</strong>.
          {invite.note ? ` ${invite.note}` : ''}
        </p>
        {error ? <small role="alert">{error}</small> : null}
      </div>
      <div>
        <button type="button" className="project-soft-btn" disabled={isResponding} onClick={() => onRespond('decline')}>
          <FiX aria-hidden="true" />
          Decline
        </button>
        <button type="button" className="project-primary-btn" disabled={isResponding} onClick={() => onRespond('accept')}>
          <FiCheck aria-hidden="true" />
          {isResponding ? 'Responding...' : 'Accept invite'}
        </button>
      </div>
    </section>
  )
}

export default TeamInviteResponseCard
