import type { FastifyInstance } from 'fastify'
import { requireRoles, roleGroups } from '../../../../lib/security.js'
import {
  accessKnowledgeResourceController,
  addKnowledgeManagerController,
  addRoadmapEvidenceController,
  completeCheckpointTestController,
  createKnowledgeResourceController,
  createKnowledgeRoomController,
  createKnowledgeRoomMessageController,
  createKnowledgeSpacePostController,
  createKnowledgeSpaceController,
  decideKnowledgeMembershipRequestController,
  decideKnowledgeRoomMembershipRequestController,
  decideKnowledgeResourceAccessController,
  decideKnowledgeResourceSubmissionController,
  createRoadmapController,
  listCareerLaddersController,
  listKnowledgeController,
  listKnowledgeUnitsController,
  listKnowledgeManagerCandidatesController,
  listKnowledgeRoomMessagesController,
  purchaseKnowledgeResourceController,
  listRoadmapRecommendationsController,
  listRoadmapsController,
  listTransitionPoolsController,
  lockRoadmapController,
  readRoadmapController,
  readKnowledgeSpaceController,
  readKnowledgeResourceCheckoutController,
  readKnowledgeRoomController,
  removeKnowledgeManagerController,
  readLearnBaselineController,
  submitLearningPracticeController,
  updateKnowledgeFollowingController,
  takeDownKnowledgeSpacePostController,
  updateKnowledgeMembershipController,
  updateKnowledgeRoomController,
  updateKnowledgeRoomMembershipController,
  updateKnowledgeSpaceController,
  updateKnowledgeSpacePostController,
  verifyRoadmapEvidenceController,
  verifyRoadmapController
} from '../../controllers/learn/index.js'

async function registerLearnRoutes(app: FastifyInstance) {
  const students = requireRoles(...roleGroups.student, ...roleGroups.admin)
  const business = requireRoles(...roleGroups.business, ...roleGroups.admin)
  const admins = requireRoles(...roleGroups.admin)
  app.get('/ladders', { preHandler: requireRoles(...roleGroups.student, ...roleGroups.business, ...roleGroups.admin) }, listCareerLaddersController)
  app.get('/knowledge', { preHandler: students }, listKnowledgeController)
  app.get('/knowledge/units', { preHandler: students }, listKnowledgeUnitsController)
  app.get('/knowledge/spaces/:id', { preHandler: students }, readKnowledgeSpaceController)
  app.post('/knowledge/spaces', { preHandler: students }, createKnowledgeSpaceController)
  app.patch('/knowledge/spaces/:id', { preHandler: students }, updateKnowledgeSpaceController)
  app.get('/knowledge/spaces/:id/manager-candidates', { preHandler: students }, listKnowledgeManagerCandidatesController)
  app.post('/knowledge/spaces/:id/managers', { preHandler: students }, addKnowledgeManagerController)
  app.delete('/knowledge/spaces/:id/managers/:studentId', { preHandler: students }, removeKnowledgeManagerController)
  app.put('/knowledge/spaces/:id/requests/:studentId', { preHandler: students }, decideKnowledgeMembershipRequestController)
  app.put('/knowledge/spaces/:id/membership', { preHandler: students }, updateKnowledgeMembershipController)
  app.put('/knowledge/spaces/:id/following', { preHandler: students }, updateKnowledgeFollowingController)
  app.post('/knowledge/spaces/:id/rooms', { preHandler: students }, createKnowledgeRoomController)
  app.post('/knowledge/spaces/:id/posts', { preHandler: students }, createKnowledgeSpacePostController)
  app.patch('/knowledge/spaces/:id/posts/:postId', { preHandler: students }, updateKnowledgeSpacePostController)
  app.delete('/knowledge/spaces/:id/posts/:postId', { preHandler: students }, takeDownKnowledgeSpacePostController)
  app.put('/knowledge/spaces/:id/resources/:resourceId', { preHandler: students }, decideKnowledgeResourceSubmissionController)
  app.put('/knowledge/spaces/:id/access-requests/:accessId', { preHandler: students }, decideKnowledgeResourceAccessController)
  app.get('/knowledge/rooms/:id', { preHandler: students }, readKnowledgeRoomController)
  app.patch('/knowledge/rooms/:id', { preHandler: students }, updateKnowledgeRoomController)
  app.put('/knowledge/rooms/:id/membership', { preHandler: students }, updateKnowledgeRoomMembershipController)
  app.put('/knowledge/rooms/:id/requests/:studentId', { preHandler: students }, decideKnowledgeRoomMembershipRequestController)
  app.get('/knowledge/rooms/:id/messages', { preHandler: students }, listKnowledgeRoomMessagesController)
  app.post('/knowledge/rooms/:id/messages', { preHandler: students }, createKnowledgeRoomMessageController)
  app.post('/knowledge/resources', { preHandler: students }, createKnowledgeResourceController)
  app.post('/knowledge/resources/:id/access', { preHandler: students }, accessKnowledgeResourceController)
  app.get('/knowledge/resources/:id/checkout', { preHandler: students }, readKnowledgeResourceCheckoutController)
  app.post('/knowledge/resources/:id/purchase', { preHandler: students }, purchaseKnowledgeResourceController)
  app.get('/baseline', { preHandler: students }, readLearnBaselineController)
  app.get('/roadmaps', { preHandler: students }, listRoadmapsController)
  app.post('/roadmaps', { preHandler: students }, createRoadmapController)
  app.get('/roadmaps/:id', { preHandler: students }, readRoadmapController)
  app.post('/roadmaps/:id/lock', { preHandler: students }, lockRoadmapController)
  app.post('/roadmaps/:id/evidence', { preHandler: students }, addRoadmapEvidenceController)
  app.post('/roadmaps/:id/practice-submissions', { preHandler: students }, submitLearningPracticeController)
  app.post('/evidence/:id/verify', { preHandler: admins }, verifyRoadmapEvidenceController)
  app.post('/roadmaps/:id/tests', { preHandler: students }, completeCheckpointTestController)
  app.post('/roadmaps/:id/verify', { preHandler: students }, verifyRoadmapController)
  app.get('/roadmaps/:id/recommendations', { preHandler: students }, listRoadmapRecommendationsController)
  app.get('/transition-pools', { preHandler: business }, listTransitionPoolsController)
}

export { registerLearnRoutes }
