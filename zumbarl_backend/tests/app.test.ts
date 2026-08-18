import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.js'
import { seedDatabase } from '../src/data/index.js'
import { prisma } from '../src/lib/prisma.js'

const app = await buildApp()
const createdWorkflowRecordIds: string[] = []
const createdCounterOfferBidIds: string[] = []
const createdMarketingCampaignIds: string[] = []
const seededTeamProjectId = 'team-social-media-content-creation'

async function login(email: string) {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email, password: 'password123' }
  })
  expect(response.statusCode).toBe(200)
  return response.json().token as string
}

async function createPublishedOpportunity(token: string, payload: Record<string, any>) {
  const budgetAmount = Number(payload.budgetAmount || 1000)
  const createResponse = await app.inject({
    method: 'POST',
    url: '/api/v1/business/opportunities',
    headers: { authorization: `Bearer ${token}` },
    payload: { ...payload, budgetAmount }
  })
  expect(createResponse.statusCode).toBe(201)
  expect(createResponse.json().status).toBe('draft')
  expect(createResponse.json().visibility).toBe('draft')
  expect(createResponse.json().publishedAt).toBeNull()

  const opportunityId = createResponse.json().id as string
  const fundResponse = await app.inject({
    method: 'POST',
    url: `/api/v1/business/opportunities/${opportunityId}/fund`,
    headers: { authorization: `Bearer ${token}` },
    payload: { amount: budgetAmount, currency: payload.currency || 'KES', reference: `test-${opportunityId}` }
  })
  expect(fundResponse.statusCode).toBe(201)

  const publishResponse = await app.inject({
    method: 'POST',
    url: `/api/v1/business/opportunities/${opportunityId}/publish`,
    headers: { authorization: `Bearer ${token}` }
  })
  expect(publishResponse.statusCode).toBe(200)
  expect(publishResponse.json().visibility).toBe('public')
  expect(publishResponse.json().publishedAt).toBeTruthy()
  return publishResponse
}

