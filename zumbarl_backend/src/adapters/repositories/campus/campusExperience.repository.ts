import { prisma } from '../../../lib/prisma.js'
import { OPPORTUNITY_APPLICABLE_STATUSES } from '../../../shared/opportunities/opportunityLifecycle.js'

function toProfileHeader(student: Record<string, any> | null) {
  if (!student) return null
  return {
    id: student.id,
    userId: student.userId,
    name: `${student.firstName} ${student.lastName}`.trim(),
    firstName: student.firstName,
    lastName: student.lastName,
    role: 'Student',
    headline: `${student.campus?.name ?? 'Campus'} · Year ${Math.max(new Date().getFullYear() - student.yearJoined + 1, 1)} · ${student.careerPath ?? student.course?.name ?? 'Student'}`,
    location: student.locationCity,
    careerPath: student.careerPath,
    handle: student.user?.username
      ? `@${student.user.username}`
      : student.user?.email
        ? `@${student.user.email.split('@')[0].replace(/[^a-z0-9_]/gi, '_')}`
        : '@student',
    avatar: student.avatarUrl,
    bio: student.bio,
    tags: student.skillLevels?.slice(0, 4).map((skill: Record<string, any>) => skill.skillName) ?? []
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
    tags: opportunity.skills ?? [],
    href: `/campus/opportunities?opportunity=${opportunity.id}`,
    actionLabel: 'View opportunity'
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

function mapCampusPost(post: Record<string, any>) {
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
    href: '/campus/explore',
    actionLabel: 'Read post'
  }
}

function mapStudentStory(story: Record<string, any>) {
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
    href: '/campus/explore',
    actionLabel: 'View story'
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
    href: '/campus/learn',
    actionLabel: 'Open roadmap'
  }
}

