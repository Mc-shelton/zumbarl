import { useEffect, useState } from 'react'
import { readProjectSettings, updateProjectSettings } from '../../projects/services/projectSettingsService'

// Non-earning roles keep a configurable share of what their own work earned;
// whatever they give up is redistributed across the paying contributors. The
// workload record itself never changes - an intern's contribution still counts
// and still shows on their record, the policy only decides what it converts into.
const CONTRIBUTOR_ROLES = [
  {
    id: 'intern',
    label: 'Interns',
    allowKey: 'allowInterns',
    hint: 'Joins a longer training track with mentorship and review cycles.',
  },
  {
    id: 'attachee',
    label: 'Attachees',
    allowKey: 'allowAttachees',
    hint: 'Joins for supervised industry exposure with logs and completion evidence.',
  },
]

function BusinessProjectSettingsPanel({ projectId }) {
  const [settings, setSettings] = useState(null)
  const [status, setStatus] = useState({ error: '', notice: '', saving: false })

  useEffect(() => {
    if (!projectId) return undefined

    let isCurrent = true
    readProjectSettings(projectId)
      .then((response) => { if (isCurrent) setSettings(response) })
      .catch((error) => {
        if (isCurrent) setStatus((current) => ({ ...current, error: error?.message || 'Could not load project settings.' }))
      })

    return () => { isCurrent = false }
  }, [projectId])

  if (!projectId) {
    return <p className="business-review-empty-note">Project settings appear once this opportunity is awarded.</p>
  }
  if (status.error && !settings) {
    return <p className="business-review-empty-note is-error" role="alert">{status.error}</p>
  }
  if (!settings) return <p className="business-review-empty-note">Loading project settings…</p>

  const factors = settings.roleEarningFactors || {}

  async function save(patch) {
    setStatus({ error: '', notice: '', saving: true })
    try {
      const next = await updateProjectSettings(projectId, patch)
      setSettings(next)
      setStatus({ error: '', notice: 'Settings saved.', saving: false })
    } catch (error) {
      setStatus({ error: error?.message || 'Could not save settings.', notice: '', saving: false })
    }
  }

  return (
    <section className="business-project-settings">
      <header>
        <h3>Contributor roles</h3>
        <p>
          Choose who can join this project beyond paid contributors, and what share of their own
          work each role earns. Anything a role gives up is shared out across the paying
          contributors — it is never lost from the budget.
        </p>
      </header>

      {status.error ? <p className="business-review-capacity-error" role="alert">{status.error}</p> : null}
      {status.notice ? <p className="business-review-capacity-notice" role="status">{status.notice}</p> : null}

      <ul className="business-project-settings-roles">
        {CONTRIBUTOR_ROLES.map((role) => {
          const isAllowed = Boolean(settings[role.allowKey])
          const factor = Number.isFinite(Number(factors[role.id])) ? Number(factors[role.id]) : 100

          return (
            <li key={role.id}>
              <div className="business-project-settings-role-head">
                <label>
                  <input
                    type="checkbox"
                    checked={isAllowed}
                    disabled={status.saving}
                    onChange={(event) => save({ [role.allowKey]: event.target.checked })}
                  />
                  <span>
                    <strong>Allow {role.label.toLowerCase()}</strong>
                    <em>{role.hint}</em>
                  </span>
                </label>
              </div>

              {isAllowed ? (
                <div className="business-project-settings-factor">
                  <label htmlFor={`factor-${role.id}`}>
                    {role.label} earn <strong>{factor}%</strong> of what their work would earn
                  </label>
                  <input
                    id={`factor-${role.id}`}
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={factor}
                    disabled={status.saving}
                    onChange={(event) => setSettings((current) => ({
                      ...current,
                      roleEarningFactors: { ...factors, [role.id]: Number(event.target.value) },
                    }))}
                    onMouseUp={(event) => save({ roleEarningFactors: { ...factors, [role.id]: Number(event.target.value) } })}
                    onTouchEnd={(event) => save({ roleEarningFactors: { ...factors, [role.id]: Number(event.target.value) } })}
                  />
                  <p>
                    {factor === 0
                      ? `${role.label} earn nothing here. Their full contribution is shared across the paying contributors, and still counts on their own record.`
                      : factor === 100
                        ? `${role.label} earn the same as any paid contributor.`
                        : `${role.label} keep ${factor}% of their earned share; the other ${100 - factor}% goes to the paying contributors.`}
                  </p>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default BusinessProjectSettingsPanel
