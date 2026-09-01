import { z } from 'zod'

const placementTypeSchema = z.enum(['INTERNSHIP', 'ATTACHMENT'])
const workModeSchema = z.enum(['ONSITE', 'HYBRID', 'REMOTE'])
const currencySchema = z.string().trim().length(3).transform((value) => value.toUpperCase())
const dateSchema = z.coerce.date()
const cursorQuerySchema = z.object({ cursor: z.string().min(1).optional(), limit: z.coerce.number().int().min(1).max(100).default(25) })

const programRequirementSchema = z.object({
  skillId: z.string().min(1),
  required: z.boolean().default(true),
  weight: z.number().int().min(1).max(10).default(1)
})

const programCompetencySchema = z.object({
  competencyId: z.string().min(1),
  required: z.boolean().default(true),
  minimumScore: z.number().int().min(0).max(100).default(70),
  weight: z.number().int().min(1).max(10).default(1)
})

const programObjectSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(20).max(6000),
  placementType: placementTypeSchema,
  workMode: workModeSchema,
  location: z.string().trim().max(240).optional(),
  durationWeeks: z.number().int().min(1).max(104),
  defaultSeatCount: z.number().int().min(1).max(500),
  stipendAmount: z.number().nonnegative().optional(),
  currency: currencySchema.default('KES'),
  stipendFrequency: z.enum(['WEEKLY', 'MONTHLY', 'TOTAL']).optional(),
  supervisionPlan: z.string().trim().min(20).max(6000),
  learningOutcomes: z.array(z.string().trim().min(3).max(300)).min(1).max(30),
  recurrenceType: z.enum(['NONE', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'CUSTOM']).default('NONE'),
  recurrenceRule: z.record(z.unknown()).optional(),
  timezone: z.string().trim().min(3).max(80).default('Africa/Nairobi'),
  skills: z.array(programRequirementSchema).max(50).default([]),
  competencies: z.array(programCompetencySchema).max(50).default([]),
  supervisorIds: z.array(z.string().min(1)).min(1).max(20)
})

const createProgramSchema = programObjectSchema.superRefine((payload, context) => {
  if (payload.workMode !== 'REMOTE' && !payload.location) context.addIssue({ code: z.ZodIssueCode.custom, path: ['location'], message: 'Location is required for onsite and hybrid programs' })
  try { new Intl.DateTimeFormat('en', { timeZone: payload.timezone }).format() } catch { context.addIssue({ code: z.ZodIssueCode.custom, path: ['timezone'], message: 'Use a valid IANA timezone' }) }
})

const updateProgramSchema = programObjectSchema.partial().extend({ version: z.number().int().min(1) })

const createCohortSchema = z.object({
  applicationOpensAt: dateSchema,
  applicationClosesAt: dateSchema,
  interviewStartsAt: dateSchema.optional(),
  interviewEndsAt: dateSchema.optional(),
  offerDeadlineAt: dateSchema.optional(),
  placementStartsAt: dateSchema,
  placementEndsAt: dateSchema,
  seatCount: z.number().int().min(1).max(500),
  recurrenceSource: z.string().max(120).optional()
}).superRefine((payload, context) => {
  if (!(payload.applicationOpensAt < payload.applicationClosesAt && payload.applicationClosesAt <= payload.placementStartsAt && payload.placementStartsAt < payload.placementEndsAt)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['applicationOpensAt'], message: 'Cohort dates must be in application, placement-start, placement-end order' })
  }
})

