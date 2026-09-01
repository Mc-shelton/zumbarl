import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Seo from '../components/Seo'
import evergreen from '../features/evergreen/services/evergreenService'
import '../styles/evergreen.css'

function Status({ children }) {
  return <span className={`evergreen-status evergreen-status-${String(children).toLowerCase().replaceAll('_', '-')}`}>{String(children).replaceAll('_', ' ')}</span>
}

function AsyncState({ loading, error, empty, onRetry, children }) {
  if (loading) return <div className="evergreen-state" role="status">Loading Evergreen records…</div>
  if (error) return <div className="evergreen-state evergreen-state-error" role="alert"><strong>Evergreen could not load</strong><span>{error}</span><button type="button" onClick={onRetry}>Retry</button></div>
  if (empty) return <div className="evergreen-state"><strong>Nothing here yet</strong><span>{empty}</span></div>
  return children
}

function useResource(loader, dependencyKey = 'static') {
  const [state, setState] = useState({ loading: true, error: '', data: null })
  const loaderRef = useRef(loader)
  useEffect(() => { loaderRef.current = loader }, [loader])
  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }))
    try { setState({ loading: false, error: '', data: await loaderRef.current() }) }
    catch (error) { setState({ loading: false, error: error.message, data: null }) }
  }, [])
  // Reload when the caller's stable resource identity changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void dependencyKey; void load() }, [dependencyKey, load])
  return { ...state, reload: load }
}

function Layout({ surface, title, subtitle, actions, children }) {
  const nav = surface === 'company'
    ? [['Overview', '/business/evergreen'], ['New program', '/business/evergreen/programs/new'], ['Business home', '/business/workspace']]
    : surface === 'student'
      ? [['Readiness', '/campus/career/evergreen/readiness'], ['Matches', '/campus/career/evergreen/matches'], ['Career home', '/campus/learn']]
      : [['Reviews', '/admin/evergreen/reviews'], ['Placements', '/admin/evergreen/placements'], ['Billing', '/admin/evergreen/billing']]
  return <main className="evergreen-page">
    <Seo title={`${title} | Zumbarl Evergreen`} description={subtitle} path={window.location.pathname} />
    <header className="evergreen-topbar"><Link to="/" className="evergreen-wordmark">Zumbarl <span>Evergreen</span></Link><nav aria-label="Evergreen navigation">{nav.map(([label, href]) => <Link key={href} to={href}>{label}</Link>)}</nav></header>
    <div className="evergreen-shell">
      <section className="evergreen-hero"><div><p className="evergreen-kicker">Continuous placements</p><h1>{title}</h1><p>{subtitle}</p></div>{actions ? <div className="evergreen-actions">{actions}</div> : null}</section>
      {children}
    </div>
  </main>
}

function CompanyOverview() {
  const eligibility = useResource(evergreen.eligibility)
  const programs = useResource(evergreen.programs)
  const qualification = eligibility.data?.qualification
  return <Layout surface="company" title="Evergreen recruitment" subtitle="Run repeat internship and attachment cohorts from one approved program." actions={<Link className="evergreen-button" to="/business/evergreen/programs/new">Create program</Link>}>
    <AsyncState {...eligibility} onRetry={eligibility.reload}>{eligibility.data ? <section className="evergreen-grid evergreen-summary-grid">
      <article><span>Company qualification</span><strong>{qualification?.qualified ? 'Qualified' : 'Action required'}</strong><p>{qualification?.reasons?.join(' · ')}</p></article>
      <article><span>Recruiting entitlement</span><strong>{eligibility.data.entitlement ? 'Active' : 'Not active'}</strong><p>{eligibility.data.entitlement ? `Valid until ${new Date(eligibility.data.entitlement.validUntil).toLocaleDateString()}` : 'Finance must confirm an invoice before recruiting begins.'}</p></article>
      <article><span>Program capacity</span><strong>{eligibility.data.limits ? `${eligibility.data.limits.activePrograms} / ${eligibility.data.limits.programLimit}` : 'Unavailable'}</strong><p>Entitlement-backed recurring programs</p></article>
    </section> : null}</AsyncState>
    <section className="evergreen-section"><div className="evergreen-section-heading"><div><p className="evergreen-kicker">Programs</p><h2>Recurring placement programs</h2></div></div>
      <AsyncState {...programs} onRetry={programs.reload} empty={!programs.data?.data?.length ? 'Create a program once, then let each eligible cohort recur from it.' : ''}>
        <div className="evergreen-list">{programs.data?.data?.map((program) => <Link className="evergreen-row" key={program.id} to={`/business/evergreen/programs/${program.id}`}><span><strong>{program.title}</strong><small>{program.placementType} · {program.workMode} · {program.defaultSeatCount} seats</small></span><span><Status>{program.status}</Status><small>Version {program.version}</small></span></Link>)}</div>
      </AsyncState>
    </section>
  </Layout>
}

