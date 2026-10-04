import type { FastifyInstance } from 'fastify'
import { listRegistrationCampusesController, listRegistrationCoursesController, loginUserController, logoutUserController, readAuthenticatedUserController, registerUserController, requestEmailOtpController, searchRegistrationLocationsController, verifyEmailOtpController } from '../../controllers/auth/index.js'

async function registerAuthRoutes(app: FastifyInstance) {
  app.post('/register', registerUserController)
  app.get('/campuses', listRegistrationCampusesController)
  app.get('/courses', listRegistrationCoursesController)
  app.get('/locations/search', searchRegistrationLocationsController)
  app.post('/login', loginUserController)
  app.post('/logout', logoutUserController)
  app.post('/email-otp/request', requestEmailOtpController)
  app.post('/email-otp/verify', verifyEmailOtpController)
  app.get('/me', readAuthenticatedUserController)
}

export {
  registerAuthRoutes
}
