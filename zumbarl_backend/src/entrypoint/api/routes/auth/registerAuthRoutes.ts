import type { FastifyInstance } from 'fastify'
import { listRegistrationCampusesController, loginUserController, readAuthenticatedUserController, registerUserController, searchRegistrationLocationsController } from '../../controllers/auth/index.js'

async function registerAuthRoutes(app: FastifyInstance) {
  app.post('/register', registerUserController)
  app.get('/campuses', listRegistrationCampusesController)
  app.get('/locations/search', searchRegistrationLocationsController)
  app.post('/login', loginUserController)
  app.get('/me', readAuthenticatedUserController)
}

export {
  registerAuthRoutes
}