function ProgramForm() {
  const navigate = useNavigate()
  const eligibility = useResource(evergreen.eligibility)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault(); setSubmitting(true); setError('')
    const values = new FormData(event.currentTarget)
    try {
      const result = await evergreen.createProgram({
        title: values.get('title'), description: values.get('description'), placementType: values.get('placementType'), workMode: values.get('workMode'), location: values.get('location') || undefined,
        durationWeeks: Number(values.get('durationWeeks')), defaultSeatCount: Number(values.get('defaultSeatCount')), stipendAmount: values.get('stipendAmount') ? Number(values.get('stipendAmount')) : undefined,
        currency: 'KES', stipendFrequency: values.get('stipendFrequency') || undefined, supervisionPlan: values.get('supervisionPlan'), learningOutcomes: String(values.get('learningOutcomes')).split('\n').filter(Boolean),
        recurrenceType: values.get('recurrenceType'), timezone: values.get('timezone'), skills: [], competencies: [], supervisorIds: [values.get('supervisorId')],
      })
      navigate(`/business/evergreen/programs/${result.data.id}`)
    } catch (caught) { setError(caught.message) } finally { setSubmitting(false) }
  }
  return <Layout surface="company" title="Create an Evergreen program" subtitle="Define the reusable role, supervision and recurrence contract. Cohorts inherit this specification.">
    <AsyncState {...eligibility} onRetry={eligibility.reload}>{eligibility.data && !eligibility.data.canCreateProgram ? <div className="evergreen-state"><strong>Program creation is restricted</strong><span>Complete qualification and activate a finance-confirmed entitlement first.</span></div> : <form className="evergreen-form" onSubmit={submit}>
      {error ? <p role="alert" className="evergreen-inline-error">{error}</p> : null}
      <label>Program title<input name="title" required minLength="3" /></label><label>Placement type<select name="placementType"><option>INTERNSHIP</option><option>ATTACHMENT</option></select></label>
      <label className="evergreen-span-2">Description<textarea name="description" required minLength="20" rows="4" /></label>
      <label>Work mode<select name="workMode"><option>ONSITE</option><option>HYBRID</option><option>REMOTE</option></select></label><label>Location<input name="location" placeholder="Nairobi or remote" /></label>
      <label>Duration in weeks<input name="durationWeeks" type="number" min="1" defaultValue="12" required /></label><label>Seats per cohort<input name="defaultSeatCount" type="number" min="1" defaultValue="2" required /></label>
      <label>Stipend amount (KES)<input name="stipendAmount" type="number" min="0" /></label><label>Stipend frequency<select name="stipendFrequency"><option value="">Not specified</option><option>MONTHLY</option><option>WEEKLY</option><option>TOTAL</option></select></label>
      <label>Recurrence<select name="recurrenceType"><option>MONTHLY</option><option>QUARTERLY</option><option>WEEKLY</option><option>NONE</option></select></label><label>Timezone<input name="timezone" defaultValue="Africa/Nairobi" required /></label>
      <label className="evergreen-span-2">Learning outcomes (one per line)<textarea name="learningOutcomes" required defaultValue="Apply verified skills in a supervised workplace\nSubmit evidence of competency growth" rows="3" /></label>
      <label className="evergreen-span-2">Supervision plan<textarea name="supervisionPlan" required minLength="20" rows="4" /></label>
      <label>Required supervisor<select name="supervisorId" required>{eligibility.data?.supervisors?.map((person) => <option key={person.id} value={person.id}>{person.name || person.email}</option>)}</select></label>
      <div className="evergreen-form-actions evergreen-span-2"><Link to="/business/evergreen">Cancel</Link><button className="evergreen-button" disabled={submitting}>{submitting ? 'Creating…' : 'Create draft'}</button></div>
    </form>}</AsyncState>
  </Layout>
}

