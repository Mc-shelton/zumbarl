import { describe, expect, it } from 'vitest'
import { submitProjectDeliverableSchema } from './validateEarnPayloads.js'

function submissionWithUrl(url: string) {
  return {
    title: 'Final campaign files',
    files: [{
      fileName: 'campaign.pdf',
      url,
      mimeType: 'application/pdf',
      sizeBytes: 2048
    }]
  }
}

describe('submitProjectDeliverableSchema', () => {
  it.each([
    '/files/zumbarl-public-assets/project-deliverable/campaign.pdf',
    '/api/v1/uploads/content/zumbarl-private-files/project-deliverable/campaign.pdf',
    'https://cdn.example.test/project-deliverable/campaign.pdf'
  ])('accepts a stored project file URL: %s', (url) => {
    expect(submitProjectDeliverableSchema.safeParse(submissionWithUrl(url)).success).toBe(true)
  })

  it.each([
    '/api/v1/uploads/content/../../private.txt',
    '/api/v1/uploads/content/%2e%2e/private.txt',
    '/unrecognized/local/file.pdf',
    'javascript:alert(1)'
  ])('rejects an unsafe or unknown file URL: %s', (url) => {
    expect(submitProjectDeliverableSchema.safeParse(submissionWithUrl(url)).success).toBe(false)
  })
})
