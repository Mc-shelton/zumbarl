import { z } from 'zod'

function emptyStringToUndefined(value: unknown) {
  return value === '' || value === null ? undefined : value
}

function nullToUndefined(value: unknown) {
  return value === null ? undefined : value
}

function nullishToEmptyArray(value: unknown) {
  return value === '' || value === null || value === undefined ? [] : value
}

const optionalStringSchema = z.preprocess(
  nullToUndefined,
  z.string().optional()
)

const stringListSchema = z.preprocess(
  nullishToEmptyArray,
  z.array(z.string()).default([])
)

const requiredAttachmentsSchema = z.preprocess(
  nullishToEmptyArray,
  z.array(z.lazy(() => requiredAttachmentSchema)).default([])
)

const scopeItemsSchema = z.preprocess(
  nullishToEmptyArray,
  z.array(z.lazy(() => scopeItemSchema)).default([])
)

const optionalPositiveIntegerSchema = z.preprocess(
  emptyStringToUndefined,
  z.coerce.number().int().positive().optional()
)

const requiredAttachmentSchema = z.object({
  id: z.string().optional(),
  label: z.string().default(''),
  fileType: z.string().default(''),
  required: z.coerce.boolean().default(true)
})

const scopeItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().default(''),
  workflow: optionalStringSchema,
  type: optionalStringSchema,
  description: z.string().default(''),
  submissionMethod: optionalStringSchema,
  verificationMethod: optionalStringSchema,
  evidenceRequired: optionalStringSchema,
  acceptanceCriteria: optionalStringSchema,
  paymentRelease: optionalStringSchema,
  budget: z.union([z.string(), z.number()]).optional(),
  budgetAmount: z.coerce.number().nonnegative().optional(),
  paymentPercent: z.union([z.string(), z.number()]).optional(),
  isSequential: z.preprocess((value) => value === null ? undefined : value, z.coerce.boolean().default(true)),
  status: optionalStringSchema,
  maxSubmissions: optionalPositiveIntegerSchema,
  referenceFiles: z.preprocess(nullishToEmptyArray, z.array(z.record(z.any())).default([]))
}).passthrough()

const createOpportunitySchema = z.object({
  title: z.string().default(''),
  type: z.enum(['gig', 'job', 'project', 'attachment', 'internship']).default('gig'),
  summary: z.string().default(''),
  budgetAmount: z.coerce.number().nonnegative().optional(),
  budget: optionalStringSchema,
  currency: z.string().length(3).default('KES'),
  requirements: stringListSchema,
  deliverables: z.preprocess(nullishToEmptyArray, z.union([z.array(z.string()), z.string()]).default([])),
  deliverableMilestones: scopeItemsSchema,
  milestoneScopes: scopeItemsSchema,
  scopeMode: z.enum(['deliverable', 'milestone']).default('deliverable'),
  acceptanceCriteria: optionalStringSchema,
  applicationDeadline: optionalStringSchema,
  availability: optionalStringSchema,
  bidderInstructions: optionalStringSchema,
  category: optionalStringSchema,
  clarityScore: z.coerce.number().int().min(0).max(100).optional(),
  company: optionalStringSchema,
  companyDescription: optionalStringSchema,
  deadline: optionalStringSchema,
  duration: optionalStringSchema,
  engagementMode: optionalStringSchema,
  experienceLevel: optionalStringSchema,
  mode: optionalStringSchema,
  mustHave: stringListSchema,
  opportunityType: optionalStringSchema,
  paymentTerms: optionalStringSchema,
  portfolioRequired: optionalStringSchema,
  preferredQualifications: z.preprocess(nullToUndefined, z.union([z.string(), z.array(z.string())]).optional()),
  qualificationQuestions: stringListSchema,
  requiredAttachments: requiredAttachmentsSchema,
  revisionLimit: z.coerce.number().int().min(0).max(5).default(3),
  screeningFocus: optionalStringSchema,
  skills: z.preprocess(nullToUndefined, z.union([z.string(), z.array(z.string())]).optional()),
  status: optionalStringSchema,
  visibility: z.enum(['draft', 'public', 'invite-only']).default('draft')
}).passthrough()

const updateOpportunitySchema = createOpportunitySchema.partial().passthrough()

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
  updateOpportunitySchema,
  updateBusinessProfileSchema,
  createBusinessIndustrySchema,
  submitBusinessKycSchema,
  createOpportunityDeliverablesSchema,
  inviteOpportunityBiddersSchema,
  fundOpportunitySchema,
  reviewApplicantSchema
}