function ProgramDetail() {
  const { programId } = useParams(); const navigate = useNavigate()
  const resource = useResource(() => evergreen.program(programId), programId)
  const [busy, setBusy] = useState(''); const [error, setError] = useState('')
  async function action(name, callback) { setBusy(name); setError(''); try { await callback(); await resource.reload() } catch (caught) { setError(caught.message) } finally { setBusy('') } }
  async function createCohort() {
    const now = new Date(); const opens = new Date(now.getTime() + 24 * 60 * 60 * 1000); const closes = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); const starts = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); const ends = new Date(starts.getTime() + (resource.data.data.durationWeeks * 7 * 24 * 60 * 60 * 1000))
    const result = await evergreen.createCohort(programId, { applicationOpensAt: opens, applicationClosesAt: closes, placementStartsAt: starts, placementEndsAt: ends, seatCount: resource.data.data.defaultSeatCount })
    navigate(`/business/evergreen/cohorts/${result.data.id}`)
  }
  const program = resource.data?.data
  return <Layout surface="company" title={program?.title || 'Program detail'} subtitle="Approval, cohort recurrence and supervision remain attached to this typed program.">
    <AsyncState {...resource} onRetry={resource.reload}>{program ? <><section className="evergreen-grid evergreen-summary-grid"><article><span>Status</span><strong><Status>{program.status}</Status></strong><p>Version {program.version}</p></article><article><span>Placement</span><strong>{program.placementType}</strong><p>{program.workMode} · {program.durationWeeks} weeks</p></article><article><span>Recurring intake</span><strong>{program.recurrenceType}</strong><p>{program.defaultSeatCount} seats · {program.timezone}</p></article></section>
      {error ? <p role="alert" className="evergreen-inline-error">{error}</p> : null}<div className="evergreen-actions">{resource.data.allowedActions.submit ? <button onClick={() => action('submit', () => evergreen.submitProgram(programId))} disabled={busy}>Submit for review</button> : null}{resource.data.allowedActions.pause ? <button onClick={() => action('pause', () => evergreen.pauseProgram(programId))} disabled={busy}>Pause program</button> : null}{resource.data.allowedActions.createCohort ? <button className="evergreen-button" onClick={() => action('cohort', createCohort)} disabled={busy}>Plan next cohort</button> : null}</div>
      <section className="evergreen-section"><h2>Cohorts</h2><div className="evergreen-list">{program.cohorts?.map((cohort) => <Link className="evergreen-row" to={`/business/evergreen/cohorts/${cohort.id}`} key={cohort.id}><span><strong>Cohort {cohort.sequenceNumber}</strong><small>{new Date(cohort.placementStartsAt).toLocaleDateString()} – {new Date(cohort.placementEndsAt).toLocaleDateString()}</small></span><span><Status>{cohort.status}</Status><small>{cohort.filledSeats}/{cohort.seatCount} accepted</small></span></Link>)}</div></section></> : null}</AsyncState>
  </Layout>
}

function CohortDetail() {
  const { cohortId } = useParams(); const cohort = useResource(() => evergreen.cohort(cohortId), cohortId); const candidates = useResource(() => evergreen.candidates(cohortId), cohortId); const eligibility = useResource(evergreen.eligibility); const [message, setMessage] = useState('')
  async function move(id, action, body) { try { await evergreen.candidateAction(id, action, body); setMessage('Candidate pipeline updated.'); await candidates.reload() } catch (error) { setMessage(error.message) } }
  async function prepareOffer(candidate) {
    const role = window.prompt('Formal role title', cohort.data?.data?.program?.title || '')
    if (!role) return
    const supervisorId = eligibility.data?.supervisors?.[0]?.id
    if (!supervisorId) { setMessage('Assign a valid company supervisor before drafting an offer.'); return }
    try {
      const startDate = new Date(cohort.data.data.placementStartsAt)
      const endDate = new Date(cohort.data.data.placementEndsAt)
      const respondBy = new Date(Math.min(Date.now() + 7 * 86400000, startDate.getTime() - 86400000))
      const result = await evergreen.createOffer(candidate.id, { supervisorId, role, duties: `Complete the supervised responsibilities defined by the ${cohort.data.data.program.title} program.`, placementType: cohort.data.data.program.placementType, workMode: cohort.data.data.program.workMode, location: cohort.data.data.program.location || undefined, stipendAmount: cohort.data.data.program.stipendAmount == null ? undefined : Number(cohort.data.data.program.stipendAmount), currency: cohort.data.data.program.currency, stipendFrequency: cohort.data.data.program.stipendFrequency || undefined, startDate, endDate, respondBy, expectations: cohort.data.data.program.learningOutcomes, policyLinks: [] })
      await evergreen.sendOffer(result.data.id)
      setMessage('Formal offer sent. The student remains unlocked until they accept.'); await candidates.reload()
    } catch (error) { setMessage(error.message) }
  }
  return <Layout surface="company" title={cohort.data ? `Cohort ${cohort.data.data.sequenceNumber}` : 'Cohort'} subtitle="Open is recruiting. Live starts only when an accepted placement has begun.">
    <AsyncState {...cohort} onRetry={cohort.reload}>{cohort.data ? <section className="evergreen-grid evergreen-summary-grid"><article><span>Lifecycle</span><strong><Status>{cohort.data.data.status}</Status></strong><p>{cohort.data.allowedActions.live ? 'At least one placement has started.' : 'No live placement is implied by an open cohort.'}</p></article><article><span>Seats</span><strong>{cohort.data.data.filledSeats} / {cohort.data.data.seatCount}</strong><p>Accepted placements</p></article><article><span>Applications close</span><strong>{new Date(cohort.data.data.applicationClosesAt).toLocaleDateString()}</strong><p>Placement starts {new Date(cohort.data.data.placementStartsAt).toLocaleDateString()}</p></article></section> : null}</AsyncState>
    {message ? <p className="evergreen-inline-message" role="status">{message}</p> : null}
    <section className="evergreen-section"><h2>Candidate pipeline</h2><AsyncState {...candidates} onRetry={candidates.reload} empty={!candidates.data?.data?.length ? 'No candidates yet. This is different from a failed matching run.' : ''}><div className="evergreen-list">{candidates.data?.data?.map((candidate) => <div className="evergreen-row" key={candidate.id}><span><strong>{candidate.name || 'Consented candidate'}</strong><small>{candidate.campus || 'Campus hidden'} · {candidate.matchReasons?.join(' · ') || 'Direct applicant'}</small></span><span className="evergreen-row-actions"><Status>{candidate.status}</Status>{candidate.status === 'MATCHED' ? <button onClick={() => move(candidate.id, 'invite')}>Invite</button> : null}{['INVITED', 'APPLIED'].includes(candidate.status) ? <button onClick={() => move(candidate.id, 'shortlist')}>Shortlist</button> : null}{candidate.status === 'SHORTLISTED' ? <button onClick={() => move(candidate.id, 'interviews')}>Interview</button> : null}{candidate.status === 'INTERVIEWING' ? <button className="evergreen-button" onClick={() => prepareOffer(candidate)}>Prepare and send offer</button> : null}{!['ACCEPTED', 'COMPLETED', 'REJECTED', 'OFFERED'].includes(candidate.status) ? <button onClick={() => move(candidate.id, 'reject', { reason: 'Not selected after human review' })}>Reject</button> : null}</span></div>)}</div></AsyncState></section>
  </Layout>
}

