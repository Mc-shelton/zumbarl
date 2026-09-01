import { z } from 'zod'
const wellnessReportSchema = z.object({ category: z.enum(['counseling', 'anonymous-support', 'safety-report', 'program-request']), anonymous: z.boolean().default(false), message: z.string().min(5), urgency: z.enum(['low', 'normal', 'high']).default('normal') })
const counselorBookingSchema = z.object({ counselorId: z.string().optional(), scheduledAt: z.string().datetime(), reason: z.string().optional() })
const supportCaseStatusSchema = z.object({ status: z.enum(['open', 'in_review', 'resolved', 'dismissed']), note: z.string().optional() })
const wellbeingCheckInSchema = z.object({
  mood: z.enum(['good', 'okay', 'meh', 'low', 'overwhelmed']),
  stressors: z.array(z.enum(['money', 'school', 'relationships', 'family', 'work', 'loneliness', 'anxiety', 'sleep', 'health', 'substance_use', 'other'])).max(6).default([]),
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

export {
  wellnessReportSchema,
  counselorBookingSchema,
  supportCaseStatusSchema,
  wellbeingCheckInSchema,
  wellbeingConversationSchema,
  wellbeingMessageSchema,
  wellbeingPreferenceSchema,
  wellbeingResetSchema
}
