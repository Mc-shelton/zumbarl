import { useState } from 'react'
import { FiArrowUpRight, FiBriefcase, FiCheck, FiCompass, FiLock, FiShield, FiTarget, FiTrendingUp } from 'react-icons/fi'

function formatKes(value) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function formatGate(gate) {
  if (gate.key === 'averageQuality') return `${Number(gate.current || 0).toFixed(1)}${gate.unit}`
  return `${Math.round(Number(gate.current || 0))}${gate.unit === '%' ? '%' : gate.unit ? ` ${gate.unit}` : ''}`
}

function CareerProgressionPanel({ isOwnProfile = false, onModeChange, progression = null }) {
  const [savingMode, setSavingMode] = useState('')
  const [modeError, setModeError] = useState('')

  if (!progression) return null

  async function chooseMode(mode) {
    if (!isOwnProfile || savingMode || mode === progression.mode) return
    setSavingMode(mode)
    setModeError('')
    try {
      await onModeChange(mode)
    } catch (error) {
      setModeError(error?.message || 'Your focus could not be updated.')
    } finally {
      setSavingMode('')
    }
  }

  const currentStage = progression.careerStage
  const leadingSkills = (progression.skills || []).slice(0, 3)
  const trust = progression.trust || {}

  return (
    <section className="campus-profile-surface career-progression-panel">
      <header className="career-progression-head">
        <div>
          <span className="career-progression-eyebrow"><FiTrendingUp aria-hidden="true" /> Measurable career progress</span>
          <h2>{isOwnProfile ? 'Turn every verified gig into career progress' : 'Evidence-backed career progression'}</h2>
          <p>{isOwnProfile ? 'Choose what you want Zumbarl to optimise for. You keep control of every application and final price.' : 'Levels come from completed work, client diversity, delivery quality, and confidence—not self-declared badges.'}</p>
        </div>
        <div className="career-stage-badge">
          <small>Career stage {currentStage?.number || 1} of 5</small>
          <strong>{currentStage?.label || 'Explore & Foundation'}</strong>
          <span>{currentStage?.progressPercent || 0}% complete</span>
        </div>
      </header>

      <div className="career-stage-track" aria-label="Career stage progress">
        {(progression.stages || []).map((stage) => (
          <div className={`career-stage-step is-${String(stage.status).toLowerCase()}`} key={stage.key} aria-current={stage.isCurrent ? 'step' : undefined}>
            <span>{stage.status === 'COMPLETED' ? <FiCheck aria-hidden="true" /> : stage.status === 'LOCKED' ? <FiLock aria-hidden="true" /> : stage.number}</span>
            <div><strong>{stage.shortLabel}</strong><small>{stage.status === 'IN_PROGRESS' ? `${stage.progressPercent}%` : String(stage.status).toLowerCase()}</small></div>
          </div>
        ))}
      </div>

      <div className="career-progression-grid">
        <section className="career-focus-card">
          <div className="career-card-title"><FiCompass aria-hidden="true" /><div><h3>{isOwnProfile ? 'What do you want right now?' : 'Current focus'}</h3><p>{progression.modeDetails?.matchingFocus}</p></div></div>
          {isOwnProfile ? (
            <div className="career-mode-options">
              {(progression.availableModes || []).map((mode) => (
                <button className={mode.key === progression.mode ? 'is-selected' : ''} disabled={Boolean(savingMode)} key={mode.key} onClick={() => chooseMode(mode.key)} type="button">
                  <span>{mode.key === progression.mode ? <FiCheck aria-hidden="true" /> : null}{mode.label}</span>
                  <small>{mode.description}</small>
                  {savingMode === mode.key ? <em>Saving…</em> : null}
                </button>
              ))}
            </div>
          ) : (
            <div className="career-public-focus"><strong>{progression.modeDetails?.label}</strong><p>{progression.modeDetails?.description}</p></div>
          )}
          {modeError ? <p className="career-progression-error" role="alert">{modeError}</p> : null}
        </section>

        <section className="career-trust-proof">
          <div className="career-card-title"><FiShield aria-hidden="true" /><div><h3>Why businesses can trust this</h3><p>{trust.explanation}</p></div></div>
          <div className="career-trust-metrics">
            <div><strong>{trust.verifiedGigs || 0}</strong><span>verified gigs</span></div>
            <div><strong>{trust.uniqueClients || 0}</strong><span>distinct clients</span></div>
            <div><strong>{trust.reliability || 0}%</strong><span>reliability</span></div>
            <div><strong>{trust.endorsements || 0}</strong><span>endorsements</span></div>
          </div>
          <p className="career-confidence-line"><span className={`is-${String(trust.confidence || 'provisional').toLowerCase()}`}>{String(trust.confidence || 'provisional').toLowerCase()} confidence</span>{trust.publicScore == null ? 'Public score unlocks after enough diverse evidence.' : `${Math.round(trust.publicScore)}/100 · ${String(trust.tier).toLowerCase()} trust tier`}</p>
        </section>
      </div>

      <section className="career-skill-progress">
        <header><div><h3><FiTarget aria-hidden="true" /> Skill advancement</h3><p>Each level has visible evidence gates. Recommended rates are guidance and remain editable.</p></div></header>
        {leadingSkills.length ? <div className="career-skill-cards">{leadingSkills.map((skill) => (
          <article key={skill.key}>
            <header><div><small>Level {skill.levelNumber}</small><h4>{skill.name}</h4></div><span>{String(skill.level).toLowerCase()}</span></header>
            <div className="career-skill-progress-line"><span style={{ width: `${skill.progressPercent}%` }} /></div>
            <p>{skill.eligibleForReview ? 'Eligible for supervised expert review' : skill.nextLevel ? `${skill.progressPercent}% toward ${String(skill.nextLevel).toLowerCase()}${skill.requiresReview ? ' · review required' : ''}` : 'Highest verified level reached'}</p>
            <div className="career-skill-gates">{(skill.gates || []).slice(0, 4).map((gate) => <span className={gate.met ? 'is-met' : ''} key={gate.key}>{gate.met ? <FiCheck aria-hidden="true" /> : null}{gate.label} · {formatGate(gate)}/{gate.target}{gate.unit === '%' ? '%' : ''}</span>)}</div>
            <footer><div><small>Recommended range</small><strong>{formatKes(skill.recommendedRate?.minimum)}–{formatKes(skill.recommendedRate?.maximum)}</strong></div><span>advisory</span></footer>
          </article>
        ))}</div> : <div className="career-empty-skills"><FiBriefcase aria-hidden="true" /><div><strong>No target skills yet</strong><p>Add a skill to start measuring verified progress and earning guidance.</p></div></div>}
      </section>

      {isOwnProfile && progression.recommendations?.length ? <footer className="career-next-actions"><div><FiArrowUpRight aria-hidden="true" /><span><strong>Your next best moves</strong><small>These update as new evidence is verified.</small></span></div><ul>{progression.recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}</ul></footer> : null}
    </section>
  )
}

export default CareerProgressionPanel