function StudentWorkspace({ view }) {
  const readiness = useResource(evergreen.readiness)
  const dataResource = useResource(view === 'offers' ? evergreen.offers : view === 'placements' ? evergreen.placements : evergreen.matches, view)
  const [message, setMessage] = useState('')
  async function accept(id) { if (!window.confirm('Accepting creates an exclusive active placement and closes incompatible open offers. Continue?')) return; try { await evergreen.acceptOffer(id); setMessage('Offer accepted. Your exclusive placement is ready for onboarding.'); await dataResource.reload() } catch (error) { setMessage(error.message) } }
  async function saveAvailability(event) { event.preventDefault(); const form = new FormData(event.currentTarget); try { await evergreen.setAvailability({ isSeeking: true, placementTypes: [form.get('type')], workModes: [form.get('mode')], locations: form.get('location') ? [form.get('location')] : [], roleInterests: String(form.get('roles')).split(',').map((item) => item.trim()).filter(Boolean), consentVersion: 'evergreen-student-v1', companyVisibleFields: ['name', 'avatarUrl', 'campus', 'course', 'careerPath', 'skills', 'competencies', 'portfolio', 'roleInterests', 'workModes', 'locations'], expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) }); setMessage('Availability and company-visible consent saved.'); await readiness.reload() } catch (error) { setMessage(error.message) } }
  const title = view === 'offers' ? 'Placement offers' : view === 'placements' ? 'My placements' : view === 'matches' ? 'Explained matches' : 'Placement readiness'
  const items = dataResource.data?.data || []
  return <Layout surface="student" title={title} subtitle="Control your visibility, understand every match, and keep one exclusive active placement at a time." actions={<><Link to="/campus/career/evergreen/matches">Matches</Link><Link to="/campus/career/evergreen/offers">Offers</Link><Link to="/campus/career/evergreen/placements">Placements</Link></>}>
    {message ? <p className="evergreen-inline-message" role="status">{message}</p> : null}
    {view === 'readiness' ? <AsyncState {...readiness} onRetry={readiness.reload}>{readiness.data ? <><section className="evergreen-grid evergreen-summary-grid"><article><span>Readiness</span><strong>{readiness.data.ready ? 'Verified' : 'Not ready yet'}</strong><p>{readiness.data.gaps?.join(' · ') || 'Identity, transition access and roadmap evidence are ready.'}</p></article><article><span>Availability</span><strong>{readiness.data.availability?.isSeeking ? 'Seeking placement' : readiness.data.availability?.pausedAt ? 'Paused' : 'Not enabled'}</strong><p>{readiness.data.activePlacement ? 'An exclusive placement is active.' : 'No active placement lock.'}</p></article><article><span>Verified evidence</span><strong>{readiness.data.verifiedCompetencies?.length || 0} competencies</strong><p>{readiness.data.verifiedRoadmaps?.length || 0} verified roadmaps</p></article></section>
      <form className="evergreen-form evergreen-availability" onSubmit={saveAvailability}><h2 className="evergreen-span-2">Availability and privacy</h2><label>Placement type<select name="type"><option>INTERNSHIP</option><option>ATTACHMENT</option></select></label><label>Work mode<select name="mode"><option>REMOTE</option><option>HYBRID</option><option>ONSITE</option></select></label><label>Preferred location<input name="location" /></label><label>Role interests, comma separated<input name="roles" /></label><p className="evergreen-consent evergreen-span-2">By enabling discovery, you consent to share your name, campus, course, career path, verified skills and competencies, public portfolio, and the preferences above with qualified, entitled companies for matching.</p><div className="evergreen-form-actions evergreen-span-2"><button className="evergreen-button">Enable or reconfirm discovery</button><button type="button" onClick={async () => { await evergreen.pauseAvailability(); setMessage('Availability paused.'); await readiness.reload() }}>Pause availability</button></div></form></> : null}</AsyncState>
      : <AsyncState {...dataResource} onRetry={dataResource.reload} empty={!items.length ? (view === 'matches' ? 'No matches yet. If matching fails, Zumbarl will show a separate retry state.' : `No ${view} yet.`) : ''}><div className="evergreen-list">{items.map((item) => {
        const offer = view === 'offers' ? item : null; const program = offer?.candidate?.cohort?.program || item.cohort?.program; const placement = view === 'placements' ? item : null
        return <div className="evergreen-row" key={item.id}><span><strong>{placement?.role || offer?.role || program?.title || 'Evergreen placement'}</strong><small>{offer ? `${offer.company.name} · respond by ${new Date(offer.respondBy).toLocaleDateString()}` : placement ? `${placement.company.name} · ${new Date(placement.startDate).toLocaleDateString()}` : item.matchReasons?.join(' · ')}</small></span><span className="evergreen-row-actions"><Status>{item.status}</Status>{view === 'matches' ? <button onClick={async () => { try { await evergreen.apply(item.cohortId); setMessage('Application submitted.'); await dataResource.reload() } catch (error) { setMessage(error.message) } }}>Apply</button> : null}{offer && ['SENT', 'VIEWED'].includes(offer.status) ? <><button className="evergreen-button" onClick={() => accept(offer.id)}>Accept</button><button onClick={async () => { await evergreen.declineOffer(offer.id, 'Declined by student'); await dataResource.reload() }}>Decline</button></> : null}{placement ? <Link to={`/campus/career/evergreen/placements/${placement.id}`}>Open workspace</Link> : null}</span></div>
      })}</div></AsyncState>}
  </Layout>
}

