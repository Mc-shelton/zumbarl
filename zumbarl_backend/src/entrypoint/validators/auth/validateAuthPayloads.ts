import { z } from 'zod'
import { roles } from '../../../lib/security.js'

const registerUserSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(7).default('+254700000000'),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(roles).default('STUDENT_STANDARD'),
  campus: z.string().optional(),
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
