export const DELIVERY_FEE = 150
export const PLATFORM_FEE = 100

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
  const deliveryFee = hasItems ? DELIVERY_FEE : 0
  const platformFee = hasItems ? PLATFORM_FEE : 0

  return {
    deliveryFee,
    finalTotal: subtotal + deliveryFee + platformFee,
    itemCount,
    platformFee,
    subtotal,
  }
}
