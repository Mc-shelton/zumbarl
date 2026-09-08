function normalizeCurrency(currency: unknown): string {
  const normalized = String(currency || 'KES').trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(normalized)) throw new RangeError('A valid three-letter currency is required')
  return normalized
}

function moneyScale(currency: unknown = 'KES'): number {
  const normalized = normalizeCurrency(currency)
  const decimalPlaces = new Intl.NumberFormat('en', { style: 'currency', currency: normalized })
    .resolvedOptions().maximumFractionDigits ?? 2
  return 10 ** decimalPlaces
}

function toMinorUnits(value: unknown, currency: unknown = 'KES'): number {
  const amount = Number(value)
  if (!Number.isFinite(amount)) throw new RangeError('Money amount must be finite')
  return Math.round((amount + Number.EPSILON) * moneyScale(currency))
}

function fromMinorUnits(value: number, currency: unknown = 'KES'): number {
  if (!Number.isSafeInteger(value)) throw new RangeError('Minor-unit amount must be a safe integer')
  const amount = value / moneyScale(currency)
  return Object.is(amount, -0) ? 0 : amount
}

function normalizeMoney(value: unknown, currency: unknown = 'KES'): number {
  return fromMinorUnits(toMinorUnits(value, currency), currency)
}

function addMoney(values: unknown[], currency: unknown = 'KES'): number {
  return fromMinorUnits(values.reduce<number>((total, value) => total + toMinorUnits(value, currency), 0), currency)
}

function multiplyMoney(value: unknown, quantity: unknown, currency: unknown = 'KES'): number {
  const normalizedQuantity = Number(quantity)
  if (!Number.isSafeInteger(normalizedQuantity) || normalizedQuantity < 0) {
    throw new RangeError('Money quantity must be a non-negative integer')
  }
  return fromMinorUnits(toMinorUnits(value, currency) * normalizedQuantity, currency)
}

export {
  addMoney,
  fromMinorUnits,
  multiplyMoney,
  normalizeCurrency,
  normalizeMoney,
  toMinorUnits
}