function PlacementDetail({ surface = 'student' }) {
  const { placementId } = useParams(); const resource = useResource(() => evergreen.placement(placementId), placementId); const [message, setMessage] = useState('')
  const placement = resource.data?.data
  const canAmend = surface === 'student' || (surface === 'company' && resource.data?.allowedActions?.supervise)
  return <Layout surface={surface} title={placement?.role || 'Placement workspace'} subtitle="Onboarding, goals, check-ins, verified evidence and completion stay in one supervised record.">
    <AsyncState {...resource} onRetry={resource.reload}>{placement ? <><section className="evergreen-grid evergreen-summary-grid"><article><span>Status</span><strong><Status>{placement.status}</Status></strong><p>{placement.activeLock ? 'Exclusive active-placement lock held' : 'No active lock'}</p></article><article><span>Company</span><strong>{placement.company.name}</strong><p>{placement.supervisor?.user?.name || 'Supervisor assignment pending'}</p></article><article><span>Dates</span><strong>{new Date(placement.startDate).toLocaleDateString()}</strong><p>to {new Date(placement.endDate).toLocaleDateString()}</p></article></section>
      {message ? <p className="evergreen-inline-message">{message}</p> : null}<section className="evergreen-section"><h2>Goals and evidence</h2><div className="evergreen-list">{placement.goals.map((goal) => <div className="evergreen-row" key={goal.id}><span><strong>{goal.title}</strong><small>{goal.description}</small></span><Status>{goal.status}</Status></div>)}</div></section>
      <section className="evergreen-section"><h2>Onboarding checklist</h2><div className="evergreen-list">{placement.onboardingItems.map((item) => <div className="evergreen-row" key={item.id}><span><strong>{item.label}</strong><small>{item.ownerType === 'STUDENT' ? 'Student action' : 'Company action'}</small></span><span className="evergreen-row-actions"><Status>{item.completedAt ? 'COMPLETED' : 'PENDING'}</Status>{!item.completedAt && ((surface === 'student' && item.ownerType === 'STUDENT') || (surface === 'company' && item.ownerType === 'COMPANY')) ? <button onClick={async () => { try { await evergreen.completeOnboarding(placementId, item.id); setMessage('Onboarding item completed.'); await resource.reload() } catch (error) { setMessage(error.message) } }}>Mark complete</button> : null}</span></div>)}</div></section>
      <section className="evergreen-section"><h2>Evidence review</h2><div className="evergreen-list">{placement.evidence.length ? placement.evidence.map((evidence) => <div className="evergreen-row" key={evidence.id}><span><strong>{evidence.title}</strong><small>{evidence.evidenceType} · {evidence.artifactReference}</small></span><span className="evergreen-row-actions"><Status>{evidence.status}</Status>{surface === 'company' && evidence.status === 'SUBMITTED' ? <button onClick={async () => { try { await evergreen.verifyEvidence(placementId, evidence.id); setMessage('Evidence verified.'); await resource.reload() } catch (error) { setMessage(error.message) } }}>Verify evidence</button> : null}</span></div>) : <div className="evergreen-state">No placement evidence submitted yet.</div>}</div></section>
      <section className="evergreen-section"><h2>Terms amendments</h2><div className="evergreen-list">{placement.amendments.length ? placement.amendments.map((amendment) => <div className="evergreen-row" key={amendment.id}><span><strong>Amendment {amendment.version}</strong><small>{amendment.reason}</small></span><span className="evergreen-row-actions"><Status>{amendment.status}</Status>{canAmend && amendment.status === 'PROPOSED' ? <><button onClick={async () => { try { await evergreen.decideAmendment(placementId, amendment.id, { decision: 'ACCEPT' }); setMessage('Amendment accepted. It applies only after both parties accept.'); await resource.reload() } catch (error) { setMessage(error.message) } }}>Accept</button><button onClick={async () => { const reason = window.prompt('Reason for rejecting this amendment'); if (!reason) return; await evergreen.decideAmendment(placementId, amendment.id, { decision: 'REJECT', reason }); await resource.reload() }}>Reject</button></> : null}</span></div>) : <div className="evergreen-state">No terms amendments.</div>}</div>
        {canAmend && !['COMPLETED', 'CANCELLED_BEFORE_START', 'TERMINATED'].includes(placement.status) ? <form className="evergreen-form" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); try { await evergreen.createAmendment(placementId, { reason: form.get('reason'), changes: { location: form.get('location') } }); setMessage('Amendment proposed. Both parties must accept before it changes the placement.'); event.currentTarget.reset(); await resource.reload() } catch (error) { setMessage(error.message) } }}><label>Proposed location<input name="location" required /></label><label>Reason<textarea name="reason" minLength="10" required /></label><button>Propose amendment</button></form> : null}
      </section>
      {resource.data.allowedActions.submitCheckIn ? <form className="evergreen-form" onSubmit={async (event) => { event.preventDefault(); const note = new FormData(event.currentTarget).get('reflection'); const now = new Date(); try { await evergreen.submitCheckIn(placementId, { periodStartsAt: new Date(now.getTime() - 7 * 86400000), periodEndsAt: now, dueAt: now, studentReflection: note }); setMessage('Check-in submitted.'); event.currentTarget.reset(); await resource.reload() } catch (error) { setMessage(error.message) } }}><label className="evergreen-span-2">Weekly reflection<textarea name="reflection" minLength="10" required /></label><button className="evergreen-button">Submit check-in</button></form> : null}
      {surface === 'student' ? <><form className="evergreen-form" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); try { await evergreen.submitEvidence(placementId, { evidenceType: 'URL', title: form.get('title'), artifactReference: form.get('url'), description: form.get('description') }); setMessage('Evidence submitted for verification.'); event.currentTarget.reset(); await resource.reload() } catch (error) { setMessage(error.message) } }}><label>Evidence title<input name="title" required /></label><label>Artifact URL<input name="url" type="url" required /></label><label className="evergreen-span-2">What this proves<textarea name="description" /></label><button className="evergreen-button">Submit evidence</button></form><form className="evergreen-form" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); try { await evergreen.requestSupport(placementId, { category: form.get('category'), summary: form.get('summary'), privateDetails: form.get('privateDetails') || undefined }); setMessage('Your protected request was sent to operations. Private details are not shared with the company.'); event.currentTarget.reset() } catch (error) { setMessage(error.message) } }}><h2 className="evergreen-span-2">Private help</h2><label>Category<select name="category"><option>SUPERVISION</option><option>SAFETY</option><option>HARASSMENT</option><option>PAYMENT</option><option>WELLBEING</option><option>ACCESSIBILITY</option><option>OTHER</option></select></label><label>Summary<input name="summary" minLength="10" required /></label><label className="evergreen-span-2">Private details<textarea name="privateDetails" /></label><button>Contact operations privately</button></form></> : null}
      {surface === 'company' && resource.data.allowedActions.supervise ? <><form className="evergreen-form" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); try { await evergreen.createGoal(placementId, { title: form.get('title'), description: form.get('description') }); setMessage('Placement goal added.'); event.currentTarget.reset(); await resource.reload() } catch (error) { setMessage(error.message) } }}><label>Goal title<input name="title" required /></label><label>Expected outcome<input name="description" required /></label><button className="evergreen-button">Add goal</button></form>{['ACTIVE', 'COMPLETION_REVIEW'].includes(placement.status) && !placement.evaluations.some((item) => item.evaluatorType === 'SUPERVISOR') ? <form className="evergreen-form" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); try { await evergreen.createEvaluation(placementId, { rubricScores: { overall: Number(form.get('score')) }, narrative: form.get('narrative'), recommendation: form.get('recommendation'), visibility: 'SHARED' }); setMessage('Supervisor completion evaluation submitted.'); event.currentTarget.reset(); await resource.reload() } catch (error) { setMessage(error.message) } }}><h2 className="evergreen-span-2">Supervisor evaluation</h2><label>Overall score (0–5)<input name="score" type="number" min="0" max="5" step="1" required /></label><label>Recommendation<input name="recommendation" /></label><label className="evergreen-span-2">Structured feedback<textarea name="narrative" minLength="10" required /></label><button>Submit evaluation</button></form> : null}<div className="evergreen-actions">{placement.status === 'READY' ? <button className="evergreen-button" onClick={async () => { await evergreen.startPlacement(placementId); await resource.reload() }}>Start placement</button> : null}{placement.status === 'COMPLETION_REVIEW' ? <button className="evergreen-button" onClick={async () => { try { await evergreen.completePlacement(placementId, 'Supervisor approved verified completion'); setMessage('Placement completed. The active lock was released and availability now requires reconfirmation.'); await resource.reload() } catch (error) { setMessage(error.message) } }}>Approve completion</button> : null}{['PENDING_ONBOARDING', 'READY', 'DEFERRED'].includes(placement.status) ? <button onClick={async () => { const reason = window.prompt('Cancellation reason (recorded in placement history)'); if (!reason) return; try { await evergreen.cancelPlacement(placementId, reason); setMessage('Placement cancelled and the exclusive lock released. Availability remains paused until the student reconfirms.'); await resource.reload() } catch (error) { setMessage(error.message) } }}>Cancel before start</button> : null}</div></> : null}
      {resource.data.allowedActions.submitCompletion ? <button onClick={async () => { try { await evergreen.submitCompletion(placementId, 'Student completion materials submitted'); setMessage('Completion submitted for review.'); await resource.reload() } catch (error) { setMessage(error.message) } }}>Submit completion</button> : null}</> : null}</AsyncState>
  </Layout>
}

