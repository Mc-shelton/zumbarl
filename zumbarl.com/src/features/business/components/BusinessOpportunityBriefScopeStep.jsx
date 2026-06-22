import { useState } from 'react'
import { FiCode, FiFileText, FiImage, FiInfo, FiMapPin, FiPlus, FiTrendingUp, FiUploadCloud, FiX } from 'react-icons/fi'
import { BUSINESS_OPPORTUNITY_BRIEF_SELECTS } from '../opportunityBriefCreateData'

const SAMPLE_WORK_FILE_TYPE_OPTIONS = [
  'Any accepted file',
  'Image',
  'Video',
  'PDF',
  'DOCX',
  'Spreadsheet',
  'ZIP',
  'Link',
]

const DELIVERABLE_TYPE_META = {
  'File Asset Deliverables': {
    icon: FiImage,
    label: 'Files, creative assets, source files',
    submissionMethod: 'Direct upload to Zumbarl, max 50MB per file and 10 files per submission.',
    verificationMethod: 'Company review, originality check, and revision tracking.',
    evidenceRequired: 'PNG, JPG, PDF, SVG, MP4, MOV, AI, PSD, Figma link, or Canva link.',
    acceptanceCriteria: 'No watermarks, final files match the brief, and required source files are included.',
  },
  'Code & Development Deliverables': {
    icon: FiCode,
    label: 'Repos, live URLs, ZIP fallback',
    submissionMethod: 'GitHub repository link, deployed live URL, ZIP fallback, and optional Loom walkthrough.',
    verificationMethod: 'Brief checklist, GitHub commit history, and live demo verification.',
    evidenceRequired: 'GitHub repository, live URL, ZIP upload, setup notes, and walkthrough where needed.',
    acceptanceCriteria: 'Work is runnable or deployable and matches the agreed technical scope.',
  },
  'Document Deliverables': {
    icon: FiFileText,
    label: 'Docs, reports, scripts, proposals',
    submissionMethod: 'Google Docs share link, DOCX, or PDF.',
    verificationMethod: 'Word count validation, plagiarism check, AI-content indicator, and edit history review.',
    evidenceRequired: 'Google Docs link, DOCX, PDF, tracked changes, and comments where relevant.',
    acceptanceCriteria: 'Meets word count, authorship, originality, and any AI-use policy defined in the brief.',
  },
  'Stats & Metrics Deliverables': {
    icon: FiTrendingUp,
    label: 'Reach, engagement, growth, leads',
    submissionMethod: 'Before-and-after analytics screenshots or API-verifiable metrics.',
    verificationMethod: 'Baseline comparison, measurement-window check, and API/platform verification where available.',
    evidenceRequired: 'Metric target, baseline, measurement window, measurement method, and accepted evidence format.',
    acceptanceCriteria: 'Metrics are achieved through valid activity with no fake engagement or fraudulent screenshots.',
  },
  'Proof-Based Deliverables': {
    icon: FiMapPin,
    label: 'Physical-world proof and confirmations',
    submissionMethod: 'Geo-tagged photo, GPS check-in, WhatsApp confirmation, or sequential timestamped stages.',
    verificationMethod: 'EXIF validation, GPS proximity check, timestamp review, and recipient confirmation.',
    evidenceRequired: 'Geo-tagged photos, GPS check-ins, WhatsApp confirmations, and sequential stage proof.',
    acceptanceCriteria: 'Proof matches the agreed location, recipient, time, and safety requirements.',
  },
  'Hybrid Deliverables': {
    icon: FiPlus,
    label: 'Combined components and staged escrow',
    submissionMethod: 'Component-specific submission workflows generated from selected deliverable types.',
    verificationMethod: 'Each component is verified using its own rules before staged escrow release.',
    evidenceRequired: 'Required evidence for every selected component, with sequence locks where needed.',
    acceptanceCriteria: 'All component requirements and payment splits are defined before acceptance.',
  },
}

