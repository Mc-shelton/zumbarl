import { useMemo, useState } from 'react'
import { FiSearch, FiSend, FiUserPlus, FiX } from 'react-icons/fi'
import { useDialog } from '../../../components/ui'

const PROJECT_ROLES = [
  'Contributor',
  'Designer',
  'Content Writer',
  'Developer',
  'Project Coordinator',
]

function TeamInviteModal({
  candidates: availableCandidates = [],
  error = '',
  existingInvites = [],
  existingMembers = [],
  isLoading = false,
  isSending = false,
  onClose,
  onSend,
}) {
  const dialogRef = useDialog({ isOpen: true, onClose })
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [role, setRole] = useState(PROJECT_ROLES[0])
  const [note, setNote] = useState('')
  const memberNames = useMemo(() => new Set(existingMembers.map((member) => member.name)), [existingMembers])
  const invitedIds = useMemo(() => new Set(existingInvites.map((invite) => invite.userId)), [existingInvites])
  const candidates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return availableCandidates
      .filter((candidate) => !memberNames.has(candidate.name))
      .filter((candidate) => !normalizedQuery || [
        candidate.name,
        candidate.school,
        (candidate.skills || []).join(' '),
      ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery)))
  }, [availableCandidates, memberNames, query])

  function toggleCandidate(candidateId) {
    if (invitedIds.has(candidateId)) return
    setSelectedIds((current) => (
      current.includes(candidateId)
        ? current.filter((id) => id !== candidateId)
        : [...current, candidateId]
    ))
  }

  function sendInvites() {
    const selectedCandidates = availableCandidates.filter((candidate) => selectedIds.includes(candidate.userId))
    if (!selectedCandidates.length) return
    onSend({ candidates: selectedCandidates, note, role })
  }

  return (
    <div className="project-modal-backdrop team-modal-backdrop" role="presentation">
      <section
        ref={dialogRef}
        className="project-submit-modal team-invite-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-project-members-title"
      >
        <button type="button" className="project-modal-close" aria-label="Close invite members modal" onClick={onClose}>
          <FiX aria-hidden="true" />
        </button>
        <header>
          <span aria-hidden="true"><FiUserPlus /></span>
          <div>
            <h2 id="invite-project-members-title">Invite project members</h2>
            <p>Select Zumbarl users and assign their role on this project.</p>
          </div>
        </header>

        <label className="team-invite-search">
          <span>Find users</span>
          <div>
            <FiSearch aria-hidden="true" />
            <input
              type="search"
              value={query}
              placeholder="Search by name, school, role, or skill"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </label>

        <div className="team-invite-candidate-list">
          {isLoading ? (
            <p className="team-invite-empty" role="status">Loading available students...</p>
          ) : candidates.length ? candidates.map((candidate) => {
            const isInvited = invitedIds.has(candidate.userId) || candidate.alreadyInvited
            const isSelected = selectedIds.includes(candidate.userId)
            return (
              <label key={candidate.userId} className={isSelected ? 'is-selected' : ''}>
                <input
                  type="checkbox"
                  checked={isSelected || isInvited}
                  disabled={isInvited}
                  onChange={() => toggleCandidate(candidate.userId)}
                />
                <img src={candidate.avatar || '/assets/index/bee_nobg.png'} alt="" />
                <span>
                  <strong>{candidate.name}</strong>
                  <small>{candidate.school || 'Student profile'}</small>
                  <em>{(candidate.skills || []).join(' · ') || 'Skills not added yet'}</em>
                </span>
                <b>{isInvited ? 'Invited' : isSelected ? 'Selected' : 'Select'}</b>
              </label>
            )
          }) : (
            <p className="team-invite-empty">No users match that search.</p>
          )}
        </div>

        {error ? <p className="team-invite-error" role="alert">{error}</p> : null}

        <div className="team-invite-fields">
          <label>
            Project role
            <select value={role} onChange={(event) => setRole(event.target.value)}>
              {PROJECT_ROLES.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>
            Invite note (optional)
            <textarea
              value={note}
              placeholder="Add project context or what you would like them to work on."
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
        </div>

        <footer>
          <p>{selectedIds.length} user{selectedIds.length === 1 ? '' : 's'} selected</p>
          <button type="button" className="project-soft-btn" disabled={isSending} onClick={onClose}>Cancel</button>
          <button type="button" className="project-primary-btn" disabled={!selectedIds.length || isSending} onClick={sendInvites}>
            <FiSend aria-hidden="true" />
            {isSending ? 'Sending...' : 'Send invites'}
          </button>
        </footer>
      </section>
    </div>
  )
}

export default TeamInviteModal
