import { useEffect, useMemo, useState } from 'react'
import { FiArrowLeft, FiCheckCircle, FiClock, FiRefreshCw, FiSend } from 'react-icons/fi'
import { Link, useParams } from 'react-router-dom'
import CampusSidebar from '../components/layout/CampusSidebar'
import Seo from '../components/Seo'
import { readRoadmapEnrollment, submitLearningPractice } from '../features/learn/services/learnService'
import '../styles/campus.css'
import '../styles/learn.css'
import '../styles/learn-experience.css'

function LearnPracticePage() {
  const { enrollmentId, checkpointId, resourceId } = useParams()
  const [enrollment, setEnrollment] = useState(null)
  const [responses, setResponses] = useState({})
  const [reflection, setReflection] = useState('')
  const [submitted, setSubmitted] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const checkpoint = useMemo(() => enrollment?.checkpoints?.find((item) => item.id === checkpointId) || null, [checkpointId, enrollment])
  const resource = useMemo(() => checkpoint?.resources?.find((item) => item.id === resourceId) || null, [checkpoint, resourceId])
  const content = resource?.content || {}
  const practice = resource?.practice || {}
  const fields = Array.isArray(practice.fields) ? practice.fields : []

  useEffect(() => {
    let active = true
    readRoadmapEnrollment(enrollmentId)
      .then((payload) => { if (active) setEnrollment(payload) })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [enrollmentId])

  async function submitPractice(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const result = await submitLearningPractice(enrollmentId, {
        checkpointId,
        resourceId,
        competencyId: checkpoint.competencies[0]?.id,
        responses,
        reflection,
      })
      setSubmitted(result)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const existingSubmission = enrollment?.practiceSubmissions?.find((item) => item.resourceId === resourceId)

  return (
    <main className="campus-page learn-page learn-experience-page">
      <Seo title={`${resource?.title || 'Learn and practise'} | Zumbarl`} description="Learn a skill and produce reviewable practice evidence." path={`/campus/learn/${enrollmentId}/checkpoints/${checkpointId}/practice/${resourceId}`} />
      <div className="campus-stage">
        <div className="campus-shell learn-experience-shell">
          <CampusSidebar activeItemId="learn" />
          <section className="campus-main learn-experience-main">
            <Link className="learn-back-link" to={`/campus/learn?checkpoint=${checkpointId}`}><FiArrowLeft aria-hidden="true" />Back to checkpoint</Link>
            {loading && <div className="learn-loading"><FiRefreshCw aria-hidden="true" />Opening lesson…</div>}
            {!loading && (!checkpoint || !resource) && <div className="learn-feedback is-error" role="alert">{error || 'This learning resource could not be found in your path.'}</div>}

            {!loading && resource && !submitted && (
              <>
                <header className="learn-experience-hero learn-lesson-hero">
                  <div><span>{resource.type || 'Lesson'} · {resource.provider || 'Zumbarl'}</span><h1>{resource.title}</h1><p>{resource.description}</p></div>
                  <div className="learn-duration"><FiClock aria-hidden="true" /><strong>{content.durationMinutes || 15} min</strong><span>guided lesson</span></div>
                </header>
                {error && <div className="learn-feedback is-error" role="alert">{error}</div>}

                <div className="learn-lesson-layout">
                  <article className="learn-lesson-content">
                    <section className="learn-objectives"><span className="learn-eyebrow">What you will learn</span><ul>{(content.objectives || []).map((objective) => <li key={objective}><FiCheckCircle aria-hidden="true" />{objective}</li>)}</ul></section>
                    {(content.sections || []).map((section, index) => (
                      <section key={section.heading} className="learn-lesson-section"><span>{String(index + 1).padStart(2, '0')}</span><div><h2>{section.heading}</h2><p>{section.body}</p>{section.example && <aside><strong>Example</strong>{section.example}</aside>}</div></section>
                    ))}
                  </article>

                  <form className="learn-practice-sheet" onSubmit={submitPractice}>
                    <span className="learn-eyebrow">Put it into practice</span><h2>{practice.title || 'Practice this skill'}</h2><p>{practice.instructions || 'Apply the lesson to a real brief.'}</p>
                    {fields.map((field) => (
                      <label key={field.id}><span>{field.label}</span><small>{field.prompt}</small><textarea required minLength={2} maxLength={2000} value={responses[field.id] || ''} placeholder={field.placeholder} onChange={(event) => setResponses((current) => ({ ...current, [field.id]: event.target.value }))} /></label>
                    ))}
                    <label><span>What did you learn?</span><small>Reflect on one decision you would now make differently in real work.</small><textarea required minLength={3} maxLength={1000} value={reflection} placeholder="I learned that…" onChange={(event) => setReflection(event.target.value)} /></label>
                    {existingSubmission && <p className="learn-existing-submission"><FiCheckCircle aria-hidden="true" />You already submitted this practice on {new Date(existingSubmission.submittedAt).toLocaleDateString('en-KE')}. You may submit an improved version.</p>}
                    <button className="learn-primary-btn" type="submit" disabled={saving || fields.some((field) => !responses[field.id]?.trim()) || !reflection.trim()}>{saving ? 'Saving practice…' : 'Finish and send for review'}<FiSend aria-hidden="true" /></button>
                  </form>
                </div>
              </>
            )}

            {submitted && <section className="learn-result-card"><FiCheckCircle aria-hidden="true" /><span className="learn-eyebrow">Practice completed</span><h1>Your work is saved</h1><p>This worksheet is now reviewable checkpoint evidence. It will add points after verification; approved work completed elsewhere on Zumbarl is still detected automatically.</p><div><Link className="learn-primary-btn" to={`/campus/learn?checkpoint=${checkpointId}`}>Return to checkpoint</Link></div></section>}
          </section>
        </div>
      </div>
    </main>
  )
}

export default LearnPracticePage