function numberValue(value) {
  return Number(String(value || '').replace(/[^\d.]/g, '')) || 0
}

function toFileMetadata(file) {
  return {
    id: `file-${file.name}-${file.lastModified}`,
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
    lastModified: file.lastModified,
  }
}

function formatFileSize(size = 0) {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  if (size >= 1024) return `${Math.round(size / 1024)} KB`
  return `${size} B`
}

function createSampleWork(index = 0) {
  return {
    id: `sample-work-${Date.now()}-${index}`,
    label: '',
    fileType: SAMPLE_WORK_FILE_TYPE_OPTIONS[0],
    files: [],
  }
}

function createDeliverableMilestone(type = 'File Asset Deliverables', index = 0) {
  const meta = DELIVERABLE_TYPE_META[type]
  return {
    id: `deliverable-${Date.now()}-${index}`,
    title: '',
    workflow: type,
    type,
    description: '',
    submissionMethod: meta.submissionMethod,
    verificationMethod: meta.verificationMethod,
    evidenceRequired: meta.evidenceRequired,
    acceptanceCriteria: meta.acceptanceCriteria,
    sampleWork: [createSampleWork(index)],
    paymentRelease: 'Release after this deliverable is reviewed and approved.',
    budget: '',
    paymentPercent: '',
    isSequential: true,
  }
}

function createProjectMilestone(type = 'Hybrid Deliverables', index = 0) {
  const meta = DELIVERABLE_TYPE_META[type]
  return {
    id: `milestone-${Date.now()}-${index}`,
    title: '',
    type,
    description: '',
    submissionMethod: meta.submissionMethod,
    verificationMethod: meta.verificationMethod,
    evidenceRequired: meta.evidenceRequired,
    acceptanceCriteria: 'Milestone scope is complete, reviewed, and accepted against the agreed brief.',
    sampleWork: [createSampleWork(index)],
    paymentRelease: 'Release after this milestone is reviewed and approved.',
    budget: '',
    paymentPercent: '',
    isSequential: true,
  }
}

function summarizeDeliverables(milestones) {
  return milestones
    .map((milestone, index) => `${index + 1}. ${milestone.title || milestone.type}: ${milestone.description || milestone.submissionMethod}`)
    .join('\n')
}

function summarizeAcceptanceCriteria(milestones) {
  return milestones
    .map((milestone, index) => `${index + 1}. ${milestone.title || milestone.type}: ${milestone.acceptanceCriteria}`)
    .join('\n')
}

function getTotalBudget(milestones) {
  return milestones.reduce((total, milestone) => total + numberValue(milestone.budget), 0)
}

function getTotalPercent(milestones) {
  return milestones.reduce((total, milestone) => total + numberValue(milestone.paymentPercent), 0)
}

function getMilestoneSummary(milestones) {
  return {
    acceptanceCriteria: summarizeAcceptanceCriteria(milestones),
    budget: String(getTotalBudget(milestones).toLocaleString('en-US')),
    deliverables: summarizeDeliverables(milestones),
  }
}

function getScopeItems(form, scopeMode) {
  if (scopeMode === 'milestone') {
    return form.milestoneScopes?.length ? form.milestoneScopes : [createProjectMilestone('Hybrid Deliverables', 0)]
  }

  return form.deliverableMilestones?.length ? form.deliverableMilestones : [createDeliverableMilestone('File Asset Deliverables', 0)]
}

