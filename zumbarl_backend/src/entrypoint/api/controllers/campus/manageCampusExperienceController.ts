import type { FastifyReply, FastifyRequest } from 'fastify'
import { idParamSchema, requireParams } from '../../../../lib/http.js'
import {
  readCampusHomeExperienceService,
  readStudentProfileExperienceService
} from '../../../../adapters/services/campus/index.js'

async function readCampusHomeExperienceController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await readCampusHomeExperienceService(request.authUser?.studentId))
}

async function readMyStudentProfileExperienceController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await readStudentProfileExperienceService(request.authUser?.studentId))
}

async function readStudentProfileExperienceController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await readStudentProfileExperienceService(id))
}

export {
  readCampusHomeExperienceController,
  readMyStudentProfileExperienceController,
  readStudentProfileExperienceController
}
