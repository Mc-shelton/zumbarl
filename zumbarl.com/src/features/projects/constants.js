import { ACCESS_KEYS, filterByAccess } from '../auth/roleConfig'

export const PROJECT_TAB_ITEMS = [
  { label: 'Overview', requiredAccess: ACCESS_KEYS.projects.view },
  { label: 'Messages', requiredAccess: ACCESS_KEYS.projects.messages },
  { label: 'Files', requiredAccess: ACCESS_KEYS.projects.files },
  { label: 'Reviews', requiredAccess: ACCESS_KEYS.projects.reviews },
  { label: 'Activity Logs', requiredAccess: ACCESS_KEYS.projects.activityLogs },
]

export const PROJECT_TABS = filterByAccess(PROJECT_TAB_ITEMS).map((tab) => tab.label)

export const PROJECT_TAB_QUERY = {
  Overview: 'overview',
  Board: 'board',
  Timeline: 'timeline',
  Sprints: 'sprints',
  Milestones: 'milestones',
  Team: 'team',
  Messages: 'messages',
  Files: 'files',
  'Activity Logs': 'activity-logs',
  Reviews: 'reviews',
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
  { label: 'Timeline', requiredAccess: ACCESS_KEYS.projects.timeline },
  { label: 'Sprints', requiredAccess: ACCESS_KEYS.projects.sprints },
  { label: 'Team', requiredAccess: ACCESS_KEYS.projects.team },
]

export const PROJECT_MILESTONE_TAB_ITEM = {
  label: 'Milestones',
  requiredAccess: ACCESS_KEYS.projects.milestones,
}

export function normalizeProjectTab(tabQueryValue) {
  return PROJECT_QUERY_TAB[tabQueryValue] || LEGACY_PROJECT_QUERY_TAB[tabQueryValue] || 'Overview'
}

export function getProjectTabs(project) {
  const baseTabs = PROJECT_TAB_ITEMS

  if (project.hasTeam) {
    return filterByAccess([
      baseTabs[0],
      ...PROJECT_TEAM_TAB_ITEMS.slice(0, 3),
      PROJECT_MILESTONE_TAB_ITEM,
      PROJECT_TEAM_TAB_ITEMS[3],
      ...baseTabs.slice(2),
    ]).map((tab) => tab.label)
  }

  if (project.hasMilestones) {
    return filterByAccess([
      baseTabs[0],
      baseTabs[1],
      PROJECT_MILESTONE_TAB_ITEM,
      ...baseTabs.slice(2),
    ]).map((tab) => tab.label)
  }

  return filterByAccess(baseTabs).map((tab) => tab.label)
}

export function resolveAllowedProjectTab(tab, project) {
  const tabs = getProjectTabs(project)

  return tabs.includes(tab) ? tab : tabs[0] || 'Overview'
}