describe('Zumbarl API', () => {
  beforeAll(async () => {
    await seedDatabase()
  })

  afterAll(async () => {
    await prisma.projectTeamMember.deleteMany({ where: { projectId: seededTeamProjectId } })
    await prisma.projectTeamInvite.deleteMany({ where: { projectId: seededTeamProjectId } })
    await prisma.notification.deleteMany({
      where: { type: { in: ['PROJECT_TEAM_INVITE', 'PROJECT_TEAM_INVITE_RESPONSE', 'PROJECT_WORK_SUBMITTED', 'PROJECT_WORK_REVISED'] } }
    })
    if (createdWorkflowRecordIds.length) {
      await prisma.workflowRecord.deleteMany({ where: { id: { in: createdWorkflowRecordIds } } })
    }
    if (createdCounterOfferBidIds.length) {
      await prisma.notification.deleteMany({
        where: {
          OR: createdCounterOfferBidIds.map((bidId) => ({
            data: { path: ['bidId'], equals: bidId }
          }))
        }
      })
    }
    if (createdMarketingCampaignIds.length) {
      await prisma.marketingCampaign.deleteMany({
        where: { id: { in: createdMarketingCampaignIds } }
      })
    }
    await prisma.opportunity.deleteMany({
      where: {
        title: {
          in: [
            'Phased application test opportunity',
            'Application draft lifecycle test opportunity',
            'Auto-reject counter-offer test opportunity',
            'Retryable counter-offer test opportunity',
            'Published deletion protection test opportunity',
            'Private until funded test opportunity',
            'Auto-created fallback deliverable test opportunity'
          ]
        }
      }
    })
    await app.close()
  })

  it('reports health', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(response.statusCode).toBe(200)
    expect(response.json().status).toBe('ok')
  })

  it('edits marketing campaigns and lets qualified creators claim slots without applying', async () => {
    const businessToken = await login('business@zumbarl.test')
    const studentToken = await login('student@zumbarl.test')
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/marketing/campaigns',
      headers: { authorization: `Bearer ${businessToken}` },
      payload: {
        title: 'First come creator campaign',
        description: 'A campaign used to verify immediate creator pickup.',
        destinationUrl: 'https://example.com/campaign-offer',
        budgetAmount: 2000,
        currency: 'KES',
        platforms: ['Instagram'],
        minimumFollowers: 10000,
        minimumLikes: 700,
        minimumEngagement: 1000,
        payoutPerCampaigner: 1000,
        creatorsLimit: 2,
        materials: [{
          id: 'test-campaign-media',
          title: 'Campaign creative.png',
          type: 'image',
          url: '/files/zumbarl-public-assets/companies/test/campaign-creative.png',
          mimeType: 'image/png'
        }],
        startsAt: '2026-08-16',
        endsAt: '2026-08-30',
        status: 'published'
      }
    })
    expect(createResponse.statusCode).toBe(201)
    const campaignId = createResponse.json().id as string
    createdMarketingCampaignIds.push(campaignId)

    const editResponse = await app.inject({
      method: 'PATCH',
      url: `/api/v1/marketing/campaigns/${campaignId}`,
      headers: { authorization: `Bearer ${businessToken}` },
      payload: { title: 'Edited first come creator campaign' }
    })
    expect(editResponse.statusCode).toBe(200)
    expect(editResponse.json().title).toBe('Edited First Come Creator Campaign')

    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/marketing/campaigns',
      headers: { authorization: `Bearer ${studentToken}` }
    })
    expect(listResponse.statusCode).toBe(200)
    expect(listResponse.json().data.some((campaign: Record<string, any>) => campaign.id === campaignId)).toBe(true)

    const claimResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/marketing/campaigns/${campaignId}/accept`,
      headers: { authorization: `Bearer ${studentToken}` }
    })
    expect(claimResponse.statusCode).toBe(201)
    expect(claimResponse.json().status).toBe('accepted')
    expect(claimResponse.json().trackingUrl).toMatch(/^\/api\/v1\/marketing\/track\//)
    expect(claimResponse.json().promoCode).toBeTruthy()

    const trackingResponse = await app.inject({
      method: 'GET',
      url: claimResponse.json().trackingUrl
    })
    expect(trackingResponse.statusCode).toBe(200)
    expect(trackingResponse.headers['content-type']).toContain('text/html')
    expect(trackingResponse.body).toContain('<meta property="og:title" content="First Come Creator Campaign">')
    expect(trackingResponse.body).toContain('src="/api/v1/marketing/track-client.js"')
    expect(trackingResponse.headers['set-cookie']).toContain('zmb_campaign_vid=')

    const previewDetailResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/marketing/campaigns/${campaignId}`,
      headers: { authorization: `Bearer ${studentToken}` }
    })
    expect(previewDetailResponse.statusCode).toBe(200)
    expect(previewDetailResponse.json().acceptances[0].trackingClicks).toBe(0)

    const clickResponse = await app.inject({
      method: 'POST',
      url: `${claimResponse.json().trackingUrl}/click`,
      headers: { cookie: String(trackingResponse.headers['set-cookie']).split(';')[0] }
    })
    expect(clickResponse.statusCode).toBe(200)
    expect(clickResponse.json().destinationUrl).toBe('https://example.com/campaign-offer')
    expect(clickResponse.json().uniqueVisitor).toBe(true)
    expect(clickResponse.json().uniqueClicks).toBe(1)
    expect(clickResponse.json().totalVisits).toBe(1)

    const duplicateClickResponse = await app.inject({
      method: 'POST',
      url: `${claimResponse.json().trackingUrl}/click`,
      headers: { cookie: String(trackingResponse.headers['set-cookie']).split(';')[0] }
    })
    expect(duplicateClickResponse.statusCode).toBe(200)
    expect(duplicateClickResponse.json().uniqueVisitor).toBe(false)
    expect(duplicateClickResponse.json().uniqueClicks).toBe(1)
    expect(duplicateClickResponse.json().totalVisits).toBe(2)

    const detailResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/marketing/campaigns/${campaignId}`,
      headers: { authorization: `Bearer ${studentToken}` }
    })
    expect(detailResponse.statusCode).toBe(200)
    expect(detailResponse.json().campaign.acceptedCreatorsCount).toBe(1)
    expect(detailResponse.json().campaign.eligibility.eligible).toBe(true)
    expect(detailResponse.json().acceptances).toHaveLength(1)
    expect(detailResponse.json().acceptances[0].trackingClicks).toBe(1)
    expect(detailResponse.json().acceptances[0].trackingVisits).toBe(2)
  })

  it('creates a shared fallback deliverable as soon as an unscoped project is awarded', async () => {
    const businessToken = await login('business@zumbarl.test')
    const studentToken = await login('student@zumbarl.test')
    const opportunityResponse = await createPublishedOpportunity(businessToken, {
      title: 'Auto-created fallback deliverable test opportunity',
      summary: 'An opportunity with no explicitly configured deliverables.',
      budgetAmount: 1200,
      deliverableMilestones: [],
      milestoneScopes: []
    })
    const opportunity = opportunityResponse.json()

    const bidResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/earn/opportunities/${opportunity.id}/bids`,
      headers: { authorization: `Bearer ${studentToken}` },
      payload: {
        amount: 1200,
        intent: 'earn',
        proposal: 'I can deliver the complete project work for this opportunity.'
      }
    })
    expect(bidResponse.statusCode).toBe(201)

    const applicantsResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/business/opportunities/${opportunity.id}/applicants`,
      headers: { authorization: `Bearer ${businessToken}` }
    })
    const bid = applicantsResponse.json().data[0]
    const awardResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/business/applicants/${bid.id}/award`,
      headers: { authorization: `Bearer ${businessToken}` }
    })
    expect(awardResponse.statusCode).toBe(201)
    const projectId = awardResponse.json().project.id
    createdWorkflowRecordIds.push(projectId)

    const businessDeliverables = await app.inject({
      method: 'GET',
      url: `/api/v1/business/opportunities/${opportunity.id}/deliverables`,
      headers: { authorization: `Bearer ${businessToken}` }
    })
    expect(businessDeliverables.statusCode).toBe(200)
    expect(businessDeliverables.json().data).toHaveLength(1)
    expect(businessDeliverables.json().data[0].title).toBe('Final Project Delivery')
    expect(businessDeliverables.json().data[0].metadata.systemGenerated).toBe(true)

    const studentWorkspace = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}`,
      headers: { authorization: `Bearer ${studentToken}` }
    })
    expect(studentWorkspace.statusCode).toBe(200)
    expect(studentWorkspace.json().opportunity.deliverableMilestones).toHaveLength(1)
    expect(studentWorkspace.json().opportunity.deliverableMilestones[0].id)
      .toBe(businessDeliverables.json().data[0].id)
  })

  it('logs in and returns business dashboard', async () => {
    const token = await login('business@zumbarl.test')
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/business/dashboard',
      headers: { authorization: `Bearer ${token}` }
    })
    expect(response.statusCode).toBe(200)
    const metrics = response.json().metrics
    expect(Array.isArray(metrics)).toBe(true)
    const activeOpportunities = metrics.find((metric: Record<string, unknown>) => metric.label === 'Active Opportunities')
    expect(activeOpportunities).toBeDefined()
  })

  it('persists sample work and only allows draft opportunities to be deleted', async () => {
    const token = await login('business@zumbarl.test')
    const sampleUrl = 'https://example.com/reference-design.png'
    const draftResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/business/opportunities',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        title: 'Draft deletion test opportunity',
        summary: 'A draft used to verify sample work persistence and deletion.',
        visibility: 'draft',
        opportunitySplash: {
          id: 'upload-test-splash',
          name: 'draft-splash.png',
          fileName: 'draft-splash.png',
          type: 'image/png',
          mimeType: 'image/png',
          bucket: 'zumbarl-opportunity-files',
          storageKey: 'opportunities/test/brief/draft-splash.png',
          url: '/files/zumbarl-opportunity-files/opportunities/test/brief/draft-splash.png',
          previewUrl: '/files/zumbarl-opportunity-files/opportunities/test/brief/draft-splash.png',
          crop: { positionX: 45, positionY: 55, zoom: 1.2 },
          cropConfirmed: true,
          uploadStatus: 'complete'
        },
        deliverableMilestones: [
          {
            title: 'Reference-aligned design',
            sampleWork: [
              {
                label: 'Expected visual quality',
                files: [
                  {
                    id: 'upload-test-reference',
                    fileName: 'reference-design.png',
                    mimeType: 'image/png',
                    sizeBytes: 128,
                    url: sampleUrl
                  }
                ]
              }
            ]
          }
        ]
      }
    })
    expect(draftResponse.statusCode).toBe(201)
    const draft = draftResponse.json()
    expect(draft.opportunitySplash.url)
      .toBe('/files/zumbarl-opportunity-files/opportunities/test/brief/draft-splash.png')
    expect(draft.opportunitySplash.crop).toEqual({ positionX: 45, positionY: 55, zoom: 1.2 })
    expect(draft.deliverableMilestones[0].sampleWork[0].files[0].url).toBe(sampleUrl)
    expect(await prisma.opportunitySampleWork.count({
      where: { scopeItem: { opportunityId: draft.id } }
    })).toBe(1)

    const deleteDraftResponse = await app.inject({
      method: 'DELETE',
      url: `/api/v1/business/opportunities/${draft.id}`,
      headers: { authorization: `Bearer ${token}` }
    })
    expect(deleteDraftResponse.statusCode).toBe(204)
    expect(await prisma.opportunity.findUnique({ where: { id: draft.id } })).toBeNull()
    expect(await prisma.opportunitySampleWork.count({
      where: { scopeItem: { opportunityId: draft.id } }
    })).toBe(0)

    const publishedResponse = await createPublishedOpportunity(token, {
        title: 'Published deletion protection test opportunity',
        summary: 'A public opportunity that must not be deletable.',
        budgetAmount: 1000
    })

    const deletePublishedResponse = await app.inject({
      method: 'DELETE',
      url: `/api/v1/business/opportunities/${publishedResponse.json().id}`,
      headers: { authorization: `Bearer ${token}` }
    })
    expect(deletePublishedResponse.statusCode).toBe(409)
    expect(deletePublishedResponse.json().error).toBe('OPPORTUNITY_NOT_DRAFT')
  })

  it('allows a student to create a roadmap', async () => {
    const token = await login('student@zumbarl.test')
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/learn/roadmaps',
      headers: { authorization: `Bearer ${token}` },
      payload: { ladderId: 'digital-marketer', intent: 'earn-while-learning' }
    })
    expect(response.statusCode).toBe(201)
    expect(response.json().checkpoints.length).toBeGreaterThan(0)
  })

  it('keeps an opportunity private and blocks applications until its full budget is funded and published', async () => {
    const businessToken = await login('business@zumbarl.test')
    const studentToken = await login('kevin.mutua@zumbarl.test')
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/business/opportunities',
      headers: { authorization: `Bearer ${businessToken}` },
      payload: {
        title: 'Private until funded test opportunity',
        summary: 'This opportunity must stay private until escrow covers the complete budget.',
        budgetAmount: 2000,
        status: 'open',
        visibility: 'public'
      }
    })
    expect(createResponse.statusCode).toBe(201)
    const opportunity = createResponse.json()
    expect(opportunity.status).toBe('draft')
    expect(opportunity.visibility).toBe('draft')

    const discoverBeforePayment = await app.inject({
      method: 'GET',
      url: '/api/v1/earn/opportunities',
      headers: { authorization: `Bearer ${studentToken}` }
    })
    expect(discoverBeforePayment.json().data.some((item: Record<string, any>) => item.id === opportunity.id)).toBe(false)

    const applicationBeforePublication = await app.inject({
      method: 'POST',
      url: `/api/v1/earn/opportunities/${opportunity.id}/bids`,
      headers: { authorization: `Bearer ${studentToken}` },
      payload: { amount: 2000, intent: 'earn', proposal: 'This must not be accepted yet.' }
    })
    expect(applicationBeforePublication.statusCode).toBe(409)
    expect(applicationBeforePublication.json().error).toBe('OPPORTUNITY_NOT_ACCEPTING_APPLICATIONS')

    const publishBeforePayment = await app.inject({
      method: 'POST',
      url: `/api/v1/business/opportunities/${opportunity.id}/publish`,
      headers: { authorization: `Bearer ${businessToken}` }
    })
    expect(publishBeforePayment.statusCode).toBe(409)
    expect(publishBeforePayment.json().error).toBe('OPPORTUNITY_FUNDING_REQUIRED')

    await app.inject({
      method: 'POST',
      url: `/api/v1/business/opportunities/${opportunity.id}/fund`,
      headers: { authorization: `Bearer ${businessToken}` },
      payload: { amount: 1000, currency: 'KES', reference: 'partial-funding-test' }
    })
    const publishAfterPartialPayment = await app.inject({
      method: 'POST',
      url: `/api/v1/business/opportunities/${opportunity.id}/publish`,
      headers: { authorization: `Bearer ${businessToken}` }
    })
    expect(publishAfterPartialPayment.statusCode).toBe(409)
    expect(publishAfterPartialPayment.json().details.escrowCoverage).toBe(1000)

    await app.inject({
      method: 'POST',
      url: `/api/v1/business/opportunities/${opportunity.id}/fund`,
      headers: { authorization: `Bearer ${businessToken}` },
      payload: { amount: 1000, currency: 'KES', reference: 'remaining-funding-test' }
    })
    const publishResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/business/opportunities/${opportunity.id}/publish`,
      headers: { authorization: `Bearer ${businessToken}` }
    })
    expect(publishResponse.statusCode).toBe(200)

    const discoverAfterPublication = await app.inject({
      method: 'GET',
      url: '/api/v1/earn/opportunities',
      headers: { authorization: `Bearer ${studentToken}` }
    })
    expect(discoverAfterPublication.json().data.some((item: Record<string, any>) => item.id === opportunity.id)).toBe(true)
  })

  it('locks the agreed project price after a student has been accepted', async () => {
    const businessToken = await login('business@zumbarl.test')
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${seededTeamProjectId}/price-proposals`,
      headers: { authorization: `Bearer ${businessToken}` },
      payload: { amount: 9000, currency: 'KES' }
    })
    expect(response.statusCode).toBe(409)
    expect(response.json().error).toBe('PROJECT_PRICE_LOCKED_AFTER_ACCEPTANCE')
  })

  it('saves incomplete application drafts and converts them into one submitted applicant', async () => {
    const businessToken = await login('business@zumbarl.test')
    const studentToken = await login('kevin.mutua@zumbarl.test')
    const opportunityResponse = await createPublishedOpportunity(businessToken, {
        title: 'Application draft lifecycle test opportunity',
        summary: 'An open opportunity used to verify incomplete application drafts and final submission.',
        budgetAmount: 1000
    })
    const opportunityId = opportunityResponse.json().id

    const draftResponse = await app.inject({
      method: 'PUT',
      url: `/api/v1/earn/opportunities/${opportunityId}/bid-draft`,
      headers: { authorization: `Bearer ${studentToken}` },
      payload: {
        amount: null,
        applicationStepIndex: 1,
        attachments: [],
        currency: 'KES',
        intent: 'earn',
        proposal: 'Early idea',
        questionAnswers: []
      }
    })
    expect(draftResponse.statusCode).toBe(200)
    expect(draftResponse.json().status).toBe('draft')
    expect(draftResponse.json().proposal).toBe('Early idea')

    const readDraftResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/earn/opportunities/${opportunityId}/bid-draft`,
      headers: { authorization: `Bearer ${studentToken}` }
    })
    expect(readDraftResponse.statusCode).toBe(200)
    expect(readDraftResponse.json().draft.metadata.applicationStepIndex).toBe(1)

    const applicantsBeforeSubmit = await app.inject({
      method: 'GET',
      url: `/api/v1/business/opportunities/${opportunityId}/applicants`,
      headers: { authorization: `Bearer ${businessToken}` }
    })
    expect(applicantsBeforeSubmit.statusCode).toBe(200)
    expect(applicantsBeforeSubmit.json().data).toHaveLength(0)

    const submitResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/earn/opportunities/${opportunityId}/bids`,
      headers: { authorization: `Bearer ${studentToken}` },
      payload: {
        amount: 3500,
        attachments: [],
        currency: 'KES',
        deliveryTime: '4-7 days',
        intent: 'earn',
        proposal: 'I can complete this opportunity and provide a clear handover.',
        questionAnswers: []
      }
    })
    expect(submitResponse.statusCode).toBe(201)
    expect(submitResponse.json().status).toBe('submitted')

    const savedOpportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } })
    expect(savedOpportunity?.applicants).toBe(1)
    const applicantsAfterSubmit = await app.inject({
      method: 'GET',
      url: `/api/v1/business/opportunities/${opportunityId}/applicants`,
      headers: { authorization: `Bearer ${businessToken}` }
    })
    expect(applicantsAfterSubmit.json().data).toHaveLength(1)

    const overwriteSubmittedResponse = await app.inject({
      method: 'PUT',
      url: `/api/v1/earn/opportunities/${opportunityId}/bid-draft`,
      headers: { authorization: `Bearer ${studentToken}` },
      payload: { proposal: 'Should not overwrite the submitted application.' }
    })
    expect(overwriteSubmittedResponse.statusCode).toBe(409)
  })

  it('automatically rejects an application when a flagged counter-offer is declined', async () => {
    const businessToken = await login('business@zumbarl.test')
    const studentToken = await login('kevin.mutua@zumbarl.test')
    const opportunityResponse = await createPublishedOpportunity(businessToken, {
        budgetAmount: 1000,
        title: 'Auto-reject counter-offer test opportunity',
        summary: 'An opportunity used to verify declined offer automation.'
    })
    const opportunityId = opportunityResponse.json().id

    const bidResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/earn/opportunities/${opportunityId}/bids`,
      headers: { authorization: `Bearer ${studentToken}` },
      payload: {
        amount: 2000,
        attachments: [],
        currency: 'KES',
        intent: 'earn',
        proposal: 'I can complete this opportunity with a clear handover.',
        questionAnswers: []
      }
    })
    expect(bidResponse.statusCode).toBe(201)
    const bidId = bidResponse.json().id
    createdCounterOfferBidIds.push(bidId)

    const atBudgetResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/business/applicants/${bidId}/counter-offer`,
      headers: { authorization: `Bearer ${businessToken}` },
      payload: { amount: 1000, autoRejectOnDecline: true, currency: 'KES' }
    })
    expect(atBudgetResponse.statusCode).toBe(400)
    expect(atBudgetResponse.json().error).toBe('COUNTER_OFFER_OUTSIDE_NEGOTIATION_RANGE')

    const atStudentBidResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/business/applicants/${bidId}/counter-offer`,
      headers: { authorization: `Bearer ${businessToken}` },
      payload: { amount: 2000, autoRejectOnDecline: true, currency: 'KES' }
    })
    expect(atStudentBidResponse.statusCode).toBe(400)
    expect(atStudentBidResponse.json().error).toBe('COUNTER_OFFER_OUTSIDE_NEGOTIATION_RANGE')

    const counterOfferResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/business/applicants/${bidId}/counter-offer`,
      headers: { authorization: `Bearer ${businessToken}` },
      payload: {
        amount: 1200,
        autoRejectOnDecline: true,
        currency: 'KES'
      }
    })
    expect(counterOfferResponse.statusCode).toBe(200)
    expect(counterOfferResponse.json().counterOffer.autoRejectOnDecline).toBe(true)

    const declineResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/earn/bids/${bidId}/counter-offer/respond`,
      headers: { authorization: `Bearer ${studentToken}` },
      payload: { decision: 'rejected' }
    })
    expect(declineResponse.statusCode).toBe(200)
    expect(declineResponse.json().applicationAutoRejected).toBe(true)

    const savedBid = await prisma.bid.findUnique({ where: { id: bidId } })
    expect(savedBid?.status).toBe('rejected')
    expect((savedBid?.metadata as Record<string, any>)?.counterOffer?.status).toBe('rejected')

    const applicantsResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/business/opportunities/${opportunityId}/applicants`,
      headers: { authorization: `Bearer ${businessToken}` }
    })
    expect(applicantsResponse.statusCode).toBe(200)
    expect(applicantsResponse.json().data.find((applicant: Record<string, any>) => applicant.id === bidId)?.status)
      .toBe('rejected')

    const responseNotification = await prisma.notification.findFirst({
      where: {
        type: 'BID_COUNTER_OFFER_RESPONSE',
        data: { path: ['bidId'], equals: bidId }
      }
    })
    expect(responseNotification?.title).toBe('Offer Declined — Application Rejected')
    expect((responseNotification?.data as Record<string, any>)?.applicationAutoRejected).toBe(true)

    const retryAfterAutoRejectResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/business/applicants/${bidId}/counter-offer`,
      headers: { authorization: `Bearer ${businessToken}` },
      payload: { amount: 1400, autoRejectOnDecline: false, currency: 'KES' }
    })
    expect(retryAfterAutoRejectResponse.statusCode).toBe(409)
    expect(retryAfterAutoRejectResponse.json().error).toBe('APPLICATION_NOT_NEGOTIABLE')
  })

  it('only allows a new offer after a non-auto-reject offer was declined', async () => {
    const businessToken = await login('business@zumbarl.test')
    const studentToken = await login('kevin.mutua@zumbarl.test')
    const opportunityResponse = await createPublishedOpportunity(businessToken, {
        budgetAmount: 1000,
        title: 'Retryable counter-offer test opportunity',
        summary: 'An opportunity used to verify the counter-offer retry lifecycle.'
    })
    const opportunityId = opportunityResponse.json().id

    const bidResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/earn/opportunities/${opportunityId}/bids`,
      headers: { authorization: `Bearer ${studentToken}` },
      payload: {
        amount: 2000,
        attachments: [],
        currency: 'KES',
        intent: 'earn',
        proposal: 'I can deliver this work with a documented handover.',
        questionAnswers: []
      }
    })
    expect(bidResponse.statusCode).toBe(201)
    const bidId = bidResponse.json().id
    createdCounterOfferBidIds.push(bidId)

    const firstOfferResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/business/applicants/${bidId}/counter-offer`,
      headers: { authorization: `Bearer ${businessToken}` },
      payload: { amount: 1200, autoRejectOnDecline: false, currency: 'KES' }
    })
    expect(firstOfferResponse.statusCode).toBe(200)

    const retryWhilePendingResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/business/applicants/${bidId}/counter-offer`,
      headers: { authorization: `Bearer ${businessToken}` },
      payload: { amount: 1300, autoRejectOnDecline: false, currency: 'KES' }
    })
    expect(retryWhilePendingResponse.statusCode).toBe(409)
    expect(retryWhilePendingResponse.json().error).toBe('COUNTER_OFFER_RETRY_NOT_ALLOWED')

    const declineResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/earn/bids/${bidId}/counter-offer/respond`,
      headers: { authorization: `Bearer ${studentToken}` },
      payload: { decision: 'rejected' }
    })
    expect(declineResponse.statusCode).toBe(200)
    expect(declineResponse.json().applicationAutoRejected).toBe(false)
    expect((await prisma.bid.findUnique({ where: { id: bidId } }))?.status).toBe('submitted')

    const retryAfterDeclineResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/business/applicants/${bidId}/counter-offer`,
      headers: { authorization: `Bearer ${businessToken}` },
      payload: { amount: 1400, autoRejectOnDecline: true, currency: 'KES' }
    })
    expect(retryAfterDeclineResponse.statusCode).toBe(200)
    expect(retryAfterDeclineResponse.json().counterOffer.amount).toBe(1400)
    expect(retryAfterDeclineResponse.json().counterOffer.autoRejectOnDecline).toBe(true)

    const acceptRetryResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/earn/bids/${bidId}/counter-offer/respond`,
      headers: { authorization: `Bearer ${studentToken}` },
      payload: { decision: 'accepted' }
    })
    expect(acceptRetryResponse.statusCode).toBe(200)

    const retryAfterAcceptedResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/business/applicants/${bidId}/counter-offer`,
      headers: { authorization: `Bearer ${businessToken}` },
      payload: { amount: 1300, autoRejectOnDecline: false, currency: 'KES' }
    })
    expect(retryAfterAcceptedResponse.statusCode).toBe(409)
    expect(retryAfterAcceptedResponse.json().error).toBe('COUNTER_OFFER_RETRY_NOT_ALLOWED')
  })

  it('persists project team invites, notifies the student, and adds accepted members', async () => {
    await prisma.projectTeamMember.deleteMany({ where: { projectId: seededTeamProjectId } })
    await prisma.projectTeamInvite.deleteMany({ where: { projectId: seededTeamProjectId } })
    await prisma.notification.deleteMany({
      where: { type: { in: ['PROJECT_TEAM_INVITE', 'PROJECT_TEAM_INVITE_RESPONSE'] } }
    })

    const ownerToken = await login('student@zumbarl.test')
    const invitedStudentToken = await login('brian.otieno@zumbarl.test')
    const candidatesResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${seededTeamProjectId}/team/invite-candidates`,
      headers: { authorization: `Bearer ${ownerToken}` }
    })
    expect(candidatesResponse.statusCode).toBe(200)
    const brian = candidatesResponse.json().candidates.find((candidate: Record<string, any>) => (
      candidate.email === 'brian.otieno@zumbarl.test'
    ))
    expect(brian?.userId).toBeTruthy()

    const inviteResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${seededTeamProjectId}/team/invites`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        userIds: [brian.userId],
        role: 'Designer',
        note: 'Help us create the campaign visuals.'
      }
    })
    expect(inviteResponse.statusCode).toBe(201)
    expect(inviteResponse.json().notifications).toBe(1)
    const inviteId = inviteResponse.json().invites[0].id

    const studentNotificationsResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/campus/notifications',
      headers: { authorization: `Bearer ${invitedStudentToken}` }
    })
    expect(studentNotificationsResponse.statusCode).toBe(200)
    expect(studentNotificationsResponse.json().data.some((notification: Record<string, any>) => (
      notification.type === 'PROJECT_TEAM_INVITE'
      && notification.data?.inviteId === inviteId
      && notification.data?.deepLink.includes(seededTeamProjectId)
    ))).toBe(true)

    const myInvitesResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/team-invites/me',
      headers: { authorization: `Bearer ${invitedStudentToken}` }
    })
    expect(myInvitesResponse.statusCode).toBe(200)
    expect(myInvitesResponse.json().invites.find((invite: Record<string, any>) => invite.id === inviteId)?.status)
      .toBe('pending')

    const acceptResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/team-invites/${inviteId}/respond`,
      headers: { authorization: `Bearer ${invitedStudentToken}` },
      payload: { action: 'accept' }
    })
    expect(acceptResponse.statusCode).toBe(200)
    expect(acceptResponse.json().invite.status).toBe('accepted')
    expect(acceptResponse.json().member.role).toBe('Designer')

    const teamResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${seededTeamProjectId}/team`,
      headers: { authorization: `Bearer ${ownerToken}` }
    })
    expect(teamResponse.statusCode).toBe(200)
    expect(teamResponse.json().members.some((member: Record<string, any>) => (
      member.email === 'brian.otieno@zumbarl.test' && member.role === 'Designer'
    ))).toBe(true)

    const ownerNotificationsResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/campus/notifications',
      headers: { authorization: `Bearer ${ownerToken}` }
    })
    expect(ownerNotificationsResponse.json().data.some((notification: Record<string, any>) => (
      notification.type === 'PROJECT_TEAM_INVITE_RESPONSE'
      && notification.data?.inviteId === inviteId
    ))).toBe(true)
  })

  it('persists phased student application answers and attachments', async () => {
    const businessToken = await login('business@zumbarl.test')
    const createOpportunityResponse = await createPublishedOpportunity(businessToken, {
        title: 'Phased application test opportunity',
        summary: 'An opportunity used to verify student application data persistence.',
        budgetAmount: 5000,
        qualificationQuestions: ['What relevant experience do you have?'],
        requiredAttachments: [
          { label: 'Portfolio link', fileType: 'Link', required: true }
        ],
        deliverableMilestones: [
          {
            title: 'Campaign concept',
            sampleWork: [
              {
                label: 'Student-facing reference',
                fileType: 'Link',
                files: [
                  {
                    id: 'student-facing-reference',
                    kind: 'link',
                    name: 'Campaign reference',
                    url: 'https://example.com/campaign-reference'
                  }
                ]
              }
            ]
          }
        ]
    })
    const opportunity = createOpportunityResponse.json()
    const attachmentRequirement = opportunity.requiredAttachments[0]
    const studentToken = await login('student@zumbarl.test')

    const incompleteResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/earn/opportunities/${opportunity.id}/bids`,
      headers: { authorization: `Bearer ${studentToken}` },
      payload: {
        amount: 4500,
        intent: 'earn',
        proposal: 'I can complete this opportunity.',
        questionAnswers: [],
        attachments: []
      }
    })
    expect(incompleteResponse.statusCode).toBe(400)

    const submitResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/earn/opportunities/${opportunity.id}/bids`,
      headers: { authorization: `Bearer ${studentToken}` },
      payload: {
        amount: 4500,
        intent: 'earn',
        proposal: 'I can complete this opportunity with the required experience.',
        deliveryTime: '4-7 days',
        questionAnswers: [
          {
            question: 'What relevant experience do you have?',
            answer: 'I have completed two similar campus projects.'
          }
        ],
        attachments: [
          {
            requirementId: attachmentRequirement.id,
            label: attachmentRequirement.label,
            fileType: attachmentRequirement.fileType,
            url: 'https://example.com/student-portfolio'
          }
        ]
      }
    })
    expect(submitResponse.statusCode).toBe(201)
    expect(submitResponse.json().questionAnswers).toHaveLength(1)
    expect(submitResponse.json().attachments).toHaveLength(1)

    const applicantResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/business/opportunities/${opportunity.id}/applicants`,
      headers: { authorization: `Bearer ${businessToken}` }
    })
    expect(applicantResponse.statusCode).toBe(200)
    expect(applicantResponse.json().data).toHaveLength(1)
    expect(applicantResponse.json().data[0].student.name).toBeTruthy()
    expect(applicantResponse.json().data[0].questionAnswers).toHaveLength(1)
    expect(applicantResponse.json().data[0].attachments).toHaveLength(1)

    const bid = applicantResponse.json().data[0]
    const scheduleResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/business/applicants/${bid.id}/interview`,
      headers: { authorization: `Bearer ${businessToken}` },
      payload: {
        interviewType: 'video',
        interviewAt: '2026-07-15T08:00:00.000Z',
        durationMinutes: 30,
        timezone: 'Africa/Nairobi',
        meetingOption: 'custom',
        meetingUrl: 'https://meet.google.com/test-interview',
        note: 'Please prepare one relevant project example.'
      }
    })
    expect(scheduleResponse.statusCode).toBe(201)
    expect(scheduleResponse.json().interview.status).toBe('pending')
    const interviewId = scheduleResponse.json().interview.id

    const notificationsResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/campus/notifications',
      headers: { authorization: `Bearer ${studentToken}` }
    })
    expect(notificationsResponse.statusCode).toBe(200)
    expect(notificationsResponse.json().data.some((notification: Record<string, any>) => (
      notification.type === 'INTERVIEW_SCHEDULED'
      && notification.data?.interviewId === interviewId
    ))).toBe(true)

    const interviewResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/earn/interviews/${interviewId}`,
      headers: { authorization: `Bearer ${studentToken}` }
    })
    expect(interviewResponse.statusCode).toBe(200)
    expect(interviewResponse.json().meetingUrl).toBe('https://meet.google.com/test-interview')

    const invalidResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/earn/interviews/${interviewId}/respond`,
      headers: { authorization: `Bearer ${studentToken}` },
      payload: {
        action: 'propose_new_time',
        proposedAt: '2026-07-16T09:00:00.000Z'
      }
    })
    expect(invalidResponse.statusCode).toBe(400)

    const studentResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/earn/interviews/${interviewId}/respond`,
      headers: { authorization: `Bearer ${studentToken}` },
      payload: {
        action: 'propose_new_time',
        proposedAt: '2026-07-16T09:00:00.000Z',
        note: 'I have an exam at the original time.'
      }
    })
    expect(studentResponse.statusCode).toBe(200)
    expect(studentResponse.json().interview.status).toBe('proposed_new_time')

    const confirmResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/earn/interviews/${interviewId}/respond`,
      headers: { authorization: `Bearer ${studentToken}` },
      payload: { action: 'rsvp' }
    })
    expect(confirmResponse.statusCode).toBe(200)
    expect(confirmResponse.json().interview.status).toBe('confirmed')

    const startResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/business/applicants/${bid.id}/interview/start`,
      headers: { authorization: `Bearer ${businessToken}` }
    })
    expect(startResponse.statusCode).toBe(200)
    expect(startResponse.json().messageCreated).toBe(true)
    expect(startResponse.json().notificationCreated).toBe(true)
    expect(startResponse.json().conversation.messages.at(-1).body).toBe('Interview started')

    const repeatedStartResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/business/applicants/${bid.id}/interview/start`,
      headers: { authorization: `Bearer ${businessToken}` }
    })
    expect(repeatedStartResponse.statusCode).toBe(200)
    expect(repeatedStartResponse.json().messageCreated).toBe(false)
    expect(repeatedStartResponse.json().notificationCreated).toBe(false)
    expect(repeatedStartResponse.json().conversation.messages).toHaveLength(1)

    const startedNotificationsResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/campus/notifications',
      headers: { authorization: `Bearer ${studentToken}` }
    })
    expect(startedNotificationsResponse.json().data.some((notification: Record<string, any>) => (
      notification.type === 'INTERVIEW_STARTED'
      && notification.data?.interviewId === interviewId
    ))).toBe(true)

    const awardResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/business/applicants/${bid.id}/award`,
      headers: { authorization: `Bearer ${businessToken}` }
    })
    expect(awardResponse.statusCode).toBe(201)
    const projectId = awardResponse.json().project.id
    createdWorkflowRecordIds.push(projectId)

    const projectResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}`,
      headers: { authorization: `Bearer ${studentToken}` }
    })
    expect(projectResponse.statusCode).toBe(200)
    expect(projectResponse.json().opportunity.deliverableMilestones[0].sampleWork[0].files[0].url)
      .toBe('https://example.com/campaign-reference')

    const startProjectResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/start`,
      headers: { authorization: `Bearer ${businessToken}` }
    })
    expect(startProjectResponse.statusCode).toBe(200)
    expect(startProjectResponse.json().project.scopeLocked).toBe(true)

    const workSubmissionResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/earn/projects/${projectId}/deliverables`,
      headers: { authorization: `Bearer ${studentToken}` },
      payload: {
        title: 'Campaign concept submission',
        kind: 'final',
        scopeItemId: opportunity.deliverableMilestones[0].id,
        scopeItemLabel: opportunity.deliverableMilestones[0].title,
        files: [{
          fileName: 'campaign-concept.pdf',
          url: '/files/zumbarl-project-files/project-deliverable/campaign-concept.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1024
        }]
      }
    })
    expect(workSubmissionResponse.statusCode).toBe(201)
    expect(workSubmissionResponse.json().files[0].url)
      .toBe('/files/zumbarl-project-files/project-deliverable/campaign-concept.pdf')
    createdWorkflowRecordIds.push(workSubmissionResponse.json().id)

    const duplicateSubmissionResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/earn/projects/${projectId}/deliverables`,
      headers: { authorization: `Bearer ${studentToken}` },
      payload: {
        title: 'Unlinked duplicate submission',
        kind: 'final',
        scopeItemId: opportunity.deliverableMilestones[0].id,
        scopeItemLabel: opportunity.deliverableMilestones[0].title,
        files: [{ fileName: 'duplicate.pdf', url: '/files/duplicate.pdf' }]
      }
    })
    expect(duplicateSubmissionResponse.statusCode).toBe(409)
    expect(duplicateSubmissionResponse.json().error).toBe('DELIVERABLE_REVISION_REQUIRED')

    const revisionResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/earn/projects/${projectId}/deliverables`,
      headers: { authorization: `Bearer ${studentToken}` },
      payload: {
        title: 'Campaign concept revision',
        kind: 'revision',
        revisionOfId: workSubmissionResponse.json().id,
        scopeItemId: opportunity.deliverableMilestones[0].id,
        scopeItemLabel: opportunity.deliverableMilestones[0].title,
        files: [{ fileName: 'campaign-concept-v2.pdf', url: '/files/campaign-concept-v2.pdf' }]
      }
    })
    expect(revisionResponse.statusCode).toBe(201)
    expect(revisionResponse.json().isRevision).toBe(true)
    expect(revisionResponse.json().revisionOfId).toBe(workSubmissionResponse.json().id)
    createdWorkflowRecordIds.push(revisionResponse.json().id)

    const revisedSubmissionsResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/business/opportunities/${opportunity.id}/submissions`,
      headers: { authorization: `Bearer ${businessToken}` }
    })
    expect(revisedSubmissionsResponse.statusCode).toBe(200)
    expect(revisedSubmissionsResponse.json().data[0].isRevision).toBe(true)
    expect(revisedSubmissionsResponse.json().data[0].revisionNumber).toBe(1)
    expect(revisedSubmissionsResponse.json().data[0].projectAgreedAmount).toBe(4500)
    expect(revisedSubmissionsResponse.json().data[0].payoutAmount).toBe(4500)
    expect(revisedSubmissionsResponse.json().data[0].payoutCurrency).toBe('KES')

    const revisionNotification = await prisma.notification.findFirst({
      where: {
        type: 'PROJECT_WORK_REVISED',
        data: { path: ['deliverableId'], equals: revisionResponse.json().id }
      }
    })
    expect(revisionNotification).toBeTruthy()

    const lateDeliverableResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/business/opportunities/${opportunity.id}/deliverables`,
      headers: { authorization: `Bearer ${businessToken}` },
      payload: {
        deliverables: [{ title: 'Late scope change' }]
      }
    })
    expect(lateDeliverableResponse.statusCode).toBe(409)
    expect(lateDeliverableResponse.json().error).toBe('OPPORTUNITY_SCOPE_LOCKED_AFTER_PROJECT_START')
  })
})
