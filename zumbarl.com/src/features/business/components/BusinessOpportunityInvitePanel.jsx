import { FiSearch, FiSend, FiX } from 'react-icons/fi'

export function BusinessOpportunityInvitePanel({
  candidates,
  inviteNote,
  inviteOpportunity,
  onChangeInviteNote,
  onChangeInviteQuery,
  onClose,
  onSendInvites,
  onToggleBidder,
  selectedBidderIds,
}) {
  if (!inviteOpportunity) return null

  const selectedCount = selectedBidderIds.length

  return (
    <div className="business-opportunity-invite-backdrop" role="presentation">
      <section
        className="business-opportunity-invite-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="business-invite-title"
      >
        <header>
          <div>
            <p className="business-section-kicker">Invite Bidders</p>
            <h2 id="business-invite-title">{inviteOpportunity.title}</h2>
            <span>{inviteOpportunity.company} · {inviteOpportunity.budget}</span>
          </div>
          <button type="button" aria-label="Close invite bidders" onClick={onClose}>
            <FiX aria-hidden="true" />
          </button>
        </header>

        <label className="business-opportunity-invite-search">
          <FiSearch aria-hidden="true" />
          <input
            type="search"
            placeholder="Search by student, school, or skill"
            onChange={(event) => onChangeInviteQuery(event.target.value)}
          />
        </label>

        <div className="business-opportunity-invite-list">
          {candidates.map((candidate) => {
            const isSelected = selectedBidderIds.includes(candidate.id)

            return (
              <label
                key={candidate.id}
                className={`business-opportunity-bidder-card${isSelected ? ' is-selected' : ''}${candidate.alreadyInvited ? ' is-invited' : ''}`}
              >
                <input
                  checked={isSelected || candidate.alreadyInvited}
                  disabled={candidate.alreadyInvited}
                  type="checkbox"
                  onChange={() => onToggleBidder(candidate.id)}
                />
                <span className={`tone-${candidate.tone}`} aria-hidden="true">
                  {candidate.name.split(' ').map((part) => part[0]).join('')}
                </span>
                <div>
                  <strong>{candidate.name}</strong>
                  <p>{candidate.school}</p>
                  <ul>
                    {candidate.skills.map((skill) => <li key={`${candidate.id}-${skill}`}>{skill}</li>)}
                  </ul>
                </div>
                <aside>
                  <b>{candidate.match}%</b>
                  <em>{candidate.alreadyInvited ? 'Invited' : `${candidate.skillMatches} skill match`}</em>
                  <small>{candidate.status}</small>
                </aside>
              </label>
            )
          })}
        </div>

        <label className="business-opportunity-invite-note">
          <span>Invite Note</span>
          <textarea value={inviteNote} onChange={(event) => onChangeInviteNote(event.target.value)} />
        </label>

        <footer>
          <p>{selectedCount} bidder{selectedCount === 1 ? '' : 's'} selected</p>
          <div>
            <button type="button" className="business-profile-ghost-btn" onClick={onClose}>Cancel</button>
            <button
              type="button"
              className="business-profile-primary-btn"
              disabled={!selectedCount}
              onClick={onSendInvites}
            >
              Send Invites
              <FiSend aria-hidden="true" />
            </button>
          </div>
        </footer>
      </section>
    </div>
  )
}
