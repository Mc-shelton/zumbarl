import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

async function readBusinessDashboard() {
  return sendZumbarlApiRequest('/business/dashboard')
}

export {
  readBusinessDashboard,
}
