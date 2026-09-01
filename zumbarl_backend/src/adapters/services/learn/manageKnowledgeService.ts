import { forbidden, notFound } from '../../../lib/http.js'
import { learnKnowledgeRepository } from '../../repositories/learn/index.js'
import { fetchCampaignLinkPreview } from '../marketing/fetchLinkPreview.js'

function requireStudentId(studentId?: string) {
  if (!studentId) forbidden('A student profile is required')
  return studentId
}

function slugify(value: string) {
  return `${value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString(36)}`
}

function mapOwner(owner?: Record<string, any> | null) {
  if (!owner) return { id: null, name: 'Unmanaged community', avatarUrl: null, campus: null }
  return {
    id: owner.id,
    name: `${owner.firstName} ${owner.lastName}`,
    avatarUrl: owner.avatarUrl,
    campus: owner.campus?.name || null
  }
}

function mapManagedStudent(student: Record<string, any>) {
  return {
    id: student.id,
    name: `${student.firstName} ${student.lastName}`,
    handle: student.user?.username ? `@${student.user.username}` : null,
    email: student.user?.email || null,
    avatarUrl: student.avatarUrl,
    campus: student.campus?.name || null,
    followerCount: student._count?.incomingRelationships || 0,
    zumbarlScore: !student.zumbarl || student.zumbarl.confidence === 'PROVISIONAL' ? null : Math.round(student.zumbarl.currentScore || 0),
    zumbarlTier: !student.zumbarl || student.zumbarl.confidence === 'PROVISIONAL' ? 'PROVISIONAL' : student.zumbarl.tier || 'PROVISIONAL'
  }
}

function mapManagedMembership(membership: Record<string, any>, viewerStudentId?: string, followedMemberIds = new Set<string>()) {
  return {
    ...mapManagedStudent(membership.student),
    role: membership.role.toLowerCase(),
    status: membership.status.toLowerCase(),
    joinedAt: membership.joinedAt,
    isViewer: membership.student.id === viewerStudentId,
    isFollowing: followedMemberIds.has(membership.student.id)
  }
}

function mapRoom(room: Record<string, any>, viewerStudentId?: string, inheritedManagement = false, canViewActivity = true) {
  const membership = room.memberships?.[0] || null
  return {
    id: room.id,
    title: room.title,
    description: room.description,
    isPrimary: Boolean(room.isPrimary),
    creator: mapManagedStudent(room.creator),
    resource: room.resource ? {
      id: room.resource.id,
      title: room.resource.title,
      type: room.resource.resourceType.toLowerCase()
    } : null,
    messageCount: canViewActivity ? room._count?.messages || 0 : null,
    memberCount: room._count?.memberships || 0,
    membership: membership ? { role: membership.role.toLowerCase(), status: membership.status.toLowerCase() } : null,
    isCreator: room.createdByStudentId === viewerStudentId,
    canManage: inheritedManagement || room.createdByStudentId === viewerStudentId || (membership?.status === 'ACTIVE' && membership.role === 'ADMIN'),
    updatedAt: room.updatedAt
  }
}

function mapRoomMessage(message: Record<string, any>, viewerStudentId?: string) {
  return {
    id: message.id,
    body: message.body,
    attachments: Array.isArray(message.attachments) ? message.attachments : [],
    linkPreviews: Array.isArray(message.linkPreviews) ? message.linkPreviews : [],
    resources: (message.resources || []).map((resource: Record<string, any>) => ({
      id: resource.id,
      title: resource.title,
      type: resource.resourceType.toLowerCase()
    })),
    author: mapManagedStudent(message.author),
    isMine: message.authorStudentId === viewerStudentId,
    createdAt: message.createdAt
  }
}

function mapSpace(space: Record<string, any>) {
  const membership = space.memberships?.[0] || null
  return {
    id: space.id,
    type: space.type.toLowerCase(),
    groupType: space.groupType?.toLowerCase() || (space.type === 'GROUP' ? 'study_group' : null),
    name: space.name,
    slug: space.slug,
    description: space.description,
    visibility: space.visibility.toLowerCase(),
    membershipMode: space.membershipMode.toLowerCase(),
    avatarUrl: space.avatarUrl || `/assets/knowledge/default-${space.type.toLowerCase()}-avatar.svg`,
    coverImageUrl: space.coverImageUrl,
    owner: mapOwner(space.owner),
    resourceCount: space._count?.resources || 0,
    memberCount: space._count?.memberships || 0,
    roomCount: space._count?.rooms || 0,
    followerCount: space._count?.followers || 0,
    membership: membership ? { role: membership.role.toLowerCase(), status: membership.status.toLowerCase() } : null,
    followed: Boolean(space.followers?.length),
    updatedAt: space.updatedAt
  }
}

