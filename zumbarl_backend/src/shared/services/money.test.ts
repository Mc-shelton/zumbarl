import { describe, expect, it } from 'vitest'
import { addMoney, multiplyMoney, normalizeCurrency, normalizeMoney, toMinorUnits } from './money.js'

describe('money helpers', () => {
  it('adds decimal currency through integer minor units', () => {
    expect(addMoney([0.1, 0.2], 'KES')).toBe(0.3)
    expect(multiplyMoney(19.99, 3, 'KES')).toBe(59.97)
    expect(toMinorUnits(59.97, 'KES')).toBe(5997)
  })

  it('uses the currency minor-unit precision', () => {
    expect(normalizeMoney(10.6, 'JPY')).toBe(11)
    expect(normalizeMoney(1.2344, 'KWD')).toBe(1.234)
  })

  it('normalizes and validates currency codes', () => {
    expect(normalizeCurrency(' kes ')).toBe('KES')
    expect(() => normalizeCurrency('shillings')).toThrow('three-letter currency')
  })
})
