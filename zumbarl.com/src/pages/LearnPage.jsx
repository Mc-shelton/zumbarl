import { useEffect, useMemo, useRef, useState } from 'react'
import { FiArchive, FiArrowRight, FiAward, FiBookOpen, FiBriefcase, FiCheck, FiChevronRight, FiClock, FiLock, FiRefreshCw, FiTarget, FiUsers, FiZap } from 'react-icons/fi'
import { Link, useSearchParams } from 'react-router-dom'
import CampusSidebar from '../components/layout/CampusSidebar'
import Seo from '../components/Seo'
import LearnKnowledgeHub from '../features/learn/components/LearnKnowledgeHub'
import {
  createRoadmap,
  lockRoadmap,
  readLearnExperience,
  readRoadmapRecommendations,
  verifyRoadmap,
} from '../features/learn/services/learnService'
import '../styles/campus.css'
import '../styles/learn.css'

const INTENT_LABELS = {
  explore: 'Explore this career',
  'earn-while-learning': 'Earn while learning',
  'attachment-readiness': 'Prepare for attachment',
  'internship-readiness': 'Prepare for internship',
  'job-readiness': 'Prepare for a job',
}

function scoreLabel(checkpoint) {
  if (checkpoint.status === 'completed') return 'Completed'
  if (checkpoint.status === 'active') return 'In progress'
  return 'Locked'
}

function LearnPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [experience, setExperience] = useState({ ladders: [], baseline: null, roadmaps: [] })
  const [selectedLadderId, setSelectedLadderId] = useState('')
  const [activeCheckpointId, setActiveCheckpointId] = useState('')
  const [intent, setIntent] = useState('earn-while-learning')
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const activeArea = searchParams.get('view') === 'path' ? 'path' : 'knowledge'
  const [knowledgeData, setKnowledgeData] = useState({ resources: [], libraries: [], groups: [], summary: {} })
  const workspaceRef = useRef(null)

  const selectArea = (area) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('view', area)
    if (area === 'path') nextParams.delete('tab')
    setSearchParams(nextParams, { replace: true })
  }

  useEffect(() => {
    let active = true
    readLearnExperience()
      .then((next) => {
        if (!active) return
        setExperience(next)
        setSelectedLadderId(next.roadmaps[0]?.roadmapId || next.ladders[0]?.id || '')
      })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const selectedLadder = useMemo(
    () => experience.ladders.find((ladder) => ladder.id === selectedLadderId) || experience.ladders[0] || null,
    [experience.ladders, selectedLadderId],
  )
  const enrollment = useMemo(
    () => experience.roadmaps.find((roadmap) => roadmap.roadmapId === selectedLadder?.id) || null,
    [experience.roadmaps, selectedLadder?.id],
  )
  const checkpoints = enrollment?.checkpoints || selectedLadder?.checkpoints || []
  const activeCheckpoint = checkpoints.find((checkpoint) => checkpoint.id === (activeCheckpointId || searchParams.get('checkpoint')))
    || checkpoints.find((checkpoint) => checkpoint.status === 'active')
    || checkpoints[0]
    || null

  useEffect(() => {
    if (!enrollment?.id) return
    readRoadmapRecommendations(enrollment.id).then(setRecommendations).catch(() => setRecommendations([]))
  }, [enrollment?.id, enrollment?.updatedAt])

  const replaceEnrollment = (updated) => {
    setExperience((current) => ({
      ...current,
      roadmaps: [updated, ...current.roadmaps.filter((item) => item.id !== updated.id)],
    }))
  }

  const runAction = async (action, successMessage) => {
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const result = await action()
      setNotice(successMessage)
      return result
    } catch (requestError) {
      setError(requestError.message)
      return null
    } finally {
      setSaving(false)
    }
  }

  const startPath = async () => {
    if (!selectedLadder) return
    const created = await runAction(() => createRoadmap(selectedLadder.id, intent), 'Your path is ready. Start with the first checkpoint.')
    if (created) replaceEnrollment(created)
  }

  const focusPath = async () => {
    const updated = await runAction(() => lockRoadmap(enrollment.id), 'Opportunity discovery now prioritizes this path.')
    if (updated) replaceEnrollment(updated)
  }

  const requestVerification = async () => {
    const result = await runAction(() => verifyRoadmap(enrollment.id), 'Career path verified and added to your profile.')
    if (result?.roadmap) replaceEnrollment(result.roadmap)
    if (result && !result.verified) setNotice('Complete every required checkpoint to verify this career path.')
  }

  const pendingEvidence = enrollment?.evidence?.filter((item) => item.status === 'PENDING').length || 0
  const allComplete = Boolean(enrollment && enrollment.checkpoints.every((checkpoint) => !checkpoint.required || checkpoint.status === 'completed'))
  const baselineSkillSlugs = new Set((experience.baseline?.skills || []).map((skill) => skill.slug))

  if (loading) {
    return (
      <main className="campus-page learn-page"><div className="learn-loading"><FiRefreshCw aria-hidden="true" />Building your learning path…</div></main>
    )
  }

  return (
    <main className="campus-page learn-page">
      <Seo title="Learn & Grow | Zumbarl" description="Turn real work into verified career progress." path="/campus/learn" />
      <div className="campus-stage">
        <div className="campus-shell learn-shell">
          <CampusSidebar activeItemId="learn" />

          <section className="campus-main learn-main">
            <header className="learn-page-intro">
              <div className="learn-breadcrumb"><span>Campus</span><FiChevronRight aria-hidden="true" /><strong>Learn &amp; Grow</strong></div>
              <div className="learn-page-intro-copy">
                <div>
                  <h1>Learn &amp; Grow</h1>
                  <p>Build career-ready skills, find study material, and learn with your campus community.</p>
                </div>
              </div>
              <nav className="learn-area-switcher" aria-label="Learn and Grow areas">
                <button type="button" className={activeArea === 'knowledge' ? 'is-active' : ''} onClick={() => selectArea('knowledge')}>
                  <FiBookOpen aria-hidden="true" /><span><strong>Knowledge hub</strong><small>Resources and groups</small></span>
                </button>
                <button type="button" className={activeArea === 'path' ? 'is-active' : ''} onClick={() => selectArea('path')}>
                  <FiTarget aria-hidden="true" /><span><strong>My learning path</strong><small>Career readiness</small></span>
                </button>
              </nav>
            </header>

            {error && <div className="learn-feedback is-error" role="alert">{error}</div>}
            {notice && <div className="learn-feedback" role="status"><FiCheck aria-hidden="true" />{notice}</div>}

            {activeArea === 'knowledge' ? <LearnKnowledgeHub initialTab={searchParams.get('tab') || 'resources'} onDataChange={setKnowledgeData} /> : <>

            <section className="learn-hero">
              <div>
                <span>My learning path</span>
                <h1>{enrollment ? selectedLadder?.title : 'Choose where you want your work to take you.'}</h1>
                <p>{enrollment
                  ? `${activeCheckpoint?.title || 'Your next checkpoint'} is your next focus. Learn it, practise it, and let your verified Zumbarl work prove it.`
                  : 'Zumbarl creates a practical path from what you already know to your next attachment, internship, or paid opportunity.'}</p>
                <div className="learn-hero-actions">
                  {enrollment ? (
                    <button type="button" className="learn-primary-btn" onClick={() => workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                      Continue checkpoint <FiArrowRight aria-hidden="true" />
                    </button>
                  ) : (
                    <button type="button" className="learn-primary-btn" disabled={saving || !selectedLadder} onClick={startPath}>
                      Start this path <FiArrowRight aria-hidden="true" />
                    </button>
                  )}
                  {enrollment && !enrollment.locked && (
                    <button type="button" className="learn-secondary-btn" disabled={saving} onClick={focusPath}><FiTarget aria-hidden="true" />Focus my opportunities</button>
                  )}
                </div>
              </div>
              <div className="learn-progress-summary" aria-label="Path progress">
                <strong>{Math.round(enrollment?.progressPercent || 0)}%</strong>
                <span>Path completed</span>
                <div><i style={{ width: `${enrollment?.progressPercent || 0}%` }} /></div>
                <small>{enrollment?.locked ? 'Opportunity matching is focused on this path' : `${selectedLadder?.estimatedWeeks || 0} week guided path`}</small>
              </div>
            </section>

            <section className="learn-path-picker" aria-label="Career paths">
              <div>
                <h2>Your direction</h2>
                <p>Switch paths without losing progress.</p>
              </div>
              <div className="learn-path-options">
                {experience.ladders.map((ladder) => (
                  <button key={ladder.id} type="button" className={ladder.id === selectedLadder?.id ? 'is-selected' : ''} onClick={() => setSelectedLadderId(ladder.id)}>
                    <strong>{ladder.title}</strong>
                    <span>{experience.roadmaps.some((roadmap) => roadmap.roadmapId === ladder.id) ? 'In progress' : `${ladder.estimatedWeeks} weeks`}</span>
                  </button>
                ))}
              </div>
              {!enrollment && selectedLadder && (
                <label className="learn-intent-select">
                  <span>What are you preparing for?</span>
                  <select value={intent} onChange={(event) => setIntent(event.target.value)}>
                    {(selectedLadder.intents || Object.keys(INTENT_LABELS)).map((value) => <option key={value} value={value}>{INTENT_LABELS[value] || value}</option>)}
                  </select>
                </label>
              )}
            </section>

            <section className="learn-roadmap-panel" aria-labelledby="path-heading">
              <header>
                <div><span className="learn-eyebrow">Your path</span><h2 id="path-heading">{selectedLadder?.title}</h2></div>
                {enrollment?.locked && <strong><FiLock aria-hidden="true" /> Focused</strong>}
              </header>
              <div className="learn-roadmap-tree" style={{ '--roadmap-progress': `${checkpoints.length > 1 ? Math.max(0, checkpoints.findIndex((checkpoint) => checkpoint.id === activeCheckpoint?.id)) / (checkpoints.length - 1) * 100 : 100}%` }}>
                {checkpoints.map((checkpoint, index) => {
                  const nodeStatus = checkpoint.status || (index ? 'locked' : 'active')
                  const isCurrent = checkpoint.id === activeCheckpoint?.id
                  return <article key={checkpoint.id} className={`learn-roadmap-node is-${nodeStatus} ${isCurrent ? 'is-selected' : ''}`}>
                    <button type="button" aria-current={checkpoint.id === activeCheckpoint?.id ? 'step' : undefined} onClick={() => setActiveCheckpointId(checkpoint.id)}>
                      <span className="learn-node-top"><span className="learn-node-index">{nodeStatus === 'completed' ? <FiCheck aria-hidden="true" /> : index + 1}</span><small>{nodeStatus === 'completed' ? 'Completed' : isCurrent ? 'Current' : nodeStatus === 'locked' ? 'Locked' : 'Available'}</small></span>
                      <span className="learn-node-level">{checkpoint.level}</span>
                      <strong>{checkpoint.title}</strong>
                      <em>{enrollment ? `${checkpoint.score}%` : scoreLabel(checkpoint)}</em>
                    </button>
                  </article>
                })}
              </div>
            </section>

            {activeCheckpoint && (
              <section className="learn-workspace" ref={workspaceRef}>
                <article className="learn-checkpoint-card">
                  <div className="learn-checkpoint-heading">
                    <div><span className="learn-eyebrow">Current checkpoint</span><h2>{activeCheckpoint.title}</h2><p>{activeCheckpoint.description}</p></div>
                    {enrollment && <div className="learn-score"><strong>{activeCheckpoint.score}%</strong><span>readiness</span></div>}
                  </div>

                  <div className="learn-score-bars">
                    <div><span>Verified work <strong>{activeCheckpoint.evidenceScore || 0}/{selectedLadder.weights.evidence}</strong></span><i><b style={{ width: `${((activeCheckpoint.evidenceScore || 0) / selectedLadder.weights.evidence) * 100}%` }} /></i></div>
                    <div><span>Assessment <strong>{activeCheckpoint.testScore || 0}/{selectedLadder.weights.test}</strong></span><i><b style={{ width: `${((activeCheckpoint.testScore || 0) / selectedLadder.weights.test) * 100}%` }} /></i></div>
                  </div>

                  <h3>What you’ll be able to prove</h3>
                  <div className="learn-competencies">
                    {activeCheckpoint.competencies.map((item) => <span key={item.id}><FiCheck aria-hidden="true" />{item.name}</span>)}
                  </div>

                  <h3>Learn and practise</h3>
                  <div className="learn-resource-list">
                    {activeCheckpoint.resources.length ? activeCheckpoint.resources.map((resource) => (
                      enrollment ? <Link key={resource.id} to={`/campus/learn/${enrollment.id}/checkpoints/${activeCheckpoint.id}/practice/${resource.id}`}>
                        <FiBookOpen aria-hidden="true" /><span><strong>{resource.title}</strong><small>{resource.description}</small></span><FiArrowRight aria-hidden="true" />
                      </Link> : <button key={resource.id} type="button" onClick={startPath}>
                        <FiBookOpen aria-hidden="true" /><span><strong>{resource.title}</strong><small>Start this path to open the lesson.</small></span><FiArrowRight aria-hidden="true" />
                      </button>
                    )) : <p>No resources have been added to this checkpoint yet.</p>}
                  </div>
                </article>

                <aside className="learn-next-card">
                  <span className="learn-eyebrow">Do next</span>
                  <h2>Your real work builds this score</h2>
                  <p>Finish matched work on Zumbarl. Once it is approved or verified, we connect its skills to this checkpoint and award points automatically.</p>
                  {!enrollment ? (
                    <button type="button" className="learn-primary-btn" onClick={startPath}>Start path <FiArrowRight aria-hidden="true" /></button>
                  ) : (
                    <>
                      <div className="learn-auto-evidence">
                        <FiZap aria-hidden="true" />
                        <div><strong>Automatic evidence is on</strong><span>Approved opportunities, verified campaign proof, portfolio work and endorsements count when their skills match.</span></div>
                      </div>
                      {activeCheckpoint.assessment.length > 0 && <Link className="learn-secondary-btn" to={`/campus/learn/${enrollment.id}/checkpoints/${activeCheckpoint.id}/assessment`}><FiBookOpen aria-hidden="true" />Take checkpoint assessment</Link>}
                      {allComplete && !enrollment.verified && <button type="button" className="learn-secondary-btn" onClick={requestVerification}><FiAward aria-hidden="true" />Verify career path</button>}
                    </>
                  )}
                </aside>
              </section>
            )}

            <section className="learn-matches">
              <div className="learn-section-heading"><div><span className="learn-eyebrow">Practise on Zumbarl</span><h2>Work that builds this checkpoint</h2></div><p>Matches explain which competency they help you prove.</p></div>
              <div className="learn-match-grid">
                {recommendations.length ? recommendations.map((item) => (
                  <article key={item.id}>
                    <div><span>{item.engagementState === 'active_project' ? 'Active project' : item.engagementState === 'applied' ? 'Application submitted' : item.opportunityType}</span><strong>{item.matchScore}% match</strong></div>
                    <h3>{item.title}</h3><p>{item.companyName}</p>
                    <ul>{item.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                    {item.engagementState === 'active_project' && item.projectId ? (
                      <Link to={`/campus/projects/${encodeURIComponent(item.projectId)}?tab=work-deliverables`}>Continue project <FiArrowRight aria-hidden="true" /></Link>
                    ) : item.engagementState === 'applied' && item.bidId ? (
                      <Link to={`/campus/opportunities?tab=bids&bid=${encodeURIComponent(item.bidId)}`}>View application <FiArrowRight aria-hidden="true" /></Link>
                    ) : (
                      <Link to={`/campus/opportunities?opportunity=${encodeURIComponent(item.id)}&view=activity`}>View opportunity <FiArrowRight aria-hidden="true" /></Link>
                    )}
                  </article>
                )) : <div className="learn-empty-match"><FiBriefcase aria-hidden="true" /><strong>No live matches yet</strong><span>We’ll show opportunities here when their required skills connect to this checkpoint.</span></div>}
              </div>
            </section>
            </>}
          </section>

          <aside className="campus-rail learn-rail">
            {activeArea === 'knowledge' ? <>
              <section className="learn-rail-card learn-knowledge-rail-card">
                <div className="learn-rail-card-heading"><FiBookOpen aria-hidden="true" /><div><h2>Your learning shelf</h2><p>Everything you can read, borrow or join.</p></div></div>
                <div className="learn-baseline-grid learn-knowledge-icon-totals" aria-label="Your learning shelf totals">
                  <span title="Resources"><FiBookOpen aria-hidden="true" /><strong>{knowledgeData.summary?.resources || 0}</strong><small className="sr-only">Resources</small></span>
                  <span title="Borrowed"><FiClock aria-hidden="true" /><strong>{knowledgeData.summary?.borrowed || 0}</strong><small className="sr-only">Borrowed resources</small></span>
                  <span title="Libraries"><FiArchive aria-hidden="true" /><strong>{knowledgeData.summary?.libraries || 0}</strong><small className="sr-only">Libraries</small></span>
                  <span title="Groups"><FiUsers aria-hidden="true" /><strong>{knowledgeData.summary?.groups || 0}</strong><small className="sr-only">Study groups</small></span>
                </div>
              </section>
              <section className="learn-rail-card">
                <div className="learn-rail-heading"><h2>Your spaces</h2><span>{[...knowledgeData.libraries, ...knowledgeData.groups].filter((space) => space.membership).length}</span></div>
                <div className="learn-space-rail-list">
                  {[...knowledgeData.libraries, ...knowledgeData.groups].filter((space) => space.membership).slice(0, 4).map((space) => (
                    <Link key={space.id} to={`/campus/learn/spaces/${encodeURIComponent(space.slug || space.id)}`}><span className="learn-space-rail-icon">{space.type === 'library' ? <FiBookOpen aria-hidden="true" /> : <FiTarget aria-hidden="true" />}</span><span><strong>{space.name}</strong><small>{space.membership?.role === 'owner' ? 'You manage this space' : `${space.memberCount} members`}</small></span></Link>
                  ))}
                  {![...knowledgeData.libraries, ...knowledgeData.groups].some((space) => space.membership) && <p className="learn-rail-empty-copy">Join a library or study group to keep it here.</p>}
                </div>
              </section>
            </> : <>
            <section className="learn-rail-card">
              <h2>Your starting point</h2>
              <p>Based on verified profile activity.</p>
              <div className="learn-baseline-grid">
                <span><strong>{experience.baseline?.evidenceSummary?.portfolioItems || 0}</strong>Portfolio items</span>
                <span><strong>{experience.baseline?.evidenceSummary?.endorsements || 0}</strong>Endorsements</span>
              </div>
            </section>
            <section className="learn-rail-card">
              <h2>Skills on this path</h2>
              <div className="learn-skill-list">
                {(selectedLadder?.checkpoints || []).flatMap((checkpoint) => checkpoint.competencies).map((competency) => (
                  <span key={competency.id} className={competency.skill && baselineSkillSlugs.has(competency.skill.slug) ? 'is-known' : ''}>
                    {competency.skill && baselineSkillSlugs.has(competency.skill.slug) && <FiCheck aria-hidden="true" />}{competency.name}
                  </span>
                ))}
              </div>
            </section>
            {enrollment && (
              <section className="learn-rail-card learn-review-card">
                <FiClock aria-hidden="true" />
                <div><h2>{pendingEvidence} awaiting review</h2><p>Only verified evidence contributes to your readiness.</p></div>
              </section>
            )}
            </>}
          </aside>
        </div>
      </div>
    </main>
  )
}

export default LearnPage
