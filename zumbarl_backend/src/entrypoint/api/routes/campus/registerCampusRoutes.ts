import type { FastifyInstance } from 'fastify'
import { requireRoles, roleGroups } from '../../../../lib/security.js'
import {
  listUserNotificationsController,
  markAllUserNotificationsReadController,
  markUserNotificationReadController,
  readCampusHomeExperienceController,
  readMyStudentProfileExperienceController,
  readStudentProfileExperienceController,
  runCampusAssistantController
  ,updateMyStudentProfileController
} from '../../controllers/campus/index.js'

async function registerCampusRoutes(app: FastifyInstance) {
  const campusActor = requireRoles(...roleGroups.student, ...roleGroups.business, ...roleGroups.admin)
  app.get('/home', { preHandler: campusActor }, readCampusHomeExperienceController)
  app.post('/assistant', { preHandler: campusActor }, runCampusAssistantController)
  app.get('/notifications', { preHandler: campusActor }, listUserNotificationsController)
  app.post('/notifications/read-all', { preHandler: campusActor }, markAllUserNotificationsReadController)
  app.post('/notifications/:id/read', { preHandler: campusActor }, markUserNotificationReadController)
  app.get('/profile/me', { preHandler: campusActor }, readMyStudentProfileExperienceController)
  app.patch('/profile/me', { preHandler: campusActor }, updateMyStudentProfileController)
  app.get('/profiles/:id', { preHandler: campusActor }, readStudentProfileExperienceController)
}

export {
  registerCampusRoutes
}
