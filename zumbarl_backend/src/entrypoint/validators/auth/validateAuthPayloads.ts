import { z } from 'zod'
import { publicRegistrationRoles } from '../../../lib/security.js'

const registerUserSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(7).default('+254700000000'),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  username: z.string().min(3).max(30).regex(/^@?[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  name: z.string().min(2).optional(),
  role: z.enum(publicRegistrationRoles).default('STUDENT_STANDARD'),
  yearJoined: z.coerce.number().int().min(new Date().getFullYear() - 15).max(new Date().getFullYear()).optional(),
  campus: z.union([
    z.object({ id: z.string().min(1) }),
    z.object({
      name: z.string().trim().min(2).max(120),
      branch: z.string().trim().max(120).optional(),
      city: z.string().trim().min(2).max(120),
      locationLabel: z.string().trim().min(2).max(300),
      latitude: z.coerce.number().min(-90).max(90),
      longitude: z.coerce.number().min(-180).max(180)
    })
  ]).optional(),
  course: z.union([
    z.object({ id: z.string().min(1) }),
    z.object({ name: z.string().trim().min(2).max(160), category: z.enum(['STEM', 'COMMERCE', 'ARTS', 'OTHER']), duration: z.coerce.number().int().min(1).max(10) })
  ]).optional(),
  businessName: z.string().trim().min(2).max(160).optional()
}).superRefine((payload, context) => {
  if ((payload.role === 'student' || payload.role === 'STUDENT_STANDARD') && !payload.yearJoined) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['yearJoined'], message: 'Year joined campus is required' })
  }
  if ((payload.role === 'student' || payload.role === 'STUDENT_STANDARD') && !payload.course) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['course'], message: 'Course is required' })
  }
  if ((payload.role === 'business' || payload.role === 'COMPANY_STANDARD') && !payload.businessName) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['businessName'],
      message: 'Business name is required for company registration'
    })
  }
})

const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

export {
  registerUserSchema,
  loginUserSchema
}
