import { createPrismaRecordRepository, runPrismaRecordTransaction } from '../../../shared/repositories/index.js'

const roadmaps = createPrismaRecordRepository('roadmaps')
const evidence = createPrismaRecordRepository('evidence')
const students = createPrismaRecordRepository('students')

class LearnRoadmapsRepository {
  listRoadmaps(studentId: string | undefined, query: Record<string, unknown>) {
    return roadmaps.list(query, (roadmap) => !studentId || roadmap.studentId === studentId)
  }

  createRoadmap(payload: Record<string, any>) {
    return roadmaps.create(payload)
  }

  findRoadmap(id: string) {
    return roadmaps.findById(id)
  }

  updateRoadmap(id: string, patch: Record<string, any>) {
    return roadmaps.updateById(id, patch)
  }

  createEvidence(payload: Record<string, any>) {
    return evidence.create(payload)
  }

  async listVerifiedRoadmaps() {
    const verifiedRoadmaps = await roadmaps.listAll((roadmap) => roadmap.verified)
    return Promise.all(verifiedRoadmaps.map(async (roadmap) => ({ roadmap, student: await students.findById(roadmap.studentId) })))
  }

  addEvidenceAndUpdateRoadmap(id: string, payload: Record<string, any>) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionRoadmaps = createRepository('roadmaps')
      const transactionEvidence = createRepository('evidence')
      const roadmap = await transactionRoadmaps.findById(id)
      if (!roadmap) return null

      const proof = await transactionEvidence.create({ ...payload, roadmapId: id, studentId: roadmap.studentId, verified: true })
      const checkpoints = roadmap.checkpoints.map((checkpoint: Record<string, any>) => checkpoint.id === payload.checkpointId ? { ...checkpoint, evidenceScore: Math.min(80, checkpoint.evidenceScore + payload.score), status: 'active' } : checkpoint)
      await transactionRoadmaps.updateById(id, { checkpoints })
      return proof
    })
  }
}

const learnRoadmapsRepository = new LearnRoadmapsRepository()

export {
  LearnRoadmapsRepository,
  learnRoadmapsRepository
}