class CampusExperienceRepository {
  async updateProfile(studentId: string | undefined, payload: Record<string, any>) {
    if (!studentId) return null
    return prisma.$transaction(async (tx) => {
      const existing = await tx.studentProfile.findUnique({ where: { id: studentId } })
      if (!existing) return null
      await tx.studentProfile.update({
        where: { id: studentId },
        data: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          locationCity: payload.location,
          careerPath: payload.careerPath || null,
          bio: payload.bio || null,
          avatarUrl: payload.avatarUrl || null
        }
      })
      if (payload.username) await tx.user.update({ where: { id: existing.userId }, data: { username: payload.username } })
      const requestedSkills: string[] = Array.isArray(payload.skills) ? payload.skills.map((skill: unknown) => String(skill).trim()).filter(Boolean) : []
      const skills: string[] = [...new Set<string>(requestedSkills)].slice(0, 12)
      await tx.skillLevel_.deleteMany({ where: { studentId, verifiedByGigs: 0, skillName: { notIn: skills } } })
      for (const skillName of skills) {
        await tx.skillLevel_.upsert({
          where: { studentId_skillName: { studentId, skillName } },
          update: {},
          create: { studentId, skillName, level: 'BEGINNER' }
        })
      }
      const updated = await tx.studentProfile.findUnique({ where: { id: studentId }, include: { campus: true, course: true, user: true, skillLevels: true } })
      return toProfileHeader(updated)
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
        wallets: { orderBy: { createdAt: 'asc' } },
        roadmapEnrollments: true,
        pipelineRelationships: true,
        portfolioItems: true
      }
    }) : null
    const campusWhere = student?.campusId ? { OR: [{ campusId: student.campusId }, { campusId: null }] } : {}
    const [items, opportunities, listings, events, posts, stories, roadmaps] = await Promise.all([
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
          publishedAt: { not: null }
        },
        include: { company: true },
        orderBy: { createdAt: 'desc' },
        take: 6
      }),
      prisma.marketplaceListing.findMany({
        where: { status: 'ACTIVE', ...campusWhere },
        include: { shop: true, seller: true },
        orderBy: { createdAt: 'desc' },
        take: 8
      }),
      prisma.campusEvent.findMany({
        where: { status: 'PUBLISHED', startsAt: { gte: new Date() }, ...campusWhere },
        include: {
          _count: { select: { rsvps: { where: { status: { in: ['GOING', 'ATTENDED'] } } } } },
          ...(studentId ? { rsvps: { where: { studentId, status: { in: ['GOING', 'INTERESTED'] } } } } : {})
        },
        orderBy: { startsAt: 'asc' },
        take: 6
      }),
      prisma.campusPost.findMany({
        where: { status: 'PUBLISHED', ...campusWhere },
        include: { student: true, campus: true },
        orderBy: { publishedAt: 'desc' },
        take: 6
      }),
      prisma.studentStory.findMany({
        where: { status: 'ACTIVE', ...campusWhere },
        include: { student: true, campus: true },
        orderBy: { publishedAt: 'desc' },
        take: 6
      }),
      prisma.careerRoadmap.findMany({
        where: { status: 'PUBLISHED', ...campusWhere },
        include: { campus: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        take: 6
      })
    ])
    const grouped = groupContentSections(items)
    const marketplaceItems = listings.filter((listing) => listing.listingType !== 'SERVICE').map(mapMarketplaceListing)
    const serviceItems = listings.filter((listing) => listing.listingType === 'SERVICE').map(mapMarketplaceListing)
    const assistantConfig = grouped.get('assistant')?.[0] ?? {}
    const score = student?.zumbarl
    const mainWallet = student?.wallets.find((wallet) => wallet.type === 'MAIN') ?? student?.wallets[0]
    const currentYear = new Date().getFullYear()
    const yearOfStudy = student ? Math.max(currentYear - student.yearJoined + 1, 1) : null
    const mappedEvents = events.map(mapCampusEvent)
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
      quickActions: grouped.get('quick_actions') ?? [],
      recommendationSections: [
        { id: 'stories', title: 'Stories', subtitle: 'Fresh updates from students around campus', items: stories.map(mapStudentStory) },
        { id: 'posts', title: 'Posts', subtitle: 'Campus ideas, questions and showcases', items: posts.map(mapCampusPost) },
        { id: 'gigs', title: 'Recommended for you', subtitle: 'Gigs and paid work matched to your campus activity', items: opportunities.map(mapOpportunity) },
        { id: 'marketplace', title: 'Marketplace picks', subtitle: 'Student shops, products and useful campus items', items: marketplaceItems },
        { id: 'communities', title: 'Communities', subtitle: 'Groups and chamas you may want to join', items: grouped.get('communities') ?? [] },
        { id: 'events', title: 'Events', subtitle: 'Campus activity worth showing up for', items: mappedEvents },
        { id: 'roadmaps', title: 'Career roadmaps', subtitle: 'Skill paths that connect learning to portfolio proof', items: roadmaps.map(mapCareerRoadmap) },
        { id: 'services', title: 'Services', subtitle: 'Student services available near you', items: serviceItems }
      ],
      trustPoints: grouped.get('trust') ?? [],
      discoveryLibrary: grouped.get('discovery') ?? [],
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
              label: 'Zumbarl Score',
              value: score?.confidence === 'PROVISIONAL' ? 'Provisional' : Math.round(score?.currentScore ?? 0),
              detail: score?.confidence === 'PROVISIONAL' ? 'Building confidence' : score?.tier ?? 'BRONZE',
              trend: score?.confidence === 'PROVISIONAL'
                ? `${Number(score?.effectiveEngagements ?? 0).toFixed(1)} of 3 effective engagements`
                : score?.trendDirection ?? 'Building profile'
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
          title: student.roadmapEnrollments[0]?.status === 'IN_PROGRESS' ? 'Roadmap in progress' : 'Explore career roadmaps',
          detail: student.roadmapEnrollments[0] ? `${Math.round(student.roadmapEnrollments[0].progressPercent)}% complete` : 'Build verified skills'
        }
      } : null
    }
  }

  async readProfileExperience(studentId?: string) {
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
        campus: true,
        course: true,
        zumbarl: true,
        skillLevels: true,
        portfolioItems: true,
        endorsementsReceived: { include: { company: true }, orderBy: { createdAt: 'desc' } },
        achievements: { orderBy: { earnedAt: 'desc' } },
        certificates: { orderBy: { issuedAt: 'desc' } },
        pipelineRelationships: { include: { company: true }, orderBy: { updatedAt: 'desc' } }
      }
    })
    if (!student) return null

    const [profileListings, profilePosts, profileStories, profileRoadmaps, walletTransactions, followerCount, followingCount, campusPostTotals, connectPosts] = await Promise.all([
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
      })
    ])
    const score = student.zumbarl
    const endorsements = student.endorsementsReceived.map((endorsement) => ({
      id: endorsement.id,
      company: endorsement.company.name,
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
      skills: student.skillLevels.map((skill) => ({
        id: skill.id,
        name: skill.skillName,
        level: skill.level,
        category: 'General',
        verifiedByGigs: skill.verifiedByGigs
      })),
      portfolioItems: student.portfolioItems.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        filter: item.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category: item.category,
        client: item.companyName,
        image: item.thumbnailUrl,
        rating: item.metricsVerified ? 'Verified' : 'Pending verification',
        impactMetrics: item.impactMetrics
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
        gigs: relationship.gigsCompleted,
        status: relationship.status,
        targetRole: relationship.targetRole
      })),
      recentActivity: [
        ...profileStories.map(mapStudentStory),
        ...profilePosts.map(mapCampusPost),
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

    const contains = { contains: query, mode: 'insensitive' as const }
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
          publishedAt: { not: null },
          OR: [{ title: contains }, { summary: contains }, { category: contains }, { skills: { has: query } }]
        },
        include: { company: true },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.marketplaceListing.findMany({
        where: {
          status: 'ACTIVE',
          ...campusScope,
          OR: [{ title: contains }, { description: contains }, { category: contains }]
        },
        include: { seller: true },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.studentProfile.findMany({
        where: {
          isOpenToHire: true,
          OR: [{ firstName: contains }, { lastName: contains }, { careerPath: contains }, { bio: contains }]
        },
        include: { campus: true, course: true },
        orderBy: { updatedAt: 'desc' },
        take: 5
      }),
      prisma.campusEvent.findMany({
        where: {
          status: 'PUBLISHED',
          startsAt: { gte: new Date() },
          ...campusScope,
          OR: [{ title: contains }, { description: contains }, { category: contains }, { tags: { has: query } }]
        },
        orderBy: { startsAt: 'asc' },
        take: 5
      }),
      prisma.campusContentItem.findMany({
        where: {
          isActive: true,
          OR: [{ title: contains }, { subtitle: contains }, { description: contains }, { tags: { has: query } }]
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        take: 5
      })
    ])

    const results = [
      ...gigs.map((gig) => ({
        id: gig.id,
        kind: 'gig',
        title: gig.title,
        summary: gig.summary,
        meta: [gig.company?.name, gig.budgetLabel ?? (gig.budgetAmount ? `${gig.currency} ${gig.budgetAmount.toLocaleString()}` : null)].filter(Boolean).join(' · ') || null,
        href: `/campus/opportunities?opportunity=${gig.id}`
      })),
      ...listings.map((listing) => ({
        id: listing.id,
        kind: listing.listingType === 'SERVICE' ? 'service' : 'product',
        title: listing.title,
        summary: listing.description,
        meta: [`${listing.currency} ${listing.priceAmount.toLocaleString()}`, listing.locationLabel].filter(Boolean).join(' · ') || null,
        href: '/campus/opportunities/buy-sell'
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
        meta: [event.locationName, event.startsAt.toISOString()].filter(Boolean).join(' · ') || null,
        href: '/campus/opportunities?tab=Ongoing'
      })),
      ...resources.map((item) => ({
        id: item.id,
        kind: 'resource',
        title: item.title,
        summary: item.description ?? item.subtitle ?? null,
        meta: item.org ?? item.meta ?? null,
        href: item.href ?? null
      }))
    ]

    return results
  }
}

const campusExperienceRepository = new CampusExperienceRepository()

export {
  CampusExperienceRepository,
  campusExperienceRepository
}