function OperationsWorkspace({ view }) {
  const resource = useResource(view === 'placements' ? evergreen.placementAlerts : evergreen.programReviews, view); const [message, setMessage] = useState(''); const items = resource.data?.data || []
  return <Layout surface="operations" title={view === 'placements' ? 'Placement alerts' : 'Program review'} subtitle="Review exceptions and recover durable Evergreen work without broad access to unrelated sensitive data.">
    {message ? <p className="evergreen-inline-message">{message}</p> : null}<AsyncState {...resource} onRetry={resource.reload} empty={!items.length ? `No ${view === 'placements' ? 'placement alerts' : 'programs awaiting review'}.` : ''}><div className="evergreen-list">{items.map((item) => <div className="evergreen-row" key={item.id}><span><strong>{item.title || item.role}</strong><small>{item.company?.name} · updated {new Date(item.updatedAt).toLocaleDateString()}</small></span><span className="evergreen-row-actions"><Status>{item.status}</Status>{view !== 'placements' ? <><button className="evergreen-button" onClick={async () => { try { await evergreen.approveProgram(item.id); setMessage('Program approved.'); await resource.reload() } catch (error) { setMessage(error.message) } }}>Approve</button><button onClick={async () => { const reason = window.prompt('Required changes'); if (!reason) return; await evergreen.requestChanges(item.id, reason); await resource.reload() }}>Request changes</button></> : null}</span></div>)}</div></AsyncState>
  </Layout>
}

