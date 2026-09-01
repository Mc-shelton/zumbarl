import { useCallback, useEffect, useRef, useState } from 'react'
import { FiBell, FiCheck, FiChevronDown, FiMessageCircle } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import { ACCESS_KEYS, AUTH_ROLE_STORAGE_KEY, hasAccess } from '../../features/auth/roleConfig'
import { AUTH_TOKEN_KEY } from '../../lib/sendZumbarlApiRequest'
import { useViewerProfile } from '../../features/auth/viewerProfile'
import { clearAuthUserCache } from '../../features/auth/services/authUserService'
import { clearBusinessProfileCache } from '../../features/business/services/businessProfileService'
import {
  listZumbarlNotifications,
  markAllZumbarlNotificationsRead,
  markZumbarlNotificationRead,
} from '../../features/campus/services/readNotifications'
import { listConversations } from '../../features/messages/services/messageService'
import { playNotificationSound } from '../../features/communications/services/communicationSounds'

const ACTION_ACCESS_KEYS = {
  campus: {
    messages: ACCESS_KEYS.campus.messages,
    notifications: ACCESS_KEYS.campus.notifications,
    profile: ACCESS_KEYS.profile.viewOwn,
  },
  business: {
    messages: ACCESS_KEYS.business.messages,
    notifications: ACCESS_KEYS.business.notifications,
    profile: ACCESS_KEYS.business.dashboard,
  },
}

function formatNotificationTime(value) {
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return ''

  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000))
  if (elapsedMinutes < 1) return 'Now'
  if (elapsedMinutes < 60) return `${elapsedMinutes}m`
  const elapsedHours = Math.floor(elapsedMinutes / 60)
  if (elapsedHours < 24) return `${elapsedHours}h`
  const elapsedDays = Math.floor(elapsedHours / 24)
  if (elapsedDays < 7) return `${elapsedDays}d`
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(timestamp)
}

