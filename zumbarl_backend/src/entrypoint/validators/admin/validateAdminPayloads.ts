import { z } from 'zod'

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  username: z.string().min(3).max(30).regex(/^@?[a-zA-Z0-9_]+$/).optional(),
  phone: z.string().min(6).optional(),
  status: z.enum(['active', 'suspended']).optional(),
  role: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  isVerified: z.coerce.boolean().optional(),
  reason: z.string().min(3).optional()
})

const revokeSessionsSchema = z.object({ reason: z.string().min(3) })

const reviewKycSchema = z.object({
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED', 'in_review', 'verified', 'needs_changes']),
  verificationTier: z.string().optional(),
  reason: z.string().min(3)
})

const mergeDuplicateAccountsSchema = z.object({
  sourceUserId: z.string().min(1),
  targetUserId: z.string().min(1),
  reason: z.string().min(3)
})

const financialActionSchema = z.object({
  action: z.enum(['escrow_release', 'escrow_refund', 'fee_change', 'chama_freeze', 'advance_threshold_change', 'export_requested']),
  scope: z.string().optional(),
  scopeId: z.string().optional(),
  amount: z.coerce.number().optional(),
  reference: z.string().optional(),
  reason: z.string().min(3)
}).passthrough()

const gigOversightActionSchema = z.object({
  action: z.enum(['resolve_dispute', 'remove_listing', 'restore_listing', 'verify_deliverable', 'reject_deliverable', 'retire_template']),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  outcome: z.string().optional(),
  reason: z.string().min(3)
}).passthrough()

const scoreConfigurationSchema = z.object({
  name: z.string().min(2),
  weights: z.record(z.any()).optional(),
  thresholds: z.record(z.any()).optional(),
  penalties: z.record(z.any()).optional(),
  effectiveFrom: z.string().optional(),
  reason: z.string().min(3)
}).passthrough()

const contentModerationActionSchema = z.object({
  action: z.enum(['remove', 'restore', 'dismiss', 'dissolve_group', 'flag_for_review']),
  contentType: z.string().optional(),
  contentId: z.string().optional(),
  reason: z.string().min(3)
}).passthrough()

const systemConfigurationSchema = z.object({
  kind: z.enum(['feature_flag', 'notification_template', 'integration_health', 'protective_rule', 'campus_setting', 'platform_setting']),
  key: z.string().min(2),
  label: z.string().optional(),
  value: z.any().optional(),
  enabled: z.coerce.boolean().optional(),
  campusId: z.string().optional(),
  effectiveFrom: z.string().optional(),
  reason: z.string().min(3)
}).passthrough()

const updateModerationCaseSchema = z.object({
  status: z.enum(['open', 'in_review', 'resolved', 'dismissed']),
  action: z.enum(['none', 'remove_content', 'suspend_user', 'restrict_marketplace']).default('none'),
  note: z.string().optional()
})

const campusVendorSchema = z.object({
  type: z.enum(['hotel', 'barber_shop', 'service']),
  name: z.string().trim().min(2).max(120),
  campusManagedProfileId: z.string().min(1),
  managerUserId: z.string().min(1),
  description: z.string().trim().max(1000).optional(),
  locationLabel: z.string().trim().max(160).optional()
})
const campusVendorUpdateSchema = z.object({
  type: z.enum(['hotel', 'barber_shop', 'service']).optional(),
  name: z.string().trim().min(2).max(120).optional(),
  campusManagedProfileId: z.string().min(1).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  locationLabel: z.string().trim().max(160).nullable().optional(),
  logoUrl: z.string().trim().max(2000).nullable().optional(),
  coverImageUrl: z.string().trim().max(2000).nullable().optional()
})
const campusVendorManagerSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'editor']).default('editor')
})

export {
  updateUserSchema,
  revokeSessionsSchema,
  reviewKycSchema,
  mergeDuplicateAccountsSchema,
  financialActionSchema,
  gigOversightActionSchema,
  scoreConfigurationSchema,
  contentModerationActionSchema,
  systemConfigurationSchema,
  updateModerationCaseSchema,
  campusVendorSchema,
  campusVendorUpdateSchema,
  campusVendorManagerSchema
}
