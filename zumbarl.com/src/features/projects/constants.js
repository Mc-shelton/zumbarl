import { ACCESS_KEYS, filterByAccess } from '../auth/roleConfig'

export const PROJECT_TAB_ITEMS = [
  { label: 'Overview', requiredAccess: ACCESS_KEYS.projects.view },
  { label: 'Work & Deliverables', requiredAccess: ACCESS_KEYS.projects.view },
  { label: 'Messages', requiredAccess: ACCESS_KEYS.projects.messages },
  { label: 'Files', requiredAccess: ACCESS_KEYS.projects.files },
  { label: 'Reviews', requiredAccess: ACCESS_KEYS.projects.reviews },
  { label: 'Activity Logs', requiredAccess: ACCESS_KEYS.projects.activityLogs },
]

export const PROJECT_TABS = filterByAccess(PROJECT_TAB_ITEMS).map((tab) => tab.label)

export const PROJECT_TAB_QUERY = {
  Overview: 'overview',
  'Work & Deliverables': 'work-deliverables',
  Board: 'board',
  Timeline: 'timeline',
  Sprints: 'sprints',
  Milestones: 'milestones',
  Team: 'team',
  Messages: 'messages',
  Files: 'files',
  'Activity Logs': 'activity-logs',
  Reviews: 'reviews',
  Settings: 'settings',
}

export const PROJECT_QUERY_TAB = Object.fromEntries(
  Object.entries(PROJECT_TAB_QUERY).map(([key, value]) => [value, key])
)

export const LEGACY_PROJECT_QUERY_TAB = {
  invoices: 'Activity Logs',
}

export const PROJECT_TEAM_ONLY_TABS = ['Board', 'Timeline', 'Sprints', 'Team']
export const PROJECT_TEAM_TAB_ITEMS = [
  { label: 'Board', requiredAccess: ACCESS_KEYS.projects.board },
  { label: 'Sprints', requiredAccess: ACCESS_KEYS.projects.sprints },
  { label: 'Timeline', requiredAccess: ACCESS_KEYS.projects.timeline },
  { label: 'Team', requiredAccess: ACCESS_KEYS.projects.team },
]
export const PROJECT_TEAM_TAB_ITEM = PROJECT_TEAM_TAB_ITEMS[3]
// The business is routed into this same workspace, so its project-level controls
// need a home here rather than only on the opportunity page.
export const PROJECT_SETTINGS_TAB_ITEM = { label: 'Settings', requiredAccess: ACCESS_KEYS.projects.view }

export const PROJECT_MILESTONE_TAB_ITEM = {
  label: 'Milestones',
  requiredAccess: ACCESS_KEYS.projects.milestones,
}

export function normalizeProjectTab(tabQueryValue) {
  return PROJECT_QUERY_TAB[tabQueryValue] || LEGACY_PROJECT_QUERY_TAB[tabQueryValue] || 'Overview'
}

export function getProjectTabs(project, { isBusinessViewer = false } = {}) {
  const baseTabs = PROJECT_TAB_ITEMS
  const isTeamProject = Boolean(project.isTeamProject ?? project.hasTeam)
  const withSettings = (tabs) => (
    isBusinessViewer && isTeamProject ? [...tabs, PROJECT_SETTINGS_TAB_ITEM] : tabs
  )

  // A deliverable-based team project is a task opportunity that grew a team:
  // the work is divided inside each deliverable, so it takes the Team tab but
  // none of the milestone planning surfaces.
  if (isTeamProject && !project.hasMilestones) {
    return filterByAccess(withSettings([
      ...baseTabs.slice(0, 2),
      PROJECT_TEAM_TAB_ITEM,
      ...baseTabs.slice(2),
    ])).map((tab) => tab.label)
  }

  // A milestone team project tracks its work on Board and Milestones, so the
  // deliverable-shaped Work tab would just be a second, conflicting view of the
  // same milestones.
  if (isTeamProject) {
    return filterByAccess(withSettings([
      baseTabs[0],
      ...PROJECT_TEAM_TAB_ITEMS.slice(0, 2),
      PROJECT_MILESTONE_TAB_ITEM,
      PROJECT_TEAM_TAB_ITEMS[2],
      PROJECT_TEAM_TAB_ITEM,
      ...baseTabs.slice(2),
    ])).map((tab) => tab.label)
  }

  if (project.hasMilestones) {
    return filterByAccess([
      ...baseTabs.slice(0, 3),
      PROJECT_MILESTONE_TAB_ITEM,
      ...baseTabs.slice(3),
    ]).map((tab) => tab.label)
  }

  return filterByAccess(baseTabs).map((tab) => tab.label)
}

export function resolveAllowedProjectTab(tab, project, options) {
  const tabs = getProjectTabs(project, options)

  return tabs.includes(tab) ? tab : tabs[0] || 'Overview'
}