function CampusTopActions({
  as: Component = 'div',
  className = '',
  iconButtonClassName = 'campus-icon-btn',
  label,
  menuItems = [],
  onLogout,
  primaryAction = null,
  scope = 'campus',
  showMenu = true,
  showUserButton = true,
  userButtonClassName = 'opportunities-user-btn',
  showUserChevron = false,
  viewer,
}) {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const actionsRef = useRef(null)
  const latestNotificationIdRef = useRef(null)
  const accessKeys = ACTION_ACCESS_KEYS[scope] || ACTION_ACCESS_KEYS.campus
  const currentViewer = useViewerProfile(viewer)
  const canOpenMessages = hasAccess(accessKeys.messages)
  const canOpenNotifications = hasAccess(accessKeys.notifications)
  const canViewProfile = !accessKeys.profile || hasAccess(accessKeys.profile)
  const resolvedMenuItems = menuItems.length
    ? menuItems
    : [{ label: 'View profile', href: scope === 'business' ? '/business/company-profile' : '/campus/profile' }]

  useEffect(() => {
    if (!isMenuOpen && !isNotificationsOpen) return undefined

    const closeMenus = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return
      if (event.type === 'pointerdown' && actionsRef.current?.contains(event.target)) return
      setIsMenuOpen(false)
      setIsNotificationsOpen(false)
    }

    window.addEventListener('keydown', closeMenus)
    document.addEventListener('pointerdown', closeMenus)
    return () => {
      window.removeEventListener('keydown', closeMenus)
      document.removeEventListener('pointerdown', closeMenus)
    }
  }, [isMenuOpen, isNotificationsOpen])

  const sendBrowserNotice = useCallback((notification) => {
    if (
      typeof window === 'undefined'
      || !('Notification' in window)
      || window.Notification.permission !== 'granted'
      || !notification
    ) return

    const browserNotification = new window.Notification(notification.title, {
      body: notification.body,
      tag: notification.id,
    })
    browserNotification.onclick = () => {
      window.focus()
      const deepLink = notification.data?.deepLink
      if (deepLink) navigate(deepLink)
    }
  }, [navigate])

  const loadNotifications = useCallback(async ({ notify = false } = {}) => {
    if (!canOpenNotifications) return

    try {
      const response = await listZumbarlNotifications()
      const nextNotifications = response?.data || []
      const latestNotification = nextNotifications[0]
      const previousLatestId = latestNotificationIdRef.current

      setNotifications(nextNotifications)
      setUnreadNotificationCount(response?.unreadCount || 0)

      if (!previousLatestId && latestNotification?.id) {
        latestNotificationIdRef.current = latestNotification.id
      } else if (notify && latestNotification?.id && latestNotification.id !== previousLatestId && !latestNotification.isRead) {
        latestNotificationIdRef.current = latestNotification.id
        playNotificationSound()
        sendBrowserNotice(latestNotification)
      }
    } catch {
      setNotifications([])
      setUnreadNotificationCount(0)
    }
  }, [canOpenNotifications, sendBrowserNotice])

  useEffect(() => {
    if (!canOpenNotifications) return undefined

    const initialLoadId = window.setTimeout(loadNotifications, 0)
    const refreshNotifications = () => loadNotifications({ notify: true })
    const refreshVisibleNotifications = () => {
      if (document.visibilityState === 'visible') refreshNotifications()
    }
    const intervalId = window.setInterval(refreshNotifications, 10000)
    window.addEventListener('focus', refreshNotifications)
    document.addEventListener('visibilitychange', refreshVisibleNotifications)
    return () => {
      window.clearTimeout(initialLoadId)
      window.clearInterval(intervalId)
      window.removeEventListener('focus', refreshNotifications)
      document.removeEventListener('visibilitychange', refreshVisibleNotifications)
    }
  }, [canOpenNotifications, loadNotifications])

  useEffect(() => {
    if (!canOpenMessages) return undefined
    let isMounted = true
    const loadUnreadMessages = () => listConversations()
      .then((response) => {
        if (isMounted) setUnreadMessageCount(response?.unreadCount || 0)
      })
      .catch(() => {})
    const handleMessage = () => loadUnreadMessages()
    loadUnreadMessages()
    window.addEventListener('zumbarl:message-created', handleMessage)
    window.addEventListener('zumbarl:messages-read', handleMessage)
    return () => {
      isMounted = false
      window.removeEventListener('zumbarl:message-created', handleMessage)
      window.removeEventListener('zumbarl:messages-read', handleMessage)
    }
  }, [canOpenMessages])

  async function openNotifications() {
    setIsNotificationsOpen((current) => !current)
    setIsMenuOpen(false)
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'default') {
      window.Notification.requestPermission().catch(() => {})
    }
    await loadNotifications()
  }

  async function markAllNotificationsRead() {
    setUnreadNotificationCount(0)
    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })))
    await markAllZumbarlNotificationsRead().catch(() => loadNotifications())
  }

  async function openNotification(notification) {
    setNotifications((current) => current.map((item) => (
      item.id === notification.id ? { ...item, isRead: true } : item
    )))
    setUnreadNotificationCount((current) => Math.max(0, current - (notification.isRead ? 0 : 1)))
    await markZumbarlNotificationRead(notification.id).catch(() => loadNotifications())
    const deepLink = notification.data?.deepLink
    if (deepLink) navigate(deepLink)
    setIsNotificationsOpen(false)
  }

  function handleLogout() {
    clearAuthUserCache()
    clearBusinessProfileCache()

    if (onLogout) {
      onLogout()
      return
    }

    window.localStorage.removeItem(AUTH_TOKEN_KEY)
    window.localStorage.removeItem(AUTH_ROLE_STORAGE_KEY)
    navigate('/login', { replace: true })
  }

  return (
    <Component ref={actionsRef} className={`app-top-actions ${className}`.trim()} aria-label={label}>
      {primaryAction}
      {canOpenMessages ? (
        <button type="button" className={iconButtonClassName} aria-label="Open messages" onClick={() => navigate('/messages')}>
          <FiMessageCircle aria-hidden="true" />
          {unreadMessageCount ? <span className="campus-badge">{unreadMessageCount > 9 ? '9+' : unreadMessageCount}</span> : null}
        </button>
      ) : null}
      {canOpenNotifications ? (
        <div className="app-notification-menu-wrap">
          <button
            type="button"
            className={iconButtonClassName}
            aria-expanded={isNotificationsOpen}
            aria-label="Open notifications"
            onClick={openNotifications}
          >
            <FiBell aria-hidden="true" />
            {unreadNotificationCount ? (
              <span className="campus-badge">{unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}</span>
            ) : null}
          </button>
          {isNotificationsOpen ? (
            <div className="app-notification-menu" role="menu" aria-label="Notifications">
              <header>
                <div className="app-notification-heading">
                  <span><FiBell aria-hidden="true" /></span>
                  <div>
                    <strong>Notifications</strong>
                    <small>{unreadNotificationCount ? `${unreadNotificationCount} new` : 'You’re all caught up'}</small>
                  </div>
                </div>
                {unreadNotificationCount ? (
                  <button type="button" onClick={markAllNotificationsRead}><FiCheck aria-hidden="true" /> Mark all read</button>
                ) : null}
              </header>
              <div className="app-notification-list">
                {notifications.length ? notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    className={`app-notification-item${notification.isRead ? '' : ' is-unread'}`}
                    role="menuitem"
                    onClick={() => openNotification(notification)}
                  >
                    <span className="app-notification-icon"><FiBell aria-hidden="true" /></span>
                    <span className="app-notification-copy">
                      <strong>{notification.title}</strong>
                      <small>{notification.body}</small>
                    </span>
                    <span className="app-notification-meta">
                      <time dateTime={notification.createdAt}>{formatNotificationTime(notification.createdAt)}</time>
                      {!notification.isRead ? <i aria-label="Unread" /> : null}
                    </span>
                  </button>
                )) : (
                  <p><FiBell aria-hidden="true" /><strong>No notifications yet</strong><span>Updates about your campus activity will appear here.</span></p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      {showUserButton && canViewProfile ? (
        <div className="app-profile-menu-wrap">
          <button
            type="button"
            className={`app-user-btn ${userButtonClassName}`.trim()}
            aria-expanded={showMenu ? isMenuOpen : undefined}
            aria-label="Open profile menu"
            onClick={() => {
              if (!showMenu) return
              setIsMenuOpen((current) => !current)
              setIsNotificationsOpen(false)
            }}
          >
            {currentViewer.avatar ? (
              <img src={currentViewer.avatar} alt={`${currentViewer.name} avatar`} />
            ) : (
              <span>{currentViewer.initials}</span>
            )}
            {showUserChevron ? <FiChevronDown aria-hidden="true" /> : null}
          </button>
          {showMenu ? (
            <>
              {isMenuOpen ? (
                <div className="business-profile-menu" role="menu">
                  {resolvedMenuItems.map((item) => (
                    <Link key={item.href} to={item.href} role="menuitem" onClick={() => setIsMenuOpen(false)}>{item.label}</Link>
                  ))}
                  <button type="button" className="app-logout-menu-item" role="menuitem" onClick={handleLogout}>Log out</button>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </Component>
  )
}

export default CampusTopActions
