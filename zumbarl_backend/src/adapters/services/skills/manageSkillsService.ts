import { skillsRepository } from '../../repositories/skills/index.js'

function listSkillsService(query: Record<string, unknown>) {
  return skillsRepository.listSkills(query)
}

function createSkillService(payload: Record<string, unknown>, actorId: string | undefined) {
  return skillsRepository.createSkill(payload, actorId)
}

export {
  createSkillService,
  listSkillsService
}
