export function resolveProjectPayment(payments, projectId) {
  return payments.find((item) => item.projectId === projectId) || null
}
