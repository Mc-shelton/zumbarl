import { z } from 'zod'
const wellnessReportSchema = z.object({ category: z.enum(['counseling', 'anonymous-support', 'safety-report', 'program-request']), anonymous: z.boolean().default(false), message: z.string().min(5), urgency: z.enum(['low', 'normal', 'high']).default('normal') })
const counselorBookingSchema = z.object({ counselorId: z.string().optional(), scheduledAt: z.string().datetime(), reason: z.string().optional() })
const supportCaseStatusSchema = z.object({ status: z.enum(['open', 'in_review', 'resolved', 'dismissed']), note: z.string().optional() })

export {
  wellnessReportSchema,
  counselorBookingSchema,
  supportCaseStatusSchema
}
