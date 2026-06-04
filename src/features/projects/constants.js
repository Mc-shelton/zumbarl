export const PROJECT_TABS = ['Overview', 'Messages', 'Files', 'Invoices', 'Reviews']

export const PROJECT_TAB_QUERY = {
  Overview: 'overview',
  Board: 'board',
  Timeline: 'timeline',
  Sprints: 'sprints',
  Milestones: 'milestones',
  Team: 'team',
  Messages: 'messages',
  Files: 'files',
  Invoices: 'invoices',
  Reviews: 'reviews',
}

export const PROJECT_QUERY_TAB = Object.fromEntries(
  Object.entries(PROJECT_TAB_QUERY).map(([key, value]) => [value, key])
)

export const PROJECT_TEAM_ONLY_TABS = ['Board', 'Timeline', 'Sprints', 'Team']

export function normalizeProjectTab(tabQueryValue) {
  return PROJECT_QUERY_TAB[tabQueryValue] || 'Overview'
}

export function getProjectTabs(project) {
  if (project.hasTeam) {
    return ['Overview', 'Board', 'Timeline', 'Sprints', 'Milestones', 'Team', 'Files', 'Invoices', 'Reviews']
  }

  if (project.hasMilestones) {
    return ['Overview', 'Messages', 'Milestones', 'Files', 'Invoices', 'Reviews']
  }

  return PROJECT_TABS
}

export function resolveAllowedProjectTab(tab, project) {
  if (tab === 'Milestones' && !project.hasMilestones) {
    return 'Overview'
  }

  if (PROJECT_TEAM_ONLY_TABS.includes(tab) && !project.hasTeam) {
    return 'Overview'
  }

  return tab
}
