export const SELLER_COMMISSION_RATE = 0.075

export function formatKes(amount) {
  return `KES ${amount.toLocaleString()}`
}

export function getLineItemPrice(item) {
  return item.price ?? item.unitPrice ?? 0
}

export function getLineItemQuantity(item) {
  return item.qty ?? item.quantity ?? 1
}

export function getOrderTotals(items) {
  const itemCount = items.reduce((sum, item) => sum + getLineItemQuantity(item), 0)
  const subtotal = items.reduce(
    (sum, item) => sum + getLineItemPrice(item) * getLineItemQuantity(item),
    0
  )
  const hasItems = items.length > 0
  const deliveryFee = items.reduce((sum, item) => sum + Number(item.fulfilment?.fee || 0), 0)
  const deliveryPending = hasItems && items.some((item) => item.fulfilment?.quoted === false || item.fulfilment?.method === 'unquoted')
  const platformFee = 0

  return {
    deliveryFee,
    deliveryPending,
    finalTotal: subtotal + deliveryFee + platformFee,
    itemCount,
    platformFee,
    subtotal,
  }
}

export function getSellerCommission(subtotal) {
  return Math.round(subtotal * SELLER_COMMISSION_RATE)
}
