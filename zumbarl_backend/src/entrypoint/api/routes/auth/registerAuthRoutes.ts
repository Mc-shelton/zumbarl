import type { FastifyInstance } from 'fastify'
import { loginUserController, readAuthenticatedUserController, registerUserController } from '../../controllers/auth/index.js'

async function registerAuthRoutes(app: FastifyInstance) {
  app.post('/register', registerUserController)
  app.post('/login', loginUserController)
  app.get('/me', readAuthenticatedUserController)
}

export {
  registerAuthRoutes
}
