import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { idParamSchema, requireBody, requireParams } from '../../../../lib/http.js'
import {
  listUserNotificationsService,
  markAllUserNotificationsReadService,
  markUserNotificationReadService,
  readCampusHomeExperienceService,
  readStudentProfileExperienceService,
  runCampusAssistantQueryService
  ,updateStudentProfileService
} from '../../../../adapters/services/campus/index.js'

const assistantQuerySchema = z.object({
  query: z.string().trim().min(1, 'Ask the assistant a question to search.').max(200)
})
const profileUpdateSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,30}$/),
  location: z.string().trim().min(2).max(100),
  careerPath: z.string().trim().max(120).default(''),
  bio: z.string().trim().max(500).default(''),
  avatarUrl: z.string().trim().max(2048).default(''),
  skills: z.array(z.string().trim().min(1).max(80)).max(12).default([])
})

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
async function updateMyStudentProfileController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await updateStudentProfileService(request.authUser?.studentId, requireBody(profileUpdateSchema, request)))
}

async function readStudentProfileExperienceController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await readStudentProfileExperienceService(id))
}

async function runCampusAssistantController(request: FastifyRequest, reply: FastifyReply) {
  const { query } = requireBody(assistantQuerySchema, request)
  return reply.send(await runCampusAssistantQueryService(request.authUser?.studentId, query))
}

export {
  listUserNotificationsController,
  markAllUserNotificationsReadController,
  markUserNotificationReadController,
  readCampusHomeExperienceController,
  readMyStudentProfileExperienceController,
  readStudentProfileExperienceController,
  runCampusAssistantController
  ,updateMyStudentProfileController
}
