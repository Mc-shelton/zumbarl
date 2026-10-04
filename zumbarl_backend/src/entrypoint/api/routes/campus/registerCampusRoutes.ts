import type { FastifyInstance } from 'fastify'
import { requireRoles, roleGroups } from '../../../../lib/security.js'
import {
  archiveMyPortfolioItemController,
  listUserNotificationsController,
  markAllUserNotificationsReadController,
  markUserNotificationReadController,
  readCampusHomeExperienceController,
  readMyStudentProfileExperienceController,
  readMyStudentKycController,
  publishMyPortfolioItemController,
  submitMyStudentKycDocumentController,
  readStudentProfileScoreController,
  readStudentProfileExperienceController,
  runCampusAssistantController,
  shareMyPortfolioItemController,
  unpublishMyPortfolioItemController,
  updateMyPortfolioItemController,
  updateMyStudentProfileController,
  updateMyStudentProgressionModeController
} from '../../controllers/campus/index.js'

async function registerCampusRoutes(app: FastifyInstance) {
  const campusActor = requireRoles(...roleGroups.student, ...roleGroups.business, ...roleGroups.admin)
  const studentActor = requireRoles(...roleGroups.student)
  app.get('/home', { preHandler: campusActor }, readCampusHomeExperienceController)
  app.post('/assistant', { preHandler: campusActor }, runCampusAssistantController)
  app.get('/notifications', { preHandler: campusActor }, listUserNotificationsController)
  app.post('/notifications/read-all', { preHandler: campusActor }, markAllUserNotificationsReadController)
  app.post('/notifications/:id/read', { preHandler: campusActor }, markUserNotificationReadController)
  app.get('/profile/me', { preHandler: studentActor }, readMyStudentProfileExperienceController)
  app.patch('/profile/me', { preHandler: campusActor }, updateMyStudentProfileController)
  app.patch('/profile/me/progression-mode', { preHandler: campusActor }, updateMyStudentProgressionModeController)
  app.get('/profile/me/kyc', { preHandler: campusActor }, readMyStudentKycController)
  app.post('/profile/me/kyc/documents', { preHandler: campusActor }, submitMyStudentKycDocumentController)
  app.patch('/profile/me/portfolio/:id', { preHandler: studentActor }, updateMyPortfolioItemController)
  app.post('/profile/me/portfolio/:id/publish', { preHandler: studentActor }, publishMyPortfolioItemController)
  app.post('/profile/me/portfolio/:id/unpublish', { preHandler: studentActor }, unpublishMyPortfolioItemController)
  app.post('/profile/me/portfolio/:id/archive', { preHandler: studentActor }, archiveMyPortfolioItemController)
  app.post('/profile/me/portfolio/:id/share', { preHandler: studentActor }, shareMyPortfolioItemController)
  app.get('/profiles/:id/score', { preHandler: campusActor }, readStudentProfileScoreController)
  app.get('/profiles/:id', { preHandler: campusActor }, readStudentProfileExperienceController)
}

export {
  registerCampusRoutes
}
