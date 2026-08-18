import { useState } from 'react'
import { FiAlertCircle, FiCheckCircle, FiChevronDown, FiChevronUp } from 'react-icons/fi'

// The milestone lifecycle, read from real records. Every gate below reflects
// something that has actually happened - funding released, a student joined, a
// sprint planned - rather than the local mock state this panel used to run on.
const PROGRAM_GATES = [
  { id: 'biddingOpen', label: 'Team bidding', pending: 'Business must open applications first.', done: 'Applications are open to students.' },
  { id: 'studentJoined', label: 'Student admission', pending: 'No student has joined this project team yet.', done: 'The project team has members.' },
  { id: 'fundsReleased', label: 'Milestone funding', pending: 'Business must release the milestone budget before activation.', done: 'Milestone budget is funded in escrow.' },
  { id: 'backlogReady', label: 'Backlog + sprint plan', pending: 'Plan a sprint and schedule tasks into it.', done: 'Sprint planned with scheduled tasks.' },
  { id: 'milestoneActive', label: 'Milestone active', pending: 'Activate the milestone once it is funded.', done: 'Milestone is active and being worked on.' },
  { id: 'scopeLocked', label: 'Scope lock', pending: 'Scope locks when the project starts.', done: 'Scope is locked for this milestone.' },
  { id: 'submitted', label: 'Submit + review', pending: 'Students submit after execution and catchup evidence.', done: 'Work has been submitted for review.' },
  { id: 'approved', label: 'Approval', pending: 'Waiting on business approval.', done: 'Approved by the business.' },
  { id: 'disbursed', label: 'Payout', pending: 'Payout follows approval, split by workload.', done: 'Milestone budget has been disbursed.' },
]

// Reference, not a control surface: the lifecycle tells you what is outstanding
// but you act on it elsewhere (fund, activate, plan, submit). It sits at the foot
// of the milestone view as a compact strip rather than a wall of cards on top.
function MilestoneProgramPanel({ programGates }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!programGates) return null

  const { gates, milestone } = programGates
  const cleared = PROGRAM_GATES.filter((gate) => gates?.[gate.id])
  const outstanding = PROGRAM_GATES.filter((gate) => !gates?.[gate.id])

  return (
    <section className="milestone-program-footer">
      <button
        type="button"
        className="milestone-program-footer-head"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="milestone-program-footer-label">
          Milestone lifecycle
          {milestone ? <em>{milestone.title}</em> : null}
        </span>
        <span className="milestone-program-footer-progress">
          {cleared.length}/{PROGRAM_GATES.length} cleared
        </span>
        <span className="milestone-program-footer-next">
          {outstanding.length ? `Next: ${outstanding[0].label}` : 'All stages cleared'}
        </span>
        {isOpen ? <FiChevronUp aria-hidden="true" /> : <FiChevronDown aria-hidden="true" />}
      </button>

      {isOpen ? (
        <ul className="milestone-program-footer-gates">
          {PROGRAM_GATES.map((gate) => {
            const isDone = Boolean(gates?.[gate.id])
            return (
              <li key={gate.id} className={isDone ? 'is-done' : ''} title={isDone ? gate.done : gate.pending}>
                {isDone ? <FiCheckCircle aria-hidden="true" /> : <FiAlertCircle aria-hidden="true" />}
                <span>{gate.label}</span>
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}

export default MilestoneProgramPanel
