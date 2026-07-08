import { notFound } from '../../../lib/http.js'
import { campusExperienceRepository } from '../../repositories/campus/index.js'

const readCampusHomeExperienceService = (studentId: string | undefined) => campusExperienceRepository.readHomeExperience(studentId)
const listUserNotificationsService = (userId: string | undefined) => campusExperienceRepository.listNotifications(userId)
const markUserNotificationReadService = async (userId: string | undefined, notificationId: string) => {
  return await campusExperienceRepository.markNotificationRead(userId, notificationId) ?? notFound('Notification')
}
const markAllUserNotificationsReadService = (userId: string | undefined) => campusExperienceRepository.markAllNotificationsRead(userId)

async function readStudentProfileExperienceService(studentId: string | undefined) {
  return await campusExperienceRepository.readProfileExperience(studentId) ?? notFound('Student profile')
}

export {
  listUserNotificationsService,
  markAllUserNotificationsReadService,
  markUserNotificationReadService,
  readCampusHomeExperienceService,
  readStudentProfileExperienceService
}
