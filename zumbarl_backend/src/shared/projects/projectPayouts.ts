function resolveBudgetAmount(amount: unknown, label: unknown): number {
  const numeric = Number(amount ?? 0)
  if (numeric > 0) return numeric
  const parsed = Number(String(label ?? '').replace(/[^\d.]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function shareOfAgreedTotal<T extends { id: string }>(
  total: number,
  items: T[],
  currentId: string,
  isFinal: boolean,
  weightOf: (item: T) => number
): number {
  if (!items.length) return total
  const totalWeight = items.reduce((sum, item) => sum + Math.max(0, weightOf(item)), 0)
  const fractionOf = (item: T) => (totalWeight > 0 ? Math.max(0, weightOf(item)) / totalWeight : 1 / items.length)
  const roundedFor = (item: T) => Math.round(total * fractionOf(item))
  if (isFinal) {
    const others = items.filter((item) => item.id !== currentId)
    return total - others.reduce((sum, item) => sum + roundedFor(item), 0)
  }
  const current = items.find((item) => item.id === currentId)
  return current ? roundedFor(current) : 0
}

export { resolveBudgetAmount, shareOfAgreedTotal }