function mapResource(resource: Record<string, any>, viewerStudentId?: string) {
  return {
    id: resource.id,
    title: resource.title,
    description: resource.description,
    type: resource.resourceType.toLowerCase(),
    accessMode: resource.accessMode.toLowerCase(),
    subject: resource.subject,
    courseCode: resource.courseCode,
    unit: resource.unit ? { id: resource.unit.id, name: resource.unit.name } : resource.courseCode ? { id: null, name: resource.courseCode } : null,
    academicYear: resource.academicYear,
    institution: resource.institution,
    price: resource.price,
    currency: resource.currency,
    sourceMode: resource.sourceMode?.toLowerCase() || (resource.fileUrls?.length ? 'files' : 'link'),
    fileUrl: resource.fileUrl,
    fileUrls: resource.fileUrls || [],
    coverImageUrl: resource.coverImageUrl || `/assets/knowledge/default-resource-${resource.resourceType.toLowerCase().replaceAll('_', '-')}.svg`,
    previewText: resource.previewText,
    availableCopies: resource.availableCopies,
    status: resource.status.toLowerCase(),
    sourceMessageId: resource.sourceMessageId || null,
    ownedByViewer: resource.ownerStudentId === viewerStudentId,
    owner: mapOwner(resource.owner),
    space: resource.space ? mapSpace(resource.space) : null,
    viewerActions: Object.fromEntries((resource.accesses || []).map((item: Record<string, any>) => [item.action.toLowerCase(), {
      status: item.status.toLowerCase(),
      dueAt: item.dueAt
    }])),
    circulationCount: resource._count?.accesses || 0,
    createdAt: resource.createdAt,
    recommendation: resource.recommendation || { source: 'fallback' }
  }
}

function mapResourceAccessRequest(access: Record<string, any>) {
  return {
    id: access.id,
    action: access.action.toLowerCase(),
    status: access.status.toLowerCase(),
    amount: access.amount,
    requestedAt: access.createdAt,
    requester: mapManagedStudent(access.student),
    resource: {
      id: access.resource.id,
      title: access.resource.title,
      type: access.resource.resourceType.toLowerCase(),
      accessMode: access.resource.accessMode.toLowerCase(),
      coverImageUrl: access.resource.coverImageUrl || `/assets/knowledge/default-resource-${access.resource.resourceType.toLowerCase().replaceAll('_', '-')}.svg`,
      price: access.resource.price,
      currency: access.resource.currency,
      availableCopies: access.resource.availableCopies
    }
  }
}

function mapResourcePurchase(access: Record<string, any>) {
  return {
    id: access.id,
    amount: Number(access.amount || 0),
    currency: access.resource.currency || 'KES',
    purchasedAt: access.updatedAt,
    buyer: mapManagedStudent(access.student),
    publisher: mapOwner(access.resource.owner),
    resource: {
      id: access.resource.id,
      title: access.resource.title,
      type: access.resource.resourceType.toLowerCase(),
      coverImageUrl: access.resource.coverImageUrl || `/assets/knowledge/default-resource-${access.resource.resourceType.toLowerCase().replaceAll('_', '-')}.svg`
    }
  }
}

function payloadObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {}
}

function mapSpacePost(post: Record<string, any>, viewerStudentId: string, canManage: boolean, space: Record<string, any>) {
  const payload = payloadObject(post.payload)
  const spaceType = String(space.type || 'GROUP').toLowerCase()
  const reactions = payloadObject(post.reactions)
  const reshares = payloadObject(payload.reshares)
  const comments = (post.comments || []).map((comment: Record<string, any>) => ({
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt,
    author: comment.author ? mapManagedStudent(comment.author) : {
      id: null,
      name: 'Zumbarl student',
      handle: '@student',
      avatarUrl: null,
      campus: null
    }
  }))
  return {
    id: post.id,
    type: post.type,
    body: post.body,
    tags: Array.isArray(post.tags) ? post.tags : [],
    mediaUrls: Array.isArray(payload.mediaUrls) ? payload.mediaUrls : [],
    mediaEdits: Array.isArray(payload.mediaEdits) ? payload.mediaEdits : [],
    event: payloadObject(payload.event),
    poll: payloadObject(payload.poll),
    feeling: payloadObject(payload.feeling),
    comments,
    reactionCount: Object.keys(reactions).length,
    viewerReacted: Boolean(reactions[viewerStudentId]),
    commentCount: comments.length,
    repostCount: Number(post.reposts || 0),
    viewerReshared: Boolean(reshares[viewerStudentId]),
    viewerReshareCommentary: String(payloadObject(reshares[viewerStudentId]).commentary || ''),
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: {
      id: space.id,
      name: space.name,
      handle: spaceType === 'library' ? 'Library' : 'Study group',
      avatarUrl: space.avatarUrl || `/assets/knowledge/default-${spaceType}-avatar.svg`,
      campus: post.author?.campus?.name || null,
      profileType: `knowledge-${spaceType}`,
      profilePath: `/campus/learn/spaces/${encodeURIComponent(space.slug || space.id)}`
    },
    isMine: post.studentId === viewerStudentId,
    canEdit: canManage || post.studentId === viewerStudentId,
    canTakeDown: canManage
  }
}

