import { useMemo } from 'react'
import { BID_RAIL_INTERVIEWS, OPPORTUNITY_INVITES, SERVICE_ORDERS } from '../constants'

function useOpportunityDashboardStats(invites = OPPORTUNITY_INVITES) {
  return useMemo(() => ({
    activeInviteClientsCount: new Set(invites.map((invite) => invite.company)).size,
    actionRequiredServiceOrdersCount: SERVICE_ORDERS.filter((order) => order.statusTone === 'is-awaiting').length,
    completedServiceOrdersCount: SERVICE_ORDERS.filter((order) => order.statusTone === 'is-completed').length,
    confirmedServiceOrdersCount: SERVICE_ORDERS.filter((order) => (
      order.statusTone === 'is-confirmed' || order.statusTone === 'is-scheduled'
    )).length,
    expiringSoonInvitesCount: invites.filter((invite) => (
      invite.expires.includes('1 day') || invite.expires.includes('2 days')
    )).length,
    newInvitesCount: invites.filter((invite) => invite.isNew).length,
    upcomingInterviewsCount: BID_RAIL_INTERVIEWS.length,
  }), [invites])
}

export default useOpportunityDashboardStats
