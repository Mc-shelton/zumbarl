import { prisma } from '../../../lib/prisma.js'
import { OPPORTUNITY_APPLICABLE_STATUSES } from '../../../shared/opportunities/opportunityLifecycle.js'
import { rankOpportunitiesForStudentMode } from '../../../shared/career/studentProgression.js'
import { connectCommunityRepository } from '../connect/index.js'
import { canonicalSkillKey } from '../skills/index.js'

function uniqueSkillLevels(skills: Array<Record<string, any>> = []) {
  const unique = new Map<string, Record<string, any>>()
  for (const skill of skills) {
    const key = canonicalSkillKey(skill.skillName)
    const existing = unique.get(key)
    const displayQuality = (value: string) => (/^[A-Z]/.test(value) ? 1 : 0) + (/[.+#]/.test(value) ? 1 : 0)
    if (!existing || displayQuality(skill.skillName) > displayQuality(existing.skillName)) unique.set(key, skill)
  }
  return [...unique.values()]
}

function canonicalCourseKey(name: string) {
  return String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function toProfileHeader(student: Record<string, any> | null) {
  if (!student) return null
  const managedCampusPage = student.campus?.managedProfile
  const campusPage = managedCampusPage
    && managedCampusPage.type === 'campus'
    && String(managedCampusPage.status).toLowerCase() === 'active'
    ? { id: managedCampusPage.id, name: managedCampusPage.name, slug: managedCampusPage.slug }
    : null
  return {
    id: student.id,
    userId: student.userId,
    name: `${student.firstName} ${student.lastName}`.trim(),
    firstName: student.firstName,
    lastName: student.lastName,
    role: 'Student',
    campusName: student.campus?.name ?? null,
    campusPage,
    headline: `${student.campus?.name ?? 'Campus'} · Year ${Math.max(new Date().getFullYear() - student.yearJoined + 1, 1)} · ${student.careerPath ?? student.course?.name ?? 'Student'}`,
    location: student.locationCity,
    careerPath: student.careerPath,
    course: student.course ? { id: student.course.id, name: student.course.name, category: student.course.category, duration: student.course.duration } : null,
    handle: student.user?.username
      ? `@${student.user.username}`
      : student.user?.email
        ? `@${student.user.email.split('@')[0].replace(/[^a-z0-9_]/gi, '_')}`
        : '@student',
    avatar: student.avatarUrl,
    bio: student.bio,
    yearJoined: student.yearJoined,
    showZumbarlPoints: student.showZumbarlPoints !== false,
    tags: uniqueSkillLevels(student.skillLevels).slice(0, 4).map((skill) => skill.skillName)
  }
}

function mapContentItem(item: Record<string, any>) {
  return {
    id: item.id,
    section: item.section,
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    org: item.org,
    meta: item.meta,
    value: item.value,
    thumbnail: item.imageUrl,
    image: item.imageUrl,
    thumbnails: item.images?.length ? item.images : item.imageUrl ? [item.imageUrl] : [],
    href: item.href,
    actionLabel: item.actionLabel,
    tags: item.tags,
    ...(item.payload && typeof item.payload === 'object' && !Array.isArray(item.payload) ? item.payload : {})
  }
}

function groupContentSections(items: Record<string, any>[]) {
  const grouped = new Map<string, Record<string, any>[]>()
  items.forEach((item) => {
    grouped.set(item.section, [...(grouped.get(item.section) ?? []), mapContentItem(item)])
  })
  return grouped
}

function formatKes(value: number) {
  return `KES ${Math.round(value).toLocaleString('en-KE')}`
}

function formatEventDate(value: Date) {
  return value.toLocaleDateString('en-KE', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function jsonObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

const ASSISTANT_STOP_WORDS = new Set([
  'a', 'am', 'an', 'and', 'are', 'around', 'at', 'be', 'can', 'do', 'find', 'for',
  'campus', 'from', 'get', 'give', 'i', 'in', 'is', 'it', 'kes', 'ksh', 'me', 'my',
  'looking', 'near', 'of', 'on', 'please', 'show', 'some', 'something', 'the', 'to',
  'under', 'want', 'what', 'with', 'you'
])

function normalizeAssistantText(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function assistantSearchTerms(query: string) {
  return [...new Set(
    normalizeAssistantText(query)
      .split(' ')
      .filter((term) => term.length > 1 && !/^\d+$/.test(term) && !ASSISTANT_STOP_WORDS.has(term))
  )]
}

function assistantIntent(query: string) {
  const normalized = normalizeAssistantText(query)
  const includesAny = (terms: string[]) => terms.some((term) => normalized.includes(term))
  if (includesAny(['gig', 'job', 'work', 'paid', 'freelance', 'opportunity'])) return 'gig'
  if (includesAny(['event', 'happening', 'weekend', 'workshop', 'meetup'])) return 'event'
  if (includesAny(['mentor', 'person', 'people', 'student', 'designer', 'developer', 'creator', 'tutor'])) return 'person'
  if (includesAny(['service', 'food', 'laundry', 'print', 'delivery', 'barber', 'hotel', 'hostel'])) return 'service'
  if (includesAny(['book', 'notes', 'paper', 'study', 'learn', 'revision', 'roadmap', 'course'])) return 'resource'
  if (includesAny(['product', 'buy', 'sell', 'market', 'laptop', 'phone', 'used'])) return 'product'
  return null
}

function assistantBudgetCeiling(query: string) {
  const normalized = query.replace(/,/g, '')
  const match = normalized.match(/(?:under|below|less than|max(?:imum)?|kes|ksh)\s*(?:kes|ksh)?\s*(\d+(?:\.\d+)?)(k)?/i)
  if (!match) return null
  const value = Number(match[1]) * (match[2]?.toLowerCase() === 'k' ? 1000 : 1)
  return Number.isFinite(value) ? value : null
}

function isPlaceholderCatalogueTitle(value: unknown) {
  const title = normalizeAssistantText(value)
  return title === 'some opportunity' ||
    title === 'item something' ||
    title.startsWith('test ') ||
    title.startsWith('e2e ')
}

function rankAssistantResult(
  result: { kind: string; title: string; summary?: string | null; meta?: string | null },
  terms: string[],
  intent: string | null
) {
  const title = normalizeAssistantText(result.title)
  const supportingText = normalizeAssistantText(`${result.summary ?? ''} ${result.meta ?? ''}`)
  const termScore = terms.reduce((score, term) => (
    score + (title.includes(term) ? 6 : 0) + (supportingText.includes(term) ? 2 : 0)
  ), 0)
  const intentScore = intent && (
    result.kind === intent ||
    (intent === 'resource' && result.kind === 'resource') ||
    (intent === 'product' && result.kind === 'product')
  ) ? 12 : 0
  return termScore + intentScore
}

function mapOpportunity(opportunity: Record<string, any>) {
  const splash = opportunity.opportunitySplash && typeof opportunity.opportunitySplash === 'object'
    ? opportunity.opportunitySplash
    : {}

  return {
    id: opportunity.id,
    section: 'gigs',
    title: opportunity.title,
    description: opportunity.description ?? opportunity.summary,
    org: opportunity.companyName ?? opportunity.company?.name,
    meta: `${String(opportunity.category || opportunity.opportunityType || 'opportunity').toLowerCase()} · ${String(opportunity.engagementMode || opportunity.mode || 'remote').toLowerCase()}`,
    value: formatKes(opportunity.budgetAmount ?? 0),
    thumbnail: splash.url ?? splash.previewUrl,
    image: splash.url ?? splash.previewUrl,
    companyLogo: opportunity.company?.logoUrl ?? null,
    tags: opportunity.skills ?? [],
    href: `/campus/opportunities?opportunity=${opportunity.id}`,
    actionLabel: 'View opportunity',
    recommendationReason: opportunity.progressionMatch?.reason,
    progressionMatchScore: opportunity.progressionMatch?.score
  }
}

function contentDate(value: unknown) {
  const date = new Date(String(value || ''))
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-KE', { day: 'numeric', month: 'short' }).format(date)
}

function contentTitle(value: unknown, fallback: string) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  if (!text) return fallback
  return text.length > 64 ? `${text.slice(0, 61).trimEnd()}…` : text
}

function connectTags(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map((tag) => typeof tag === 'string' ? tag : tag?.label).filter(Boolean)
}

function mapConnectPost(post: Record<string, any>) {
  const creator = post.creator && typeof post.creator === 'object' ? post.creator : {}
  const event = post.event && typeof post.event === 'object' ? post.event : {}
  const media = Array.isArray(post.mediaUrls) ? post.mediaUrls.filter(Boolean) : []
  const reactionCount = Number(post.reactionCount || 0)
  const commentCount = Number(post.commentCount || 0)
  const type = String(post.type || 'post').toLowerCase()
  const typeLabel = type === 'image' ? 'Photo' : type === 'video' ? 'Video' : type === 'poll' ? 'Poll' : type === 'event' ? 'Event' : type === 'feeling' ? 'Check-in' : 'Post'

  return {
    id: post.id,
    section: 'posts',
    title: contentTitle(event.title || post.title || post.body, 'Campus update'),
    description: String(post.body || ''),
    org: creator.name || 'Zumbarl community',
    avatar: creator.avatarUrl || null,
    meta: [typeLabel, contentDate(post.createdAt)].filter(Boolean).join(' · '),
    value: `${reactionCount} ${reactionCount === 1 ? 'reaction' : 'reactions'} · ${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}`,
    thumbnail: media[0] || event.thumbnailUrl || null,
    image: media[0] || event.thumbnailUrl || null,
    thumbnails: media,
    tags: connectTags(post.tags),
    href: `/campus/explore?post=${encodeURIComponent(String(post.id))}`,
    actionLabel: 'Read post'
  }
}

function mapLegacyCampusPost(post: Record<string, any>) {
  const image = post.mediaUrls?.[0]
  return {
    id: post.id,
    section: 'posts',
    title: post.title ?? 'Campus post',
    description: post.body,
    org: post.student ? `${post.student.firstName} ${post.student.lastName}`.trim() : post.campus?.name,
    meta: post.postType,
    value: `${post.likeCount ?? 0} likes`,
    thumbnail: image,
    image,
    thumbnails: post.mediaUrls ?? [],
    tags: post.tags ?? [],
    href: `/campus/explore?post=${encodeURIComponent(String(post.id))}`,
    actionLabel: 'Read post'
  }
}

function mapLegacyStudentStory(story: Record<string, any>) {
  return {
    id: story.id,
    section: 'stories',
    title: story.title,
    description: story.caption,
    org: story.student ? `${story.student.firstName} ${story.student.lastName}`.trim() : story.campus?.name,
    meta: story.mediaType,
    value: `${story.viewCount ?? 0} views`,
    thumbnail: story.thumbnailUrl ?? story.mediaUrl,
    image: story.mediaUrl,
    thumbnails: [story.thumbnailUrl ?? story.mediaUrl],
    href: `/campus/explore?story=${encodeURIComponent(String(story.id))}`,
    actionLabel: 'View story'
  }
}

function mapMarketplaceListing(listing: Record<string, any>) {
  const image = listing.images?.[0] ?? listing.shop?.coverImageUrl
  return {
    id: listing.id,
    section: listing.listingType === 'SERVICE' ? 'services' : 'marketplace',
    title: listing.title,
    description: listing.description,
    org: listing.shop?.name ?? `${listing.seller?.firstName ?? 'Student'} shop`,
    meta: `${listing.category} · ${listing.listingType.toLowerCase()}`,
    value: formatKes(listing.priceAmount ?? 0),
    priceAmount: listing.priceAmount,
    currency: listing.currency,
    condition: listing.condition,
    listingType: listing.listingType,
    status: listing.status,
    stock: listing.stockCount,
    stockCount: listing.stockCount,
    images: listing.images,
    gallery: listing.images,
    deliveryOptions: listing.deliveryOptions,
    variants: listing.variants,
    thumbnail: image,
    image,
    thumbnails: listing.images?.length ? listing.images : [image],
    tags: [listing.category, ...(listing.deliveryOptions ?? [])],
    href: `/campus/opportunities/buy-sell/${listing.id}`,
    actionLabel: listing.listingType === 'SERVICE' ? 'Book service' : 'View item',
    shop: listing.shop ? {
      id: listing.shop.id,
      name: listing.shop.name,
      slug: listing.shop.slug,
      tagline: listing.shop.tagline,
      ratingAverage: listing.shop.ratingAverage,
      orderCount: listing.shop.orderCount
    } : null
  }
}

function mapCampusEvent(event: Record<string, any>) {
  return {
    id: event.id,
    section: 'events',
    title: event.title,
    description: event.description,
    org: event.organizerName,
    meta: event.startsAt instanceof Date ? event.startsAt.toISOString() : event.startsAt,
    value: event.priceAmount ? formatKes(event.priceAmount) : 'Free',
    thumbnail: event.coverImageUrl,
    image: event.coverImageUrl,
    tags: event.tags ?? [],
    href: '/campus/explore',
    actionLabel: 'View event',
    attendeeCount: event._count?.rsvps ?? 0,
    isGoing: event.rsvps?.some((rsvp: Record<string, any>) => rsvp.status === 'GOING') ?? false,
    isInterested: event.rsvps?.some((rsvp: Record<string, any>) => rsvp.status === 'INTERESTED') ?? false
  }
}

function mapCareerRoadmap(roadmap: Record<string, any>) {
  return {
    id: roadmap.id,
    section: 'roadmaps',
    title: roadmap.title,
    description: roadmap.description,
    org: roadmap.campus?.name ?? 'Zumbarl',
    meta: `${roadmap.level.toLowerCase()} · ${roadmap.estimatedWeeks} weeks`,
    value: roadmap.careerFamily,
    thumbnail: roadmap.coverImageUrl,
    image: roadmap.coverImageUrl,
    tags: roadmap.skills ?? [],
    href: `/campus/learn?view=path&roadmap=${encodeURIComponent(String(roadmap.id))}`,
    actionLabel: 'Open roadmap'
  }
}

class CampusExperienceRepository {
  async updateProfile(studentId: string | undefined, payload: Record<string, any>) {
    if (!studentId) return null
    return prisma.$transaction(async (tx) => {
      const existing = await tx.studentProfile.findUnique({ where: { id: studentId } })
      if (!existing) return null
      let course = null
      if (payload.course?.id) course = await tx.course.findUniqueOrThrow({ where: { id: payload.course.id } })
      else if (payload.course?.name) {
        course = (await tx.course.findMany()).find((item) => canonicalCourseKey(item.name) === canonicalCourseKey(payload.course.name))
          || await tx.course.create({ data: { name: payload.course.name, category: payload.course.category, duration: Number(payload.course.duration) } })
      }
      await tx.studentProfile.update({
        where: { id: studentId },
        data: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          locationCity: payload.location,
          careerPath: payload.careerPath || null,
          bio: payload.bio || null,
          avatarUrl: payload.avatarUrl || null,
          ...(course ? { courseId: course.id, courseDuration: course.duration } : {}),
          ...((course || payload.yearJoined !== undefined) ? { expectedGraduation: new Date(`${Number(payload.yearJoined || existing.yearJoined) + (course?.duration || existing.courseDuration)}-12-31T00:00:00.000Z`) } : {}),
          ...(payload.yearJoined !== undefined
            ? {
                yearJoined: Number(payload.yearJoined)
              }
            : {}),
          ...(payload.showZumbarlPoints !== undefined
            ? { showZumbarlPoints: payload.showZumbarlPoints }
            : {})
        }
      })
      if (payload.username) await tx.user.update({ where: { id: existing.userId }, data: { username: payload.username } })
      const requestedSkills: string[] = Array.isArray(payload.skills) ? payload.skills.map((skill: unknown) => String(skill).trim()).filter(Boolean) : []
      const catalogSkills = await tx.skill.findMany({ where: { status: { not: 'archived' } }, select: { name: true } })
      const catalogNameByKey = new Map(catalogSkills.map((skill) => [canonicalSkillKey(skill.name), skill.name]))
      const requestedNameByKey = new Map(requestedSkills.map((name) => [canonicalSkillKey(name), name]))
      const skills: string[] = [...requestedNameByKey.entries()].slice(0, 12).map(([key, name]) => catalogNameByKey.get(key) || name)
      await tx.skillLevel_.deleteMany({ where: { studentId, verifiedByGigs: 0, skillName: { notIn: skills } } })
      for (const skillName of skills) {
        await tx.skillLevel_.upsert({
          where: { studentId_skillName: { studentId, skillName } },
          update: {},
          create: { studentId, skillName, level: 'BEGINNER' }
        })
      }
      const updated = await tx.studentProfile.findUnique({
        where: { id: studentId },
        include: {
          campus: { include: { managedProfile: { select: { id: true, type: true, name: true, slug: true, status: true } } } },
          course: true,
          user: true,
          skillLevels: true
        }
      })
      return toProfileHeader(updated)
    })
  }

  async readStudentKyc(studentId: string | undefined, userId: string | undefined) {
    if (!studentId || !userId) return null
    return prisma.studentProfile.findFirst({
      where: { id: studentId, userId },
      select: {
        id: true,
        kycStatus: true,
        kycVerifiedAt: true,
        studentIdNumber: true,
        user: { select: { name: true, email: true, phone: true, username: true } },
        kycDocuments: { orderBy: { createdAt: 'desc' } }
      }
    })
  }

  async submitStudentKycDocument(studentId: string | undefined, userId: string | undefined, payload: Record<string, any>) {
    if (!studentId || !userId) return null
    const [student, upload] = await Promise.all([
      prisma.studentProfile.findFirst({ where: { id: studentId, userId }, select: { id: true } }),
      prisma.uploadedFile.findFirst({
        where: {
          id: payload.uploadId,
          ownerId: userId,
          status: 'complete',
          bucket: 'zumbarl-kyc-private',
          scope: `kyc-${String(payload.documentType).toLowerCase()}`,
          mimeType: { in: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] },
          sizeBytes: { lte: 10 * 1024 * 1024 }
        }
      })
    ])
    if (!student || !upload) return null

    return prisma.$transaction(async (tx) => {
      await tx.kycDocument.updateMany({
        where: { studentId, documentType: payload.documentType, status: { not: 'EXPIRED' } },
        data: { status: 'EXPIRED' }
      })
      const document = await tx.kycDocument.create({
        data: {
          studentId,
          documentType: payload.documentType,
          fileUrl: upload.url,
          fileKey: upload.storageKey,
          status: 'PENDING'
        }
      })
      await tx.studentProfile.update({
        where: { id: studentId },
        data: { kycStatus: 'UNDER_REVIEW', kycVerifiedAt: null }
      })
      return document
    })
  }
  async listNotifications(userId?: string) {
    if (!userId) return { data: [], unreadCount: 0 }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.notification.count({
        where: { userId, isRead: false }
      })
    ])

    return {
      data: notifications.map((notification) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        isRead: notification.isRead,
        sentVia: notification.sentVia,
        createdAt: notification.createdAt.toISOString()
      })),
      unreadCount
    }
  }

  async markNotificationRead(userId: string | undefined, notificationId: string) {
    if (!userId) return null

    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId }
    })
    if (!notification) return null

    return prisma.notification.update({
      where: { id: notification.id },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })
  }

  async markAllNotificationsRead(userId?: string) {
    if (!userId) return { count: 0 }

    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })
  }

  async readHomeExperience(studentId?: string) {
    const student = studentId ? await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        campus: true,
        course: true,
        zumbarl: true,
        skillLevels: true,
        wallets: { orderBy: { createdAt: 'asc' } },
        roadmapEnrollments: true,
        pipelineRelationships: true,
        portfolioItems: true
      }
    }) : null
    const campusWhere = student?.campusId ? { OR: [{ campusId: student.campusId }, { campusId: null }] } : {}
    const [items, opportunities, listings, events, livePostFeed, roadmaps] = await Promise.all([
      prisma.campusContentItem.findMany({
        where: {
          scope: 'campus_home',
          isActive: true,
          OR: [
            { studentId: null },
            ...(studentId ? [{ studentId }] : []),
            ...(student?.campusId ? [{ campusId: student.campusId }] : [])
          ]
        },
        orderBy: [{ section: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }]
      }),
      prisma.opportunity.findMany({
        where: {
          status: { in: OPPORTUNITY_APPLICABLE_STATUSES },
          visibility: 'public',
          publishedAt: { not: null },
          isSeed: false
        },
        include: { company: true },
        orderBy: { createdAt: 'desc' },
        take: 18
      }),
      prisma.marketplaceListing.findMany({
        where: { status: 'ACTIVE', ...campusWhere },
        include: { shop: true, seller: true },
        orderBy: { createdAt: 'desc' },
        take: 8
      }),
      prisma.campusEvent.findMany({
        where: {
          id: { notIn: ['event-creative-career-day'] },
          status: 'PUBLISHED',
          startsAt: { gte: new Date() },
          ...campusWhere
        },
        include: {
          _count: { select: { rsvps: { where: { status: { in: ['GOING', 'ATTENDED'] } } } } },
          ...(studentId ? { rsvps: { where: { studentId, status: { in: ['GOING', 'INTERESTED'] } } } } : {})
        },
        orderBy: { startsAt: 'asc' },
        take: 6
      }),
      connectCommunityRepository.listFeed({ pageSize: 12 }, studentId),
      prisma.careerRoadmap.findMany({
        where: { status: 'PUBLISHED', ...campusWhere },
        include: { campus: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        take: 6
      })
    ])
    const grouped = groupContentSections(items)
    const marketplaceItems = listings
      .filter((listing) => listing.listingType !== 'SERVICE' && !isPlaceholderCatalogueTitle(listing.title))
      .map(mapMarketplaceListing)
    const serviceItems = listings
      .filter((listing) => listing.listingType === 'SERVICE' && !isPlaceholderCatalogueTitle(listing.title))
      .map(mapMarketplaceListing)
    const eligibleOpportunities = opportunities.filter((opportunity) => !isPlaceholderCatalogueTitle(opportunity.title))
    const rankedOpportunities = student
      ? rankOpportunitiesForStudentMode(eligibleOpportunities, {
          mode: student.currentMode,
          skills: student.skillLevels.map((skill) => skill.skillName),
          careerPath: student.careerPath
        }).slice(0, 6)
      : eligibleOpportunities.slice(0, 6)
    const mappedOpportunities = rankedOpportunities.map(mapOpportunity)
    const mappedRoadmaps = roadmaps.map(mapCareerRoadmap)
    const assistantConfig = grouped.get('assistant')?.[0] ?? {}
    const score = student?.zumbarl
    const mainWallet = student?.wallets.find((wallet) => wallet.type === 'MAIN') ?? student?.wallets[0]
    const currentYear = new Date().getFullYear()
    const yearOfStudy = student ? Math.max(currentYear - student.yearJoined + 1, 1) : null
    const mappedEvents = events.map(mapCampusEvent)
    const currentRoadmapEnrollment = student?.roadmapEnrollments[0]
    const currentRoadmapProgress = Math.round(currentRoadmapEnrollment?.progressPercent ?? 0)
    const livePosts = (livePostFeed?.data ?? [])
      .filter((post: Record<string, any>) => !post.seedKey)
      .slice(0, 6)
      .map(mapConnectPost)
    const quickActions = (grouped.get('quick_actions') ?? []).map((action) => ({
      ...action,
      href: ['/campus/events', '/campus/community'].includes(String(action.href))
        ? '/campus/explore'
        : action.href
    }))
    const liveDiscovery = [
      ...mappedOpportunities.slice(0, 2),
      ...marketplaceItems.slice(0, 2),
      ...serviceItems.slice(0, 1),
      ...mappedEvents.slice(0, 2),
      ...mappedRoadmaps.slice(0, 1)
    ]
    return {
      viewer: student ? {
        name: `${student.firstName} ${student.lastName}`.trim(),
        firstName: student.firstName,
        campus: student.campus?.name,
        course: student.careerPath ?? student.course?.name,
        yearOfStudy,
        city: student.locationCity
      } : null,
      hero: grouped.get('hero')?.[0] ?? null,
      quickActions,
      recommendationSections: [
        { id: 'posts', title: 'Posts', subtitle: 'Campus ideas, questions and showcases', items: livePosts },
        { id: 'gigs', title: 'Recommended for you', subtitle: 'Gigs and paid work matched to your campus activity', items: mappedOpportunities },
        { id: 'marketplace', title: 'Marketplace picks', subtitle: 'Student shops, products and useful campus items', items: marketplaceItems },
        { id: 'communities', title: 'Communities', subtitle: 'Groups and chamas you may want to join', items: grouped.get('communities') ?? [] },
        { id: 'events', title: 'Events', subtitle: 'Campus activity worth showing up for', items: mappedEvents },
        { id: 'roadmaps', title: 'Career roadmaps', subtitle: 'Skill paths that connect learning to portfolio proof', items: mappedRoadmaps },
        { id: 'services', title: 'Services', subtitle: 'Student services available near you', items: serviceItems }
      ],
      trustPoints: grouped.get('trust') ?? [],
      discoveryLibrary: liveDiscovery,
      assistant: assistantConfig,
      rail: student ? {
        wallet: {
          balance: mainWallet?.balance ?? 0,
          pendingBalance: mainWallet?.pendingBalance ?? 0,
          currency: mainWallet?.currency ?? 'KES',
          type: mainWallet?.type ?? 'MAIN'
        },
        portfolio: {
          meta: [student.campus?.name, yearOfStudy ? `Year ${yearOfStudy}` : null, student.careerPath ?? student.course?.name].filter(Boolean).join(' · '),
          stats: [
            {
              label: 'Buzz',
              value: score?.confidence === 'PROVISIONAL' ? 'Provisional' : Math.round(score?.currentScore ?? 0),
              detail: score?.confidence === 'PROVISIONAL' ? 'Building confidence' : score?.tier ?? 'BRONZE',
              trend: score?.confidence === 'PROVISIONAL'
                ? `${Number(score?.effectiveEngagements ?? 0).toFixed(1)} of 3 effective engagements`
                : score?.trendDirection === 'UP'
                  ? 'Trending up'
                  : score?.trendDirection === 'DOWN'
                    ? 'Needs attention'
                    : 'Steady'
            },
            { label: 'Gigs Completed', value: score?.totalGigsCompleted ?? 0, detail: `${score?.endorsementCount ?? 0} endorsements`, trend: `${student.portfolioItems.length} portfolio pieces` }
          ],
          groups: [
            { name: 'Quality score', value: `${Math.round(score?.qualityScore ?? 0)} / 100`, progress: Math.round(score?.qualityScore ?? 0) },
            { name: 'Average rating', value: score?.avgRating ? `${score.avgRating.toFixed(1)} / 5` : 'Not rated', progress: Math.round((score?.avgRating ?? 0) * 20) },
            { name: 'Delivery rate', value: `${Math.round(score?.deliveryRate ?? 0)}%`, progress: Math.round(score?.deliveryRate ?? 0) }
          ]
        },
        events: mappedEvents.slice(0, 3).map((event) => ({
          ...event,
          time: formatEventDate(new Date(event.meta)),
          attendees: event.attendeeCount
        })),
        learning: {
          title: !currentRoadmapEnrollment
            ? 'Explore career roadmaps'
            : currentRoadmapProgress >= 100 || currentRoadmapEnrollment.status === 'COMPLETED'
              ? 'Roadmap completed'
              : currentRoadmapEnrollment.status === 'IN_PROGRESS'
                ? 'Roadmap in progress'
                : 'Continue your roadmap',
          detail: currentRoadmapEnrollment ? `${currentRoadmapProgress}% complete` : 'Build verified skills'
        }
      } : null
    }
  }

  async readProfileExperience(studentId?: string, options: { includePrivatePortfolio?: boolean } = {}) {
    const includePrivatePortfolio = options.includePrivatePortfolio === true
    const profileReference = String(studentId || '').trim().replace(/^@/, '')
    const student = await prisma.studentProfile.findFirst({
      where: studentId ? {
        OR: [
          { id: studentId },
          { user: { username: { equals: profileReference, mode: 'insensitive' } } },
          { user: { email: { startsWith: `${profileReference}@`, mode: 'insensitive' } } }
        ]
      } : undefined,
      orderBy: { createdAt: 'asc' },
      include: {
        user: true,
        campus: { include: { managedProfile: { select: { id: true, type: true, name: true, slug: true, status: true } } } },
        course: true,
        zumbarl: true,
        skillLevels: true,
        portfolioItems: {
          where: includePrivatePortfolio
            ? { status: { not: 'ARCHIVED' } }
            : { status: 'PUBLISHED', isPublic: true },
          orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }]
        },
        endorsementsReceived: { include: { company: true }, orderBy: { createdAt: 'desc' } },
        achievements: { orderBy: { earnedAt: 'desc' } },
        certificates: { orderBy: { issuedAt: 'desc' } },
        pipelineRelationships: { include: { company: true }, orderBy: { updatedAt: 'desc' } }
      }
    })
    if (!student) return null

    const portfolioOpportunityIds = student.portfolioItems.flatMap((item) => item.opportunityId ? [item.opportunityId] : [])

    const [profileListings, profilePosts, profileStories, profileRoadmaps, walletTransactions, followerCount, followingCount, campusPostTotals, connectPosts, portfolioRatings, portfolioSkills, portfolioOpportunities] = await Promise.all([
      prisma.marketplaceListing.findMany({
        where: { sellerId: student.id, status: 'ACTIVE' },
        include: { shop: true, seller: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.campusPost.findMany({
        where: { studentId: student.id, status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        take: 5
      }),
      prisma.studentStory.findMany({
        where: { studentId: student.id, status: 'ACTIVE' },
        orderBy: { publishedAt: 'desc' },
        take: 5
      }),
      prisma.studentRoadmapEnrollment.findMany({
        where: { studentId: student.id },
        include: { roadmap: true },
        orderBy: { updatedAt: 'desc' },
        take: 5
      }),
      prisma.transaction.findMany({
        where: { wallet: { studentId: student.id }, status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        take: 6
      }),
      prisma.connectRelationship.count({
        where: { targetStudentId: student.id, type: 'follow' }
      }),
      prisma.connectRelationship.count({
        where: { actorStudentId: student.id, type: 'follow' }
      }),
      prisma.campusPost.aggregate({
        where: { studentId: student.id, status: 'PUBLISHED' },
        _count: { _all: true },
        _sum: { likeCount: true }
      }),
      prisma.connectPost.findMany({
        where: { studentId: student.id, status: { not: 'removed' }, type: { not: 'reshare' } },
        select: { reactions: true }
      }),
      portfolioOpportunityIds.length ? prisma.opportunityRating.findMany({
        where: { studentId: student.id, opportunityId: { in: portfolioOpportunityIds } }
      }) : [],
      portfolioOpportunityIds.length ? prisma.opportunitySkill.findMany({
        where: { opportunityId: { in: portfolioOpportunityIds } },
        include: { skill: true }
      }) : [],
      portfolioOpportunityIds.length ? prisma.opportunity.findMany({
        where: { id: { in: portfolioOpportunityIds } },
        select: { id: true, company: { select: { logoUrl: true } } }
      }) : []
    ])
    const score = student.zumbarl
    const endorsements = student.endorsementsReceived.map((endorsement) => ({
      id: endorsement.id,
      company: endorsement.company.name,
      companyLogoUrl: endorsement.company.logoUrl,
      author: endorsement.endorsedByName,
      role: endorsement.endorsedByTitle,
      note: endorsement.note,
      value: `+${endorsement.currencyAwarded} EC`,
      date: endorsement.createdAt.toISOString()
    }))
    const connectPostLikes = connectPosts.reduce(
      (total, post) => total + Object.keys(jsonObject(post.reactions)).length,
      0
    )
    const portfolioRatingByOpportunityId = new Map(portfolioRatings.map((rating) => [rating.opportunityId, rating]))
    const portfolioCompanyLogoByOpportunityId = new Map(portfolioOpportunities.map((opportunity) => [opportunity.id, opportunity.company?.logoUrl]))
    const portfolioSkillsByOpportunityId = new Map<string, typeof portfolioSkills>()
    portfolioSkills.forEach((link) => portfolioSkillsByOpportunityId.set(
      link.opportunityId,
      [...(portfolioSkillsByOpportunityId.get(link.opportunityId) || []), link]
    ))

    return {
      header: toProfileHeader(student),
      socialStats: {
        followers: followerCount,
        following: followingCount,
        likes: Number(campusPostTotals._sum.likeCount || 0) + connectPostLikes,
        posts: campusPostTotals._count._all + connectPosts.length
      },
      metrics: [
        {
          label: 'Zumbarl Score',
          value: score?.confidence === 'PROVISIONAL' ? 'Provisional' : score?.currentScore ? Math.round(score.currentScore) : 0,
          meta: score?.confidence === 'PROVISIONAL'
            ? `${Number(score?.effectiveEngagements ?? 0).toFixed(1)} effective engagements`
            : score?.tier ?? 'BRONZE'
        },
        { label: 'Gigs Completed', value: score?.totalGigsCompleted ?? 0, meta: `${score?.endorsementCount ?? 0} endorsements` },
        { label: 'Delivery Rate', value: `${Math.round(score?.deliveryRate ?? 0)}%`, meta: 'on-time delivery' },
        { label: 'Avg. Rating', value: score?.avgRating ? `${score.avgRating.toFixed(1)}/5` : 'Pending', meta: 'from reviews' },
        { label: 'Repeat Clients', value: Math.round(score?.repeatClientRate ?? 0), meta: 'repeat signal' }
      ],
      score,
      skills: uniqueSkillLevels(student.skillLevels).map((skill) => ({
        id: skill.id,
        name: skill.skillName,
        level: skill.level,
        category: 'General',
        verifiedByGigs: skill.verifiedByGigs
      })),
      portfolioItems: student.portfolioItems.map((item) => ({
        ...(portfolioRatingByOpportunityId.get(item.opportunityId || '') ? {
          projectScores: [
            { label: 'Communication', score: portfolioRatingByOpportunityId.get(item.opportunityId || '')!.communicationScore },
            { label: 'Time Management', score: portfolioRatingByOpportunityId.get(item.opportunityId || '')!.timeManagementScore },
            { label: 'Skills & Technical Ability', score: portfolioRatingByOpportunityId.get(item.opportunityId || '')!.skillsScore },
            { label: 'Delivery Quality', score: portfolioRatingByOpportunityId.get(item.opportunityId || '')!.deliveryQualityScore },
            { label: 'Creativity & Innovation', score: portfolioRatingByOpportunityId.get(item.opportunityId || '')!.creativityScore },
            { label: 'Professionalism', score: portfolioRatingByOpportunityId.get(item.opportunityId || '')!.professionalismScore }
          ]
        } : {}),
        id: item.id,
        opportunityId: item.opportunityId,
        projectId: item.projectId,
        title: item.title,
        description: item.description,
        filter: item.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category: item.category,
        client: item.showClientName || includePrivatePortfolio ? item.companyName : 'Client private',
        companyLogoUrl: item.showClientName || includePrivatePortfolio
          ? portfolioCompanyLogoByOpportunityId.get(item.opportunityId || '')
          : null,
        clientName: includePrivatePortfolio ? item.companyName : undefined,
        showClientName: item.showClientName,
        image: item.thumbnailUrl,
        thumbnailUrl: item.thumbnailUrl,
        fileUrls: item.fileUrls,
        sourceFileUrls: includePrivatePortfolio ? item.sourceFileUrls : undefined,
        rating: portfolioRatingByOpportunityId.get(item.opportunityId || '')
          ? `${portfolioRatingByOpportunityId.get(item.opportunityId || '')!.overallScore.toFixed(1)}/5`
          : item.metricsVerified ? 'Verified' : 'Pending verification',
        ratingValue: portfolioRatingByOpportunityId.get(item.opportunityId || '')?.overallScore ?? null,
        impactMetrics: item.impactMetrics,
        clientFeedback: item.clientFeedback,
        skillsDeveloped: (portfolioSkillsByOpportunityId.get(item.opportunityId || '') || []).map((link) => ({
          name: link.skill.name,
          level: student.skillLevels.find((level) => canonicalSkillKey(level.skillName) === canonicalSkillKey(link.skill.name))?.level || 'BEGINNER'
        })),
        featured: item.isFeatured,
        isPublic: item.isPublic,
        status: item.status,
        publishedAt: item.publishedAt,
        sharedPostId: item.sharedPostId,
        date: (item.publishedAt || item.createdAt).toISOString()
      })),
      services: profileListings.filter((listing) => listing.listingType === 'SERVICE').map(mapMarketplaceListing),
      shopProducts: profileListings.filter((listing) => listing.listingType !== 'SERVICE').map(mapMarketplaceListing),
      shops: profileListings
        .map((listing) => listing.shop)
        .filter((shop, index, shops) => shop && shops.findIndex((item) => item?.id === shop.id) === index),
      endorsements,
      achievements: student.achievements,
      certificates: student.certificates,
      relationships: student.pipelineRelationships.map((relationship) => ({
        id: relationship.id,
        company: relationship.company.name,
        companyLogoUrl: relationship.company.logoUrl,
        gigs: relationship.gigsCompleted,
        status: relationship.status,
        targetRole: relationship.targetRole
      })),
      recentActivity: [
        ...profileStories.map(mapLegacyStudentStory),
        ...profilePosts.map(mapLegacyCampusPost),
        ...profileRoadmaps.map((enrollment) => ({
          id: enrollment.id,
          section: 'roadmap-progress',
          title: enrollment.roadmap.title,
          description: `${Math.round(enrollment.progressPercent)}% complete`,
          meta: enrollment.status,
          value: enrollment.roadmap.careerFamily,
          thumbnail: enrollment.roadmap.coverImageUrl
        }))
      ],
      earningsSummary: walletTransactions.map((transaction) => ({
        id: transaction.id,
        title: transaction.description ?? transaction.type,
        value: formatKes(transaction.amount),
        meta: transaction.createdAt.toISOString()
      }))
    }
  }

  /**
   * Deep system search across the live catalogue — gigs, marketplace products
   * and services, people, events, and study resources — scoped to the query.
   * Returns a flat, normalized list of result cards ranked by relevance.
   */
  async searchSystem(rawQuery: string, studentId?: string) {
    const query = rawQuery.trim().slice(0, 200)
    if (!query) return []

    const terms = assistantSearchTerms(query)
    const intent = assistantIntent(query)
    const budgetCeiling = assistantBudgetCeiling(query)
    const student = studentId
      ? await prisma.studentProfile.findUnique({ where: { id: studentId }, select: { campusId: true } })
      : null
    const campusScope = student?.campusId
      ? { OR: [{ campusId: student.campusId }, { campusId: null }] }
      : {}

    const [gigs, listings, people, events, resources] = await Promise.all([
      prisma.opportunity.findMany({
        where: {
          status: { in: OPPORTUNITY_APPLICABLE_STATUSES },
          visibility: 'public',
          publishedAt: { not: null }
        },
        include: { company: true },
        orderBy: { createdAt: 'desc' },
        take: 30
      }),
      prisma.marketplaceListing.findMany({
        where: {
          status: 'ACTIVE',
          ...campusScope
        },
        include: { seller: true, shop: true },
        orderBy: { createdAt: 'desc' },
        take: 30
      }),
      prisma.studentProfile.findMany({
        where: {
          isOpenToHire: true
        },
        include: { campus: true, course: true },
        orderBy: { updatedAt: 'desc' },
        take: 30
      }),
      prisma.campusEvent.findMany({
        where: {
          status: 'PUBLISHED',
          startsAt: { gte: new Date() },
          ...campusScope
        },
        orderBy: { startsAt: 'asc' },
        take: 30
      }),
      prisma.campusContentItem.findMany({
        where: {
          isActive: true,
          section: { in: ['discovery', 'resources', 'learning', 'roadmaps'] }
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        take: 30
      })
    ])

    const results: Array<{
      id: string
      kind: string
      title: string
      summary: string | null
      meta: string | null
      href: string | null
      priceAmount?: number
      relevance?: number
    }> = [
      ...gigs.map((gig) => ({
        id: gig.id,
        kind: 'gig',
        title: gig.title,
        summary: gig.summary ?? gig.description,
        meta: [gig.company?.name, gig.budgetLabel ?? (gig.budgetAmount ? `${gig.currency} ${gig.budgetAmount.toLocaleString()}` : null)].filter(Boolean).join(' · ') || null,
        href: `/campus/opportunities?opportunity=${gig.id}`
      })),
      ...listings.map((listing) => ({
        id: listing.id,
        kind: listing.listingType === 'SERVICE' ? 'service' : 'product',
        title: listing.title,
        summary: listing.description,
        meta: [listing.shop?.name, `${listing.currency} ${listing.priceAmount.toLocaleString()}`, listing.locationLabel].filter(Boolean).join(' · ') || null,
        href: `/campus/opportunities/buy-sell/${listing.id}`,
        priceAmount: listing.priceAmount
      })),
      ...people.map((person) => ({
        id: person.id,
        kind: 'person',
        title: `${person.firstName} ${person.lastName}`.trim(),
        summary: person.bio ?? person.careerPath ?? null,
        meta: [person.careerPath ?? person.course?.name, person.campus?.name].filter(Boolean).join(' · ') || null,
        href: `/campus/profiles/${person.id}`
      })),
      ...events.map((event) => ({
        id: event.id,
        kind: 'event',
        title: event.title,
        summary: event.description,
        meta: [event.locationName, formatEventDate(event.startsAt)].filter(Boolean).join(' · ') || null,
        href: '/campus/explore'
      })),
      ...resources
        .filter((item) => {
          const resourceTerms = ['book', 'books', 'learn', 'notes', 'revision', 'study', 'tutor']
          return item.tags.some((tag) => resourceTerms.includes(normalizeAssistantText(tag))) || normalizeAssistantText(item.meta) === 'book'
        })
        .map((item) => ({
        id: item.id,
        kind: 'resource',
        title: item.title,
        summary: item.description ?? item.subtitle ?? null,
        meta: item.org ?? item.meta ?? null,
        href: item.href === '/campus/finance' ? '/campus/profile?tab=Activity' : item.href ?? '/campus/learn'
      }))
    ]

    const seenResults = new Set<string>()
    return results
      .map((result) => ({
        ...result,
        relevance: rankAssistantResult(result, terms, intent)
      }))
      .filter((result) => {
        const matchesIntent = !intent || result.kind === intent || (intent === 'resource' && result.kind === 'product')
        return result.relevance > 0 && matchesIntent
      })
      .filter((result) => (
        budgetCeiling === null ||
        result.kind !== 'product' ||
        result.priceAmount === undefined ||
        result.priceAmount <= budgetCeiling
      ))
      .filter((result) => !isPlaceholderCatalogueTitle(result.title))
      .sort((left, right) => (right.relevance ?? 0) - (left.relevance ?? 0))
      .filter((result) => {
        const key = `${result.kind}:${normalizeAssistantText(result.title)}`
        if (seenResults.has(key)) return false
        seenResults.add(key)
        return true
      })
      .slice(0, 8)
      .map(({ relevance: _relevance, priceAmount: _priceAmount, ...result }) => result)
  }
}

const campusExperienceRepository = new CampusExperienceRepository()

export {
  CampusExperienceRepository,
  campusExperienceRepository
}