async function listKnowledgeService(studentId: string | undefined, query: Record<string, unknown>) {
  const result = await learnKnowledgeRepository.listKnowledge(requireStudentId(studentId), query)
  return {
    resources: result.resources.map((resource) => mapResource(resource, studentId)),
    libraries: result.spaces.filter((space) => space.type === 'LIBRARY').map(mapSpace),
    groups: result.spaces.filter((space) => space.type === 'GROUP').map(mapSpace),
    summary: {
      resources: result.resources.length,
      libraries: result.spaces.filter((space) => space.type === 'LIBRARY').length,
      groups: result.spaces.filter((space) => space.type === 'GROUP').length,
      borrowed: result.myBorrowCount,
      saved: result.mySavedCount
    }
  }
}

async function readKnowledgeSpaceService(identifier: string, studentId: string | undefined) {
  const resolvedStudentId = requireStudentId(studentId)
  const result = await learnKnowledgeRepository.findSpaceDetail(identifier, resolvedStudentId)
  if (!result) notFound('Knowledge space')
  const followedMemberIds = new Set(result.followedMemberIds || [])
  const viewerSpaceMembership = result.space.memberships?.[0]
  const canManageSpace = result.space.ownerStudentId === resolvedStudentId || (
    viewerSpaceMembership?.status === 'ACTIVE' && ['OWNER', 'ADMIN'].includes(viewerSpaceMembership.role)
  )
  const canViewRoomActivity = canManageSpace || viewerSpaceMembership?.status === 'ACTIVE'
  return {
    space: mapSpace(result.space),
    resources: result.resources.map((resource) => mapResource(resource, resolvedStudentId)),
    members: result.activeMemberships.map((membership) => mapManagedMembership(membership, resolvedStudentId, followedMemberIds)),
    rooms: result.rooms.map((room) => ({
      ...mapRoom(room, resolvedStudentId, canManageSpace, canViewRoomActivity),
      ...(room.isPrimary ? { memberCount: result.activeMemberships.length } : {})
    })),
    posts: (result.posts || []).map((post: Record<string, any>) => mapSpacePost(post, resolvedStudentId, canManageSpace, result.space)),
    management: result.managementMemberships?.length || result.space.ownerStudentId === studentId
      ? {
        managers: result.managementMemberships
          .filter((item) => item.status === 'ACTIVE' && ['OWNER', 'ADMIN'].includes(item.role))
          .map((membership) => mapManagedMembership(membership, resolvedStudentId, followedMemberIds)),
        members: result.managementMemberships
          .filter((item) => item.status === 'ACTIVE' && item.role === 'MEMBER')
          .map((membership) => mapManagedMembership(membership, resolvedStudentId, followedMemberIds)),
        pendingRequests: result.managementMemberships
          .filter((item) => item.status === 'PENDING')
          .map((membership) => mapManagedMembership(membership, resolvedStudentId, followedMemberIds)),
        pendingResources: (result.pendingResources || []).map((resource: Record<string, any>) => mapResource(resource, resolvedStudentId)),
        pendingAccesses: (result.pendingAccesses || [])
          .filter((access: Record<string, any>) => access.studentId !== resolvedStudentId)
          .map(mapResourceAccessRequest),
        purchases: (result.purchases || []).map(mapResourcePurchase),
        earnings: {
          purchaseCount: (result.purchases || []).length,
          grossAmount: (result.purchases || []).reduce((total: number, purchase: Record<string, any>) => total + Number(purchase.amount || 0), 0),
          currency: result.purchases?.[0]?.resource?.currency || 'KES'
        }
      }
      : null
  }
}

async function createKnowledgeSpacePostService(spaceId: string, studentId: string | undefined, payload: Record<string, any>) {
  const resolvedStudentId = requireStudentId(studentId)
  await requireActiveKnowledgeMember(spaceId, resolvedStudentId)
  await learnKnowledgeRepository.createSpacePost(spaceId, resolvedStudentId, payload)
  return readKnowledgeSpaceService(spaceId, resolvedStudentId)
}

