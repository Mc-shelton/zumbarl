import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

function readSocialMarketingProfile() {
  return sendZumbarlApiRequest('/connect/profile/marketing')
}

function extractSocialMetrics(payload) {
  return sendZumbarlApiRequest('/connect/profile/marketing/extract', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function saveSocialMetricsAccount(payload) {
  return sendZumbarlApiRequest('/connect/profile/marketing/accounts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function deleteSocialMetricsAccount(platform) {
  return sendZumbarlApiRequest(`/connect/profile/marketing/accounts/${encodeURIComponent(platform)}`, {
    method: 'DELETE',
  })
}

export {
  deleteSocialMetricsAccount,
  extractSocialMetrics,
  readSocialMarketingProfile,
  saveSocialMetricsAccount,
}
