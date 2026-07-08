import { DEFAULT_OPPORTUNITY_INTENT_ID, OPPORTUNITY_INTENT_OPTIONS } from '../constants'

const OPPORTUNITY_INTENT_STORAGE_KEY = 'zumbarl.opportunity-intent'

export function getPreferredOpportunityIntentId() {
  try {
    const storedIntentId = window.localStorage.getItem(OPPORTUNITY_INTENT_STORAGE_KEY)
    return OPPORTUNITY_INTENT_OPTIONS.some((intent) => intent.id === storedIntentId)
      ? storedIntentId
      : DEFAULT_OPPORTUNITY_INTENT_ID
  } catch {
    return DEFAULT_OPPORTUNITY_INTENT_ID
  }
}

export function setPreferredOpportunityIntentId(intentId) {
  try {
    window.localStorage.setItem(OPPORTUNITY_INTENT_STORAGE_KEY, intentId)
  } catch {
    // Preference persistence is best-effort; ignore storage failures.
  }
}
