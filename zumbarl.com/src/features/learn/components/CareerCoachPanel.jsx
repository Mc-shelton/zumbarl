import { useState } from 'react'
import { FiArrowRight, FiAward, FiBookOpen, FiBriefcase, FiCalendar, FiCheck, FiTrendingUp, FiUsers, FiZap } from 'react-icons/fi'
import { Link } from 'react-router-dom'

function CoachLink({ href, children }) {
  return href ? <Link to={href}>{children}<FiArrowRight aria-hidden="true" /></Link> : <span>{children}</span>
}

function CareerCoachPanel({ plan, saving, onSave }) {
  const [selectedSkillIds, setSelectedSkillIds] = useState(() => plan?.focus?.selectedSkillIds || [])
  const [weeklyTarget, setWeeklyTarget] = useState(() => plan?.focus?.weeklyTarget || 3)

  if (!plan) return null
  const toggleSkill = (skillId) => setSelectedSkillIds((current) => (
    current.includes(skillId) ? current.filter((id) => id !== skillId) : current.length < 5 ? [...current, skillId] : current
  ))
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
      <div><span>This week</span><strong>{plan.game.weeklyProgress}/{plan.game.weeklyTarget} actions</strong></div>
    </div>

    <div className="career-focus-editor">
      <div><h3>Skills I want to practise</h3><p>Choose up to five. This selection powers every recommendation below.</p></div>
      <div className="career-focus-skills">
        {plan.focus.availableSkills.map((skill) => <button key={skill.id} type="button" className={selectedSkillIds.includes(skill.id) ? 'is-selected' : ''} onClick={() => toggleSkill(skill.id)} aria-pressed={selectedSkillIds.includes(skill.id)}>{selectedSkillIds.includes(skill.id) && <FiCheck aria-hidden="true" />}{skill.name}</button>)}
      </div>
      <label><span>Weekly target</span><select value={weeklyTarget} onChange={(event) => setWeeklyTarget(Number(event.target.value))}>{[1, 2, 3, 4, 5, 6, 7].map((value) => <option key={value} value={value}>{value} actions</option>)}</select></label>
      <button type="button" className="learn-primary-btn" disabled={saving || !selectedSkillIds.length || !changed} onClick={() => onSave(selectedSkillIds, weeklyTarget)}>{plan.focus.configured ? 'Update coaching plan' : 'Activate coaching plan'}</button>
    </div>

    <div className="career-quest-list">
      {plan.game.quests.map((quest) => <CoachLink key={quest.id} href={quest.complete ? null : quest.href}><span className={quest.complete ? 'is-complete' : ''}>{quest.complete ? <FiCheck /> : <FiZap />}</span><strong>{quest.label}</strong><small>{quest.complete ? 'Done this week' : '+ progress and XP'}</small></CoachLink>)}
    </div>

    <div className="career-coach-grid">
      <article><h3><FiBookOpen />Learn and practise</h3>
        {plan.resources.slice(0, 3).map((resource) => <CoachLink key={resource.id} href={`/campus/learn/${plan.enrollmentId}/checkpoints/${resource.checkpointId}/practice/${resource.id}`}><span><strong>{resource.title}</strong><small>{resource.provider || resource.type}</small></span></CoachLink>)}
        {plan.opportunities.slice(0, 3).map((item) => <CoachLink key={item.id} href={`/campus/opportunities?opportunity=${encodeURIComponent(item.id)}&view=activity`}><span><strong>{item.title}</strong><small>{item.matchScore}% match · {item.companyName}</small></span></CoachLink>)}
        {!plan.resources.length && !plan.opportunities.length && <p>Complete your current checkpoint to unlock focused practice.</p>}
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
