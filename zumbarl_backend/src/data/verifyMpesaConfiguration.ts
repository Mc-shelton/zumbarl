import { clearMpesaTokenCache, getMpesaAccessToken } from '../adapters/payment/mpesa/mpesa.adapter.js'
import { callbackBaseUrl } from '../adapters/services/finance/manageMpesaPaymentsService.js'
import { env } from '../config/env.js'

async function main() {
  const result = {
    environment: env.MPESA_BASE_URL.includes('sandbox') ? 'sandbox' : 'production',
    oauth: 'failed',
    callbackUrl: 'requires_public_https_url',
    stkPush: 'not_ready',
    b2c: env.MPESA_B2C_SHORT_CODE && env.MPESA_INITIATOR_NAME && env.MPESA_SECURITY_CREDENTIAL
      ? 'credentials_present_not_transaction_tested'
      : 'credentials_missing'
  }

  try {
    callbackBaseUrl()
    result.callbackUrl = 'ready'
  } catch {
    result.callbackUrl = 'requires_public_https_url'
  }

  try {
    clearMpesaTokenCache()
    await getMpesaAccessToken()
    result.oauth = 'ready'
  } catch (error) {
    result.oauth = error instanceof Error ? `failed: ${error.message}` : 'failed'
  }

  result.stkPush = result.oauth === 'ready' && result.callbackUrl === 'ready'
    ? 'configuration_ready_not_transaction_tested'
    : 'not_ready'

  console.log(JSON.stringify(result, null, 2))
  if (result.oauth !== 'ready' || result.callbackUrl !== 'ready' || result.b2c === 'credentials_missing') process.exitCode = 1
}

await main()
