import { API_BASE_URL, readZumbarlAuthToken, sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

function readSuperAdminDashboard() {
  return sendZumbarlApiRequest('/admin/super-admin/dashboard')
}

function listSuperAdminAccounts(query = '') {
  return sendZumbarlApiRequest(`/admin/super-admin/accounts${query}`)
}

function readCampusVendorManagement() {
  return sendZumbarlApiRequest('/admin/super-admin/campus-vendors')
}

function createCampusVendor(payload) {
  return sendZumbarlApiRequest('/admin/super-admin/campus-vendors', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function updateCampusVendor(id, payload) {
  return sendZumbarlApiRequest(`/admin/super-admin/campus-vendors/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

function reviewStudentKitchen(id, payload) {
  return sendZumbarlApiRequest(`/admin/super-admin/campus-vendors/${encodeURIComponent(id)}/review`, { method: 'PATCH', body: JSON.stringify(payload) })
}

function addCampusVendorManager(id, payload) {
  return sendZumbarlApiRequest(`/admin/super-admin/campus-vendors/${encodeURIComponent(id)}/managers`, { method: 'POST', body: JSON.stringify(payload) })
}

function removeCampusVendorManager(id, userId) {
  return sendZumbarlApiRequest(`/admin/super-admin/campus-vendors/${encodeURIComponent(id)}/managers/${encodeURIComponent(userId)}`, { method: 'DELETE' })
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

async function readSuperAdminKycDocument(userId, documentId) {
  const token = readZumbarlAuthToken()
  const response = await fetch(`${API_BASE_URL}/admin/super-admin/accounts/${encodeURIComponent(userId)}/kyc-documents/${encodeURIComponent(documentId)}`, {
    headers: {
      Accept: 'application/pdf,image/*',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.message || `KYC document could not be opened (${response.status})`)
  }
  return response.blob()
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

function readAcademicCatalog() {
  return sendZumbarlApiRequest('/admin/super-admin/academic-catalog')
}

function updateAcademicCampus(id, payload) {
  return sendZumbarlApiRequest(`/admin/super-admin/academic-catalog/campuses/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

function updateAcademicCourse(id, payload) {
  return sendZumbarlApiRequest(`/admin/super-admin/academic-catalog/courses/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

function updateAcademicUnit(id, payload) {
  return sendZumbarlApiRequest(`/admin/super-admin/academic-catalog/units/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

function readSuperAdminAnalytics() {
  return sendZumbarlApiRequest('/admin/super-admin/analytics')
}

function readSuperAdminAuditLogs() {
  return sendZumbarlApiRequest('/admin/super-admin/audit-logs?pageSize=25')
}

function listZumbarlAds() {
  return sendZumbarlApiRequest('/marketing/ads?pageSize=100')
}

function publishZumbarlAd(adId) {
  return sendZumbarlApiRequest(`/marketing/ads/${adId}/publish`, {
    method: 'POST',
  })
}

export {
  readSuperAdminDashboard,
  listSuperAdminAccounts,
  readCampusVendorManagement,
  createCampusVendor,
  updateCampusVendor,
  reviewStudentKitchen,
  addCampusVendorManager,
  removeCampusVendorManager,
  updateSuperAdminAccount,
  revokeSuperAdminSessions,
  reviewSuperAdminKyc,
  readSuperAdminKycDocument,
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
  readAcademicCatalog,
  updateAcademicCampus,
  updateAcademicCourse,
  updateAcademicUnit,
  readSuperAdminAnalytics,
  readSuperAdminAuditLogs,
  listZumbarlAds,
  publishZumbarlAd,
}
