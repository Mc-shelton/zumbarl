import { useEffect, useState } from 'react'
import { FiArrowRight, FiAward, FiBookOpen, FiBriefcase, FiCalendar, FiCheck, FiPlus, FiSearch, FiTrendingUp, FiUsers, FiX, FiZap } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { createProfileSkill, searchProfileSkills } from '../../profile/services/profileSkillService'

function CoachLink({ href, children }) {
  return href ? <Link to={href}>{children}<FiArrowRight aria-hidden="true" /></Link> : <span>{children}</span>
}

function CareerCoachPanel({ plan, saving, onSave }) {
  const [selectedSkillIds, setSelectedSkillIds] = useState(() => plan?.focus?.selectedSkillIds || [])
  const [weeklyTarget, setWeeklyTarget] = useState(() => plan?.focus?.weeklyTarget || 3)
  const [skillQuery, setSkillQuery] = useState('')
  const [skillResults, setSkillResults] = useState([])
  const [extraSkills, setExtraSkills] = useState([])
  const [skillError, setSkillError] = useState('')

  useEffect(() => {
    let active = true
    const timeout = setTimeout(() => {
      if (!skillQuery.trim()) { setSkillResults([]); return }
      searchProfileSkills(skillQuery).then((payload) => { if (active) setSkillResults(payload?.data || []) }).catch(() => { if (active) setSkillResults([]) })
    }, 180)
    return () => { active = false; clearTimeout(timeout) }
  }, [skillQuery])

  if (!plan) return null
  const availableSkills = [...new Map([...plan.focus.availableSkills, ...extraSkills].map((skill) => [skill.id, skill])).values()]
  const selectedSkills = availableSkills.filter((skill) => selectedSkillIds.includes(skill.id))
  const addSkill = (skill) => {
    setExtraSkills((current) => current.some((item) => item.id === skill.id) ? current : [...current, skill])
    setSelectedSkillIds((current) => current.includes(skill.id) || current.length >= 20 ? current : [...current, skill.id])
    setSkillQuery('')
  }
  const createSkill = async () => {
    setSkillError('')
    try { addSkill(await createProfileSkill(skillQuery.trim())) } catch (error) { setSkillError(error.message) }
  }
  const changed = weeklyTarget !== plan.focus.weeklyTarget
    || selectedSkillIds.join('|') !== plan.focus.selectedSkillIds.join('|')

  return <section className="career-coach" aria-labelledby="career-coach-heading">
    <header className="career-coach-header">
      <div><span className="learn-eyebrow">Your career coach</span><h2 id="career-coach-heading">One plan from learning to placement</h2><p>Your focus skills now shape what to learn, where to practise, who can help, and which roles become possible.</p></div>
      <div className="career-coach-level"><FiAward aria-hidden="true" /><span>Level {plan.game.level}</span><strong>{plan.game.levelName}</strong><small>{plan.game.xp} XP</small></div>
    </header>

    <div className="career-coach-progress">
      <div><span>Next level</span><strong>{plan.game.nextLevelXp ? `${plan.game.nextLevelXp - plan.game.xp} XP to go` : 'Highest level reached'}</strong><i><b style={{ width: `${plan.game.progressToNextLevel}%` }} /></i></div>
      <div><span>Practice streak</span><strong>{plan.game.streakWeeks} {plan.game.streakWeeks === 1 ? 'week' : 'weeks'}</strong></div>
      <div><span>This week</span><strong>{plan.game.weeklyProgress}/{plan.game.weeklyTarget} resources</strong></div>
    </div>

    <div className="career-focus-editor">
      <div><h3>Skills in my version of this path</h3><p>Add or remove skills freely. These changes belong only to your path and drive its resources, work matches, and verification.</p></div>
      <div className="career-focus-skills">
        {selectedSkills.map((skill) => <button key={skill.id} type="button" className="is-selected" onClick={() => setSelectedSkillIds((current) => current.filter((id) => id !== skill.id))} aria-label={`Remove ${skill.name}`}>{skill.verified ? <FiCheck aria-hidden="true" /> : null}{skill.name}{skill.verified && <small>Work verified</small>}<FiX aria-hidden="true" /></button>)}
      </div>
      <div className="career-skill-search"><FiSearch /><input value={skillQuery} onChange={(event) => setSkillQuery(event.target.value)} placeholder="Search or create a skill" /></div>
      {skillQuery.trim() && <div className="career-skill-results">{skillResults.filter((skill) => !selectedSkillIds.includes(skill.id)).slice(0, 6).map((skill) => <button key={skill.id} type="button" onClick={() => addSkill(skill)}><FiPlus />{skill.name}</button>)}{!skillResults.some((skill) => skill.name.toLowerCase() === skillQuery.trim().toLowerCase()) && skillQuery.trim().length >= 2 && <button type="button" onClick={createSkill}><FiPlus />Create “{skillQuery.trim()}”</button>}</div>}
      {skillError && <p className="learn-inline-error">{skillError}</p>}
      <label><span>Resources per week</span><select value={weeklyTarget} onChange={(event) => setWeeklyTarget(Number(event.target.value))}>{Array.from({ length: 14 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value} {value === 1 ? 'resource' : 'resources'}</option>)}</select></label>
      <button type="button" className="learn-primary-btn" disabled={saving || !selectedSkillIds.length || !changed} onClick={() => onSave(selectedSkillIds, weeklyTarget)}>{plan.focus.configured ? 'Update coaching plan' : 'Activate coaching plan'}</button>
    </div>

    <div className="career-quest-list">
      {plan.game.quests.map((quest) => <CoachLink key={quest.id} href={quest.complete ? null : quest.href}><span className={quest.complete ? 'is-complete' : ''}>{quest.complete ? <FiCheck /> : <FiZap />}</span><strong>{quest.label}</strong><small>{quest.complete ? 'Done this week' : '+ progress and XP'}</small></CoachLink>)}
    </div>

    <div className="career-coach-grid">
      <article><h3><FiBookOpen />Learn and practise</h3>
        {plan.resources.slice(0, 3).map((resource) => <CoachLink key={resource.id} href={`/campus/learn/${plan.enrollmentId}/checkpoints/${resource.checkpointId}/practice/${resource.id}`}><span><strong>{resource.title}</strong><small>{resource.provider || resource.type}</small></span></CoachLink>)}
        {plan.opportunities.slice(0, 3).map((item) => <CoachLink key={item.id} href={`/campus/opportunities?opportunity=${encodeURIComponent(item.id)}&view=activity`}><span><strong>{item.title}</strong><small>{item.matchScore}% match · {item.companyName}</small></span></CoachLink>)}
        {!plan.resources.length && !plan.opportunities.length && <p>Add a focus skill or refresh your resources to find relevant practice.</p>}
      </article>

      <article><h3><FiCalendar />Industry exposure</h3>
        {plan.events.slice(0, 3).map((event) => <CoachLink key={event.id} href={`/campus?q=${encodeURIComponent(event.title)}`}><span><strong>{event.title}</strong><small>{event.organizerName} · {new Date(event.startsAt).toLocaleDateString()}</small></span></CoachLink>)}
        {plan.companyUpdates.slice(0, 3).map((update) => <CoachLink key={update.id} href={update.company.slug ? `/campus/organizations/${encodeURIComponent(update.company.slug)}` : '/campus'}><span><strong>{update.company.name}</strong><small>{update.body}</small></span></CoachLink>)}
        {!plan.events.length && !plan.companyUpdates.length && <p>No skill-related events or company updates yet. We’ll keep watching your network.</p>}
      </article>

      <article><h3><FiUsers />People who can coach you</h3>
        {plan.coaches.map((coach) => <CoachLink key={coach.id} href={`/campus/profiles/${encodeURIComponent(coach.id)}`}><span><strong>{coach.name}</strong><small>{coach.skills.map((skill) => skill.name).join(' · ')} · {coach.campus}</small></span></CoachLink>)}
        {!plan.coaches.length && <p>Follow or connect with people who practise these skills to find peer coaches here.</p>}
      </article>

      <article><h3><FiBriefcase />Career possibility map</h3>
        {plan.placements.map((placement) => <CoachLink key={placement.id} href="/campus/career/evergreen/matches"><span><strong>{placement.title}</strong><small>{placement.companyName} · {placement.status} · {Math.round(placement.matchScore)}% match</small></span></CoachLink>)}
        {plan.possibilities.map((possibility) => <CoachLink key={possibility.id} href="/campus/career/evergreen/readiness"><span><strong>{possibility.title}</strong><small>{possibility.companyName} · {possibility.matchingSkills.join(', ')}</small></span></CoachLink>)}
        {!plan.placements.length && !plan.possibilities.length && <p>Your roadmap shows what to build next. Matching placement programs will appear as your evidence grows.</p>}
        <Link className="career-coach-see-all" to="/campus/career/evergreen/readiness"><FiTrendingUp />Check placement readiness<FiArrowRight /></Link>
      </article>
    </div>
  </section>
}

export default CareerCoachPanel
