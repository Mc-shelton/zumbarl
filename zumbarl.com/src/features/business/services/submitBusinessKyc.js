import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

async function readBusinessKyc() {
  return sendZumbarlApiRequest('/business/kyc')
}

async function submitBusinessKyc(payload) {
  return sendZumbarlApiRequest('/business/kyc', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export {
  readBusinessKyc,
  submitBusinessKyc,
}
