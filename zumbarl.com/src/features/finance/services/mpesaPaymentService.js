import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

function requestStudentMpesaPayout(payload) {
  return sendZumbarlApiRequest('/finance/mpesa/payouts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function readMpesaPayment(paymentId) {
  return sendZumbarlApiRequest(`/finance/mpesa/payments/${paymentId}`)
}

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

async function waitForMpesaPayout(paymentId, { attempts = 48, intervalMs = 2500 } = {}) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (attempt > 0) await wait(intervalMs)
    const response = await readMpesaPayment(paymentId)
    const payment = response?.payment
    if (payment?.status === 'COMPLETED') return payment
    if (payment?.status === 'FAILED' || payment?.status === 'REVERSED') {
      throw new Error(payment.resultDescription || 'The M-Pesa withdrawal was not completed.')
    }
  }
  throw new Error('The withdrawal is still processing. Check your wallet again before requesting another payout.')
}

export {
  readMpesaPayment,
  requestStudentMpesaPayout,
  waitForMpesaPayout,
}
