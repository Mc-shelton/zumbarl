import type { FastifyInstance } from 'fastify'
import { listRegistrationCampusesController, listRegistrationCoursesController, loginUserController, readAuthenticatedUserController, registerUserController, searchRegistrationLocationsController } from '../../controllers/auth/index.js'

async function registerAuthRoutes(app: FastifyInstance) {
  app.post('/register', registerUserController)
  app.get('/campuses', listRegistrationCampusesController)
  app.get('/courses', listRegistrationCoursesController)
  app.get('/locations/search', searchRegistrationLocationsController)
  app.post('/login', loginUserController)
  app.get('/me', readAuthenticatedUserController)
}

export {
  registerAuthRoutes
}
