import { z } from 'zod'
import { roles } from '../../../lib/security.js'

const registerUserSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(7).default('+254700000000'),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  username: z.string().min(3).max(30).regex(/^@?[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  name: z.string().min(2).optional(),
  role: z.enum(roles).default('STUDENT_STANDARD'),
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
  businessName: z.string().optional()
})

const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

export {
  registerUserSchema,
  loginUserSchema
}
