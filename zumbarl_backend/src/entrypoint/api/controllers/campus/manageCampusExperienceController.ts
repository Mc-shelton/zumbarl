import type { FastifyReply, FastifyRequest } from 'fastify'
import { idParamSchema, requireParams } from '../../../../lib/http.js'
import {
  listUserNotificationsService,
  markAllUserNotificationsReadService,
  markUserNotificationReadService,
  readCampusHomeExperienceService,
  readStudentProfileExperienceService
} from '../../../../adapters/services/campus/index.js'

async function listUserNotificationsController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listUserNotificationsService(request.authUser?.id))
}

async function markUserNotificationReadController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await markUserNotificationReadService(request.authUser?.id, id))
}

async function markAllUserNotificationsReadController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await markAllUserNotificationsReadService(request.authUser?.id))
}

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
  listUserNotificationsController,
  markAllUserNotificationsReadController,
  markUserNotificationReadController,
  readCampusHomeExperienceController,
  readMyStudentProfileExperienceController,
  readStudentProfileExperienceController
}
