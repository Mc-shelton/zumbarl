import TeamActivityLogsRail from './TeamActivityLogsRail'
import TeamDefaultRail from './TeamDefaultRail'
import TeamMembersRail from './TeamMembersRail'
import TeamMilestonesSideRail from './TeamMilestonesSideRail'
import TeamReviewsRail from './TeamReviewsRail'
import TeamSprintsRail from './TeamSprintsRail'
import TeamTimelineRail from './TeamTimelineRail'

function TeamProjectRail({ activeTab }) {
  if (activeTab === 'Team') {
    return <TeamMembersRail />
  }

  if (activeTab === 'Timeline') {
    return <TeamTimelineRail />
  }

  if (activeTab === 'Sprints') {
    return <TeamSprintsRail />
  }

  if (activeTab === 'Milestones') {
    return <TeamMilestonesSideRail />
  }

  if (activeTab === 'Activity Logs') {
    return <TeamActivityLogsRail />
  }

  if (activeTab === 'Reviews') {
    return <TeamReviewsRail />
  }

  return <TeamDefaultRail />
}

export default TeamProjectRail