async function updateKnowledgeSpacePostService(spaceId: string, postId: string, studentId: string | undefined, payload: Record<string, any>) {
  const resolvedStudentId = requireStudentId(studentId)
  const post = await learnKnowledgeRepository.findSpacePost(postId)
  if (!post || post.knowledgeSpaceId !== spaceId || post.status !== 'published') notFound('Space post')
  const space = await learnKnowledgeRepository.findSpace(spaceId, resolvedStudentId)
  if (!space) notFound('Knowledge space')
  const membership = space.memberships[0]
  const canManage = space.ownerStudentId === resolvedStudentId || (membership?.status === 'ACTIVE' && ['OWNER', 'ADMIN'].includes(membership.role))
  if (post.studentId !== resolvedStudentId && !canManage) forbidden('Only the author or a space admin can edit this post')
  await learnKnowledgeRepository.updateSpacePost(postId, payload)
  return readKnowledgeSpaceService(spaceId, resolvedStudentId)
}

async function takeDownKnowledgeSpacePostService(spaceId: string, postId: string, studentId: string | undefined) {
  const resolvedStudentId = requireStudentId(studentId)
  await requireKnowledgeManager(spaceId, resolvedStudentId)
  const post = await learnKnowledgeRepository.findSpacePost(postId)
  if (!post || post.knowledgeSpaceId !== spaceId || post.status !== 'published') notFound('Space post')
  await learnKnowledgeRepository.takeDownSpacePost(postId, resolvedStudentId)
  return readKnowledgeSpaceService(spaceId, resolvedStudentId)
}

async function requireKnowledgeManager(spaceId: string, studentId: string, ownerOnly = false) {
  const space = await learnKnowledgeRepository.findSpace(spaceId, studentId)
  if (!space) notFound('Knowledge space')
  const membership = space.memberships[0]
  const role = space.ownerStudentId === studentId ? 'OWNER' : membership?.role
  const active = space.ownerStudentId === studentId || membership?.status === 'ACTIVE'
  if (!active || !['OWNER', 'ADMIN'].includes(role || '') || (ownerOnly && role !== 'OWNER')) {
    forbidden(ownerOnly ? 'Only the page owner can manage managers' : 'Only this page’s owner or a manager can do that')
  }
  return { space, role }
}

async function requireActiveKnowledgeMember(spaceId: string, studentId: string) {
  const space = await learnKnowledgeRepository.findSpace(spaceId, studentId)
  if (!space || space.status !== 'ACTIVE') notFound('Knowledge space')
  const membership = space.memberships[0]
  if (space.ownerStudentId !== studentId && membership?.status !== 'ACTIVE') {
    forbidden('Only active members can contribute to this library or study group')
  }
  return space
}

async function createKnowledgeSpaceService(studentId: string | undefined, payload: Record<string, any>) {
  const space = await learnKnowledgeRepository.createSpace(requireStudentId(studentId), { ...payload, slug: slugify(payload.name) })
  return mapSpace(space)
}

async function createKnowledgeResourceService(studentId: string | undefined, payload: Record<string, any>) {
  const resolvedStudentId = requireStudentId(studentId)
  const studentInstitution = await learnKnowledgeRepository.findStudentInstitution(resolvedStudentId)
  payload.institution = studentInstitution?.campus?.name || payload.institution
  if (payload.unitId || payload.unitName) {
    const unit = await learnKnowledgeRepository.resolveUnit(payload.unitId, payload.unitName, payload.createUnit)
    if (!unit) notFound('Knowledge unit')
    payload.unitId = unit.id
  }
  if (payload.accessMode === 'MEMBERS_ONLY' && !payload.spaceId) {
    forbidden('Member-only resources must belong to a library or study group')
  }
  if (payload.spaceId) {
    const space = await learnKnowledgeRepository.findSpace(payload.spaceId, resolvedStudentId)
    if (!space) notFound('Knowledge space')
    if (space.type === 'GROUP' && payload.accessMode !== 'MEMBERS_ONLY') {
      forbidden('Group resources are members-only')
    }
    if (space.type === 'GROUP' && !payload.sourceMessageId) {
      forbidden('Group resources must be marked from group chat')
    }
    if (payload.sourceMessageId) {
      const message = await learnKnowledgeRepository.findRoomMessage(payload.sourceMessageId)
      if (!message || message.room.spaceId !== space.id || !message.room.isPrimary || space.type !== 'GROUP') {
        forbidden('Group resources must come from this group chat')
      }
    }
    const membership = space.memberships[0]
    if (space.ownerStudentId !== resolvedStudentId && membership?.status !== 'ACTIVE') {
      forbidden('Only active members can add resources to this space')
    }
    const canManage = space.ownerStudentId === resolvedStudentId || (
      membership?.status === 'ACTIVE' && ['OWNER', 'ADMIN'].includes(membership.role)
    )
    payload.status = space.type === 'GROUP' || canManage ? 'PUBLISHED' : 'PENDING'
  } else {
    payload.accessMode = 'FREE_READ'
    payload.price = undefined
    payload.availableCopies = undefined
    payload.status = 'PUBLISHED'
  }
  const resource = await learnKnowledgeRepository.createResource(resolvedStudentId, payload)
  return mapResource(resource, resolvedStudentId)
}

