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
  const hasDelivery = items.some((item) => !['pickup', 'digital'].includes(item.fulfilment?.method))
  const deliveryFees = new Map()
  items.forEach((item) => {
    const fulfilment = item.fulfilment || {}
    if (!fulfilment.quoted || ['pickup', 'digital'].includes(fulfilment.method)) return
    deliveryFees.set(`${item.shopId || item.sellerId || item.id}:${fulfilment.method}:${fulfilment.location}`, Number(fulfilment.fee || 0))
  })
  const deliveryFee = [...deliveryFees.values()].reduce((sum, fee) => sum + fee, 0)
  const deliveryPending = hasItems && items.some((item) => item.fulfilment?.quoted === false || item.fulfilment?.method === 'unquoted')
  const unavailableCount = items.filter((item) => item.unavailable).length
  const platformFee = 0

  return {
    deliveryFee,
    hasDelivery,
    deliveryPending,
    finalTotal: subtotal + deliveryFee + platformFee,
    itemCount,
    platformFee,
    subtotal,
    unavailableCount,
  }
}

export function getSellerCommission(subtotal) {
  return Math.round(subtotal * SELLER_COMMISSION_RATE)
}
