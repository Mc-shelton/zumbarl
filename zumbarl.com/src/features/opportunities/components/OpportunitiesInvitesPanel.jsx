import { FiClock, FiMapPin } from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import { OPPORTUNITY_INVITES } from '../constants'

function OpportunitiesInvitesPanel({
  activeInviteClientsCount,
  expiringSoonInvitesCount,
  invites = OPPORTUNITY_INVITES,
  newInvitesCount,
  onOpenPlaceBid,
}) {
  const canSubmitBid = hasAccess(ACCESS_KEYS.opportunities.apply)

  return (
    <section className="opportunities-list-section opportunities-invites-section" aria-label="Bid invites">
      <div className="opportunities-section-head opportunities-invites-head">
        <div>
          <h2>Invites</h2>
          <p>Gigs where clients invited you directly to submit a proposal.</p>
        </div>
        <button type="button" className="campus-link-btn">Mark all as seen</button>
      </div>

      <div className="opportunities-invites-summary">
        <article>
          <p>New invites</p>
          <strong>{newInvitesCount}</strong>
          <span>Needs response</span>
        </article>
        <article>
          <p>Expiring soon</p>
          <strong>{expiringSoonInvitesCount}</strong>
          <span>Within 48 hours</span>
        </article>
        <article>
          <p>Active clients</p>
          <strong>{activeInviteClientsCount}</strong>
          <span>Hiring now</span>
        </article>
      </div>

      <div className="opportunities-invite-page-list">
        {invites.map((invite) => (
          <article key={invite.id} className={`opportunities-invite-page-card${invite.isNew ? ' is-new' : ''}`}>
            <div className="opportunities-invite-page-thumb">
              <img src={invite.image} alt={`${invite.title} preview`} loading="lazy" />
              <span className={`opportunities-invite-stage-chip ${invite.stageTone}`}>{invite.stage}</span>
            </div>

            <div className="opportunities-invite-page-body">
              <div className="opportunities-invite-page-title-row">
                <h3>{invite.title}</h3>
                <strong>{invite.pay}</strong>
              </div>
              <p className="opportunities-job-meta">
                {invite.company} · {invite.mode}
              </p>
              <p className="opportunities-job-description">{invite.detail}</p>

              <div className="opportunities-tag-row">
                {invite.tags.map((tag) => (
                  <span key={`${invite.id}-${tag}`}>{tag}</span>
                ))}
              </div>

              <div className="opportunities-invite-meta-row">
                <p>
                  <FiMapPin aria-hidden="true" />
                  {invite.location}
                </p>
                <p>
                  <FiClock aria-hidden="true" />
                  {invite.expires}
                </p>
              </div>

              <footer className="opportunities-invite-page-foot">
                <div className="opportunities-bid-client">
                  <img src="/assets/index/bee_nobg.png" alt={`${invite.company} logo`} loading="lazy" />
                  <div>
                    <strong>{invite.inviter}</strong>
                    <p>{invite.posted}</p>
                  </div>
                </div>
                <div className="opportunities-bid-presence">
                  <p>
                    <FiClock aria-hidden="true" />
                    {invite.clientLastSeen}
                  </p>
                  <span>{invite.isNew ? 'New invite' : 'Seen'}</span>
                </div>
              </footer>
            </div>

            <div className="opportunities-invite-page-actions">
              {canSubmitBid ? (
                <button
                  type="button"
                  className="opportunities-search-btn"
                  onClick={() => onOpenPlaceBid(invite.opportunityId, invite)}
                >
                  {invite.isAccepted ? 'Submit Bid' : 'Accept Invite'}
                </button>
              ) : null}
              <button type="button" className="campus-link-btn">Not now</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default OpportunitiesInvitesPanel