async function readKnowledgeResourceCheckoutService(resourceId: string, studentId: string | undefined) {
  const resolvedStudentId = requireStudentId(studentId)
  const resource = await learnKnowledgeRepository.findResource(resourceId, resolvedStudentId)
  if (!resource || resource.status !== 'PUBLISHED' || resource.accessMode !== 'BUY') notFound('Purchasable knowledge resource')
  const membership = resource.space?.memberships?.[0]
  const canManage = resource.ownerStudentId === resolvedStudentId || (
    membership?.status === 'ACTIVE' && ['OWNER', 'ADMIN'].includes(membership.role)
  )
  if (canManage) forbidden('You already have direct access to this resource')
  const existingPurchase = resource.accesses.find((access) => access.action === 'PURCHASE' && ['ACTIVE', 'COMPLETED'].includes(access.status))
  if (existingPurchase) forbidden('You already own this resource')
  const wallet = await learnKnowledgeRepository.findStudentWallet(resolvedStudentId)
  return {
    resource: {
      id: resource.id,
      title: resource.title,
      description: resource.description,
      coverImageUrl: resource.coverImageUrl || `/assets/knowledge/default-resource-${resource.resourceType.toLowerCase().replaceAll('_', '-')}.svg`,
      publisher: mapOwner(resource.owner),
      space: resource.space ? { id: resource.space.id, name: resource.space.name } : null
    },
    payment: {
      amount: Number(resource.price || 0),
      currency: resource.currency || 'KES',
      method: 'wallet'
    },
    wallet: {
      balance: Number(wallet?.balance || 0),
      currency: wallet?.currency || resource.currency || 'KES',
      sufficient: Number(wallet?.balance || 0) >= Number(resource.price || 0)
    }
  }
}

async function purchaseKnowledgeResourceService(resourceId: string, studentId: string | undefined, payload: Record<string, any>) {
  const resolvedStudentId = requireStudentId(studentId)
  if (payload.paymentMethod !== 'WALLET') forbidden('Choose a supported payment method')
  const resource = await learnKnowledgeRepository.findResource(resourceId, resolvedStudentId)
  if (!resource || resource.status !== 'PUBLISHED' || resource.accessMode !== 'BUY') notFound('Purchasable knowledge resource')
  const membership = resource.space?.memberships?.[0]
  const canManage = resource.ownerStudentId === resolvedStudentId || (
    membership?.status === 'ACTIVE' && ['OWNER', 'ADMIN'].includes(membership.role)
  )
  if (canManage) forbidden('You already have direct access to this resource')
  const amount = Number(resource.price || 0)
  if (amount <= 0) forbidden('This resource does not have a valid purchase price')
  const purchased = await learnKnowledgeRepository.purchaseResource(resourceId, resolvedStudentId, amount, resource.currency || 'KES')
  if (!purchased) notFound('Purchasable knowledge resource')
  return mapResource(purchased, resolvedStudentId)
}

async function listKnowledgeUnitsService(studentId: string | undefined, query: Record<string, unknown>) {
  requireStudentId(studentId)
  return learnKnowledgeRepository.searchUnits(String(query.q || ''))
}

async function decideKnowledgeResourceSubmissionService(
  spaceId: string,
  resourceId: string,
  studentId: string | undefined,
  action: 'APPROVE' | 'REJECT'
) {
  const resolvedStudentId = requireStudentId(studentId)
  await requireKnowledgeManager(spaceId, resolvedStudentId)
  const resource = await learnKnowledgeRepository.findResource(resourceId, resolvedStudentId)
  if (!resource || resource.spaceId !== spaceId || resource.status !== 'PENDING') notFound('Pending resource submission')
  await learnKnowledgeRepository.reviewResource(resourceId, action === 'APPROVE' ? 'PUBLISHED' : 'REJECTED', resolvedStudentId)
  return readKnowledgeSpaceService(spaceId, resolvedStudentId)
}

