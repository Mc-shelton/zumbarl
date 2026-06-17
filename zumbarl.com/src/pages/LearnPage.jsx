import { useState } from 'react'
import { FiAward, FiBookOpen, FiBriefcase, FiCheckCircle, FiLock, FiPlayCircle, FiTarget, FiZap } from 'react-icons/fi'
import CampusSidebar from '../components/layout/CampusSidebar'
import Seo from '../components/Seo'
import { WorkflowStatusPanel } from '../features/workflows/components/WorkflowStatusPanel'
import {
  LEARN_CHECKPOINTS,
  LEARN_EXPOSURE_MATCHES,
  LEARN_LADDERS,
  calculateLearnCheckpointScore,
  createInitialLearnWorkflowState,
} from '../features/workflows/workflowData'
import '../styles/campus.css'
import '../styles/learn.css'
import '../styles/workflows.css'

const ROADMAP_TOOLS = [
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'projects', label: 'Projects' },
  { id: 'tutor', label: 'AI tutor' },
  { id: 'personalize', label: 'Personalize' },
]

function LearnPage() {
  const [state, setState] = useState(createInitialLearnWorkflowState)
  const [activeRoadmapTool, setActiveRoadmapTool] = useState('roadmap')
  const patchState = (patch) => setState((current) => ({ ...current, ...patch }))
  const selectedLadder = LEARN_LADDERS.find((ladder) => ladder.id === state.ladderId) || LEARN_LADDERS[0]
  const activeCheckpoint = LEARN_CHECKPOINTS.find((checkpoint) => checkpoint.id === state.activeCheckpointId) || LEARN_CHECKPOINTS[0]
  const score = calculateLearnCheckpointScore({
    evidenceAdded: state.evidenceAdded,
    testCompleted: state.testCompleted,
    baseEvidence: activeCheckpoint.evidenceScore,
    baseTest: activeCheckpoint.testScore,
  })
  const canVerify = state.tierUpgraded && state.exposureRequested && score.total >= 90

  return (
    <main className="campus-page learn-page">
      <Seo
        title="Learn Career Ladder | Zumbarl"
        description="Choose a Zumbarl career ladder, follow a roadmap, build evidence, and become transition-ready."
        path="/campus/learn"
      />

      <div className="campus-stage">
        <div className="campus-shell learn-shell">
          <CampusSidebar activeItemId="learn" />

          <section className="campus-main learn-main">
            <section className="learn-hero">
              <div>
                <span>Career ladder</span>
                <h1>Build a market-ready path from campus work to career transition.</h1>
                <p>
                  Zumbarl turns gigs, projects, campaigns, posts, tests, and business feedback into a roadmap
                  that can move a student toward attachment, internship, or job readiness.
                </p>
              </div>
              <dl>
                <div><dt>Roadmap score</dt><dd>{score.total}%</dd></div>
                <div><dt>Evidence weight</dt><dd>80%</dd></div>
                <div><dt>Tests weight</dt><dd>20%</dd></div>
              </dl>
            </section>

            <section className="learn-ladder-grid" aria-label="Career ladders">
              {LEARN_LADDERS.map((ladder) => (
                <button
                  key={ladder.id}
                  type="button"
                  className={ladder.id === state.ladderId ? 'is-selected' : ''}
                  onClick={() => patchState({
                    ladderId: ladder.id,
                    profileBuilt: false,
                    roadmapGenerated: false,
                    roadmapLocked: false,
                    evidenceAdded: false,
                    testCompleted: false,
                    tierUpgraded: false,
                    exposureRequested: false,
                    verified: false,
                  })}
                >
                  <strong>{ladder.title}</strong>
                  <span>{ladder.intent}</span>
                  <p>{ladder.summary}</p>
                </button>
              ))}
            </section>

            <WorkflowStatusPanel
              title="Career ladder gates"
              items={[
                { label: 'Baseline profile', status: state.profileBuilt ? 'done' : 'blocked', detail: state.profileBuilt ? 'Skills, work history, posts, portfolio, and reviews are mapped.' : 'Build baseline from current Zumbarl activity.' },
                { label: 'Roadmap generated', status: state.roadmapGenerated ? 'done' : 'blocked', detail: state.roadmapGenerated ? `${selectedLadder.title} checkpoint tree is ready.` : 'Generate the interactive roadmap tree.' },
                { label: 'Roadmap lock', status: state.roadmapLocked ? 'done' : 'blocked', detail: state.roadmapLocked ? 'Opportunity discovery now prioritizes active checkpoints.' : 'Optional, but recommended for focused career growth.' },
                { label: 'Evidence score', status: state.evidenceAdded ? 'done' : 'blocked', detail: `${score.evidenceScore}/80 from opportunities, projects, posts, reviews, and portfolio evidence.` },
                { label: 'Checkpoint test', status: state.testCompleted ? 'done' : 'blocked', detail: `${score.testScore}/20 from checkpoint questions.` },
                { label: 'Market tier', status: state.tierUpgraded ? 'done' : 'blocked', detail: state.tierUpgraded ? 'Student moved up one market-ready tier.' : 'Requires strong checkpoint evidence.' },
                { label: 'Exposure match', status: state.exposureRequested ? 'done' : 'blocked', detail: state.exposureRequested ? 'Attachment, mentorship, and office exposure matches requested.' : 'Request exposure once tier is ready.' },
                { label: 'Career verification', status: state.verified ? 'done' : 'blocked', detail: state.verified ? 'Credential added to portfolio and business transition pool.' : 'Verify after tier and exposure readiness.' },
              ]}
              actions={(
                <>
                  <button type="button" className="project-soft-btn" disabled={state.profileBuilt} onClick={() => patchState({ profileBuilt: true })}>
                    <FiTarget aria-hidden="true" />
                    Build baseline
                  </button>
                  <button type="button" className="project-soft-btn" disabled={!state.profileBuilt || state.roadmapGenerated} onClick={() => patchState({ roadmapGenerated: true })}>
                    <FiBookOpen aria-hidden="true" />
                    Generate roadmap
                  </button>
                  <button type="button" className="project-soft-btn" disabled={!state.roadmapGenerated || state.roadmapLocked} onClick={() => patchState({ roadmapLocked: true })}>
                    <FiLock aria-hidden="true" />
                    Lock to roadmap
                  </button>
                  <button type="button" className="project-soft-btn" disabled={!state.roadmapGenerated || state.evidenceAdded} onClick={() => patchState({ evidenceAdded: true })}>
                    <FiBriefcase aria-hidden="true" />
                    Add work evidence
                  </button>
                  <button type="button" className="project-soft-btn" disabled={!state.roadmapGenerated || state.testCompleted} onClick={() => patchState({ testCompleted: true })}>
                    <FiPlayCircle aria-hidden="true" />
                    Complete test
                  </button>
                  <button type="button" className="project-primary-btn" disabled={score.total < 90 || state.tierUpgraded} onClick={() => patchState({ tierUpgraded: true })}>
                    <FiZap aria-hidden="true" />
                    Upgrade tier
                  </button>
                  <button type="button" className="project-soft-btn" disabled={!state.tierUpgraded || state.exposureRequested} onClick={() => patchState({ exposureRequested: true })}>
                    <FiAward aria-hidden="true" />
                    Request exposure
                  </button>
                  <button type="button" className="project-primary-btn" disabled={!canVerify || state.verified} onClick={() => patchState({ verified: true })}>
                    <FiCheckCircle aria-hidden="true" />
                    Verify career ladder
                  </button>
                </>
              )}
            />

            <section className="learn-roadmap-panel">
              <header>
                <div>
                  <h2>{selectedLadder.title} roadmap</h2>
                  <p>{selectedLadder.tier} - {selectedLadder.intent}</p>
                </div>
                <strong>{state.roadmapLocked ? 'Locked to active checkpoints' : 'Open discovery'}</strong>
              </header>
              <div className="learn-roadmap-actions" role="tablist" aria-label="Roadmap tools">
                {ROADMAP_TOOLS.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    className={activeRoadmapTool === tool.id ? 'is-active' : ''}
                    role="tab"
                    aria-selected={activeRoadmapTool === tool.id}
                    onClick={() => setActiveRoadmapTool(tool.id)}
                  >
                    {tool.label}
                  </button>
                ))}
              </div>
              {activeRoadmapTool === 'roadmap' && (
                <div className="learn-roadmap-tree">
                  {LEARN_CHECKPOINTS.map((checkpoint, index) => {
                    const isActive = checkpoint.id === state.activeCheckpointId
                    const checkpointScore = checkpoint.id === activeCheckpoint.id ? score.total : checkpoint.score
                    return (
                      <article
                        key={checkpoint.id}
                        className={`learn-roadmap-node ${isActive ? 'is-active' : ''} is-${checkpoint.status}`}
                      >
                        <button type="button" onClick={() => patchState({ activeCheckpointId: checkpoint.id })}>
                          <span className="learn-node-index">{index + 1}</span>
                          <span className="learn-node-level">{checkpoint.level}</span>
                          <strong>{checkpoint.title}</strong>
                          <em>{checkpointScore}%</em>
                        </button>
                        <div className="learn-node-branches" aria-label={`${checkpoint.title} branches`}>
                          <span>{checkpoint.resources[0]}</span>
                          <span>{checkpoint.opportunities[0]}</span>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
              {activeRoadmapTool === 'projects' && (
                <div className="learn-tool-grid">
                  {activeCheckpoint.opportunities.map((item) => (
                    <article key={item}>
                      <FiBriefcase aria-hidden="true" />
                      <strong>{item}</strong>
                      <span>Recommended work evidence for {activeCheckpoint.title.toLowerCase()}.</span>
                    </article>
                  ))}
                </div>
              )}
              {activeRoadmapTool === 'tutor' && (
                <div className="learn-tool-panel">
                  <FiBookOpen aria-hidden="true" />
                  <div>
                    <h3>{activeCheckpoint.title} tutor plan</h3>
                    <p>Review weak evidence, practice checkpoint questions, and prepare portfolio notes before business exposure.</p>
                  </div>
                </div>
              )}
              {activeRoadmapTool === 'personalize' && (
                <div className="learn-tool-grid">
                  <article>
                    <FiTarget aria-hidden="true" />
                    <strong>{selectedLadder.intent}</strong>
                    <span>Discovery prioritizes the selected career intent and current market tier.</span>
                  </article>
                  <article>
                    <FiLock aria-hidden="true" />
                    <strong>{state.roadmapLocked ? 'Roadmap locked' : 'Open discovery'}</strong>
                    <span>{state.roadmapLocked ? 'Feeds now prioritize checkpoint-relevant opportunities.' : 'Use roadmap lock when the student is ready for focused progress.'}</span>
                  </article>
                </div>
              )}
            </section>

            <section className="learn-detail-grid">
              <article className="learn-card">
                <h2>{activeCheckpoint.title}</h2>
                <p>Open resources and work exposure tied to this checkpoint.</p>
                <h3>Resources</h3>
                {activeCheckpoint.resources.map((item) => <p key={item}><FiBookOpen aria-hidden="true" />{item}</p>)}
              </article>
              <article className="learn-card">
                <h2>Recommended opportunities</h2>
                <p>These matches improve the active checkpoint score.</p>
                {activeCheckpoint.opportunities.map((item) => <p key={item}><FiBriefcase aria-hidden="true" />{item}</p>)}
              </article>
              <article className="learn-card">
                <h2>Exposure matches</h2>
                {LEARN_EXPOSURE_MATCHES.map((item) => (
                  <p key={item.label}>
                    <FiAward aria-hidden="true" />
                    <span><strong>{item.label}: {item.value}</strong>{item.detail}</span>
                  </p>
                ))}
              </article>
            </section>
          </section>

          <aside className="campus-rail learn-rail">
            <section className="learn-rail-card">
              <h2>Skills in this ladder</h2>
              {selectedLadder.skills.map((skill) => <span key={skill}>{skill}</span>)}
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default LearnPage
