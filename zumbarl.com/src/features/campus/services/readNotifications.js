import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

function listZumbarlNotifications() {
  return sendZumbarlApiRequest('/campus/notifications')
}

function markZumbarlNotificationRead(notificationId) {
  return sendZumbarlApiRequest(`/campus/notifications/${notificationId}/read`, {
    method: 'POST',
  })
}

function markAllZumbarlNotificationsRead() {
  return sendZumbarlApiRequest('/campus/notifications/read-all', {
    method: 'POST',
  })
}

export {
  listZumbarlNotifications,
  markAllZumbarlNotificationsRead,
  markZumbarlNotificationRead,
}
