import { prisma } from '../../../lib/prisma.js'

function toProfileHeader(student: Record<string, any> | null) {
  if (!student) return null
  return {
    id: student.id,
    name: `${student.firstName} ${student.lastName}`.trim(),
    role: 'Student',
    headline: `${student.campus?.name ?? 'Campus'} · Year ${Math.max(new Date().getFullYear() - student.yearJoined + 1, 1)} · ${student.careerPath ?? student.course?.name ?? 'Student'}`,
    location: student.locationCity,
    handle: student.user?.email ? `@${student.user.email.split('@')[0].replace(/[^a-z0-9_]/gi, '_')}` : '@student',
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

function mapGig(gig: Record<string, any>) {
  return {
    id: gig.id,
    section: 'gigs',
    title: gig.title,
    description: gig.description,
    org: gig.company?.name,
    meta: `${String(gig.gigType || '').replaceAll('_', ' ').toLowerCase()} · ${String(gig.gigMode || '').toLowerCase()}`,
    value: formatKes(gig.budgetMax ?? 0),
    thumbnail: gig.imageUrl,
    image: gig.imageUrl,
    tags: gig.requiredSkills ?? [],
    href: `/campus/opportunities?gig=${gig.id}`,
    actionLabel: 'View gig'
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
    href: `/campus/events/${event.id}`,
    actionLabel: 'View event'
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
    href: `/campus/posts/${post.id}`,
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
    href: `/campus/stories/${story.id}`,
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
    href: `/campus/learn/roadmaps/${roadmap.slug}`,
    actionLabel: 'Open roadmap'
  }
}

class CampusExperienceRepository {
  async readHomeExperience(studentId?: string) {
    const student = studentId ? await prisma.studentProfile.findUnique({ where: { id: studentId }, include: { campus: true } }) : null
    const campusWhere = student?.campusId ? { OR: [{ campusId: student.campusId }, { campusId: null }] } : {}
    const [items, gigs, listings, events, posts, stories, roadmaps] = await Promise.all([
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
      prisma.gig.findMany({
        where: { status: 'OPEN' },
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
        where: { status: 'PUBLISHED', ...campusWhere },
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
    return {
      viewer: student ? { campus: student.campus?.name, city: student.locationCity } : null,
      hero: grouped.get('hero')?.[0] ?? null,
      quickActions: grouped.get('quick_actions') ?? [],
      recommendationSections: [
        { id: 'stories', title: 'Stories', subtitle: 'Fresh updates from students around campus', items: stories.map(mapStudentStory) },
        { id: 'posts', title: 'Posts', subtitle: 'Campus ideas, questions and showcases', items: posts.map(mapCampusPost) },
        { id: 'gigs', title: 'Recommended for you', subtitle: 'Gigs and paid work matched to your campus activity', items: gigs.map(mapGig) },
        { id: 'marketplace', title: 'Marketplace picks', subtitle: 'Student shops, products and useful campus items', items: marketplaceItems },
        { id: 'communities', title: 'Communities', subtitle: 'Groups and chamas you may want to join', items: grouped.get('communities') ?? [] },
        { id: 'events', title: 'Events', subtitle: 'Campus activity worth showing up for', items: events.map(mapCampusEvent) },
        { id: 'roadmaps', title: 'Career roadmaps', subtitle: 'Skill paths that connect learning to portfolio proof', items: roadmaps.map(mapCareerRoadmap) },
        { id: 'services', title: 'Services', subtitle: 'Student services available near you', items: serviceItems }
      ],
      trustPoints: grouped.get('trust') ?? [],
      discoveryLibrary: grouped.get('discovery') ?? [],
      assistant: assistantConfig
    }
  }

  async readProfileExperience(studentId?: string) {
    const student = await prisma.studentProfile.findFirst({
      where: studentId ? { id: studentId } : undefined,
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

    const [profileListings, profilePosts, profileStories, profileRoadmaps, walletTransactions] = await Promise.all([
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

    return {
      header: toProfileHeader(student),
      metrics: [
        { label: 'Zumbarl Score', value: score?.currentScore ? Math.round(score.currentScore) : 0, meta: score?.tier ?? 'BRONZE' },
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
}

const campusExperienceRepository = new CampusExperienceRepository()

export {
  CampusExperienceRepository,
  campusExperienceRepository
}