async function decideKnowledgeResourceAccessService(
  spaceId: string,
  accessId: string,
  studentId: string | undefined,
  action: 'APPROVE' | 'REJECT'
) {
  const resolvedStudentId = requireStudentId(studentId)
  await requireKnowledgeManager(spaceId, resolvedStudentId)
  const access = await learnKnowledgeRepository.findResourceAccess(accessId)
  if (
    !access
    || access.status !== 'PENDING'
    || !['BORROW', 'PURCHASE'].includes(access.action)
    || access.resource.spaceId !== spaceId
    || access.resource.status !== 'PUBLISHED'
  ) notFound('Pending resource access request')

  if (action === 'APPROVE' && access.action === 'BORROW') {
    const activeBorrows = await learnKnowledgeRepository.countActiveResourceBorrows(access.resourceId)
    if (activeBorrows >= Number(access.resource.availableCopies || 0)) forbidden('No copies are currently available to lend')
  }

  const dueAt = action === 'APPROVE' && access.action === 'BORROW'
    ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    : undefined
  const decision = await learnKnowledgeRepository.decideResourceAccess(
    accessId,
    action === 'APPROVE' ? 'ACTIVE' : 'CANCELLED',
    dueAt
  )
  if (!decision.count) notFound('Pending resource access request')
  return readKnowledgeSpaceService(spaceId, resolvedStudentId)
}

async function updateKnowledgeMembershipService(spaceId: string, studentId: string | undefined, active: boolean) {
  const resolvedStudentId = requireStudentId(studentId)
  const space = await learnKnowledgeRepository.findSpace(spaceId, resolvedStudentId)
  if (!space) notFound('Knowledge space')
  if (active && space.membershipMode === 'INVITE' && space.ownerStudentId && space.ownerStudentId !== resolvedStudentId) {
    forbidden('This space is invite only')
  }
  // Joining a library or group is always a request. Only its owner/admins may
  // activate the membership; room access is derived from that active status.
  const status = 'PENDING'
  const updated = await learnKnowledgeRepository.setMembership(spaceId, resolvedStudentId, active, status)
  if (!updated) notFound('Knowledge space')
  return mapSpace(updated)
}

async function updateKnowledgeFollowingService(spaceId: string, studentId: string | undefined, active: boolean) {
  const resolvedStudentId = requireStudentId(studentId)
  if (!await learnKnowledgeRepository.findSpace(spaceId, resolvedStudentId)) notFound('Knowledge space')
  const updated = await learnKnowledgeRepository.setFollowing(spaceId, resolvedStudentId, active)
  if (!updated) notFound('Knowledge space')
  return mapSpace(updated)
}

async function listKnowledgeManagerCandidatesService(spaceId: string, studentId: string | undefined, query: string) {
  const resolvedStudentId = requireStudentId(studentId)
  await requireKnowledgeManager(spaceId, resolvedStudentId, true)
  const candidates = await learnKnowledgeRepository.listManagerCandidates(spaceId, query.trim())
  return candidates.map((candidate) => ({
    ...mapManagedStudent(candidate),
    currentRole: candidate.knowledgeMemberships?.[0]?.role?.toLowerCase() || null,
    membershipStatus: candidate.knowledgeMemberships?.[0]?.status?.toLowerCase() || null
  }))
}

async function updateKnowledgeManagerService(spaceId: string, targetStudentId: string, studentId: string | undefined, active: boolean) {
  const resolvedStudentId = requireStudentId(studentId)
  const { space } = await requireKnowledgeManager(spaceId, resolvedStudentId, true)
  if (space.ownerStudentId === targetStudentId) forbidden('The owner already has full page access')
  await learnKnowledgeRepository.setManager(spaceId, targetStudentId, active)
  return readKnowledgeSpaceService(spaceId, resolvedStudentId)
}

async function decideKnowledgeMembershipRequestService(
  spaceId: string,
  targetStudentId: string,
  studentId: string | undefined,
  action: 'APPROVE' | 'REJECT'
) {
  const resolvedStudentId = requireStudentId(studentId)
  await requireKnowledgeManager(spaceId, resolvedStudentId)
  const result = await learnKnowledgeRepository.decideMembershipRequest(spaceId, targetStudentId, action)
  if (!result.count) notFound('Membership request')
  return readKnowledgeSpaceService(spaceId, resolvedStudentId)
}

async function updateKnowledgeSpaceService(spaceId: string, studentId: string | undefined, payload: Record<string, any>) {
  const resolvedStudentId = requireStudentId(studentId)
  await requireKnowledgeManager(spaceId, resolvedStudentId)
  await learnKnowledgeRepository.updateSpace(spaceId, payload)
  return readKnowledgeSpaceService(spaceId, resolvedStudentId)
}

async function requireKnowledgeRoomMember(roomId: string, studentId: string) {
  const room = await learnKnowledgeRepository.findRoom(roomId, studentId)
  if (!room || room.status !== 'ACTIVE' || room.space.status !== 'ACTIVE') notFound('Discussion room')
  const spaceMembership = room.space.memberships[0]
  const activeInSpace = room.space.ownerStudentId === studentId || spaceMembership?.status === 'ACTIVE'
  if (!activeInSpace) forbidden('Join this library or study group before requesting room access')
  const roomMembership = room.memberships[0]
  const activeInRoom = room.isPrimary || room.createdByStudentId === studentId || roomMembership?.status === 'ACTIVE'
  if (!activeInRoom) forbidden('Join this room and wait for an admin to approve your request')
  return room
}

