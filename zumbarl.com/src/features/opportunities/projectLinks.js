export function getOpportunityProjectHref(project) {
  const tabQuery = project.id === 'datavista-dashboard-redesign'
    ? '?tab=milestones'
    : project.id === 'team-social-media-content-creation'
      ? '?tab=board'
      : ''

  return `/campus/projects/${project.id}${tabQuery}`
}
