import { notFound } from '../../../lib/http.js'
import { adminOperationsRepository } from '../../repositories/admin/index.js'
function removePasswordHash(record: Record<string, any>) { const safe = { ...record }; delete safe.passwordHash; return safe }
const readAdminMetricsService = () => adminOperationsRepository.readMetrics()
async function listUsersService(query: Record<string, unknown>) { const users = await adminOperationsRepository.listUsers(query); return { ...users, data: users.data.map(removePasswordHash) } }
async function updateUserService(id: string, payload: Record<string, any>) { const user = await adminOperationsRepository.updateUser(id, payload) ?? notFound('User'); return removePasswordHash(user) }
const listModerationCasesService = (query: Record<string, unknown>) => adminOperationsRepository.listModerationCases(query)
async function updateModerationCaseService(id: string, payload: Record<string, any>) { return await adminOperationsRepository.updateModerationCase(id, payload) ?? notFound('Moderation case') }

export {
  readAdminMetricsService,
  listUsersService,
  updateUserService,
  listModerationCasesService,
  updateModerationCaseService
}