async function requireKnowledgeRoomManager(roomId: string, studentId: string) {
  const detail = await learnKnowledgeRepository.findRoomDetail(roomId, studentId)
  if (!detail || detail.room.status !== 'ACTIVE' || detail.room.space.status !== 'ACTIVE') notFound('Discussion room')
  if (!detail.canManage) forbidden('Only room or space admins can manage this room')
  return detail
}

function mapRoomDetail(result: Record<string, any>, viewerStudentId: string) {
  const followedMemberIds = new Set<string>(result.followedMemberIds || [])
  return {
    room: mapRoom(result.room, viewerStudentId, result.canManage),
    members: result.activeMemberships.map((membership: Record<string, any>) => mapManagedMembership(membership, viewerStudentId, followedMemberIds)),
    management: result.canManage ? {
      pendingRequests: result.pendingMemberships.map((membership: Record<string, any>) => mapManagedMembership(membership, viewerStudentId, followedMemberIds))
    } : null
  }
}

async function createKnowledgeRoomService(spaceId: string, studentId: string | undefined, payload: Record<string, any>) {
  const resolvedStudentId = requireStudentId(studentId)
  const space = await requireActiveKnowledgeMember(spaceId, resolvedStudentId)
  if (space.type === 'GROUP') forbidden('Groups use one built-in conversation instead of separate rooms')
  if (payload.resourceId) {
    const resource = await learnKnowledgeRepository.findResource(payload.resourceId, resolvedStudentId)
    if (!resource || resource.spaceId !== spaceId) forbidden('Choose a resource from this page')
  }
  const room = await learnKnowledgeRepository.createRoom(spaceId, resolvedStudentId, payload)
  return mapRoom(room, resolvedStudentId, true)
}

async function readKnowledgeRoomService(roomId: string, studentId: string | undefined) {
  const resolvedStudentId = requireStudentId(studentId)
  const result = await learnKnowledgeRepository.findRoomDetail(roomId, resolvedStudentId)
  if (!result || result.room.status !== 'ACTIVE' || result.room.space.status !== 'ACTIVE') notFound('Discussion room')
  const spaceMembership = result.room.space.memberships[0]
  if (result.room.space.ownerStudentId !== resolvedStudentId && spaceMembership?.status !== 'ACTIVE') {
    forbidden('Join this library or study group before viewing room information')
  }
  return mapRoomDetail(result, resolvedStudentId)
}

async function updateKnowledgeRoomMembershipService(roomId: string, studentId: string | undefined, active: boolean) {
  const resolvedStudentId = requireStudentId(studentId)
  const room = await learnKnowledgeRepository.findRoom(roomId, resolvedStudentId)
  if (!room || room.status !== 'ACTIVE' || room.space.status !== 'ACTIVE') notFound('Discussion room')
  if (room.isPrimary) forbidden('Group chat access follows group membership')
  const spaceMembership = room.space.memberships[0]
  if (room.space.ownerStudentId !== resolvedStudentId && spaceMembership?.status !== 'ACTIVE') {
    forbidden('Join this library or study group before requesting room access')
  }
  const result = await learnKnowledgeRepository.setRoomMembership(roomId, resolvedStudentId, active)
  if (!result) notFound('Discussion room')
  if (result.deleted) return { deleted: true, roomId }
  if (!result.detail) notFound('Discussion room')
  return { deleted: false, ...mapRoomDetail(result.detail as Record<string, any>, resolvedStudentId) }
}

async function decideKnowledgeRoomMembershipRequestService(
  roomId: string,
  targetStudentId: string,
  studentId: string | undefined,
  action: 'APPROVE' | 'REJECT'
) {
  const resolvedStudentId = requireStudentId(studentId)
  await requireKnowledgeRoomManager(roomId, resolvedStudentId)
  const decision = await learnKnowledgeRepository.decideRoomMembershipRequest(roomId, targetStudentId, action)
  if (!decision.count) notFound('Room membership request')
  const result = await learnKnowledgeRepository.findRoomDetail(roomId, resolvedStudentId)
  if (!result) notFound('Discussion room')
  return mapRoomDetail(result, resolvedStudentId)
}

async function updateKnowledgeRoomService(roomId: string, studentId: string | undefined, payload: Record<string, any>) {
  const resolvedStudentId = requireStudentId(studentId)
  await requireKnowledgeRoomManager(roomId, resolvedStudentId)
  await learnKnowledgeRepository.updateRoom(roomId, payload)
  const result = await learnKnowledgeRepository.findRoomDetail(roomId, resolvedStudentId)
  if (!result) notFound('Discussion room')
  return mapRoomDetail(result, resolvedStudentId)
}

