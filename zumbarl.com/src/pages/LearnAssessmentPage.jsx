import { useEffect, useMemo, useState } from 'react'
import { FiArrowLeft, FiArrowRight, FiCheck, FiCheckCircle, FiRefreshCw } from 'react-icons/fi'
import { Link, useParams } from 'react-router-dom'
import CampusSidebar from '../components/layout/CampusSidebar'
import Seo from '../components/Seo'
import { completeRoadmapAssessment, readRoadmapEnrollment } from '../features/learn/services/learnService'
import '../styles/campus.css'
import '../styles/learn.css'
import '../styles/learn-experience.css'

function LearnAssessmentPage() {
  const { enrollmentId, checkpointId } = useParams()
  const storageKey = `zumbarl-assessment:${enrollmentId}:${checkpointId}`
  const [enrollment, setEnrollment] = useState(null)
  const [answers, setAnswers] = useState(() => {
    try {
      const saved = window.localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })
  const [questionIndex, setQuestionIndex] = useState(0)
  const [reviewing, setReviewing] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const checkpoint = useMemo(
    () => enrollment?.checkpoints?.find((item) => item.id === checkpointId) || null,
    [checkpointId, enrollment],
  )
  const questions = checkpoint?.assessment || []
  const currentQuestion = questions[questionIndex]

  useEffect(() => {
    let active = true
    readRoadmapEnrollment(enrollmentId)
      .then((payload) => { if (active) setEnrollment(payload) })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [enrollmentId])

  function chooseAnswer(answer) {
    const next = { ...answers, [currentQuestion.id]: answer }
    setAnswers(next)
    try { window.localStorage.setItem(storageKey, JSON.stringify(next)) } catch { /* ignore storage limits */ }
  }

  async function submitAssessment() {
    setSaving(true)
    setError('')
    try {
      const payload = questions.map((question) => ({ questionId: question.id, answer: answers[question.id] }))
      const response = await completeRoadmapAssessment(enrollmentId, checkpointId, payload)
      setResult(response)
      setEnrollment(response.roadmap)
      try { window.localStorage.removeItem(storageKey) } catch { /* ignore storage limits */ }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const answeredCount = questions.filter((question) => answers[question.id]).length
  const attempts = enrollment?.assessmentAttempts?.filter((attempt) => attempt.checkpointId === checkpointId) || []

  return (
    <main className="campus-page learn-page learn-experience-page">
      <Seo title="Checkpoint assessment | Zumbarl" description="Complete your Learn & Grow checkpoint assessment." path={`/campus/learn/${enrollmentId}/checkpoints/${checkpointId}/assessment`} />
      <div className="campus-stage">
        <div className="campus-shell learn-experience-shell">
          <CampusSidebar activeItemId="learn" />
          <section className="campus-main learn-experience-main">
            <Link className="learn-back-link" to={`/campus/learn?checkpoint=${checkpointId}`}><FiArrowLeft aria-hidden="true" />Back to checkpoint</Link>

            {loading && <div className="learn-loading"><FiRefreshCw aria-hidden="true" />Loading assessment…</div>}
            {!loading && error && !checkpoint && <div className="learn-feedback is-error" role="alert">{error}</div>}

            {!loading && checkpoint && !result && (
              <>
                <header className="learn-experience-hero">
                  <div><span>Checkpoint assessment</span><h1>{checkpoint.title}</h1><p>Answer each question, review your choices, then submit. Your best result is kept, so a retry cannot lower your score.</p></div>
                  <div className="learn-assessment-progress"><strong>{answeredCount}/{questions.length}</strong><span>answered</span></div>
                </header>

                {error && <div className="learn-feedback is-error" role="alert">{error}</div>}

                {!questions.length ? (
                  <section className="learn-empty-experience"><h2>No assessment is available yet</h2><p>This checkpoint can still gain points from verified work.</p></section>
                ) : reviewing ? (
                  <section className="learn-review-sheet">
                    <span className="learn-eyebrow">Review</span>
                    <h2>Check your answers</h2>
                    <div>
                      {questions.map((question, index) => (
                        <button key={question.id} type="button" onClick={() => { setQuestionIndex(index); setReviewing(false) }}>
                          <span>{index + 1}</span><div><strong>{question.prompt}</strong><small>{answers[question.id] || 'Not answered'}</small></div><FiArrowRight aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                    <footer><button type="button" className="learn-secondary-btn" onClick={() => setReviewing(false)}>Keep editing</button><button type="button" className="learn-primary-btn" disabled={saving || answeredCount !== questions.length} onClick={submitAssessment}>{saving ? 'Scoring…' : 'Submit assessment'}<FiCheck aria-hidden="true" /></button></footer>
                  </section>
                ) : (
                  <section className="learn-question-card">
                    <header><span>Question {questionIndex + 1} of {questions.length}</span><div><i style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div></header>
                    <h2>{currentQuestion.prompt}</h2>
                    <div className="learn-answer-options">
                      {currentQuestion.options.map((option) => (
                        <button key={option} type="button" className={answers[currentQuestion.id] === option ? 'is-selected' : ''} onClick={() => chooseAnswer(option)}>
                          <span>{answers[currentQuestion.id] === option && <FiCheck aria-hidden="true" />}</span>{option}
                        </button>
                      ))}
                    </div>
                    <footer>
                      <button type="button" className="learn-secondary-btn" disabled={questionIndex === 0} onClick={() => setQuestionIndex((index) => index - 1)}>Previous</button>
                      {questionIndex < questions.length - 1
                        ? <button type="button" className="learn-primary-btn" disabled={!answers[currentQuestion.id]} onClick={() => setQuestionIndex((index) => index + 1)}>Next question<FiArrowRight aria-hidden="true" /></button>
                        : <button type="button" className="learn-primary-btn" disabled={!answers[currentQuestion.id]} onClick={() => setReviewing(true)}>Review answers<FiArrowRight aria-hidden="true" /></button>}
                    </footer>
                  </section>
                )}

                {attempts.length > 0 && <p className="learn-attempt-note">Previous best: {Math.max(...attempts.map((attempt) => attempt.score))}/{enrollment.ladder.weights.test} assessment points · {attempts.length} attempt{attempts.length === 1 ? '' : 's'}</p>}
              </>
            )}

            {result && (
              <section className="learn-result-card">
                <FiCheckCircle aria-hidden="true" />
                <span className="learn-eyebrow">Assessment saved</span>
                <h1>{result.correct} of {result.questions} correct</h1>
                <p>You earned <strong>{result.score}/{result.total}</strong> assessment points. Zumbarl keeps your best score for this checkpoint.</p>
                <div><Link className="learn-primary-btn" to={`/campus/learn?checkpoint=${checkpointId}`}>Return to checkpoint<FiArrowRight aria-hidden="true" /></Link><button type="button" className="learn-secondary-btn" onClick={() => { setResult(null); setAnswers({}); setQuestionIndex(0); setReviewing(false) }}>Try again</button></div>
              </section>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

export default LearnAssessmentPage
