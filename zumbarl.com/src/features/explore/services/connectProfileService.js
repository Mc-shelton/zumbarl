import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

function readConnectProfile() {
  return sendZumbarlApiRequest('/connect/profile')
}

function saveConnectProfile(profile) {
  return sendZumbarlApiRequest('/connect/profile', {
    method: 'POST',
    body: JSON.stringify(profile),
  })
}

export { readConnectProfile, saveConnectProfile }
