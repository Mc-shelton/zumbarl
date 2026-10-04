import { useEffect, useMemo, useRef, useState } from 'react'
import { FiArrowLeft, FiArrowRight, FiBookOpen, FiCheck, FiPlus, FiSearch, FiX } from 'react-icons/fi'
import { createProfileSkill, searchProfileSkills } from '../../profile/services/profileSkillService'
import { searchLearningPaths } from '../services/learnService'

const INTENTS = [
  ['earn-while-learning', 'Earn while learning'],
  ['explore', 'Explore this career'],
  ['attachment-readiness', 'Prepare for attachment'],
  ['internship-readiness', 'Prepare for internship'],
  ['job-readiness', 'Prepare for a job'],
]

function sameName(left, right) {
  return String(left || '').trim().toLowerCase() === String(right || '').trim().toLowerCase()
}

function LearningPathBuilder({ initialRoadmapId = '', enrolledRoadmapIds, saving, actionError, onClose, onCreate, onJoin }) {
  const initialSelectionApplied = useRef('')
  const [step, setStep] = useState('choose')
  const [query, setQuery] = useState('')
  const [paths, setPaths] = useState([])
  const [selectedPath, setSelectedPath] = useState(null)
  const [intent, setIntent] = useState('earn-while-learning')
  const [description, setDescription] = useState('')
  const [estimatedWeeks, setEstimatedWeeks] = useState(8)
  const [skillQuery, setSkillQuery] = useState('')
  const [skillResults, setSkillResults] = useState([])
  const [selectedSkills, setSelectedSkills] = useState([])
  const [searching, setSearching] = useState(false)
  const [pathSearchError, setPathSearchError] = useState('')
  const [skillError, setSkillError] = useState('')
  const [showingPopularSkills, setShowingPopularSkills] = useState(false)
  const [creatingSkill, setCreatingSkill] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape' && !saving) onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose, saving])

  useEffect(() => {
    let active = true
    const timeout = setTimeout(() => {
      setSearching(true)
      setPathSearchError('')
      searchLearningPaths(query.trim())
        .then((items) => {
          if (!active) return
          setPaths(items)
          if (initialRoadmapId && initialSelectionApplied.current !== initialRoadmapId) {
            const initialPath = items.find((path) => path.id === initialRoadmapId || path.slug === initialRoadmapId)
            if (initialPath) {
              initialSelectionApplied.current = initialRoadmapId
              if (!enrolledRoadmapIds.has(initialPath.id)) setSelectedPath(initialPath)
            }
          }
        })
        .catch((error) => { if (active) { setPaths([]); setPathSearchError(error.message || 'Paths could not be loaded.') } })
        .finally(() => { if (active) setSearching(false) })
    }, 180)
    return () => { active = false; clearTimeout(timeout) }
  }, [enrolledRoadmapIds, initialRoadmapId, query])

  const skillSearchTerm = skillQuery.trim() || (step === 'details' ? query.trim() : '')
  useEffect(() => {
    if (step !== 'details') return undefined
    let active = true
    const timeout = setTimeout(() => {
      setSkillError('')
      searchProfileSkills(skillSearchTerm)
        .then(async (payload) => {
          let items = payload?.data || []
          let isPopularFallback = false
          if (!items.length && !skillQuery.trim()) {
            items = (await searchProfileSkills(''))?.data || []
            isPopularFallback = true
          }
          if (active) { setSkillResults(items); setShowingPopularSkills(isPopularFallback) }
        })
        .catch((error) => { if (active) { setSkillResults([]); setSkillError(error.message || 'Skills could not be loaded.') } })
    }, 180)
    return () => { active = false; clearTimeout(timeout) }
  }, [skillQuery, skillSearchTerm, step])

  const trimmedQuery = query.trim()
  const exactPath = paths.some((path) => sameName(path.title, trimmedQuery))
  const exactSkill = skillResults.some((skill) => sameName(skill.name, skillQuery))
  const selectedIds = useMemo(() => new Set(selectedSkills.map((skill) => skill.id)), [selectedSkills])
  const visibleSkills = skillResults.filter((skill) => !selectedIds.has(skill.id)).slice(0, 8)

  const addSkill = (skill) => {
    setSelectedSkills((current) => current.some((item) => item.id === skill.id) ? current : [...current, skill])
    setSkillQuery('')
    setSkillError('')
  }

  const createSkill = async () => {
    if (skillQuery.trim().length < 2 || creatingSkill) return
    setCreatingSkill(true)
    setSkillError('')
    try {
      addSkill(await createProfileSkill(skillQuery.trim()))
    } catch (error) {
      setSkillError(error.message)
    } finally {
      setCreatingSkill(false)
    }
  }

  const handleSkillKeyDown = (event) => {
    if (event.key !== 'Enter' || skillQuery.trim().length < 2) return
    event.preventDefault()
    const existingSkill = skillResults.find((skill) => sameName(skill.name, skillQuery))
    if (existingSkill) addSkill(existingSkill)
    else createSkill()
  }

  const joinPath = async () => {
    setSubmitted(true)
    await onJoin(selectedPath.id, intent)
  }

  const createPath = async () => {
    setSubmitted(true)
    await onCreate({
      title: trimmedQuery,
      description: description.trim() || undefined,
      estimatedWeeks,
      skillIds: selectedSkills.map((skill) => skill.id),
      outcomes: [],
      intent,
    })
  }

  const startCreation = () => {
    setSelectedPath(null)
    setSubmitted(false)
    setStep('details')
  }

  return <div className="learning-path-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose() }}>
    <section className={`learning-path-modal is-${step}`} role="dialog" aria-modal="true" aria-labelledby="new-path-heading">
      <header className="learning-path-modal-header">
        <span className="learning-path-brand" aria-hidden="true"><img src="/assets/index/bee_nobg.png" alt="" /></span>
        <div><span className="learn-eyebrow">Student-owned learning</span><h2 id="new-path-heading">{step === 'choose' ? 'Add a learning path' : `Create ${trimmedQuery}`}</h2><p>{step === 'choose' ? 'Find an existing path or create one, then make the journey yours.' : 'Set the first skills and pace. You can customize both later without changing anyone else’s path.'}</p></div>
        <button type="button" onClick={onClose} disabled={saving} aria-label="Close"><FiX /></button>
      </header>

      <div className="learning-path-modal-body">
      <ol className="learning-path-steps" aria-label="Path setup progress">
        <li className="is-active"><span>{step === 'details' ? <FiCheck /> : 1}</span><strong>Choose a path</strong></li>
        <li className={step === 'details' ? 'is-active' : ''}><span>2</span><strong>Customize and join</strong></li>
      </ol>

      {step === 'choose' ? <>
        <label className="learning-path-search"><span>What do you want to learn or become?</span><div><FiSearch /><input autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setSelectedPath(null); setSubmitted(false) }} placeholder="Try product design, bookkeeping, video editing…" /></div></label>

        <div className="learning-path-catalog-heading"><div><strong>{trimmedQuery ? 'Matching paths' : 'Popular paths'}</strong><small>{trimmedQuery ? 'Choose the closest fit or create your own.' : 'Start typing to narrow the catalogue.'}</small></div>{searching && <span>Searching…</span>}</div>
        <div className="learning-path-results" aria-live="polite">
          {!searching && paths.slice(0, 6).map((path) => {
            const enrolled = enrolledRoadmapIds.has(path.id)
            return <button key={path.id} type="button" className={selectedPath?.id === path.id ? 'is-selected' : ''} onClick={() => !enrolled && setSelectedPath(path)} disabled={enrolled}>
              <span className="learning-path-result-icon"><FiBookOpen /></span><span><strong>{path.title}</strong><small>{path.summary || 'A flexible path you can customize after joining.'}</small><em>{path.skills.slice(0, 4).join(' · ') || 'Add your own skills after joining'}</em></span>{enrolled ? <b>Joined</b> : selectedPath?.id === path.id ? <FiCheck /> : <FiArrowRight />}
            </button>
          })}
          {!searching && !paths.length && !pathSearchError && <div className="learning-path-no-results"><FiSearch /><strong>No existing path matches yet</strong><span>You can create it and make it your own.</span></div>}
        </div>
        {pathSearchError && <p className="learn-inline-error" role="alert">{pathSearchError}</p>}

        {selectedPath && <div className="learning-path-join-review">
          <div><span className="learn-eyebrow">Ready to join</span><h3>{selectedPath.title}</h3><p>{selectedPath.summary}</p></div>
          <label className="learning-path-intent"><span>My goal for this path</span><select value={intent} onChange={(event) => setIntent(event.target.value)}>{INTENTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          {submitted && actionError && <p className="learn-inline-error" role="alert">{actionError}</p>}
          <div className="learning-path-modal-actions"><button type="button" className="learn-secondary-btn" onClick={() => setSelectedPath(null)} disabled={saving}>Choose another</button><button type="button" className="learn-primary-btn" disabled={saving} onClick={joinPath}>{saving ? 'Adding path…' : `Join ${selectedPath.title}`}<FiArrowRight /></button></div>
        </div>}

        {!selectedPath && trimmedQuery.length >= 3 && !exactPath && <button type="button" className="learning-path-create-prompt" onClick={startCreation}><span><FiPlus /></span><span><small>Not seeing the right path?</small><strong>Create “{trimmedQuery}”</strong><em>You decide its skills and weekly pace.</em></span><FiArrowRight /></button>}
      </> : <div className="learning-path-create">
        <button type="button" className="learning-path-back" onClick={() => setStep('choose')} disabled={saving}><FiArrowLeft />Back to results</button>

        <section className="learning-path-skill-builder" aria-labelledby="starting-skills-heading">
          <div className="learning-path-section-heading"><span className="learning-path-section-number">1</span><div><h3 id="starting-skills-heading">Choose your starting skills</h3><p>Resources and work opportunities will be matched to these skills.</p></div></div>
          {selectedSkills.length > 0 && <div className="learning-path-selected-skills">{selectedSkills.map((skill) => <button key={skill.id} type="button" onClick={() => setSelectedSkills((current) => current.filter((item) => item.id !== skill.id))} aria-label={`Remove ${skill.name}`}>{skill.name}<FiX /></button>)}</div>}
          <div className="learning-path-skill-search"><FiSearch /><input autoFocus value={skillQuery} onChange={(event) => setSkillQuery(event.target.value)} onKeyDown={handleSkillKeyDown} placeholder="Search for a skill, or type a new one" /></div>
          <div className="learning-path-suggestions-label"><span>{skillQuery.trim() ? 'Search results' : showingPopularSkills ? 'Popular skills' : `Suggested for ${trimmedQuery}`}</span><small>{selectedSkills.length}/20 selected</small></div>
          <div className="learning-path-skill-results">
            {visibleSkills.map((skill) => <button key={skill.id} type="button" onClick={() => addSkill(skill)} disabled={selectedSkills.length >= 20}><FiPlus />{skill.name}</button>)}
            {skillQuery.trim().length >= 2 && !exactSkill && <button type="button" onClick={createSkill} disabled={creatingSkill || selectedSkills.length >= 20}><FiPlus />{creatingSkill ? 'Creating skill…' : `Create “${skillQuery.trim()}”`}</button>}
            {!visibleSkills.length && !skillQuery.trim() && <p>Search for the first skill you want to practise.</p>}
          </div>
          {skillError && <p className="learn-inline-error" role="alert">{skillError}</p>}
        </section>

        <section className="learning-path-details" aria-labelledby="path-details-heading">
          <div className="learning-path-section-heading"><span className="learning-path-section-number">2</span><div><h3 id="path-details-heading">Set your direction</h3><p>Give the path enough context to make its recommendations useful.</p></div></div>
          <label className="learning-path-wide-field"><span>What do you want to be able to do? <small>Optional</small></span><textarea value={description} maxLength={600} onChange={(event) => setDescription(event.target.value)} placeholder={`For example: Build real ${trimmedQuery} projects and prepare for paid work.`} /></label>
          <div className="learning-path-field-grid">
            <label><span>My goal</span><select value={intent} onChange={(event) => setIntent(event.target.value)}>{INTENTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label><span>Target duration</span><select value={estimatedWeeks} onChange={(event) => setEstimatedWeeks(Number(event.target.value))}>{[4, 6, 8, 12, 16, 24].map((weeks) => <option key={weeks} value={weeks}>{weeks} weeks</option>)}</select></label>
          </div>
        </section>

        <div className="learning-path-create-summary"><div><small>You’re creating</small><strong>{trimmedQuery}</strong><span>{selectedSkills.length} {selectedSkills.length === 1 ? 'skill' : 'skills'} · {estimatedWeeks} weeks · {INTENTS.find(([value]) => value === intent)?.[1]}</span></div><p>Only the reusable path is shared. Your skills, schedule, resources, and progress stay personal.</p></div>
        {submitted && actionError && <p className="learn-inline-error" role="alert">{actionError}</p>}
        <div className="learning-path-modal-actions"><button type="button" className="learn-secondary-btn" onClick={() => setStep('choose')} disabled={saving}>Back</button><button type="button" className="learn-primary-btn" disabled={saving || !selectedSkills.length} onClick={createPath}>{saving ? 'Creating path…' : 'Create and join path'}<FiArrowRight /></button></div>
      </div>}
      </div>
    </section>
  </div>
}

export default LearningPathBuilder
