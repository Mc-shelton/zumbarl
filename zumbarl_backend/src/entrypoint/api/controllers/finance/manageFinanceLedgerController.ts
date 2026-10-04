import type { FastifyReply, FastifyRequest } from 'fastify'
import { idParamSchema, requireBody, requireParams } from '../../../../lib/http.js'
import { z } from 'zod'
import { createEscrowService, handleMpesaB2cResultService, handleMpesaB2cTimeoutService, handleMpesaStkCallbackService, initiateStudentMpesaPayoutService, listPayoutsService, listWalletLedgerService, listWalletsService, markPayoutPaidService, readMpesaPaymentService, reconcileMpesaPaymentService, releaseEscrowService } from '../../../../adapters/services/finance/index.js'
import { createEscrowSchema, createMpesaPayoutSchema, mpesaB2cResultSchema, mpesaCallbackSchema, releaseEscrowSchema } from '../../../validators/finance/index.js'

async function listWalletsController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listWalletsService(request.authUser))
}

async function listWalletLedgerController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await listWalletLedgerService(id, request.query as Record<string, unknown>, request.authUser))
}

async function createEscrowController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await createEscrowService(request.authUser?.businessId, requireBody(createEscrowSchema, request)))
}

async function releaseEscrowController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await releaseEscrowService(id, requireBody(releaseEscrowSchema, request)))
}

async function listPayoutsController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listPayoutsService(request.query as Record<string, unknown>, request.authUser))
}

async function markPayoutPaidController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await markPayoutPaidService(id))
}

const mpesaCallbackParamSchema = z.object({
  id: z.string().min(1),
  token: z.string().min(20)
})

async function readMpesaPaymentController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await readMpesaPaymentService(id, request.authUser))
}

async function reconcileMpesaPaymentController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await reconcileMpesaPaymentService(id, request.authUser))
}

async function handleMpesaStkCallbackController(request: FastifyRequest, reply: FastifyReply) {
  const { id, token } = requireParams(mpesaCallbackParamSchema, request)
  await handleMpesaStkCallbackService(id, token, requireBody(mpesaCallbackSchema, request))
  return reply.send({ ResultCode: 0, ResultDesc: 'Accepted' })
}

async function initiateStudentMpesaPayoutController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(202).send(await initiateStudentMpesaPayoutService(
    request.authUser?.studentId,
    requireBody(createMpesaPayoutSchema, request)
  ))
}

async function handleMpesaB2cResultController(request: FastifyRequest, reply: FastifyReply) {
  const { id, token } = requireParams(mpesaCallbackParamSchema, request)
  await handleMpesaB2cResultService(id, token, requireBody(mpesaB2cResultSchema, request))
  return reply.send({ ResultCode: 0, ResultDesc: 'Accepted' })
}

async function handleMpesaB2cTimeoutController(request: FastifyRequest, reply: FastifyReply) {
  const { id, token } = requireParams(mpesaCallbackParamSchema, request)
  await handleMpesaB2cTimeoutService(id, token, request.body as Record<string, any>)
  return reply.send({ ResultCode: 0, ResultDesc: 'Accepted' })
}

export {
  listWalletsController,
  listWalletLedgerController,
  createEscrowController,
  releaseEscrowController,
  listPayoutsController,
  markPayoutPaidController,
  readMpesaPaymentController,
  reconcileMpesaPaymentController,
  handleMpesaStkCallbackController,
  initiateStudentMpesaPayoutController,
  handleMpesaB2cResultController,
  handleMpesaB2cTimeoutController
}
