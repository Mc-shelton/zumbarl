import { notFound } from '../../../lib/http.js'
import { learnRoadmapsRepository } from '../../repositories/learn/index.js'

const ladders = [
  { id: 'frontend-developer', title: 'Frontend Developer', checkpoints: ['HTML/CSS fundamentals', 'React interfaces', 'API integration', 'Portfolio deployment'] },
  { id: 'digital-marketer', title: 'Digital Marketer', checkpoints: ['Audience research', 'Content calendar', 'Campaign analytics', 'Client reporting'] },
  { id: 'data-analyst', title: 'Data Analyst', checkpoints: ['Spreadsheets', 'SQL', 'Dashboards', 'Insight storytelling'] }
]

function listCareerLaddersService() {
  return { data: ladders }
}

function listRoadmapsService(studentId: string | undefined, query: Record<string, unknown>) {
  return learnRoadmapsRepository.listRoadmaps(studentId, query)
}

function createRoadmapService(studentId: string | undefined, payload: Record<string, any>) {
  const ladder = ladders.find((item) => item.id === payload.ladderId) ?? ladders[0]
  return learnRoadmapsRepository.createRoadmap({
    studentId,
    ladderId: ladder.id,
    intent: payload.intent,
    status: 'generated',
    locked: false,
    verified: false,
    checkpoints: ladder.checkpoints.map((title, index) => ({ id: `${ladder.id}-${index + 1}`, title, status: index === 0 ? 'active' : 'locked', evidenceScore: 0, testScore: 0 }))
  })
}

async function lockRoadmapService(id: string) {
  return await learnRoadmapsRepository.updateRoadmap(id, { locked: true }) ?? notFound('Roadmap')
}

async function addRoadmapEvidenceService(id: string, payload: Record<string, any>) {
  return await learnRoadmapsRepository.addEvidenceAndUpdateRoadmap(id, payload) ?? notFound('Roadmap')
}

async function completeCheckpointTestService(id: string, payload: Record<string, any>) {
  const roadmap = await learnRoadmapsRepository.findRoadmap(id) ?? notFound('Roadmap')
  const checkpoints = roadmap.checkpoints.map((checkpoint: Record<string, any>) => checkpoint.id === payload.checkpointId ? { ...checkpoint, testScore: payload.score } : checkpoint)
  return learnRoadmapsRepository.updateRoadmap(id, { checkpoints })
}

async function verifyRoadmapService(id: string) {
  const roadmap = await learnRoadmapsRepository.findRoadmap(id) ?? notFound('Roadmap')
  const complete = roadmap.checkpoints.every((checkpoint: Record<string, any>) => checkpoint.evidenceScore + checkpoint.testScore >= 70)
  if (!complete) return { verified: false, reason: 'checkpoint_scores_incomplete', roadmap }
  return learnRoadmapsRepository.updateRoadmap(id, { verified: true, status: 'verified' })
}

async function listTransitionPoolsService() {
  return { data: await learnRoadmapsRepository.listVerifiedRoadmaps() }
}

export {
  listCareerLaddersService,
  listRoadmapsService,
  createRoadmapService,
  lockRoadmapService,
  addRoadmapEvidenceService,
  completeCheckpointTestService,
  verifyRoadmapService,
  listTransitionPoolsService
}
