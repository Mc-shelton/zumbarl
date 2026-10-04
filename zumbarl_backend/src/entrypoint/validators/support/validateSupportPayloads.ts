import { z } from 'zod'
const wellnessReportSchema = z.object({ category: z.enum(['counseling', 'anonymous-support', 'safety-report', 'program-request']), anonymous: z.boolean().default(false), message: z.string().min(5), urgency: z.enum(['low', 'normal', 'high']).default('normal') })
const counselorBookingSchema = z.object({ counselorId: z.string().optional(), scheduledAt: z.string().datetime(), reason: z.string().optional() })
const supportCaseStatusSchema = z.object({
  status: z.enum(['open', 'in_review', 'resolved', 'dismissed', 'requested', 'confirmed', 'completed', 'cancelled', 'no_show']),
  note: z.string().trim().max(2000).optional(),
  counselorId: z.string().trim().min(1).nullable().optional(),
  scheduledAt: z.string().datetime().optional()
})
const wellbeingCheckInSchema = z.object({
  mood: z.enum(['good', 'okay', 'meh', 'low', 'overwhelmed']),
  stressors: z.array(z.enum(['money', 'school', 'relationships', 'family', 'work', 'loneliness', 'anxiety', 'sleep', 'health', 'peer_pressure', 'substance_use', 'other'])).max(6).default([]),
  sleep: z.enum(['under_4', '4_6', '6_8', 'over_8']).optional(),
  note: z.string().trim().max(1000).optional(),
  source: z.enum(['daily', 'manual', 'reset_follow_up']).default('daily')
})
const wellbeingPreferenceSchema = z.object({
  insightsEnabled: z.boolean().optional(),
  reminderEnabled: z.boolean().optional(),
  reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional()
}).refine((value) => Object.keys(value).length > 0, 'Choose at least one preference')
const wellbeingResetSchema = z.object({
  breathingSeconds: z.number().int().min(0).max(600).default(30),
  groundingCount: z.number().int().min(0).max(5).default(0),
  focus: z.string().trim().max(500).optional(),
  durationSeconds: z.number().int().min(0).max(1800).default(180)
})
const wellbeingConversationSchema = z.object({}).strict()
const wellbeingMessageSchema = z.object({ message: z.string().trim().min(1).max(4000) })
const wellbeingHandoffSchema = z.object({
  consent: z.literal(true),
  shareLatestMessage: z.boolean().default(false),
  note: z.string().trim().max(1000).optional()
})
const careProgramEnrollmentSchema = z.object({
  goal: z.string().trim().min(5).max(1000),
  privacyMode: z.enum(['private', 'alias']).default('private'),
  urgency: z.enum(['low', 'normal', 'high']).default('normal'),
  consent: z.literal(true),
  consentText: z.string().trim().min(10).max(1000)
})
const careProgressCheckInSchema = z.object({
  status: z.enum(['steady', 'need_support', 'setback', 'completed_step']),
  note: z.string().trim().max(1000).optional(),
  requestFollowUp: z.boolean().default(false)
})
const studentCareEnrollmentActionSchema = z.object({
  status: z.enum(['active', 'paused', 'withdrawn'])
})
const careEnrollmentUpdateSchema = z.object({
  status: z.enum(['requested', 'active', 'paused', 'completed', 'withdrawn']).optional(),
  currentStep: z.number().int().min(0).max(50).optional(),
  nextCheckInAt: z.string().datetime().nullable().optional(),
  assignedToUserId: z.string().trim().min(1).nullable().optional(),
  studentVisibleNote: z.string().trim().max(2000).optional(),
  studentVisible: z.boolean().default(true)
}).refine((value) => Object.keys(value).some((key) => key !== 'studentVisible'), 'Choose at least one care-plan update')
const supportCaseParamsSchema = z.object({ type: z.enum(['wellness', 'booking', 'moderation']), id: z.string().min(1) })
const supportCircleReviewSchema = z.object({
  status: z.enum(['active', 'rejected']),
  moderationOwner: z.string().trim().min(2).max(120),
  note: z.string().trim().min(5).max(1000)
})

export {
  wellnessReportSchema,
  counselorBookingSchema,
  careEnrollmentUpdateSchema,
  careProgramEnrollmentSchema,
  careProgressCheckInSchema,
  studentCareEnrollmentActionSchema,
  supportCaseStatusSchema,
  supportCaseParamsSchema,
  supportCircleReviewSchema,
  wellbeingCheckInSchema,
  wellbeingConversationSchema,
  wellbeingMessageSchema,
  wellbeingHandoffSchema,
  wellbeingPreferenceSchema,
  wellbeingResetSchema
}
