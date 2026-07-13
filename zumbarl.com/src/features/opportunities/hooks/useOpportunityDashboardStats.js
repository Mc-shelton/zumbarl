import { useMemo } from 'react'

function useOpportunityDashboardStats({ invites = [], interviews = [], serviceOrders = [] } = {}) {
  return useMemo(() => ({
    activeInviteClientsCount: new Set(invites.map((invite) => invite.company)).size,
    actionRequiredServiceOrdersCount: serviceOrders.filter((order) => order.statusTone === 'is-awaiting').length,
    completedServiceOrdersCount: serviceOrders.filter((order) => order.statusTone === 'is-completed').length,
    confirmedServiceOrdersCount: serviceOrders.filter((order) => (
      order.statusTone === 'is-confirmed' || order.statusTone === 'is-scheduled'
    )).length,
    expiringSoonInvitesCount: invites.filter((invite) => (
      String(invite.expires || '').includes('1 day') || String(invite.expires || '').includes('2 days')
    )).length,
    newInvitesCount: invites.filter((invite) => invite.isNew).length,
    upcomingInterviewsCount: interviews.filter((interview) => (
      interview.status !== 'cancelled' && (!interview.scheduledAt || new Date(interview.scheduledAt) >= new Date())
    )).length,
  }), [invites, interviews, serviceOrders])
}

export default useOpportunityDashboardStats
