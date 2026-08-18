import TeamActivityLogsRail from './TeamActivityLogsRail'
import TeamDefaultRail from './TeamDefaultRail'
import TeamMembersRail from './TeamMembersRail'
import TeamMessagesRail from './TeamMessagesRail'
import TeamMilestonesSideRail from './TeamMilestonesSideRail'
import TeamReviewsRail from './TeamReviewsRail'
import TeamSprintsRail from './TeamSprintsRail'
import TeamTimelineRail from './TeamTimelineRail'

function TeamProjectRail({ activeTab, activityData, messageParticipants, onInviteMember, reviews, timeline }) {
  if (activeTab === 'Team') {
    return <TeamMembersRail />
  }

  if (activeTab === 'Timeline') {
    return <TeamTimelineRail timeline={timeline} />
  }

  if (activeTab === 'Sprints') {
    return <TeamSprintsRail />
  }

  if (activeTab === 'Milestones') {
    return <TeamMilestonesSideRail />
  }

  if (activeTab === 'Activity Logs') {
    return <TeamActivityLogsRail activityData={activityData} />
  }

  if (activeTab === 'Reviews') {
    return <TeamReviewsRail submissions={reviews} />
  }

  if (activeTab === 'Messages') {
    return <TeamMessagesRail participants={messageParticipants} />
  }

  return <TeamDefaultRail onInviteMember={onInviteMember} />
}

export default TeamProjectRail