function DeliverableMilestoneCard({ index, milestone, onRemove, onUpdate, scopeMode }) {
  const isMilestoneScope = scopeMode === 'milestone'
  const workflow = milestone.workflow || milestone.type || (isMilestoneScope ? 'Hybrid Deliverables' : 'File Asset Deliverables')
  const meta = DELIVERABLE_TYPE_META[workflow] || DELIVERABLE_TYPE_META['File Asset Deliverables']
  const sampleWorkItems = Array.isArray(milestone.sampleWork) ? milestone.sampleWork : []

  function updateMilestone(field, value) {
    if (field === 'workflow') {
      onUpdate({
        ...milestone,
        workflow: value,
        type: value,
        submissionMethod: meta.submissionMethod === milestone.submissionMethod ? DELIVERABLE_TYPE_META[value].submissionMethod : milestone.submissionMethod,
        verificationMethod: meta.verificationMethod === milestone.verificationMethod ? DELIVERABLE_TYPE_META[value].verificationMethod : milestone.verificationMethod,
        evidenceRequired: meta.evidenceRequired === milestone.evidenceRequired ? DELIVERABLE_TYPE_META[value].evidenceRequired : milestone.evidenceRequired,
        acceptanceCriteria: meta.acceptanceCriteria === milestone.acceptanceCriteria ? DELIVERABLE_TYPE_META[value].acceptanceCriteria : milestone.acceptanceCriteria,
      })
      return
    }

    onUpdate({ ...milestone, [field]: value })
  }

  function updateSampleWork(nextSampleWork) {
    onUpdate({ ...milestone, sampleWork: nextSampleWork })
  }

  function addSampleWork() {
    updateSampleWork([...sampleWorkItems, createSampleWork(sampleWorkItems.length)])
  }

  function updateSampleWorkItem(sampleId, field, value) {
    updateSampleWork(sampleWorkItems.map((sample) => (
      sample.id === sampleId ? { ...sample, [field]: value } : sample
    )))
  }

  function updateSampleFiles(sampleId, files) {
    updateSampleWork(sampleWorkItems.map((sample) => (
      sample.id === sampleId ? { ...sample, files } : sample
    )))
  }

  function removeSampleWork(sampleId) {
    updateSampleWork(sampleWorkItems.filter((sample) => sample.id !== sampleId))
  }

  return (
    <article className="business-create-deliverable-milestone-card">
      <header>
        <div>
          <span>{isMilestoneScope ? 'Milestone' : 'Deliverable'} {index + 1}</span>
          <h4>{milestone.title || (isMilestoneScope ? 'Untitled milestone' : 'Untitled deliverable')}</h4>
        </div>
        <button type="button" aria-label={`Remove stage ${index + 1}`} onClick={onRemove}>
          <FiX aria-hidden="true" />
        </button>
      </header>

      <div className="business-create-deliverable-milestone-grid">
        {!isMilestoneScope ? (
          <div className="business-create-workflow-field">
            <label>
              <span>Deliverable Workflow</span>
              <select value={workflow} onChange={(event) => updateMilestone('workflow', event.target.value)}>
                {BUSINESS_OPPORTUNITY_BRIEF_SELECTS.deliverableType.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
            <p className="business-create-workflow-summary">{meta.evidenceRequired}</p>
          </div>
        ) : null}
        <label>
          <span>Title</span>
          <input
            value={milestone.title}
            placeholder={isMilestoneScope ? 'e.g. Discovery and requirements' : 'e.g. Branded campaign assets'}
            onChange={(event) => updateMilestone('title', event.target.value)}
          />
        </label>
        <label className="is-wide">
          <span>{isMilestoneScope ? 'Milestone Scope' : 'Deliverable Requirement'}</span>
          <textarea
            value={milestone.description}
            placeholder={isMilestoneScope ? 'Describe the phase outcome and what must be complete.' : 'Describe the deliverable output.'}
            onChange={(event) => updateMilestone('description', event.target.value)}
          />
        </label>
        <label>
          <span>Budget (KES)</span>
          <input value={milestone.budget} onChange={(event) => updateMilestone('budget', event.target.value)} />
        </label>
        <label>
          <span>Payment %</span>
          <input value={milestone.paymentPercent} disabled onChange={(event) => updateMilestone('paymentPercent', event.target.value)} />
          <span>recalculates based on total deliverables</span>
        </label>
        <label className="is-wide">
          <span>Acceptance Criteria</span>
          <textarea value={milestone.acceptanceCriteria} onChange={(event) => updateMilestone('acceptanceCriteria', event.target.value)} />
        </label>
        <div className="business-create-sample-work-field">
          <header>
            <div>
              <h5>Sample Deliverables / Work</h5>
              <p>Attach examples, references, templates, or links that show the quality and format expected.</p>
            </div>
            <button type="button" className="business-create-add-question" onClick={addSampleWork}>
              <FiPlus aria-hidden="true" />
              Add sample work
            </button>
          </header>
          <div className="business-create-sample-work-list">
            {sampleWorkItems.map((sample, sampleIndex) => (
              <article key={sample.id} className="business-create-sample-work-row">
                <label>
                  <span>Sample {sampleIndex + 1}</span>
                  <input
                    type="text"
                    value={sample.label}
                    placeholder="e.g. Approved Instagram carousel example"
                    onChange={(event) => updateSampleWorkItem(sample.id, 'label', event.target.value)}
                  />
                </label>
                <label>
                  <span>File type</span>
                  <select
                    value={sample.fileType}
                    onChange={(event) => updateSampleWorkItem(sample.id, 'fileType', event.target.value)}
                  >
                    {SAMPLE_WORK_FILE_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="business-create-sample-upload">
                  <span>Upload</span>
                  <div>
                    <FiUploadCloud aria-hidden="true" />
                    <strong>{sample.files?.length ? `${sample.files.length} file${sample.files.length === 1 ? '' : 's'}` : 'Browse files'}</strong>
                  </div>
                  <input
                    multiple
                    type="file"
                    onChange={(event) => updateSampleFiles(sample.id, Array.from(event.target.files || []).map(toFileMetadata))}
                  />
                </label>
                <button
                  type="button"
                  aria-label={`Remove sample work ${sampleIndex + 1}`}
                  onClick={() => removeSampleWork(sample.id)}
                >
                  <FiX aria-hidden="true" />
                </button>
                {sample.files?.length ? (
                  <p className="business-create-sample-file-list">
                    {sample.files.map((file) => `${file.name} (${formatFileSize(file.size)})`).join(', ')}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
          {!sampleWorkItems.length ? (
            <p className="business-create-sample-work-empty">No sample work added yet. Add one if creators need a reference before they start.</p>
          ) : null}
        </div>
        <label className="business-create-deliverable-lock">
          <input
            type="checkbox"
            checked={milestone.isSequential}
            onChange={(event) => updateMilestone('isSequential', event.target.checked)}
          />
          <span>Lock later {isMilestoneScope ? 'milestones' : 'deliverable submissions'} until this {isMilestoneScope ? 'milestone' : 'deliverable'} is approved</span>
        </label>
      </div>
    </article>
  )
}

function syncMilestoneFields(onUpdateField, scopeMode, milestones) {
  const summary = getMilestoneSummary(milestones)
  onUpdateField('scopeMode', scopeMode)
  onUpdateField(scopeMode === 'milestone' ? 'milestoneScopes' : 'deliverableMilestones', milestones)
  onUpdateField('deliverables', summary.deliverables)
  onUpdateField('acceptanceCriteria', summary.acceptanceCriteria)
  onUpdateField('budget', summary.budget)
}

export function BusinessOpportunityBriefScopeStep({ form, onUpdateField }) {
  const [activeScopeMode, setActiveScopeMode] = useState(form.scopeMode || 'deliverable')
  const isMilestoneScope = activeScopeMode === 'milestone'
  const milestones = getScopeItems(form, activeScopeMode)
  const totalBudget = getTotalBudget(milestones)
  const totalPercent = getTotalPercent(milestones)

  function changeScopeMode(scopeMode) {
    const nextMilestones = getScopeItems(form, scopeMode)
    setActiveScopeMode(scopeMode)
    syncMilestoneFields(onUpdateField, scopeMode, nextMilestones)
  }

  function addMilestone(type = isMilestoneScope ? 'Hybrid Deliverables' : 'File Asset Deliverables') {
    const nextMilestone = isMilestoneScope
      ? createProjectMilestone(type, milestones.length)
      : createDeliverableMilestone(type, milestones.length)
    syncMilestoneFields(onUpdateField, activeScopeMode, [...milestones, nextMilestone])
  }

  function updateMilestone(index, nextMilestone) {
    syncMilestoneFields(onUpdateField, activeScopeMode, milestones.map((milestone, itemIndex) => (itemIndex === index ? nextMilestone : milestone)))
  }

  function removeMilestone(index) {
    const nextMilestones = milestones.filter((_, itemIndex) => itemIndex !== index)
    const fallback = isMilestoneScope ? [createProjectMilestone('Hybrid Deliverables', 0)] : [createDeliverableMilestone('File Asset Deliverables', 0)]
    syncMilestoneFields(onUpdateField, activeScopeMode, nextMilestones.length ? nextMilestones : fallback)
  }

  return (
    <>
      <section className="business-create-scope-tabs" aria-label="Scope type">
        <button
          type="button"
          className={!isMilestoneScope ? 'is-active' : ''}
          onClick={() => changeScopeMode('deliverable')}
        >
          <strong>Deliverable Scope</strong>
        </button>
        <button
          type="button"
          className={isMilestoneScope ? 'is-active' : ''}
          onClick={() => changeScopeMode('milestone')}
        >
          <strong>Milestone Scope</strong>
        </button>
      </section>

      {!isMilestoneScope ? (
        <section className="business-create-budget-card business-create-deliverable-builder-card">
          <h3>Deliverables</h3>
          <p>Add the deliverables first. Choose the workflow inside each deliverable to customize submission, evidence, verification, and payment release rules.</p>
        </section>
      ) : null}

      <section className="business-create-budget-card">
        <header className="business-create-deliverable-builder-head">
          <div>
            <h3>{isMilestoneScope ? 'Project Milestones & Budget' : 'Deliverables & Budget'}</h3>
            <p>
              {isMilestoneScope
                ? 'Define phase-level milestones with their own budget, submission method, evidence, and release logic.'
                : 'Each deliverable has its own workflow, budget, evidence, acceptance criteria, and release logic.'}
            </p>
          </div>
          <button type="button" className="business-profile-ghost-btn" onClick={() => addMilestone()}>
            <FiPlus aria-hidden="true" />
            Add {isMilestoneScope ? 'project milestone' : 'deliverable'}
          </button>
        </header>
        <div className="business-create-deliverable-milestone-list">
          {milestones.map((milestone, index) => (
            <DeliverableMilestoneCard
              key={milestone.id}
              index={index}
              milestone={milestone}
              onRemove={() => removeMilestone(index)}
              onUpdate={(nextMilestone) => updateMilestone(index, nextMilestone)}
              scopeMode={activeScopeMode}
            />
          ))}
        </div>
        <div className="business-create-deliverable-totals">
          <article>
            <span>Total Budget</span>
            <strong>KES {totalBudget.toLocaleString('en-US')}</strong>
          </article>
          <article className={totalPercent === 100 ? 'is-balanced' : 'is-warning'}>
            <span>Payment Split</span>
            <strong>{totalPercent}%</strong>
            <em>{totalPercent === 100 ? 'Balanced' : 'Should total 100%'}</em>
          </article>
          <article>
            <span>{isMilestoneScope ? 'Milestones' : 'Deliverables'}</span>
            <strong>{milestones.length}</strong>
          </article>
        </div>
      </section>

      <section className="business-create-budget-card">
        <h3>Timeline & Terms</h3>
        <p>Set the overall commercial scope for the opportunity.</p>
        <div className="business-create-budget-grid">
          <aside className="business-create-budget-info">
            <FiInfo aria-hidden="true" />
            <div>
              <strong>The brief is the contract</strong>
              <p>No new deliverables/milstones can be added after acceptance. Any addition should become a new scoped requirement in a different budget.</p>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