function SupportRequestsWorkspace() {
  const resource = useResource(evergreen.supportRequests); const [message, setMessage] = useState(''); const items = resource.data?.data || []
  const failures = useResource(evergreen.failures)
  return <Layout surface="operations" title="Protected placement support" subtitle="Private student escalations are restricted to operations and every read or resolution is audited.">
    {message ? <p className="evergreen-inline-message">{message}</p> : null}<AsyncState {...resource} onRetry={resource.reload} empty={!items.length ? 'No open protected support requests.' : ''}><div className="evergreen-list">{items.map((item) => <div className="evergreen-row" key={item.id}><span><strong>{item.category}</strong><small>{item.summary} · placement {item.placementId}</small></span><span className="evergreen-row-actions"><Status>{item.status}</Status><button onClick={async () => { const resolution = window.prompt('Document the protected resolution'); if (!resolution) return; try { await evergreen.resolveSupportRequest(item.id, resolution); setMessage('Support request resolved and audited.'); await resource.reload() } catch (error) { setMessage(error.message) } }}>Resolve</button></span></div>)}</div></AsyncState>
    <section className="evergreen-section"><h2>Failed jobs and events</h2><AsyncState {...failures} onRetry={failures.reload}>{failures.data ? <><div className="evergreen-list">{failures.data.data.events.map((event) => <div className="evergreen-row" key={event.id}><span><strong>{event.eventType}</strong><small>{event.lastError || 'Delivery exhausted its retry budget.'}</small></span><span className="evergreen-row-actions"><Status>{event.status}</Status><button onClick={async () => { try { await evergreen.replayEvent(event.id); setMessage('Event queued for idempotent replay.'); await failures.reload() } catch (error) { setMessage(error.message) } }}>Replay</button></span></div>)}</div><p>{failures.data.data.jobs.length} failed job runs are retained for investigation.</p></> : null}</AsyncState></section>
    <form className="evergreen-form" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); try { await evergreen.createMentorshipAlternative({ companyId: form.get('companyId'), studentId: form.get('studentId'), type: form.get('type'), description: form.get('description'), completedAt: new Date(form.get('completedAt')), evidence: form.get('evidence') ? { reference: form.get('evidence') } : undefined }); setMessage('Mentorship alternative approved and added to the repeat-hire guardrail history.'); event.currentTarget.reset() } catch (error) { setMessage(error.message) } }}><h2 className="evergreen-span-2">Approve mentorship alternative</h2><label>Company ID<input name="companyId" required /></label><label>Student ID<input name="studentId" required /></label><label>Type<select name="type"><option>OFFICE_TOUR</option><option>SHADOWING</option><option>STRUCTURED_PERFORMANCE_ADVICE</option><option>OTHER</option></select></label><label>Completed at<input name="completedAt" type="date" required /></label><label className="evergreen-span-2">Description<textarea name="description" minLength="20" required /></label><label className="evergreen-span-2">Evidence reference<input name="evidence" /></label><button>Approve alternative</button></form>
  </Layout>
}