async function listKnowledgeRoomMessagesService(roomId: string, studentId: string | undefined) {
  const resolvedStudentId = requireStudentId(studentId)
  await requireKnowledgeRoomMember(roomId, resolvedStudentId)
  return (await learnKnowledgeRepository.listRoomMessages(roomId)).map((message) => mapRoomMessage(message, resolvedStudentId))
}

async function createKnowledgeRoomMessageService(roomId: string, studentId: string | undefined, payload: Record<string, any>) {
  const resolvedStudentId = requireStudentId(studentId)
  await requireKnowledgeRoomMember(roomId, resolvedStudentId)
  const links = [...new Set(String(payload.body || '').match(/https?:\/\/[^\s]+/gi) || [])].slice(0, 3)
  const linkPreviews = await Promise.all(links.map(async (link) => {
    let siteName = 'Shared link'
    try { siteName = new URL(link).hostname.replace(/^www\./, '') } catch { /* validation already limits this to web links */ }
    return fetchCampaignLinkPreview(link, { title: siteName, description: 'Shared in a Zumbarl group chat.' })
  }))
  return mapRoomMessage(await learnKnowledgeRepository.createRoomMessage(roomId, resolvedStudentId, { ...payload, linkPreviews }), resolvedStudentId)
}

async function accessKnowledgeResourceService(resourceId: string, studentId: string | undefined, payload: Record<string, any>) {
  const resolvedStudentId = requireStudentId(studentId)
  const resource = await learnKnowledgeRepository.findResource(resourceId, resolvedStudentId)
  if (!resource || resource.status !== 'PUBLISHED') notFound('Knowledge resource')
  const action = payload.action
  if (action === 'PURCHASE') forbidden('Complete the resource checkout to purchase this item')
  if (action === 'BORROW' && !['BORROW', 'MEMBERS_ONLY'].includes(resource.accessMode)) forbidden('This resource is not available to borrow')
  if (action === 'PURCHASE' && resource.accessMode !== 'BUY') forbidden('This resource is not for sale')
  if (resource.accessMode === 'MEMBERS_ONLY' && resource.ownerStudentId !== resolvedStudentId && resource.space?.memberships?.[0]?.status !== 'ACTIVE') {
    forbidden('Join this library or group before accessing member-only material')
  }
  if (action === 'READ' && ['BUY', 'BORROW'].includes(resource.accessMode)) {
    const membership = resource.space?.memberships?.[0]
    const canManage = resource.ownerStudentId === resolvedStudentId || (
      membership?.status === 'ACTIVE' && ['OWNER', 'ADMIN'].includes(membership.role)
    )
    const requiredAction = resource.accessMode === 'BUY' ? 'PURCHASE' : 'BORROW'
    const hasApprovedAccess = resource.accesses.some((item) => (
      item.action === requiredAction && ['ACTIVE', 'COMPLETED'].includes(item.status)
    ))
    if (!canManage && !hasApprovedAccess) forbidden('This request must be approved before the resource can be opened')
  }
  const current = resource.accesses.find((item) => item.action === action)
  const status = action === 'SAVE' && current ? 'CANCELLED' : ['BORROW', 'PURCHASE'].includes(action) ? 'PENDING' : 'ACTIVE'
  const updated = await learnKnowledgeRepository.setResourceAccess(resourceId, resolvedStudentId, action, status, action === 'PURCHASE' ? resource.price || 0 : undefined)
  if (!updated) notFound('Knowledge resource')
  return mapResource(updated, resolvedStudentId)
}

export {
  accessKnowledgeResourceService,
  createKnowledgeResourceService,
  createKnowledgeRoomMessageService,
  createKnowledgeRoomService,
  createKnowledgeSpacePostService,
  createKnowledgeSpaceService,
  decideKnowledgeMembershipRequestService,
  decideKnowledgeResourceAccessService,
  decideKnowledgeResourceSubmissionService,
  decideKnowledgeRoomMembershipRequestService,
  listKnowledgeService,
  listKnowledgeUnitsService,
  listKnowledgeManagerCandidatesService,
  listKnowledgeRoomMessagesService,
  purchaseKnowledgeResourceService,
  readKnowledgeRoomService,
  readKnowledgeResourceCheckoutService,
  readKnowledgeSpaceService,
  takeDownKnowledgeSpacePostService,
  updateKnowledgeFollowingService,
  updateKnowledgeManagerService,
  updateKnowledgeMembershipService,
  updateKnowledgeRoomMembershipService,
  updateKnowledgeRoomService,
  updateKnowledgeSpaceService
  ,updateKnowledgeSpacePostService
}