const companyVisibleFieldSchema = z.enum(['name', 'avatarUrl', 'campus', 'course', 'careerPath', 'skills', 'competencies', 'portfolio', 'verifiedEvidence', 'roleInterests', 'workModes', 'locations'])
const availabilitySchema = z.object({
  isSeeking: z.boolean(),
  placementTypes: z.array(placementTypeSchema).min(1),
  earliestStartDate: dateSchema.optional(),
  latestStartDate: dateSchema.optional(),
  locations: z.array(z.string().trim().min(2).max(160)).max(20).default([]),
  workModes: z.array(workModeSchema).min(1),
  roleInterests: z.array(z.string().trim().min(2).max(120)).max(30).default([]),
  weeklyAvailability: z.record(z.unknown()).optional(),
  consentVersion: z.string().trim().min(1).max(80),
  companyVisibleFields: z.array(companyVisibleFieldSchema).min(1),
  expiresAt: dateSchema
}).superRefine((payload, context) => {
  if (payload.expiresAt <= new Date()) context.addIssue({ code: z.ZodIssueCode.custom, path: ['expiresAt'], message: 'Availability expiry must be in the future' })
  if (payload.earliestStartDate && payload.latestStartDate && payload.earliestStartDate > payload.latestStartDate) context.addIssue({ code: z.ZodIssueCode.custom, path: ['latestStartDate'], message: 'Latest start date must follow earliest start date' })
})

const createOfferSchema = z.object({
  supervisorId: z.string().min(1),
  role: z.string().trim().min(2).max(160),
  duties: z.string().trim().min(20).max(6000),
  placementType: placementTypeSchema,
  workMode: workModeSchema,
  location: z.string().trim().max(240).optional(),
  stipendAmount: z.number().nonnegative().optional(),
  currency: currencySchema.default('KES'),
  stipendFrequency: z.enum(['WEEKLY', 'MONTHLY', 'TOTAL']).optional(),
  startDate: dateSchema,
  endDate: dateSchema,
  respondBy: dateSchema,
  expectations: z.array(z.string().trim().min(2).max(500)).min(1),
  policyLinks: z.array(z.string().url()).max(10).default([]),
  idempotencyKey: z.string().min(8).max(200).optional()
}).superRefine((payload, context) => {
  if (payload.startDate >= payload.endDate) context.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'Offer end date must follow start date' })
  if (payload.respondBy <= new Date() || payload.respondBy >= payload.startDate) context.addIssue({ code: z.ZodIssueCode.custom, path: ['respondBy'], message: 'Response deadline must be future and before the start date' })
})

