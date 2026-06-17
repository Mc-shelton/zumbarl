import {
  FiCheckCircle,
  FiLock,
  FiPlayCircle,
  FiRefreshCw,
  FiSend,
  FiUnlock,
  FiUsers,
} from 'react-icons/fi'
import { WorkflowStatusPanel } from '../../workflows/components/WorkflowStatusPanel'
import {
  PROJECT_WORKFLOW_MOCK,
  PROJECT_WORKFLOW_TERMS,
  calculateProjectStudentPay,
} from '../../workflows/workflowData'

function money(value) {
  return `KES ${Number(value || 0).toLocaleString('en-US')}`
}

function getTerm(termId) {
  return PROJECT_WORKFLOW_TERMS.find((term) => term.id === termId) || PROJECT_WORKFLOW_TERMS[0]
}

function getActiveStepId(state) {
  if (state.disbursed) return 'disbursement'
  if (state.approved) return 'review'
  if (state.submitted) return 'submission'
  if (state.milestoneActive) return 'execution'
  if (state.scopeLocked) return 'locked'
  if (state.backlogReady) return 'planning'
  if (state.fundsReleased) return 'funding'
  if (state.studentJoined) return 'admission'
  if (state.biddingOpen) return 'bidding'
  return 'brief'
}

function TermSelector({ selectedTermId, onSelectTerm }) {
  return (
    <section className="project-program-terms" aria-label="Student project terms">
      {PROJECT_WORKFLOW_TERMS.map((term) => (
        <button
          key={term.id}
          type="button"
          className={selectedTermId === term.id ? 'is-selected' : ''}
          onClick={() => onSelectTerm(term.id)}
        >
          <strong>{term.label}</strong>
          <span>{term.description}</span>
        </button>
      ))}
    </section>
  )
}

export function ProjectProgramWorkflowPanel({ state, onPatchState }) {
  const selectedTerm = getTerm(state.selectedTermId)
  const calculatedPay = calculateProjectStudentPay({
    milestoneBudget: PROJECT_WORKFLOW_MOCK.milestoneBudget,
    payFactor: selectedTerm.payFactor,
    roleWeight: PROJECT_WORKFLOW_MOCK.roleWeight,
    zumbarlScore: PROJECT_WORKFLOW_MOCK.zumbarlScore,
  })
  const activeStepId = getActiveStepId(state)
  const canActivateMilestone = state.fundsReleased && state.backlogReady && state.catchupCreated
  const planningLocked = state.scopeLocked || state.milestoneActive

  return (
    <section className="project-program-workflow">
      <section className="project-card project-program-hero">
        <div>
          <span>Project training ground</span>
          <h2>{PROJECT_WORKFLOW_MOCK.activeMilestone}</h2>
          <p>
            Manage a business project where students can join as paid contributors, attachment learners,
            or interns while the business controls milestones, funds, scope, and review quality.
          </p>
        </div>
        <dl>
          <div><dt>Milestone budget</dt><dd>{money(PROJECT_WORKFLOW_MOCK.milestoneBudget)}</dd></div>
          <div><dt>Zumbarl score</dt><dd>{PROJECT_WORKFLOW_MOCK.zumbarlScore}/100</dd></div>
          <div><dt>Calculated student pay</dt><dd>{money(calculatedPay)}</dd></div>
        </dl>
      </section>

      <TermSelector
        selectedTermId={state.selectedTermId}
        onSelectTerm={(selectedTermId) => onPatchState({ selectedTermId })}
      />

      <WorkflowStatusPanel
        title="Project program gates"
        items={[
          {
            label: 'Team bidding',
            status: state.biddingOpen ? 'done' : 'blocked',
            detail: state.biddingOpen ? 'Students can apply to join the team.' : 'Business must open applications first.',
          },
          {
            label: 'Student admission',
            status: state.studentJoined ? 'done' : 'blocked',
            detail: state.studentJoined ? `${selectedTerm.label} accepted with calculated pay.` : 'Student has not joined this project team yet.',
          },
          {
            label: 'Milestone funding',
            status: state.fundsReleased ? 'done' : 'blocked',
            detail: state.fundsReleased ? 'Milestone funds are held by Zumbarl.' : 'Business must release milestone budget before activation.',
          },
          {
            label: 'Backlog + sprint plan',
            status: state.backlogReady && state.catchupCreated ? 'done' : 'blocked',
            detail: state.backlogReady && state.catchupCreated
              ? 'Backlog, sprint scope, owners, and catchups are ready.'
              : 'Backlog, sprint scope, owners, and weekly catchup cadence must be prepared.',
          },
          {
            label: 'Scope lock',
            status: planningLocked ? 'done' : 'blocked',
            detail: planningLocked
              ? 'Milestone scope is locked; task cards can move status only.'
              : 'Scope locks only after funding, backlog, sprint, and catchup setup.',
          },
          {
            label: 'Submit + review cycle',
            status: state.submitted ? 'done' : 'blocked',
            detail: state.submitted ? 'Milestone evidence submitted for business review.' : 'Students submit after execution and catchup evidence.',
          },
          {
            label: 'Payout + growth credit',
            status: state.disbursed ? 'done' : 'blocked',
            detail: state.disbursed ? 'Funds disbursed and training evidence recorded.' : 'Payout waits for business approval.',
          },
        ]}
        actions={(
          <>
            <button type="button" className="project-soft-btn" disabled={state.biddingOpen} onClick={() => onPatchState({ biddingOpen: true })}>
              <FiUnlock aria-hidden="true" />
              Open bidding
            </button>
            <button type="button" className="project-soft-btn" disabled={!state.biddingOpen || state.studentJoined} onClick={() => onPatchState({ studentJoined: true })}>
              <FiUsers aria-hidden="true" />
              Join team
            </button>
            <button type="button" className="project-soft-btn" disabled={!state.studentJoined || state.fundsReleased} onClick={() => onPatchState({ fundsReleased: true })}>
              <FiCheckCircle aria-hidden="true" />
              Release funds
            </button>
            <button type="button" className="project-soft-btn" disabled={!state.fundsReleased || planningLocked} onClick={() => onPatchState({ backlogReady: true, catchupCreated: true })}>
              <FiRefreshCw aria-hidden="true" />
              Plan backlog + catchup
            </button>
            <button type="button" className="project-primary-btn" disabled={!canActivateMilestone || state.milestoneActive} onClick={() => onPatchState({ milestoneActive: true, scopeLocked: true })}>
              <FiLock aria-hidden="true" />
              Activate milestone
            </button>
            <button type="button" className="project-soft-btn" disabled={!state.milestoneActive || state.submitted} onClick={() => onPatchState({ submitted: true })}>
              <FiSend aria-hidden="true" />
              Submit milestone
            </button>
            <button type="button" className="project-primary-btn" disabled={!state.submitted || state.approved} onClick={() => onPatchState({ approved: true, disbursed: true })}>
              <FiPlayCircle aria-hidden="true" />
              Approve + disburse
            </button>
          </>
        )}
      />

      <section className="project-card project-program-learning">
        <header>
          <h2>Training and business controls</h2>
          <strong>{activeStepId}</strong>
        </header>
        <div>
          {PROJECT_WORKFLOW_MOCK.learningOutcomes.map((outcome) => (
            <p key={outcome}>
              <FiCheckCircle aria-hidden="true" />
              {outcome}
            </p>
          ))}
        </div>
        <p>
          Catchup cadence: <strong>{PROJECT_WORKFLOW_MOCK.catchupCadence}</strong>
        </p>
      </section>
    </section>
  )
}
