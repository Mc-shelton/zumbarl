import type { FastifyReply, FastifyRequest } from 'fastify'
import { idParamSchema, requireBody, requireParams } from '../../../../lib/http.js'
import { createEscrowService, listPayoutsService, listWalletLedgerService, listWalletsService, markPayoutPaidService, releaseEscrowService } from '../../../../adapters/services/finance/index.js'
import { createEscrowSchema, releaseEscrowSchema } from '../../../validators/finance/index.js'

async function listWalletsController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listWalletsService(request.authUser?.studentId ?? request.authUser?.businessId, request.authUser?.role === 'admin' || request.authUser?.role === 'SUPER_ADMIN'))
}

async function listWalletLedgerController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await listWalletLedgerService(id, request.query as Record<string, unknown>))
}

async function createEscrowController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await createEscrowService(request.authUser?.businessId, requireBody(createEscrowSchema, request)))
}

async function releaseEscrowController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await releaseEscrowService(id, requireBody(releaseEscrowSchema, request)))
}

async function listPayoutsController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listPayoutsService(request.query as Record<string, unknown>))
}

async function markPayoutPaidController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await markPayoutPaidService(id))
}

export {
  listWalletsController,
  listWalletLedgerController,
  createEscrowController,
  releaseEscrowController,
  listPayoutsController,
  markPayoutPaidController
}
