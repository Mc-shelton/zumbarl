import type { FastifyReply, FastifyRequest } from 'fastify'
import { requireBody } from '../../../../lib/http.js'
import { createSkillService, listSkillsService } from '../../../../adapters/services/skills/index.js'
import { createSkillSchema, listSkillsSchema } from '../../../validators/skills/index.js'

async function listSkillsController(request: FastifyRequest, reply: FastifyReply) {
  const query = listSkillsSchema.parse(request.query ?? {})
  return reply.send(await listSkillsService(query))
}

async function createSkillController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await createSkillService(requireBody(createSkillSchema, request), request.authUser?.id))
}

export {
  createSkillController,
  listSkillsController
}