function BillingWorkspace() {
  const [invoice, setInvoice] = useState(null); const [entitlement, setEntitlement] = useState(null); const [message, setMessage] = useState('')
  return <Layout surface="operations" title="Evergreen billing" subtitle="Only finance-confirmed settlement activates a dated recruiting entitlement."><form className="evergreen-form" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); try { const result = await evergreen.createInvoice({ companyId: form.get('companyId'), invoiceNumber: form.get('invoiceNumber'), amount: Number(form.get('amount')), currency: 'KES', idempotencyKey: crypto.randomUUID(), dueAt: new Date(Date.now() + 14 * 86400000) }); setInvoice(result.data); setMessage('Invoice issued. It has not activated service.') } catch (error) { setMessage(error.message) } }}><h2 className="evergreen-span-2">Issue manual invoice</h2><label>Company ID<input name="companyId" required /></label><label>Invoice number<input name="invoiceNumber" required /></label><label>Amount (KES)<input name="amount" type="number" min="1" required /></label><button className="evergreen-button">Issue invoice</button></form>{message ? <p className="evergreen-inline-message">{message}</p> : null}{invoice ? <section className="evergreen-section"><h2>Settlement and entitlement</h2><p>Invoice {invoice.invoiceNumber} was issued without activating service. Confirm only after finance has verified settlement.</p>{!entitlement ? <button className="evergreen-button" onClick={async () => { const reference = window.prompt('Verified settlement reference'); if (!reference) return; try { const result = await evergreen.confirmInvoice(invoice.id, { externalReference: reference, planCode: 'EVERGREEN_MVP', programLimit: 3, seatLimit: 20, validFrom: new Date(), validUntil: new Date(Date.now() + 365 * 86400000) }); setEntitlement(result.data); setMessage('Settlement confirmed and dated entitlement activated.') } catch (error) { setMessage(error.message) } }}>Confirm verified settlement</button> : <div className="evergreen-actions"><button onClick={async () => { const reason = window.prompt('Reason for suspending recruiting'); if (!reason) return; try { const result = await evergreen.changeEntitlementStatus(entitlement.id, { action: 'SUSPEND', reason }); setEntitlement(result.data); setMessage('New recruiting actions are suspended; active placements remain accessible.') } catch (error) { setMessage(error.message) } }}>Suspend entitlement</button><button onClick={async () => { const reason = window.prompt('Refund reason'); if (!reason) return; try { await evergreen.refundInvoice(invoice.id, reason); setMessage('Invoice refunded and recruiting entitlement revoked. History remains available.'); setEntitlement(null) } catch (error) { setMessage(error.message) } }}>Refund invoice</button></div>}</section> : null}</Layout>
}

function EvergreenWorkspacePage({ surface = 'company', view = 'overview' }) {
  const resolvedStudentView = useMemo(() => view === 'overview' ? 'readiness' : view, [view])
  if (surface === 'company' && view === 'overview') return <CompanyOverview />
  if (surface === 'company' && view === 'new-program') return <ProgramForm />
  if (surface === 'company' && view === 'program') return <ProgramDetail />
  if (surface === 'company' && view === 'cohort') return <CohortDetail />
  if (view === 'placement') return <PlacementDetail surface={surface} />
  if (surface === 'student') return <StudentWorkspace view={resolvedStudentView} />
  if (view === 'billing') return <BillingWorkspace />
  if (view === 'exceptions') return <SupportRequestsWorkspace />
  return <OperationsWorkspace view={view} />
}

export default EvergreenWorkspacePage
