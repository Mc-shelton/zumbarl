import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

function readMyStudentKyc() {
  return sendZumbarlApiRequest('/campus/profile/me/kyc')
}

function submitMyStudentKycDocument(payload) {
  return sendZumbarlApiRequest('/campus/profile/me/kyc/documents', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export { readMyStudentKyc, submitMyStudentKycDocument }
