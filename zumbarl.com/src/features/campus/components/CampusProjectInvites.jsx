import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCheck, FiUserPlus, FiX } from 'react-icons/fi'
import {
  listMyProjectTeamInvites,
  respondToProjectTeamInvite,
} from '../../projects/services/projectTeamInviteService'

function CampusProjectInvites() {
  const navigate = useNavigate()
  const [invites, setInvites] = useState([])
  const [pendingId, setPendingId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    listMyProjectTeamInvites()
      .then((response) => {
        if (active) setInvites((response?.invites || []).filter((invite) => invite.status === 'pending'))
      })
      .catch((requestError) => {
        if (active) setError(requestError?.message || 'Project invitations could not be loaded.')
      })
    return () => { active = false }
  }, [])

  async function respond(invite, action) {
    setPendingId(invite.id)
    setError('')
    try {
      await respondToProjectTeamInvite(invite.id, action)
      setInvites((current) => current.filter((item) => item.id !== invite.id))
      if (action === 'accept') {
        navigate(`/campus/projects/${invite.projectId}?tab=team`)
      }
    } catch (requestError) {
      setError(requestError?.message || 'Your response could not be saved.')
    } finally {
      setPendingId('')
    }
  }

  if (!invites.length && !error) return null

  return (
    <section className="campus-project-invites" aria-labelledby="campus-project-invites-title">
      <header>
        <span aria-hidden="true"><FiUserPlus /></span>
        <div>
          <h2 id="campus-project-invites-title">Project invitations</h2>
          <p>Respond to invitations from teams that want you on their project.</p>
        </div>
        {invites.length ? <strong>{invites.length} pending</strong> : null}
      </header>

      {error ? <p className="campus-project-invites-error" role="alert">{error}</p> : null}

      <div className="campus-project-invite-list">
        {invites.map((invite) => (
          <article key={invite.id}>
            <div>
              <span>Invited by {invite.inviterName}</span>
              <h3>{invite.projectTitle || 'Project invitation'}</h3>
              <p>
                Join as <strong>{invite.role}</strong>
                {invite.note ? ` · ${invite.note}` : ''}
              </p>
            </div>
            <div>
              <button
                type="button"
                className="project-soft-btn"
                disabled={Boolean(pendingId)}
                onClick={() => respond(invite, 'decline')}
              >
                <FiX aria-hidden="true" /> Decline
              </button>
              <button
                type="button"
                className="project-primary-btn"
                disabled={Boolean(pendingId)}
                onClick={() => respond(invite, 'accept')}
              >
                <FiCheck aria-hidden="true" />
                {pendingId === invite.id ? 'Responding…' : 'Accept invite'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default CampusProjectInvites
