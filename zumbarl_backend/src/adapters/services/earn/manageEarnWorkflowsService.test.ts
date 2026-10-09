import { describe, expect, it } from 'vitest'
import { resolveSubmittedBidPricing } from './manageEarnWorkflowsService.js'

describe('submitted bid pricing', () => {
  const opportunity = { budgetAmount: 1600, currency: 'KES' }

  it('materializes the opportunity budget instead of storing a zero bid', () => {
    expect(resolveSubmittedBidPricing(opportunity, {
      amount: 0,
      pricingType: 'fixed'
    })).toMatchObject({
      amount: 1600,
      amountSource: 'opportunity_budget',
      currency: 'KES'
    })
  })

  it('keeps a positive fixed bid as the contract amount', () => {
    expect(resolveSubmittedBidPricing(opportunity, {
      amount: 1800,
      pricingType: 'fixed'
    })).toMatchObject({
      amount: 1800,
      amountSource: 'student_bid',
      unitRate: null
    })
  })

  it('stores the estimated contract total for rate-based bids', () => {
    expect(resolveSubmittedBidPricing(opportunity, {
      amount: 250,
      estimatedUnits: 8,
      pricingType: 'per hour'
    })).toMatchObject({
      amount: 2000,
      amountSource: 'student_bid',
      unitRate: 250
    })
  })

  it('rejects zero when neither the bid nor opportunity has a payable amount', () => {
    expect(() => resolveSubmittedBidPricing({ budgetAmount: 0, currency: 'KES' }, {
      amount: 0,
      pricingType: 'fixed'
    })).toThrow(/greater than zero/i)
  })
})