const declineOfferSchema = z.object({ reason: z.string().trim().min(2).max(1000).optional() })
const reasonSchema = z.object({ reason: z.string().trim().min(3).max(2000) })
const createGoalSchema = z.object({ competencyId: z.string().min(1).optional(), title: z.string().trim().min(2).max(200), description: z.string().trim().min(5).max(2000), dueAt: dateSchema.optional() })
const createCheckInSchema = z.object({ periodStartsAt: dateSchema, periodEndsAt: dateSchema, dueAt: dateSchema, studentReflection: z.string().trim().min(10).max(6000) })
const respondCheckInSchema = z.object({ response: z.string().trim().min(5).max(6000), riskFlag: z.boolean().default(false) })
const createEvidenceSchema = z.object({ goalId: z.string().min(1).optional(), competencyId: z.string().min(1).optional(), evidenceType: z.enum(['FILE', 'URL', 'PROJECT', 'PORTFOLIO', 'OTHER']), title: z.string().trim().min(2).max(200), description: z.string().trim().max(3000).optional(), artifactReference: z.string().trim().min(2).max(2000) })
const createEvaluationSchema = z.object({ rubricScores: z.record(z.number().min(0).max(5)), narrative: z.string().trim().min(10).max(6000), recommendation: z.string().trim().max(2000).optional(), visibility: z.enum(['SHARED', 'PRIVATE_COMPANY', 'OPERATIONS']).default('SHARED') })
const amendmentChangesSchema = z.object({
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  stipendAmount: z.number().nonnegative().nullable().optional(),
  currency: currencySchema.optional(),
  stipendFrequency: z.enum(['WEEKLY', 'MONTHLY', 'TOTAL']).nullable().optional(),
  location: z.string().trim().max(240).nullable().optional(),
  supervisorId: z.string().min(1).nullable().optional(),
  duties: z.string().trim().min(20).max(6000).nullable().optional()
}).strict().refine((changes) => Object.keys(changes).length > 0, { message: 'At least one supported placement change is required' })
const createAmendmentSchema = z.object({ reason: z.string().trim().min(10).max(3000), changes: amendmentChangesSchema })
const amendmentDecisionSchema = z.object({ decision: z.enum(['ACCEPT', 'REJECT']), reason: z.string().trim().min(3).max(2000).optional() })
const createSupportRequestSchema = z.object({ category: z.enum(['SAFETY', 'WELLBEING', 'HARASSMENT', 'SUPERVISION', 'PAYMENT', 'ACCESSIBILITY', 'OTHER']), summary: z.string().trim().min(10).max(500), privateDetails: z.string().trim().min(3).max(6000).optional() })
const resolveSupportRequestSchema = z.object({ resolution: z.string().trim().min(10).max(4000) })
const placementResolutionSchema = z.object({ action: z.enum(['CANCEL_BEFORE_START', 'TERMINATE', 'DISPUTE', 'RESUME_ACTIVE', 'RETURN_TO_COMPLETION_REVIEW']), reason: z.string().trim().min(10).max(3000) })
const refundInvoiceSchema = z.object({ reason: z.string().trim().min(10).max(3000) })
const entitlementStatusSchema = z.object({ action: z.enum(['SUSPEND', 'REACTIVATE']), reason: z.string().trim().min(10).max(3000) })
const mentorshipAlternativeSchema = z.object({ companyId: z.string().min(1), studentId: z.string().min(1), type: z.enum(['OFFICE_TOUR', 'SHADOWING', 'STRUCTURED_PERFORMANCE_ADVICE', 'OTHER']), description: z.string().trim().min(20).max(3000), completedAt: dateSchema, evidence: z.record(z.unknown()).optional() }).refine((payload) => payload.completedAt <= new Date(), { path: ['completedAt'], message: 'Mentorship completion cannot be in the future' })
const createOverrideSchema = z.object({ subjectType: z.enum(['COMPANY', 'STUDENT', 'PROGRAM']), subjectId: z.string().min(1), policy: z.enum(['COMPANY_QUALIFICATION', 'STUDENT_TRANSITION_ACCESS', 'PROGRAM_POLICY', 'REPEAT_HIRE']), reason: z.string().trim().min(10).max(3000), expiresAt: dateSchema })
const createInvoiceSchema = z.object({ companyId: z.string().min(1), invoiceNumber: z.string().trim().min(3).max(100), amount: z.number().positive(), currency: currencySchema.default('KES'), externalReference: z.string().trim().max(200).optional(), dueAt: dateSchema.optional(), idempotencyKey: z.string().min(8).max(200) })
const confirmInvoiceSchema = z.object({ externalReference: z.string().trim().min(3).max(200), planCode: z.string().trim().min(2).max(80), programLimit: z.number().int().min(0).max(10000), seatLimit: z.number().int().min(0).max(100000), validFrom: dateSchema, validUntil: dateSchema }).refine((payload) => payload.validFrom < payload.validUntil, { path: ['validUntil'], message: 'Entitlement end must follow its start' })

export {
  cursorQuerySchema,
  createProgramSchema,
  updateProgramSchema,
  createCohortSchema,
  availabilitySchema,
  createOfferSchema,
  declineOfferSchema,
  reasonSchema,
  createGoalSchema,
  createCheckInSchema,
  respondCheckInSchema,
  createEvidenceSchema,
  createEvaluationSchema,
  createAmendmentSchema,
  amendmentDecisionSchema,
  createSupportRequestSchema,
  resolveSupportRequestSchema,
  placementResolutionSchema,
  createOverrideSchema,
  createInvoiceSchema,
  confirmInvoiceSchema,
  refundInvoiceSchema,
  entitlementStatusSchema,
  mentorshipAlternativeSchema
}
