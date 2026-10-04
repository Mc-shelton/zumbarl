import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { idParamSchema, requireBody, requireParams } from '../../../../lib/http.js'
import {
  archiveStudentPortfolioItemService,
  listUserNotificationsService,
  markAllUserNotificationsReadService,
  markUserNotificationReadService,
  readCampusHomeExperienceService,
  readStudentProfileScoreService,
  readStudentProfileExperienceService,
  readMyStudentKycService,
  publishStudentPortfolioItemService,
  shareStudentPortfolioItemService,
  submitMyStudentKycDocumentService,
  unpublishStudentPortfolioItemService,
  updateStudentPortfolioItemService,
  runCampusAssistantQueryService,
  updateStudentProfileService,
  updateStudentProgressionModeService
} from '../../../../adapters/services/campus/index.js'

const assistantQuerySchema = z.object({
  query: z.string().trim().min(1, 'Ask the assistant a question to search.').max(200),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().min(1).max(1000)
  })).max(8).default([])
})
const profileUpdateSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,30}$/),
  location: z.string().trim().min(2).max(100),
  careerPath: z.string().trim().max(120).default(''),
  bio: z.string().trim().max(500).default(''),
  avatarUrl: z.string().trim().max(2048).default(''),
  showZumbarlPoints: z.boolean().optional(),
  yearJoined: z.coerce.number().int().min(new Date().getFullYear() - 15).max(new Date().getFullYear()).optional(),
  course: z.union([
    z.object({ id: z.string().min(1) }),
    z.object({ name: z.string().trim().min(2).max(160), category: z.enum(['STEM', 'COMMERCE', 'ARTS', 'OTHER']), duration: z.coerce.number().int().min(1).max(10) })
  ]).optional(),
  skills: z.array(z.string().trim().min(1).max(80)).max(12).default([])
})
const studentKycDocumentSchema = z.object({
  documentType: z.enum(['NATIONAL_ID', 'STUDENT_ID']),
  uploadId: z.string().min(1)
})
const progressionModeSchema = z.object({
  mode: z.enum(['EARN', 'BALANCED', 'CAREER'])
})
const portfolioFileUrlSchema = z.string().max(4000).refine((value) => {
  if (value.startsWith('/files/') && !value.includes('..')) return true
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}, 'Use a verified project file URL or Zumbarl file path.')
const portfolioUpdateSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().min(2).max(2000).optional(),
  category: z.string().trim().min(2).max(100).optional(),
  thumbnailUrl: z.union([portfolioFileUrlSchema, z.literal('')]).optional(),
  fileUrls: z.array(portfolioFileUrlSchema).max(20).optional(),
  showClientName: z.boolean().optional(),
  isFeatured: z.boolean().optional()
}).refine((payload) => Object.keys(payload).length > 0, 'Provide at least one portfolio change.')
const portfolioShareSchema = z.object({
  visibility: z.enum(['campus', 'public']).default('campus'),
  commentary: z.string().trim().max(500).default('')
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
  return reply.send(await readStudentProfileExperienceService(request.authUser?.studentId, { includePrivatePortfolio: true }))
}
async function updateMyStudentProfileController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await updateStudentProfileService(request.authUser?.studentId, requireBody(profileUpdateSchema, request)))
}
async function updateMyStudentProgressionModeController(request: FastifyRequest, reply: FastifyReply) {
  const { mode } = requireBody(progressionModeSchema, request)
  return reply.send(await updateStudentProgressionModeService(request.authUser?.studentId, mode))
}
async function readMyStudentKycController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await readMyStudentKycService(request.authUser?.studentId, request.authUser?.id))
}
async function submitMyStudentKycDocumentController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await submitMyStudentKycDocumentService(request.authUser?.studentId, request.authUser?.id, requireBody(studentKycDocumentSchema, request)))
}

async function updateMyPortfolioItemController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await updateStudentPortfolioItemService(request.authUser?.studentId, id, requireBody(portfolioUpdateSchema, request)))
}

async function publishMyPortfolioItemController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await publishStudentPortfolioItemService(request.authUser?.studentId, id))
}

async function unpublishMyPortfolioItemController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await unpublishStudentPortfolioItemService(request.authUser?.studentId, id))
}

async function archiveMyPortfolioItemController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await archiveStudentPortfolioItemService(request.authUser?.studentId, id))
}

async function shareMyPortfolioItemController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await shareStudentPortfolioItemService(request.authUser?.studentId, id, requireBody(portfolioShareSchema, request)))
}

async function readStudentProfileExperienceController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await readStudentProfileExperienceService(id))
}

async function readStudentProfileScoreController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await readStudentProfileScoreService(id))
}

async function runCampusAssistantController(request: FastifyRequest, reply: FastifyReply) {
  const { query, history } = requireBody(assistantQuerySchema, request)
  return reply.send(await runCampusAssistantQueryService(request.authUser?.studentId, query, history))
}

export {
  archiveMyPortfolioItemController,
  listUserNotificationsController,
  markAllUserNotificationsReadController,
  markUserNotificationReadController,
  readCampusHomeExperienceController,
  readMyStudentProfileExperienceController,
  readMyStudentKycController,
  publishMyPortfolioItemController,
  submitMyStudentKycDocumentController,
  readStudentProfileScoreController,
  readStudentProfileExperienceController,
  runCampusAssistantController,
  shareMyPortfolioItemController,
  updateMyStudentProfileController,
  updateMyPortfolioItemController,
  unpublishMyPortfolioItemController,
  updateMyStudentProgressionModeController
}
