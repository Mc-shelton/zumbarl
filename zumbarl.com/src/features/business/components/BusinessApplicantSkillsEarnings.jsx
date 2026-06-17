import {
  BUSINESS_APPLICANT_EARNINGS,
  BUSINESS_APPLICANT_TOP_SKILLS,
} from '../applicantProfileData'

export function BusinessApplicantSkillsEarnings() {
  return (
    <div className="business-profile-grid-2">
      <article className="business-profile-card">
        <h2>Top Skills</h2>
        <div className="business-skills-list">
          {BUSINESS_APPLICANT_TOP_SKILLS.map((skill) => (
            <div key={skill.label} className="business-skill-row">
              <p>{skill.label}</p>
              <div>
                <span style={{ width: `${skill.progress}%` }} />
              </div>
              <strong>{skill.level}</strong>
            </div>
          ))}
        </div>
      </article>

      <article className="business-profile-card">
        <h2>Earnings Summary</h2>
        <div className="business-earnings-list">
          {BUSINESS_APPLICANT_EARNINGS.map((entry) => (
            <div key={entry.label}>
              <p>{entry.label}</p>
              <strong>{entry.value}</strong>
            </div>
          ))}
        </div>
      </article>
    </div>
  )
}
