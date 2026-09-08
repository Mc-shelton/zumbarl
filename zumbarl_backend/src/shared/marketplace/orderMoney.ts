import { addMoney, multiplyMoney, normalizeMoney, toMinorUnits } from '../services/money.js'

type OrderMoneyItem = Record<string, any>

type MoneyAllocation = {
  id: string
  amount: number
}

type OrderMoneyAllocation = {
  itemSubtotal: number
  deliveryTotal: number
  totalAmount: number
  sellers: MoneyAllocation[]
  errands: MoneyAllocation[]
  platformDeliveryAmount: number
}

function addAllocation(target: Map<string, number>, id: unknown, amount: number, currency: string) {
  const key = String(id || '')
  if (!key || amount <= 0) return
  target.set(key, addMoney([target.get(key) || 0, amount], currency))
}

function calculateOrderMoney(items: OrderMoneyItem[], currency = 'KES'): OrderMoneyAllocation {
  const sellers = new Map<string, number>()
  const errands = new Map<string, number>()
  const deliveryCharges = new Map<string, { amount: number; method: string; sellerId: string; shopId: string; location: string }>()
  let itemSubtotal = 0

  for (const item of items) {
    const quantity = Number(item.quantity ?? 0)
    if (!Number.isSafeInteger(quantity) || quantity <= 0) throw new RangeError('Order item quantity must be a positive integer')
    const lineTotal = multiplyMoney(item.unitAmount ?? 0, quantity, currency)
    if (lineTotal < 0) throw new RangeError('Order item prices cannot be negative')
    itemSubtotal = addMoney([itemSubtotal, lineTotal], currency)
    addAllocation(sellers, item.sellerId, lineTotal, currency)

    const fulfilment = item.fulfilment || {}
    const method = String(fulfilment.method || '')
    if (!fulfilment.quoted || ['pickup', 'digital', 'free_campus_delivery'].includes(method)) continue
    const fee = normalizeMoney(fulfilment.fee || 0, currency)
    if (fee < 0) throw new RangeError('Delivery fees cannot be negative')
    const shopId = String(item.shopId || '')
    const sellerId = String(item.sellerId || '')
    const location = String(fulfilment.location || '').trim()
    const key = method === 'errand_delivery'
      ? `errand:${shopId}`
      : `${method}:${shopId || sellerId}:${location}`
    const existing = deliveryCharges.get(key)
    if (existing && (toMinorUnits(existing.amount, currency) !== toMinorUnits(fee, currency) || (method === 'errand_delivery' && existing.shopId !== shopId))) {
      throw new RangeError('Items sharing a delivery must use the same delivery fee')
    }
    if (method === 'errand_delivery' && existing && location !== existing.location) {
      throw new RangeError('One errand cannot have multiple delivery destinations')
    }
    if (!existing) deliveryCharges.set(key, { amount: fee, method, sellerId, shopId, location })
  }

  let platformDeliveryAmount = 0
  for (const charge of deliveryCharges.values()) {
    if (charge.method === 'seller_delivery') addAllocation(sellers, charge.sellerId, charge.amount, currency)
    else if (charge.method === 'errand_delivery') addAllocation(errands, charge.shopId, charge.amount, currency)
    else if (charge.method === 'zumbarl_delivery') platformDeliveryAmount = addMoney([platformDeliveryAmount, charge.amount], currency)
  }

  const deliveryTotal = addMoney([...deliveryCharges.values()].map((charge) => charge.amount), currency)
  const totalAmount = addMoney([itemSubtotal, deliveryTotal], currency)
  return {
    itemSubtotal,
    deliveryTotal,
    totalAmount,
    sellers: [...sellers.entries()].map(([id, amount]) => ({ id, amount })),
    errands: [...errands.entries()].map(([id, amount]) => ({ id, amount })),
    platformDeliveryAmount
  }
}

export { calculateOrderMoney, type MoneyAllocation, type OrderMoneyAllocation, type OrderMoneyItem }
