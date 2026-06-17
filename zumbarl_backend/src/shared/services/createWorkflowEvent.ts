import { createPrismaRecordRepository } from '../repositories/index.js'

const events = createPrismaRecordRepository('reviewEvents')

function createWorkflowEvent(scope: string, action: string, payload: Record<string, any>) {
  return events.create({ scope, action, ...payload })
}

export {
  createWorkflowEvent
}
