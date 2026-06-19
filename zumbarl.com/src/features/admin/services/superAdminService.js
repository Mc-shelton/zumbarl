import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

function readSuperAdminDashboard() {
  return sendZumbarlApiRequest('/admin/super-admin/dashboard')
}

function listSuperAdminAccounts(query = '') {
  return sendZumbarlApiRequest(`/admin/super-admin/accounts${query}`)
}

function updateSuperAdminAccount(userId, payload) {
  return sendZumbarlApiRequest(`/admin/super-admin/accounts/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

function revokeSuperAdminSessions(userId, payload) {
  return sendZumbarlApiRequest(`/admin/super-admin/accounts/${userId}/revoke-sessions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function reviewSuperAdminKyc(userId, payload) {
  return sendZumbarlApiRequest(`/admin/super-admin/accounts/${userId}/review-kyc`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function readSuperAdminFinance() {
  return sendZumbarlApiRequest('/admin/super-admin/finance')
}

function recordSuperAdminFinancialAction(payload) {
  return sendZumbarlApiRequest('/admin/super-admin/finance/actions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function readSuperAdminGigs() {
  return sendZumbarlApiRequest('/admin/super-admin/gigs')
}

function recordSuperAdminGigAction(payload) {
  return sendZumbarlApiRequest('/admin/super-admin/gigs/actions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function readSuperAdminScore() {
  return sendZumbarlApiRequest('/admin/super-admin/score')
}

function writeSuperAdminScoreConfiguration(payload) {
  return sendZumbarlApiRequest('/admin/super-admin/score/configurations', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function readSuperAdminSafetyMetrics() {
  return sendZumbarlApiRequest('/admin/super-admin/safety-metrics')
}

function readSuperAdminContent() {
  return sendZumbarlApiRequest('/admin/super-admin/content')
}

function recordSuperAdminContentAction(payload) {
  return sendZumbarlApiRequest('/admin/super-admin/content/actions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function readSuperAdminConfiguration() {
  return sendZumbarlApiRequest('/admin/super-admin/configuration')
}

function writeSuperAdminConfiguration(payload) {
  return sendZumbarlApiRequest('/admin/super-admin/configuration', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function readSuperAdminAnalytics() {
  return sendZumbarlApiRequest('/admin/super-admin/analytics')
}

function readSuperAdminAuditLogs() {
  return sendZumbarlApiRequest('/admin/super-admin/audit-logs?pageSize=25')
}

export {
  readSuperAdminDashboard,
  listSuperAdminAccounts,
  updateSuperAdminAccount,
  revokeSuperAdminSessions,
  reviewSuperAdminKyc,
  readSuperAdminFinance,
  recordSuperAdminFinancialAction,
  readSuperAdminGigs,
  recordSuperAdminGigAction,
  readSuperAdminScore,
  writeSuperAdminScoreConfiguration,
  readSuperAdminSafetyMetrics,
  readSuperAdminContent,
  recordSuperAdminContentAction,
  readSuperAdminConfiguration,
  writeSuperAdminConfiguration,
  readSuperAdminAnalytics,
  readSuperAdminAuditLogs,
}
