import { z } from 'zod'

const stringListSchema = z.array(z.string()).default([])

const requiredAttachmentSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(2),
  fileType: z.string().min(2),
  required: z.coerce.boolean().default(true)
})

const scopeItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3),
  workflow: z.string().optional(),
  type: z.string().optional(),
  description: z.string().min(10),
  submissionMethod: z.string().optional(),
  verificationMethod: z.string().optional(),
  evidenceRequired: z.string().optional(),
  acceptanceCriteria: z.string().optional(),
  paymentRelease: z.string().optional(),
  budget: z.union([z.string(), z.number()]).optional(),
  budgetAmount: z.coerce.number().nonnegative().optional(),
  paymentPercent: z.union([z.string(), z.number()]).optional(),
  isSequential: z.coerce.boolean().default(true),
  status: z.string().optional(),
  maxSubmissions: z.coerce.number().int().positive().optional(),
  referenceFiles: z.array(z.record(z.any())).default([])
}).passthrough()

const createOpportunitySchema = z.object({
  title: z.string().min(3),
  type: z.enum(['gig', 'job', 'project', 'attachment', 'internship']).default('gig'),
  summary: z.string().min(10),
  budgetAmount: z.coerce.number().nonnegative().optional(),
  budget: z.string().optional(),
  currency: z.string().length(3).default('KES'),
  requirements: stringListSchema,
  deliverables: z.union([z.array(z.string()), z.string()]).default([]),
  deliverableMilestones: z.array(scopeItemSchema).default([]),
  milestoneScopes: z.array(scopeItemSchema).default([]),
  scopeMode: z.enum(['deliverable', 'milestone']).default('deliverable'),
  acceptanceCriteria: z.string().optional(),
  applicationDeadline: z.string().optional(),
  availability: z.string().optional(),
  bidderInstructions: z.string().optional(),
  category: z.string().optional(),
  clarityScore: z.coerce.number().int().min(0).max(100).optional(),
  company: z.string().optional(),
  companyDescription: z.string().optional(),
  deadline: z.string().optional(),
  duration: z.string().optional(),
  engagementMode: z.string().optional(),
  experienceLevel: z.string().optional(),
  mode: z.string().optional(),
  mustHave: stringListSchema,
  opportunityType: z.string().optional(),
  paymentTerms: z.string().optional(),
  portfolioRequired: z.string().optional(),
  preferredQualifications: z.union([z.string(), z.array(z.string())]).optional(),
  qualificationQuestions: stringListSchema,
  requiredAttachments: z.array(requiredAttachmentSchema).default([]),
  revisionLimit: z.coerce.number().int().min(0).max(5).default(3),
  screeningFocus: z.string().optional(),
  skills: z.union([z.string(), z.array(z.string())]).optional(),
  status: z.string().optional(),
  visibility: z.enum(['draft', 'public', 'invite-only']).default('draft')
}).passthrough()

const updateBusinessProfileSchema = z.object({
  name: z.string().min(2).optional(),
  industry: z.string().min(2).optional(),
  sector: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  website: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  registrationNumber: z.string().min(2).optional(),
  location: z.string().min(2).optional(),
  locationCity: z.string().min(2).optional(),
  locationAddress: z.string().min(2).optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  teamSize: z.string().optional(),
  size: z.string().optional(),
  hiringGoals: z.array(z.string()).default([]),
  onboardingCompleted: z.coerce.boolean().optional()
}).passthrough()

const createBusinessIndustrySchema = z.object({
  name: z.string().min(2),
  source: z.string().optional()
})

const submitBusinessKycSchema = z.object({
  registeredBusinessName: z.string().min(2),
  incorporationCertificate: z.string().min(2).optional(),
  kraPinCertificate: z.string().min(2).optional(),
  businessRegistrationNumber: z.string().min(2),
  representativeFullName: z.string().min(2),
  representativeIdDocument: z.string().min(2).optional(),
  representativePhone: z.string().min(6),
  representativeEmail: z.string().email(),
  representativeRole: z.string().min(2),
  industry: z.string().min(2),
  companySize: z.string().min(1),
  physicalAddress: z.string().min(2),
  geoCoordinates: z.string().optional(),
  website: z.string().url().optional(),
  yearEstablished: z.coerce.number().int().min(1800).max(new Date().getFullYear()),
  mpesaTillOrPaybill: z.string().optional(),
  bankAccountDetails: z.string().optional(),
  taxComplianceCertificate: z.string().optional(),
  linkedInCompanyPage: z.string().url().optional(),
  socialMediaPresence: z.string().optional(),
  verifiedCompanyReferral: z.string().optional(),
  status: z.enum(['draft', 'in_review', 'verified', 'needs_changes']).default('in_review')
}).passthrough()

const createOpportunityDeliverablesSchema = z.object({
  deliverables: z.array(scopeItemSchema).min(1),
  payment: z.object({
    amount: z.coerce.number().positive().optional(),
    currency: z.string().length(3).default('KES'),
    method: z.enum(['wallet', 'mobile_money', 'bank', 'card']).optional(),
    reference: z.string().optional()
  }).optional(),
  note: z.string().optional()
})

const inviteOpportunityBiddersSchema = z.object({
  studentIds: z.array(z.string()).min(1),
  note: z.string().optional()
})

const fundOpportunitySchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string().length(3).default('KES'),
  reference: z.string().optional()
})

const reviewApplicantSchema = z.object({
  action: z.enum(['shortlisted', 'interview_scheduled', 'awarded', 'removed', 'guardrail_unlocked']),
  detail: z.string().optional(),
  interviewAt: z.string().datetime().optional()
})

export {
  createOpportunitySchema,
  updateBusinessProfileSchema,
  createBusinessIndustrySchema,
  submitBusinessKycSchema,
  createOpportunityDeliverablesSchema,
  inviteOpportunityBiddersSchema,
  fundOpportunitySchema,
  reviewApplicantSchema
}
