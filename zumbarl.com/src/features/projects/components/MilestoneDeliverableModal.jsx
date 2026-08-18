import { useState } from 'react'
import { FiX } from 'react-icons/fi'

// Mirrors how deliverables are defined when creating an opportunity brief, minus
// the money: a milestone already carries the budget, so a deliverable beneath it
// only needs to say what is being delivered, how it is submitted and what counts
// as done. Presets fill the boilerplate so a team is not writing it from scratch.
const DELIVERABLE_WORKFLOWS = {
  'File Asset Deliverables': {
    label: 'Files, creative assets, source files',
    submissionMethod: 'Direct upload to Zumbarl, max 50MB per file and 10 files per submission.',
    evidenceRequired: 'PNG, JPG, PDF, SVG, MP4, MOV, AI, PSD, Figma link, or Canva link.',
    acceptanceCriteria: 'No watermarks, final files match the brief, and required source files are included.',
  },
  'Code & Technical Deliverables': {
    label: 'Repositories, deployments, technical builds',
    submissionMethod: 'GitHub repository link, deployed live URL, ZIP fallback, and optional Loom walkthrough.',
    evidenceRequired: 'GitHub repository, live URL, ZIP upload, setup notes, and walkthrough where needed.',
    acceptanceCriteria: 'Work is runnable or deployable and matches the agreed technical scope.',
  },
  'Written Deliverables': {
    label: 'Documents, copy, research, reports',
    submissionMethod: 'Google Docs share link, DOCX, or PDF.',
    evidenceRequired: 'Google Docs link, DOCX, PDF, tracked changes, and comments where relevant.',
    acceptanceCriteria: 'Meets word count, authorship, originality, and any AI-use policy defined in the brief.',
  },
  'Metric Deliverables': {
    label: 'Growth, reach, measurable outcomes',
    submissionMethod: 'Before-and-after analytics screenshots or API-verifiable metrics.',
    evidenceRequired: 'Metric target, baseline, measurement window, measurement method, and accepted evidence format.',
    acceptanceCriteria: 'Metrics are achieved through valid activity with no fake engagement or fraudulent screenshots.',
  },
  'Field & Activation Deliverables': {
    label: 'On-ground activations, campus presence',
    submissionMethod: 'Geo-tagged photo, GPS check-in, WhatsApp confirmation, or sequential timestamped stages.',
    evidenceRequired: 'Geo-tagged photos, GPS check-ins, WhatsApp confirmations, and sequential stage proof.',
    acceptanceCriteria: 'Evidence is time-stamped, location-verified, and matches the agreed activation plan.',
  },
}

const EMPTY_FORM = {
  title: '',
  budgetAmount: '',
  workflow: '',
  description: '',
  requirement: '',
  submissionMethod: '',
  evidenceRequired: '',
  acceptanceCriteria: '',
  startsAt: '',
  dueAt: '',
}

function MilestoneDeliverableModal({ initial = null, isPending, milestone, onClose, onSave }) {
  const remaining = Number.isFinite(Number(milestone?.budget?.remaining))
    ? Number(milestone.budget.remaining)
    : null
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, ...(initial || {}) }))

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  // Choosing a workflow fills the boilerplate, but only where the author has not
  // already written their own.
  function applyWorkflow(workflow) {
    const preset = DELIVERABLE_WORKFLOWS[workflow]
    setForm((current) => ({
      ...current,
      workflow,
      submissionMethod: current.submissionMethod || preset?.submissionMethod || '',
      evidenceRequired: current.evidenceRequired || preset?.evidenceRequired || '',
      acceptanceCriteria: current.acceptanceCriteria || preset?.acceptanceCriteria || '',
    }))
  }

  function submit(event) {
    event.preventDefault()
    if (!form.title.trim()) return
    onSave({
      ...form,
      title: form.title.trim(),
      budgetAmount: Number(form.budgetAmount) || 0,
      startsAt: form.startsAt || undefined,
      dueAt: form.dueAt || undefined,
    })
  }

  return (
    <div className="deliverable-modal-backdrop" role="presentation">
      <section
        className="deliverable-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="milestone-deliverable-title"
      >
        <header>
          <div>
            <h2 id="milestone-deliverable-title">{initial ? 'Edit deliverable' : 'Add deliverable'}</h2>
            <p>{milestone ? `Under ${milestone.title}` : 'Define what the team will deliver.'}</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose}><FiX aria-hidden="true" /></button>
        </header>

        <form className="deliverable-modal-body" onSubmit={submit}>
          <label className="is-wide">
            <span>Deliverable name *</span>
            <input
              type="text"
              value={form.title}
              placeholder="e.g. Brand book"
              onChange={(event) => setField('title', event.target.value)}
            />
          </label>

          <label>
            <span>Price (KES)</span>
            <input
              type="number"
              min="0"
              value={form.budgetAmount}
              placeholder="0"
              onChange={(event) => setField('budgetAmount', event.target.value)}
            />
            <em className="deliverable-modal-hint">
              {remaining !== null
                ? `${remaining.toLocaleString()} left of this milestone's budget`
                : 'Drawn from the milestone budget'}
            </em>
          </label>

          <label>
            <span>Type of work</span>
            <select value={form.workflow} onChange={(event) => applyWorkflow(event.target.value)}>
              <option value="">Choose a type to prefill the rules</option>
              {Object.entries(DELIVERABLE_WORKFLOWS).map(([key, meta]) => (
                <option key={key} value={key}>{key} — {meta.label}</option>
              ))}
            </select>
          </label>

          <label className="is-wide">
            <span>What is being delivered</span>
            <textarea
              rows={2}
              value={form.description}
              placeholder="Describe the deliverable in a sentence or two"
              onChange={(event) => setField('description', event.target.value)}
            />
          </label>

          <label className="is-wide">
            <span>Requirements</span>
            <textarea
              rows={2}
              value={form.requirement}
              placeholder="What must be included for this to be complete"
              onChange={(event) => setField('requirement', event.target.value)}
            />
          </label>

          <label className="is-wide">
            <span>How it is submitted</span>
            <textarea
              rows={2}
              value={form.submissionMethod}
              onChange={(event) => setField('submissionMethod', event.target.value)}
            />
          </label>

          <label className="is-wide">
            <span>Evidence required</span>
            <textarea
              rows={2}
              value={form.evidenceRequired}
              onChange={(event) => setField('evidenceRequired', event.target.value)}
            />
          </label>

          <label className="is-wide">
            <span>Acceptance criteria</span>
            <textarea
              rows={2}
              value={form.acceptanceCriteria}
              placeholder="What the business will check before approving"
              onChange={(event) => setField('acceptanceCriteria', event.target.value)}
            />
          </label>

          <label>
            <span>Starts</span>
            <input type="date" value={form.startsAt} onChange={(event) => setField('startsAt', event.target.value)} />
          </label>

          <label>
            <span>Due</span>
            <input type="date" value={form.dueAt} onChange={(event) => setField('dueAt', event.target.value)} />
          </label>

          <footer>
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" className="project-primary-btn" disabled={isPending || !form.title.trim()}>
              {initial ? 'Save deliverable' : 'Add deliverable'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default MilestoneDeliverableModal
