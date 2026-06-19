import { notFound } from '../../../lib/http.js'
import { campusExperienceRepository } from '../../repositories/campus/index.js'

const readCampusHomeExperienceService = (studentId: string | undefined) => campusExperienceRepository.readHomeExperience(studentId)

async function readStudentProfileExperienceService(studentId: string | undefined) {
  return await campusExperienceRepository.readProfileExperience(studentId) ?? notFound('Student profile')
}

export {
  readCampusHomeExperienceService,
  readStudentProfileExperienceService
}
