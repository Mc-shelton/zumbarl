import { slugify } from './earnFlowMappers'

export const EARN_PAYMENT_STATUS = {
  ready: 'ready_for_payout',
  processing: 'processing',
  paid: 'paid',
  setupRequired: 'setup_required',
}

const PAYMENT_STATUS_LABELS = {
  [EARN_PAYMENT_STATUS.ready]: 'Ready for payout',
  [EARN_PAYMENT_STATUS.processing]: 'Processing payout',
  [EARN_PAYMENT_STATUS.paid]: 'Paid out',
  [EARN_PAYMENT_STATUS.setupRequired]: 'Payout setup required',
}

export function createPayoutReadinessRecord({ project, projectId, review }) {
  const statusKey = EARN_PAYMENT_STATUS.ready

  return {
    id: `payment-${slugify(projectId || project.title)}`,
    projectId,
    amount: project.budget || 'Payout pending',
    recipient: project.owner || 'Brian Mwangi',
    status: PAYMENT_STATUS_LABELS[statusKey],
    statusKey,
    method: 'Payout method pending',
    createdAt: review.createdAt,
    nextStep: 'Confirm payout method and process transfer.',
    note: 'Client approval has cleared this project for payout processing.',
  }
}

export function resolveProjectPayment(payments, projectId) {
  return payments.find((item) => item.projectId === projectId) || null
}

export function resolvePaymentPipeline(payments) {
  return payments.reduce((pipeline, payment) => ({
    ...pipeline,
    [payment.statusKey || EARN_PAYMENT_STATUS.setupRequired]: (
      pipeline[payment.statusKey || EARN_PAYMENT_STATUS.setupRequired] || 0
    ) + 1,
  }), {})
}
