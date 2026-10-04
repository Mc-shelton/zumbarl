import { useEffect, useMemo, useRef, useState } from 'react'
import { FiArchive, FiArrowRight, FiBookOpen, FiBriefcase, FiCheck, FiChevronDown, FiChevronRight, FiClock, FiPlus, FiRefreshCw, FiTarget, FiUsers, FiX } from 'react-icons/fi'
import { Link, useSearchParams } from 'react-router-dom'
import CampusSidebar from '../components/layout/CampusSidebar'
import CampusTopActions from '../components/layout/CampusTopActions'
import Seo from '../components/Seo'
import LearnKnowledgeHub from '../features/learn/components/LearnKnowledgeHub'
import CareerCoachPanel from '../features/learn/components/CareerCoachPanel'
import LearningPathBuilder from '../features/learn/components/LearningPathBuilder'
import {
  createRoadmap,
  readLearnExperience,
  readRoadmapCoachingPlan,
  readRoadmapRecommendations,
  updateRoadmapCoachingFocus,
  updateRoadmapResourceProgress,
  updateRoadmapResourceSelection,
} from '../features/learn/services/learnService'
import '../styles/campus.css'
import '../styles/learn.css'

function LearnPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [experience, setExperience] = useState({ ladders: [], baseline: null, roadmaps: [] })
  const [selectedLadderId, setSelectedLadderId] = useState('')
  const [recommendationFeed, setRecommendationFeed] = useState({ enrollmentId: '', items: [] })
  const [coachingPlan, setCoachingPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [showPathBuilder, setShowPathBuilder] = useState(false)
  const [showPathSwitcher, setShowPathSwitcher] = useState(false)
  const activeArea = searchParams.get('view') === 'path' ? 'path' : 'knowledge'
  const requestedRoadmapId = searchParams.get('roadmap') || ''
  const [knowledgeData, setKnowledgeData] = useState({ resources: [], libraries: [], groups: [], summary: {} })
  const resourceSectionRef = useRef(null)
  const pathSwitcherRef = useRef(null)

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
        const requestedLadder = next.ladders.find((ladder) => (
          ladder.id === requestedRoadmapId || ladder.slug === requestedRoadmapId
        ))
        const requestedEnrollment = requestedLadder
          ? next.roadmaps.find((roadmap) => roadmap.roadmapId === requestedLadder.id)
          : null
        setSelectedLadderId(requestedLadder?.id || next.roadmaps[0]?.roadmapId || next.ladders[0]?.id || '')
        if (requestedLadder && !requestedEnrollment) setShowPathBuilder(true)
      })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [requestedRoadmapId])

  const selectedLadder = useMemo(
    () => experience.ladders.find((ladder) => ladder.id === selectedLadderId) || experience.ladders[0] || null,
    [experience.ladders, selectedLadderId],
  )
  const enrollment = useMemo(
    () => experience.roadmaps.find((roadmap) => roadmap.roadmapId === selectedLadder?.id) || null,
    [experience.roadmaps, selectedLadder?.id],
  )
  const joinedPaths = useMemo(
    () => experience.roadmaps.map((roadmap) => ({
      roadmap,
      ladder: experience.ladders.find((ladder) => ladder.id === roadmap.roadmapId) || roadmap.ladder,
    })).filter((item) => item.ladder),
    [experience.ladders, experience.roadmaps],
  )
  const enrolledRoadmapIds = useMemo(
    () => new Set(experience.roadmaps.map((roadmap) => roadmap.roadmapId)),
    [experience.roadmaps],
  )
  const pathResources = useMemo(() => {
    const resources = new Map()
    for (const checkpoint of enrollment?.checkpoints || []) {
      for (const resource of checkpoint.resources || []) {
        if (!resources.has(resource.id)) resources.set(resource.id, { ...resource, checkpointId: checkpoint.id })
      }
    }
    return [...resources.values()].sort((left, right) => {
      if (left.status === 'COMPLETED' && right.status !== 'COMPLETED') return 1
      if (right.status === 'COMPLETED' && left.status !== 'COMPLETED') return -1
      return (right.matchScore || 0) - (left.matchScore || 0)
    })
  }, [enrollment])
  const selectedPathResources = pathResources.filter((resource) => resource.selected)
  const suggestedPathResources = pathResources.filter((resource) => !resource.selected)
  const recommendations = recommendationFeed.enrollmentId === enrollment?.id ? recommendationFeed.items : []

  useEffect(() => {
    if (!showPathSwitcher) return undefined
    const closeSwitcher = (event) => {
      if (!pathSwitcherRef.current?.contains(event.target)) setShowPathSwitcher(false)
    }
    document.addEventListener('mousedown', closeSwitcher)
    return () => document.removeEventListener('mousedown', closeSwitcher)
  }, [showPathSwitcher])

  useEffect(() => {
    if (activeArea !== 'path' || !enrollment?.id) return
    let active = true
    const readRecommendations = () => readRoadmapRecommendations(enrollment.id)
      .then((items) => { if (active) setRecommendationFeed({ enrollmentId: enrollment.id, items }) })
      .catch(() => { if (active) setRecommendationFeed({ enrollmentId: enrollment.id, items: [] }) })
    readRecommendations()
    readRoadmapCoachingPlan(enrollment.id).then((plan) => { if (active) setCoachingPlan(plan) }).catch(() => { if (active) setCoachingPlan(null) })
    const intervalId = window.setInterval(readRecommendations, 60_000)
    const refreshWhenVisible = () => { if (document.visibilityState === 'visible') readRecommendations() }
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      active = false
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [activeArea, enrollment?.id, enrollment?.updatedAt])

  const replaceEnrollment = (updated) => {
    setExperience((current) => ({
      ...current,
      ladders: current.ladders.some((ladder) => ladder.id === updated.ladder.id) ? current.ladders : [updated.ladder, ...current.ladders],
      roadmaps: [updated, ...current.roadmaps.filter((item) => item.id !== updated.id)],
    }))
    setSelectedLadderId(updated.roadmapId)
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

  const joinPath = async (ladderId, selectedIntent) => {
    const created = await runAction(() => createRoadmap(ladderId, selectedIntent), 'Learning path added. Choose the resources you want in your plan.')
    if (created) { replaceEnrollment(created); setShowPathBuilder(false) }
    return created
  }

  const createStudentPath = async (payload) => {
    const created = await runAction(() => createRoadmap(payload), 'Your new learning path is ready and reusable by other students.')
    if (created) { replaceEnrollment(created); setShowPathBuilder(false) }
    return created
  }

  const saveCoachingFocus = async (skillIds, weeklyTarget) => {
    const updated = await runAction(
      () => updateRoadmapCoachingFocus(enrollment.id, skillIds, weeklyTarget),
      'Your coaching plan now follows these practice skills.',
    )
    if (updated) replaceEnrollment(updated)
  }

  const markResourceDone = async (resourceId) => {
    const updated = await runAction(() => updateRoadmapResourceProgress(enrollment.id, resourceId, 100), 'Resource completed. Your weekly progress is updated.')
    if (updated) replaceEnrollment(updated)
  }

  const setResourceSelected = async (resource, selected) => {
    const updated = await runAction(
      () => updateRoadmapResourceSelection(enrollment.id, resource.id, selected),
      selected ? `${resource.title} was added to your plan.` : `${resource.title} was removed from your plan.`,
    )
    if (updated) replaceEnrollment(updated)
  }

  const renderResourceCard = (resource) => (
    <article key={resource.id} className={`${resource.status === 'COMPLETED' ? 'is-complete' : ''}${resource.selected ? ' is-selected' : ' is-suggested'}`}>
      <Link to={resource.content?.knowledgeResourceId
        ? `/campus/learn?view=knowledge&resource=${encodeURIComponent(resource.content.knowledgeResourceId)}`
        : `/campus/learn/${enrollment.id}/checkpoints/${resource.checkpointId}/practice/${resource.id}`}>
        <span className="learn-resource-icon">{resource.status === 'COMPLETED' ? <FiCheck /> : <FiBookOpen />}</span>
        <span className="learn-resource-copy"><small>{resource.provider || resource.type || 'Knowledge Hub resource'}</small><strong>{resource.title}</strong><span>{resource.description || 'Open this resource to review what it covers.'}</span></span>
        {resource.matchScore ? <em>{resource.matchScore}% match</em> : null}
        <FiArrowRight aria-hidden="true" />
      </Link>
      <div className="learn-resource-footer">
        <span>{resource.status === 'COMPLETED' ? 'Completed' : resource.selected ? 'In your plan' : 'Recommended for this path'}</span>
        <div>
          {!resource.selected && <button type="button" disabled={saving} onClick={() => setResourceSelected(resource, true)}><FiPlus />Add to my plan</button>}
          {resource.selected && ['SELECTED', 'NOT_STARTED'].includes(resource.status) && <button type="button" className="is-remove" disabled={saving} onClick={() => setResourceSelected(resource, false)}><FiX />Remove</button>}
          {resource.selected && resource.status !== 'COMPLETED' && <button type="button" disabled={saving} onClick={() => markResourceDone(resource.id)}><FiCheck />Mark complete</button>}
        </div>
      </div>
    </article>
  )

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
            <div className="learn-sticky-head">
              <header className="learn-mobile-appbar">
                <div className="learn-mobile-brand" aria-hidden="true">
                  <span><img src="/assets/index/bee_nobg.png" alt="" /></span>
                  <div><small>Learning</small><strong>Learn &amp; Grow</strong></div>
                </div>
                <CampusTopActions className="learn-mobile-actions" userButtonClassName="learn-mobile-user-btn" />
              </header>

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
            </div>

            {error && <div className="learn-feedback is-error" role="alert">{error}</div>}
            {notice && <div className="learn-feedback" role="status"><FiCheck aria-hidden="true" />{notice}</div>}

            {activeArea === 'knowledge' ? <LearnKnowledgeHub initialTab={searchParams.get('tab') || 'resources'} onDataChange={setKnowledgeData} /> : <>

            <section className="learn-path-picker" aria-label="Career paths">
              <div>
                <h2>Your learning paths</h2>
                <p>{joinedPaths.length ? `${joinedPaths.length} active ${joinedPaths.length === 1 ? 'path' : 'paths'}. Switch without losing progress.` : 'Choose your first path and make it your own.'}</p>
              </div>
              <div className="learn-path-picker-controls">
                {joinedPaths.length ? <div className="learn-path-switcher" ref={pathSwitcherRef}>
                  <button type="button" className="learn-path-switcher-trigger" aria-haspopup="menu" aria-expanded={showPathSwitcher} onClick={() => setShowPathSwitcher((current) => !current)}>
                    <span className="learn-path-switcher-icon"><FiBookOpen /></span>
                    <span><small>Current path</small><strong>{selectedLadder?.title}</strong></span>
                    <em>{Math.max(1, joinedPaths.findIndex((item) => item.ladder.id === selectedLadder?.id) + 1)} of {joinedPaths.length}</em>
                    <FiChevronDown aria-hidden="true" />
                  </button>
                  {showPathSwitcher && <div className="learn-path-switcher-menu" role="menu">
                    <header><strong>Switch learning path</strong><span>{joinedPaths.length} active</span></header>
                    <div>{joinedPaths.map(({ ladder, roadmap }) => {
                      const completedPercent = roadmap.resourceProgress?.total ? Math.round((roadmap.resourceProgress.completed / roadmap.resourceProgress.total) * 100) : 0
                      return <button key={ladder.id} type="button" role="menuitem" className={ladder.id === selectedLadder?.id ? 'is-selected' : ''} onClick={() => { setSelectedLadderId(ladder.id); setShowPathSwitcher(false) }}>
                        <span className="learn-path-switcher-icon"><FiBookOpen /></span>
                        <span><strong>{ladder.title}</strong><small>{roadmap.resourceProgress?.completed || 0} of {roadmap.resourceProgress?.total || 0} resources</small><i><b style={{ width: `${completedPercent}%` }} /></i></span>
                        {ladder.id === selectedLadder?.id ? <FiCheck aria-label="Current path" /> : <em>{completedPercent}%</em>}
                      </button>
                    })}</div>
                  </div>}
                </div> : <button type="button" className="learn-path-empty-action" onClick={() => setShowPathBuilder(true)}><FiBookOpen /><span><strong>Choose your first path</strong><small>Search the catalogue or create one</small></span><FiArrowRight /></button>}
                <button type="button" className="learn-add-path" onClick={() => { setShowPathSwitcher(false); setShowPathBuilder(true) }}><FiPlus /><span><strong>{joinedPaths.length ? 'Add path' : 'Create a path'}</strong><small>Search or create</small></span></button>
              </div>
            </section>

            {enrollment && <section className="learn-resource-progress-card" aria-labelledby="resource-progress-heading">
              <div><span className="learn-eyebrow">Accountability schedule</span><h2 id="resource-progress-heading">{enrollment.resourceProgress.completed} of {enrollment.resourceProgress.total} resources completed</h2><p>{enrollment.resourceProgress.completedThisWeek} of {enrollment.resourceProgress.weeklyTarget} planned resources completed this week.</p></div>
              <div className="learn-resource-progress-meter"><strong>{enrollment.resourceProgress.total ? Math.round((enrollment.resourceProgress.completed / enrollment.resourceProgress.total) * 100) : 0}%</strong><i><b style={{ width: `${enrollment.resourceProgress.total ? (enrollment.resourceProgress.completed / enrollment.resourceProgress.total) * 100 : 0}%` }} /></i><small>{enrollment.resourceProgress.remaining} remaining</small></div>
              <div className="learn-weekly-target"><strong>{Math.min(enrollment.resourceProgress.completedThisWeek, enrollment.resourceProgress.weeklyTarget)}/{enrollment.resourceProgress.weeklyTarget}</strong><span>this week</span></div>
            </section>}

            {enrollment && <section className="learn-path-resources" ref={resourceSectionRef} aria-labelledby="path-resources-heading">
              <header className="learn-path-resources-header">
                <div><span className="learn-eyebrow">Matched to your skills</span><h2 id="path-resources-heading">Recommended for {selectedLadder?.title}</h2><p>Review the matches, then add only the resources you want to complete. Your schedule and progress use your selected resources.</p></div>
                <span className="learn-resource-refresh-note"><FiClock aria-hidden="true" />Checked weekly</span>
              </header>
              {pathResources.length ? <div className="learn-resource-groups">
                {selectedPathResources.length > 0 && <section><header><div><strong>My selected resources</strong><span>{selectedPathResources.length} in your plan</span></div></header><div className="learn-path-resource-grid">{selectedPathResources.map(renderResourceCard)}</div></section>}
                {suggestedPathResources.length > 0 && <section><header><div><strong>Recommended resources</strong><span>Select the ones that fit how you want to learn</span></div><em>{suggestedPathResources.length} found</em></header><div className="learn-path-resource-grid">{suggestedPathResources.map(renderResourceCard)}</div></section>}
              </div> : <div className="learn-resource-empty"><FiBookOpen /><strong>No matching resources yet</strong><p>New matches are checked automatically each week and whenever you change this path’s skills.</p></div>}
            </section>}

            {enrollment && coachingPlan && <CareerCoachPanel key={`${coachingPlan.enrollmentId}:${coachingPlan.focus.selectedSkillIds.join(',')}:${coachingPlan.focus.weeklyTarget}`} plan={coachingPlan} saving={saving} onSave={saveCoachingFocus} />}

            {enrollment && <section className="learn-matches">
              <div className="learn-section-heading"><div><span className="learn-eyebrow">Practise on Zumbarl</span><h2>Work that builds your skills</h2></div><p>Live opportunities are matched automatically from the skills on this path.</p></div>
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
                )) : <div className="learn-empty-match"><FiBriefcase aria-hidden="true" /><strong>No live matches yet</strong><span>New opportunities will appear here automatically when they connect to your path.</span></div>}
              </div>
            </section>}
            </>}
          </section>

          {showPathBuilder && <LearningPathBuilder initialRoadmapId={requestedRoadmapId} enrolledRoadmapIds={enrolledRoadmapIds} saving={saving} actionError={error} onClose={() => setShowPathBuilder(false)} onJoin={joinPath} onCreate={createStudentPath} />}

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
                {(enrollment?.skills || []).map((skill) => (
                  <span key={skill.id} className={skill.verified ? 'is-known' : ''}>
                    {skill.verified && <FiCheck aria-hidden="true" />}{skill.name}{skill.verified && <small>Verified by work</small>}
                  </span>
                ))}
                {enrollment && !enrollment.skills?.length && <p className="learn-rail-empty-copy">Add at least one skill to start matching resources and opportunities.</p>}
              </div>
            </section>
            {enrollment && (
              <section className="learn-rail-card learn-review-card">
                <FiCheck aria-hidden="true" />
                <div><h2>Evidence stays automatic</h2><p>Approved gigs and verified work confirm matching skills without holding up your learning path.</p></div>
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
