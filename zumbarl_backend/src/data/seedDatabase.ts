import fs from 'node:fs/promises'
import path from 'node:path'
import { hashPassword } from '../lib/security.js'
import { prisma } from '../lib/prisma.js'
import { copyLocalSeedAsset } from '../adapters/storage/index.js'
import { createPrismaRecordRepository } from '../shared/repositories/index.js'

const projects = createPrismaRecordRepository('projects')
const campaigns = createPrismaRecordRepository('campaigns')
const shops = createPrismaRecordRepository('shops')
const wallets = createPrismaRecordRepository('wallets')

type SeedAssets = Awaited<ReturnType<typeof seedLocalFileAssets>>

async function upsertWorkflowRecord(repository: ReturnType<typeof createPrismaRecordRepository>, seedKey: string, payload: Record<string, any>) {
  const existing = await repository.findByField('seedKey', seedKey)
  if (existing) return repository.updateById(existing.id, { ...payload, seedKey })
  return repository.create({ ...payload, seedKey })
}

function getPublicAssetPath(publicAssetPath: string) {
  return path.resolve(process.cwd(), '../zumbarl.com/public', publicAssetPath.replace(/^\//, ''))
}

function getMimeType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase()
  if (extension === '.webp') return 'image/webp'
  if (extension === '.png') return 'image/png'
  if (extension === '.svg') return 'image/svg+xml'
  return 'image/jpeg'
}

async function copySeedImage(publicAssetPath: string) {
  const bucket = 'zumbarl-public-assets'
  const relativeAssetPath = publicAssetPath.replace(/^\/?assets\//, '')
  const storageKey = relativeAssetPath === 'index/bee_nobg.png'
    ? `platform/branding/${path.basename(relativeAssetPath)}`
    : `platform/demo-assets/${relativeAssetPath}`
  const sourcePath = getPublicAssetPath(publicAssetPath)
  const fileStat = await fs.stat(sourcePath)
  const url = await copyLocalSeedAsset(sourcePath, bucket, storageKey)
  await prisma.uploadedFile.upsert({
    where: { bucket_storageKey: { bucket, storageKey } },
    update: {
      fileName: path.basename(publicAssetPath),
      mimeType: getMimeType(publicAssetPath),
      bucket,
      url,
      provider: 'local',
      status: 'complete',
      isSeed: true,
      metadata: { source: 'seedDatabase', publicAssetPath }
    },
    create: {
      scope: 'zumbarl-assets',
      fileName: path.basename(publicAssetPath),
      mimeType: getMimeType(publicAssetPath),
      sizeBytes: fileStat.size,
      bucket,
      storageKey,
      url,
      provider: 'local',
      status: 'complete',
      isSeed: true,
      metadata: { source: 'seedDatabase', publicAssetPath }
    }
  })
  return url
}

async function seedLocalFileAssets() {
  await prisma.uploadedFile.deleteMany({
    where: {
      OR: [
        { storageKey: { startsWith: 'seed/' } },
        { storageKey: { startsWith: 'zumbarl/assets/' } },
        { storageKey: { startsWith: 'platform/demo-assets/assets/' } }
      ]
    }
  })

  const beeLogo = await copySeedImage('/assets/index/bee_nobg.png')
  const avatar = await copySeedImage('/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp')
  const campaign = await copySeedImage('/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp')
  const marketplace = await copySeedImage('/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp')
  const event = await copySeedImage('/assets/index/business_page_images/optimized/product-school-XZkk5xT8Xrk-unsplash.webp')
  const hydration = await copySeedImage('/assets/index/business_page_images/optimized/bruno-ngarukiye-IzEcrYJ1G34-unsplash.webp')
  const launch = await copySeedImage('/assets/index/business_page_images/optimized/omar-lopez-1qfy-jDc_jo-unsplash.webp')

  return {
    beeLogo,
    avatar,
    campaign,
    marketplace,
    marketplacePreview: launch,
    event,
    hydration,
    launch
  }
}

async function seedCampusContent(campusId: string, assets: SeedAssets) {
  await prisma.campusContentItem.deleteMany({
    where: {
      id: {
        in: [
          'campus-home-gig-social-media',
          'campus-home-gig-activation',
          'campus-home-market-design-kit',
          'campus-home-event-career-day',
          'campus-home-service-content-review',
          'student-profile-service-social-pack',
          'student-profile-shop-template-pack',
          'student-profile-activity-gig-completed',
          'student-profile-earnings-this-month',
          'campus-home-hero',
          'campus-home-assistant',
          'campus-home-action-find-work',
          'campus-home-action-marketplace',
          'campus-home-action-services',
          'campus-home-action-notes',
          'campus-home-action-events',
          'campus-home-action-communities',
          'campus-home-action-more',
          'campus-home-trust-students',
          'campus-home-trust-save',
          'campus-home-trust-grow',
          'campus-home-discovery-wallet',
          'campus-home-discovery-study-room',
          'campus-home-discovery-marketplace',
          'campus-home-discovery-people',
          'campus-home-discovery-books',
          'campus-home-discovery-gigs',
          'campus-home-discovery-roadmaps'
        ]
      }
    }
  })

  const content = [
    {
      id: 'campus-home-hero',
      scope: 'campus_home',
      section: 'hero',
      title: 'Let me help you find things',
      subtitle: 'simple, sure growth',
      description: 'Earn, learn, connect, grow and thrive in your student journey at Zumbarl.',
      imageUrl: assets.beeLogo,
      sortOrder: 1,
      payload: {
        kickerStart: 'simple',
        kickerMiddle: 'sure',
        kickerEnd: 'growth',
        headline: 'Let me help you find things',
        highlight: 'around!',
        phoneLabel: 'zumbarl',
        chips: [
          { label: 'Earn', tone: 'earn' },
          { label: 'Learn', tone: 'learn' },
          { label: 'Connect', tone: 'connect' },
          { label: 'Grow', tone: 'grow' }
        ],
        floatingIcons: ['briefcase', 'book', 'book', 'heart'],
        quickStartTitle: 'Quick start',
        quickStartSubtitle: 'Apps, products, people, books, gigs and services.',
        chatTitle: 'Zumbarl AI Assistant',
        chatSubtitle: 'Type naturally and discover apps, products, people, books and gigs.',
        backLabel: 'Back to splash',
        chatSuggestionsLabel: 'Suggestions',
        chatSuggestionsSubtitle: 'Based on: chat'
      }
    },
    {
      id: 'campus-home-assistant',
      scope: 'campus_home',
      section: 'assistant',
      title: 'Campus assistant prompts',
      sortOrder: 1,
      payload: {
        defaultChips: ['Apps', 'Marketplace', 'People', 'Books', 'Gigs'],
        searchPromptHints: [
          'Find weekend gigs near me',
          'Show affordable hostels near campus',
          'Find used calculus books under KES 1,000',
          'Connect me with product design mentors',
          "What's happening on campus this week?"
        ],
        chatPromptHints: [
          'Find 3 remote writing gigs for beginners',
          'Show book deals and delivery options',
          'Help me find mentors in software engineering',
          'Recommend student groups for designers'
        ],
        replyTemplate: 'I found matches for "{prompt}". Start with {suggestions}. I can narrow by budget, location or urgency.',
        emptyReplyTemplate: 'I can help you explore {prompt}. I can pull apps, people, products, books or gigs next.',
        chatSuggestionsLabel: 'Suggestions',
        chatSuggestionsSubtitle: 'Based on: chat'
      }
    },
    {
      id: 'campus-home-action-find-work',
      scope: 'campus_home',
      section: 'quick_actions',
      title: 'Find Work',
      subtitle: 'Jobs & gigs',
      href: '/campus/opportunities',
      sortOrder: 1,
      payload: { icon: 'briefcase', tone: 'gold' }
    },
    {
      id: 'campus-home-action-marketplace',
      scope: 'campus_home',
      section: 'quick_actions',
      title: 'Buy & Sell',
      subtitle: 'Marketplace',
      href: '/campus/opportunities/buy-sell',
      sortOrder: 2,
      payload: { icon: 'shopping-bag', tone: 'purple' }
    },
    {
      id: 'campus-home-action-services',
      scope: 'campus_home',
      section: 'quick_actions',
      title: 'Campus Services',
      subtitle: 'Food, print, laundry',
      href: '/campus/services',
      sortOrder: 3,
      payload: { icon: 'truck', tone: 'mint' }
    },
    {
      id: 'campus-home-action-notes',
      scope: 'campus_home',
      section: 'quick_actions',
      title: 'Notes & Papers',
      subtitle: 'Study resources',
      href: '/campus/learn',
      sortOrder: 4,
      payload: { icon: 'book', tone: 'coral' }
    },
    {
      id: 'campus-home-action-events',
      scope: 'campus_home',
      section: 'quick_actions',
      title: 'Events',
      subtitle: "What's happening",
      href: '/campus/events',
      sortOrder: 5,
      payload: { icon: 'calendar', tone: 'pink' }
    },
    {
      id: 'campus-home-action-communities',
      scope: 'campus_home',
      section: 'quick_actions',
      title: 'Communities',
      subtitle: 'Clubs & groups',
      href: '/campus/community',
      sortOrder: 6,
      payload: { icon: 'users', tone: 'blue' }
    },
    {
      id: 'campus-home-action-more',
      scope: 'campus_home',
      section: 'quick_actions',
      title: 'More',
      subtitle: 'Explore all',
      href: '/campus/explore',
      sortOrder: 7,
      payload: { icon: 'more-horizontal', tone: 'neutral' }
    },
    {
      id: 'campus-home-community-creators',
      scope: 'campus_home',
      section: 'communities',
      title: 'Campus Creators Circle',
      org: 'Zetech University',
      meta: '426 members',
      value: 'Join group',
      imageUrl: assets.avatar,
      sortOrder: 1
    },
    {
      id: 'campus-home-trust-safe-payments',
      scope: 'campus_home',
      section: 'trust',
      title: 'Verified & Safe',
      description: 'Trusted users, secure payments, real support.',
      meta: 'Trust signal',
      value: 'Protected',
      sortOrder: 1,
      payload: { icon: 'shield', tone: 'purple' }
    },
    {
      id: 'campus-home-trust-students',
      scope: 'campus_home',
      section: 'trust',
      title: 'Made for Students',
      description: 'Simple, mobile-first and data friendly.',
      meta: 'Trust signal',
      value: 'Student-ready',
      sortOrder: 2,
      payload: { icon: 'book', tone: 'lavender' }
    },
    {
      id: 'campus-home-trust-save',
      scope: 'campus_home',
      section: 'trust',
      title: 'Save & Plan',
      description: 'Budget, save and achieve more with ease.',
      meta: 'Trust signal',
      value: 'Financial tools',
      sortOrder: 3,
      payload: { icon: 'credit-card', tone: 'mint' }
    },
    {
      id: 'campus-home-trust-grow',
      scope: 'campus_home',
      section: 'trust',
      title: 'Grow Together',
      description: 'Communities that support your journey.',
      meta: 'Trust signal',
      value: 'Community',
      sortOrder: 4,
      payload: { icon: 'users', tone: 'pink' }
    },
    {
      id: 'campus-home-discovery-wallet',
      scope: 'campus_home',
      section: 'discovery',
      title: 'Student Wallet',
      description: 'Send money, split hostel bills and pay campus vendors fast.',
      meta: 'App',
      value: 'Explore',
      href: '/campus/finance',
      sortOrder: 1,
      tags: ['wallet', 'money', 'pay', 'finance', 'send', 'split'],
      payload: { type: 'App', chip: 'Apps', summary: 'Send money, split hostel bills and pay campus vendors fast.' }
    },
    {
      id: 'campus-home-discovery-study-room',
      scope: 'campus_home',
      section: 'discovery',
      title: 'Study Room',
      description: 'Find revision groups, tutors and curated notes by unit.',
      meta: 'App',
      value: 'Explore',
      href: '/campus/learn',
      sortOrder: 2,
      tags: ['study', 'notes', 'book', 'revision', 'tutor', 'class'],
      payload: { type: 'App', chip: 'Apps', summary: 'Find revision groups, tutors and curated notes by unit.' }
    },
    {
      id: 'campus-home-discovery-marketplace',
      scope: 'campus_home',
      section: 'discovery',
      title: 'Used MacBook Air M1',
      description: 'Verified seller near campus, includes charger and carry bag.',
      meta: 'Marketplace',
      value: 'Explore',
      href: '/campus/opportunities/buy-sell',
      sortOrder: 3,
      tags: ['product', 'marketplace', 'laptop', 'electronics', 'buy', 'sell'],
      payload: { type: 'Marketplace', chip: 'Marketplace', summary: 'Verified seller near campus, includes charger and carry bag.' }
    },
    {
      id: 'campus-home-discovery-people',
      scope: 'campus_home',
      section: 'discovery',
      title: 'Grace Wanjiku · Product Mentor',
      description: 'Helps students prepare portfolios and product case studies.',
      meta: 'Person',
      value: 'Explore',
      href: '/campus/explore',
      sortOrder: 4,
      tags: ['people', 'person', 'mentor', 'coach', 'portfolio', 'career'],
      payload: { type: 'Person', chip: 'People', summary: 'Helps students prepare portfolios and product case studies.' }
    },
    {
      id: 'campus-home-discovery-books',
      scope: 'campus_home',
      section: 'discovery',
      title: 'Soft Skills for Campus Leaders',
      description: 'Practical guide for communication, teamwork and leadership.',
      meta: 'Book',
      value: 'Explore',
      href: '/campus/learn',
      sortOrder: 5,
      tags: ['book', 'books', 'leadership', 'communication', 'learn', 'library'],
      payload: { type: 'Book', chip: 'Books', summary: 'Practical guide for communication, teamwork and leadership.' }
    },
    {
      id: 'campus-home-discovery-gigs',
      scope: 'campus_home',
      section: 'discovery',
      title: 'Event Content Creator',
      description: 'Part-time weekend role. Capture reels and run event socials.',
      meta: 'Gig',
      value: 'Explore',
      href: '/campus/opportunities',
      sortOrder: 6,
      tags: ['gig', 'job', 'work', 'content', 'creator', 'part-time', 'remote'],
      payload: { type: 'Gig', chip: 'Gigs', summary: 'Part-time weekend role. Capture reels and run event socials.' }
    }
  ]

  for (const item of content) {
    await prisma.campusContentItem.upsert({
      where: { id: item.id },
      update: { ...item, campusId },
      create: { ...item, campusId }
    })
  }
}

async function seedStructuredCampusExperience(campusId: string, studentId: string, assets: SeedAssets) {
  const shop = await prisma.marketplaceShop.upsert({
    where: { slug: 'aisha-campus-studio' },
    update: {
      ownerId: studentId,
      campusId,
      name: 'Aisha Campus Studio',
      tagline: 'Canva templates, content audits and campaign-ready assets.',
      description: 'Student-run creative shop for campus campaign templates, content planning and social media support.',
      category: 'Digital Services',
      logoUrl: assets.avatar,
      coverImageUrl: assets.marketplace,
      locationLabel: 'Zetech University',
      deliveryOptions: ['Instant download', 'Canva link', 'Remote consultation'],
      socialLinks: { instagram: '@aisha_studio' },
      ratingAverage: 4.8,
      ratingCount: 18,
      orderCount: 32,
      status: 'ACTIVE'
    },
    create: {
      id: 'shop-aisha-campus-studio',
      ownerId: studentId,
      campusId,
      name: 'Aisha Campus Studio',
      slug: 'aisha-campus-studio',
      tagline: 'Canva templates, content audits and campaign-ready assets.',
      description: 'Student-run creative shop for campus campaign templates, content planning and social media support.',
      category: 'Digital Services',
      logoUrl: assets.avatar,
      coverImageUrl: assets.marketplace,
      locationLabel: 'Zetech University',
      deliveryOptions: ['Instant download', 'Canva link', 'Remote consultation'],
      socialLinks: { instagram: '@aisha_studio' },
      ratingAverage: 4.8,
      ratingCount: 18,
      orderCount: 32
    }
  })

  await Promise.all([
    prisma.studentStory.upsert({
      where: { id: 'story-aisha-campaign-preview' },
      update: {
        title: 'Campaign shoot preview',
        caption: 'Behind the scenes from a campus content sprint.',
        mediaUrl: assets.campaign,
        mediaType: 'IMAGE',
        thumbnailUrl: assets.campaign,
        campusId,
        status: 'ACTIVE',
        viewCount: 128,
        reactionCount: 24
      },
      create: {
        id: 'story-aisha-campaign-preview',
        studentId,
        campusId,
        title: 'Campaign shoot preview',
        caption: 'Behind the scenes from a campus content sprint.',
        mediaUrl: assets.campaign,
        mediaType: 'IMAGE',
        thumbnailUrl: assets.campaign,
        viewCount: 128,
        reactionCount: 24,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    }),
    prisma.campusPost.upsert({
      where: { id: 'post-aisha-content-calendar-tip' },
      update: {
        title: 'How I plan weekly content',
        body: 'I use one content pillar for awareness, one for proof, and one for conversion before I design any posts.',
        mediaUrls: [assets.campaign],
        tags: ['Social Media', 'Canva', 'Planning'],
        postType: 'SHOWCASE',
        campusId,
        status: 'PUBLISHED',
        likeCount: 42,
        commentCount: 8,
        shareCount: 5
      },
      create: {
        id: 'post-aisha-content-calendar-tip',
        studentId,
        campusId,
        title: 'How I plan weekly content',
        body: 'I use one content pillar for awareness, one for proof, and one for conversion before I design any posts.',
        mediaUrls: [assets.campaign],
        tags: ['Social Media', 'Canva', 'Planning'],
        postType: 'SHOWCASE',
        likeCount: 42,
        commentCount: 8,
        shareCount: 5
      }
    }),
    prisma.marketplaceListing.upsert({
      where: { id: 'marketplace-aisha-template-pack' },
      update: {
        shopId: shop.id,
        title: 'Campus campaign template pack',
        description: 'Editable Canva templates for campus events, flyers and WhatsApp status promos.',
        category: 'Digital Templates',
        listingType: 'DIGITAL',
        priceAmount: 750,
        currency: 'KES',
        images: [assets.marketplace, assets.marketplacePreview],
        deliveryOptions: ['Instant download', 'Canva link'],
        campusId,
        status: 'ACTIVE',
        stockCount: 50
      },
      create: {
        id: 'marketplace-aisha-template-pack',
        shopId: shop.id,
        sellerId: studentId,
        campusId,
        title: 'Campus campaign template pack',
        description: 'Editable Canva templates for campus events, flyers and WhatsApp status promos.',
        category: 'Digital Templates',
        listingType: 'DIGITAL',
        priceAmount: 750,
        currency: 'KES',
        images: [assets.marketplace, assets.marketplacePreview],
        deliveryOptions: ['Instant download', 'Canva link'],
        stockCount: 50
      }
    }),
    prisma.marketplaceListing.upsert({
      where: { id: 'marketplace-aisha-social-audit' },
      update: {
        shopId: shop.id,
        title: 'Social content audit',
        description: 'Review captions, visual consistency and content calendar gaps for a campus brand or student creator.',
        category: 'Content Services',
        listingType: 'SERVICE',
        priceAmount: 1500,
        currency: 'KES',
        images: [assets.campaign],
        deliveryOptions: ['Remote consultation', 'Written report'],
        campusId,
        status: 'ACTIVE',
        stockCount: 10
      },
      create: {
        id: 'marketplace-aisha-social-audit',
        shopId: shop.id,
        sellerId: studentId,
        campusId,
        title: 'Social content audit',
        description: 'Review captions, visual consistency and content calendar gaps for a campus brand or student creator.',
        category: 'Content Services',
        listingType: 'SERVICE',
        priceAmount: 1500,
        currency: 'KES',
        images: [assets.campaign],
        deliveryOptions: ['Remote consultation', 'Written report'],
        stockCount: 10
      }
    }),
    prisma.campusEvent.upsert({
      where: { id: 'event-creative-career-day' },
      update: {
        title: 'Creative Career Day',
        description: 'Portfolio reviews, student creator talks and business networking for campus creatives.',
        category: 'Career',
        organizerName: 'Zetech Innovation Hub',
        organizerType: 'CAMPUS',
        coverImageUrl: assets.event,
        locationName: 'Innovation Hub',
        locationAddress: 'Zetech University, Nairobi',
        startsAt: new Date('2026-07-10T11:00:00.000Z'),
        endsAt: new Date('2026-07-10T14:00:00.000Z'),
        capacity: 120,
        priceAmount: 0,
        tags: ['Portfolio', 'Career', 'Networking'],
        campusId,
        status: 'PUBLISHED'
      },
      create: {
        id: 'event-creative-career-day',
        campusId,
        title: 'Creative Career Day',
        description: 'Portfolio reviews, student creator talks and business networking for campus creatives.',
        category: 'Career',
        organizerName: 'Zetech Innovation Hub',
        organizerType: 'CAMPUS',
        coverImageUrl: assets.event,
        locationName: 'Innovation Hub',
        locationAddress: 'Zetech University, Nairobi',
        startsAt: new Date('2026-07-10T11:00:00.000Z'),
        endsAt: new Date('2026-07-10T14:00:00.000Z'),
        capacity: 120,
        tags: ['Portfolio', 'Career', 'Networking']
      }
    })
  ])

  const event = await prisma.campusEvent.findUnique({ where: { id: 'event-creative-career-day' } })
  if (event) {
    await prisma.campusEventRsvp.upsert({
      where: { eventId_studentId: { eventId: event.id, studentId } },
      update: { status: 'GOING' },
      create: { eventId: event.id, studentId, status: 'GOING' }
    })
  }

  const roadmap = await prisma.careerRoadmap.upsert({
    where: { slug: 'social-media-creator-roadmap' },
    update: {
      title: 'Social Media Creator Roadmap',
      description: 'Build from content planning basics to campaign delivery, reporting and portfolio proof.',
      careerFamily: 'Marketing & Design',
      level: 'BEGINNER',
      estimatedWeeks: 6,
      coverImageUrl: assets.campaign,
      skills: ['Content Strategy', 'Canva', 'Analytics', 'Client Communication'],
      outcomes: ['Publish a portfolio-ready campaign', 'Submit analytics proof', 'Prepare for paid creator gigs'],
      campusId,
      status: 'PUBLISHED',
      sortOrder: 1
    },
    create: {
      id: 'roadmap-social-media-creator',
      campusId,
      title: 'Social Media Creator Roadmap',
      slug: 'social-media-creator-roadmap',
      description: 'Build from content planning basics to campaign delivery, reporting and portfolio proof.',
      careerFamily: 'Marketing & Design',
      level: 'BEGINNER',
      estimatedWeeks: 6,
      coverImageUrl: assets.campaign,
      skills: ['Content Strategy', 'Canva', 'Analytics', 'Client Communication'],
      outcomes: ['Publish a portfolio-ready campaign', 'Submit analytics proof', 'Prepare for paid creator gigs'],
      sortOrder: 1
    }
  })

  const steps = [
    {
      id: 'roadmap-step-content-pillars',
      title: 'Define content pillars',
      description: 'Choose awareness, proof and conversion pillars for a campaign.',
      stepType: 'LEARNING',
      estimatedHours: 2,
      sortOrder: 1
    },
    {
      id: 'roadmap-step-campaign-assets',
      title: 'Create a mini campaign asset set',
      description: 'Design three posts and one short-form video concept from a brief.',
      stepType: 'PROJECT',
      evidenceType: 'PORTFOLIO_ASSET',
      estimatedHours: 6,
      sortOrder: 2
    },
    {
      id: 'roadmap-step-analytics-proof',
      title: 'Submit analytics proof',
      description: 'Prepare a simple reach, engagement and learning report.',
      stepType: 'PORTFOLIO',
      evidenceType: 'REPORT',
      estimatedHours: 3,
      sortOrder: 3
    }
  ]

  for (const step of steps) {
    await prisma.careerRoadmapStep.upsert({
      where: { id: step.id },
      update: { ...step, roadmapId: roadmap.id },
      create: { ...step, roadmapId: roadmap.id }
    })
  }

  await prisma.studentRoadmapEnrollment.upsert({
    where: { studentId_roadmapId: { studentId, roadmapId: roadmap.id } },
    update: {
      status: 'IN_PROGRESS',
      progressPercent: 35,
      currentStepOrder: 2,
      completedStepIds: ['roadmap-step-content-pillars']
    },
    create: {
      studentId,
      roadmapId: roadmap.id,
      status: 'IN_PROGRESS',
      progressPercent: 35,
      currentStepOrder: 2,
      completedStepIds: ['roadmap-step-content-pillars']
    }
  })
}

async function seedDatabase() {
  const campus = await prisma.campus.upsert({
    where: { id: 'campus-zetech-university' },
    update: { name: 'Zetech University', city: 'Nairobi', isActive: true },
    create: {
      id: 'campus-zetech-university',
      name: 'Zetech University',
      city: 'Nairobi'
    }
  })
  const course = await prisma.course.upsert({
    where: { id: 'course-marketing-design' },
    update: { name: 'Marketing & Design', category: 'BUSINESS', duration: 4 },
    create: {
      id: 'course-marketing-design',
      name: 'Marketing & Design',
      category: 'BUSINESS',
      duration: 4
    }
  })
  const assets = await seedLocalFileAssets()

  const studentUser = await prisma.user.upsert({
    where: { email: 'student@zumbarl.test' },
    update: {
      name: 'Aisha Mwangi',
      firstName: 'Aisha',
      lastName: 'Mwangi',
      username: 'aisha_mwangi',
      role: 'STUDENT_STANDARD',
      isActive: true
    },
    create: {
      email: 'student@zumbarl.test',
      name: 'Aisha Mwangi',
      firstName: 'Aisha',
      lastName: 'Mwangi',
      username: 'aisha_mwangi',
      phone: '+254700100001',
      passwordHash: await hashPassword('password123'),
      role: 'STUDENT_STANDARD',
      isActive: true
    }
  })
  const businessUser = await prisma.user.upsert({
    where: { email: 'business@zumbarl.test' },
    update: {
      name: 'Zetech Studios',
      firstName: 'Zetech',
      lastName: 'Studios',
      username: 'zetech_studios',
      role: 'COMPANY_STANDARD',
      isActive: true
    },
    create: {
      email: 'business@zumbarl.test',
      name: 'Zetech Studios',
      firstName: 'Zetech',
      lastName: 'Studios',
      username: 'zetech_studios',
      phone: '+254700100002',
      passwordHash: await hashPassword('password123'),
      role: 'COMPANY_STANDARD',
      isActive: true
    }
  })
  await prisma.user.upsert({
    where: { email: 'admin@zumbarl.test' },
    update: {
      name: 'Zumbarl Admin',
      firstName: 'Zumbarl',
      lastName: 'Admin',
      username: 'zumbarl_admin',
      role: 'SUPER_ADMIN',
      isActive: true
    },
    create: {
      email: 'admin@zumbarl.test',
      name: 'Zumbarl Admin',
      firstName: 'Zumbarl',
      lastName: 'Admin',
      username: 'zumbarl_admin',
      phone: '+254700100003',
      passwordHash: await hashPassword('password123'),
      role: 'SUPER_ADMIN',
      isActive: true
    }
  })

  const student = await prisma.studentProfile.upsert({
    where: { userId: studentUser.id },
    update: {
      firstName: 'Aisha',
      lastName: 'Mwangi',
      campusId: campus.id,
      courseId: course.id,
      bio: 'Digital marketer and social media creator passionate about helping students and young professionals grow their skills and careers.',
      careerPath: 'Marketing & Design',
      avatarUrl: assets.avatar,
      kycStatus: 'APPROVED'
    },
    create: {
      userId: studentUser.id,
      firstName: 'Aisha',
      lastName: 'Mwangi',
      dateOfBirth: new Date('2000-01-01T00:00:00.000Z'),
      campusId: campus.id,
      courseId: course.id,
      yearJoined: new Date().getFullYear() - 2,
      courseDuration: course.duration,
      expectedGraduation: new Date(`${new Date().getFullYear() + 2}-12-31T00:00:00.000Z`),
      bio: 'Digital marketer and social media creator passionate about helping students and young professionals grow their skills and careers.',
      careerPath: 'Marketing & Design',
      avatarUrl: assets.avatar,
      isOpenToHire: true,
      kycStatus: 'APPROVED'
    }
  })

  const business = await prisma.company.upsert({
    where: { registrationNumber: 'ZETECH-STUDIOS-SEED' },
    update: {
      name: 'Zetech Studios',
      sector: 'Marketing',
      size: '2-10',
      description: 'Student-facing creative studio running practical digital campaigns.',
      kycStatus: 'APPROVED'
    },
    create: {
      name: 'Zetech Studios',
      registrationNumber: 'ZETECH-STUDIOS-SEED',
      sector: 'Marketing',
      size: '2-10',
      description: 'Student-facing creative studio running practical digital campaigns.',
      kycStatus: 'APPROVED'
    }
  })
  const businessContact = await prisma.companyContact.upsert({
    where: { userId: businessUser.id },
    update: { companyId: business.id, isOwner: true },
    create: {
      userId: businessUser.id,
      companyId: business.id,
      isOwner: true
    }
  })
  await prisma.companyWallet.upsert({
    where: { companyId: business.id },
    update: {},
    create: { companyId: business.id }
  })

  await Promise.all([
    prisma.gig.upsert({
      where: { id: 'gig-social-media-manager-zetech' },
      update: {
        companyId: business.id,
        postedByContactId: businessContact.id,
        title: 'Social Media Manager',
        description: 'Manage Instagram, TikTok and WhatsApp content for a student-facing campaign.',
        imageUrl: assets.campaign,
        gigType: 'SOCIAL_MEDIA',
        gigMode: 'REMOTE',
        requiredSkills: ['Social Media', 'Canva', 'Copywriting'],
        requiredTierMin: 'BRONZE',
        budgetMin: 8000,
        budgetMax: 15000,
        currency: 'KES',
        deadline: new Date('2026-07-24T00:00:00.000Z'),
        estimatedHours: 40,
        locationCity: 'Nairobi',
        isPhysical: false,
        status: 'OPEN',
        maxApplicants: 18
      },
      create: {
        id: 'gig-social-media-manager-zetech',
        companyId: business.id,
        postedByContactId: businessContact.id,
        title: 'Social Media Manager',
        description: 'Manage Instagram, TikTok and WhatsApp content for a student-facing campaign.',
        imageUrl: assets.campaign,
        gigType: 'SOCIAL_MEDIA',
        gigMode: 'REMOTE',
        requiredSkills: ['Social Media', 'Canva', 'Copywriting'],
        requiredTierMin: 'BRONZE',
        budgetMin: 8000,
        budgetMax: 15000,
        currency: 'KES',
        deadline: new Date('2026-07-24T00:00:00.000Z'),
        estimatedHours: 40,
        locationCity: 'Nairobi',
        isPhysical: false,
        status: 'OPEN',
        maxApplicants: 18
      }
    }),
    prisma.gig.upsert({
      where: { id: 'gig-campus-activation-brandmasters' },
      update: {
        companyId: business.id,
        postedByContactId: businessContact.id,
        title: 'Campus Activation Support',
        description: 'Support a campus launch activation, collect student feedback, and submit event engagement notes.',
        imageUrl: assets.event,
        gigType: 'SALES_MARKETING',
        gigMode: 'HYBRID',
        requiredSkills: ['Events', 'Communication', 'Reporting'],
        requiredTierMin: 'BRONZE',
        budgetMin: 6000,
        budgetMax: 8000,
        currency: 'KES',
        deadline: new Date('2026-07-18T00:00:00.000Z'),
        estimatedHours: 24,
        locationCity: 'Nairobi',
        isPhysical: true,
        status: 'OPEN',
        maxApplicants: 12
      },
      create: {
        id: 'gig-campus-activation-brandmasters',
        companyId: business.id,
        postedByContactId: businessContact.id,
        title: 'Campus Activation Support',
        description: 'Support a campus launch activation, collect student feedback, and submit event engagement notes.',
        imageUrl: assets.event,
        gigType: 'SALES_MARKETING',
        gigMode: 'HYBRID',
        requiredSkills: ['Events', 'Communication', 'Reporting'],
        requiredTierMin: 'BRONZE',
        budgetMin: 6000,
        budgetMax: 8000,
        currency: 'KES',
        deadline: new Date('2026-07-18T00:00:00.000Z'),
        estimatedHours: 24,
        locationCity: 'Nairobi',
        isPhysical: true,
        status: 'OPEN',
        maxApplicants: 12
      }
    }),
    prisma.gig.upsert({
      where: { id: 'gig-web-design-zetech' },
      update: {
        companyId: business.id,
        postedByContactId: businessContact.id,
        title: 'Landing Page Designer',
        description: 'Design a concise campaign landing page and hand over responsive assets for implementation.',
        imageUrl: assets.marketplace,
        gigType: 'WEB_DEVELOPMENT',
        gigMode: 'REMOTE',
        requiredSkills: ['UI/UX Design', 'Figma', 'Web Design'],
        requiredTierMin: 'SILVER',
        budgetMin: 12000,
        budgetMax: 25000,
        currency: 'KES',
        deadline: new Date('2026-08-02T00:00:00.000Z'),
        estimatedHours: 32,
        locationCity: 'Nairobi',
        isPhysical: false,
        status: 'OPEN',
        maxApplicants: 10
      },
      create: {
        id: 'gig-web-design-zetech',
        companyId: business.id,
        postedByContactId: businessContact.id,
        title: 'Landing Page Designer',
        description: 'Design a concise campaign landing page and hand over responsive assets for implementation.',
        imageUrl: assets.marketplace,
        gigType: 'WEB_DEVELOPMENT',
        gigMode: 'REMOTE',
        requiredSkills: ['UI/UX Design', 'Figma', 'Web Design'],
        requiredTierMin: 'SILVER',
        budgetMin: 12000,
        budgetMax: 25000,
        currency: 'KES',
        deadline: new Date('2026-08-02T00:00:00.000Z'),
        estimatedHours: 32,
        locationCity: 'Nairobi',
        isPhysical: false,
        status: 'OPEN',
        maxApplicants: 10
      }
    })
  ])

  await prisma.zumbarlScore.upsert({
    where: { studentId: student.id },
    update: {
      currentScore: 74,
      tier: 'SILVER',
      qualityScore: 76,
      volumeScore: 64,
      loyaltyScore: 68,
      trustScore: 82,
      deliveryScore: 94,
      avgRating: 4.6,
      deliveryRate: 94,
      totalGigsCompleted: 23,
      repeatClientRate: 7,
      endorsementCount: 3
    },
    create: {
      studentId: student.id,
      currentScore: 74,
      tier: 'SILVER',
      qualityScore: 76,
      volumeScore: 64,
      loyaltyScore: 68,
      trustScore: 82,
      deliveryScore: 94,
      avgRating: 4.6,
      deliveryRate: 94,
      totalGigsCompleted: 23,
      repeatClientRate: 7,
      endorsementCount: 3
    }
  })

  await Promise.all(['Social Media', 'Graphic Design', 'Canva', 'Copywriting', 'Analytics', 'Video Editing'].map((skillName, index) => prisma.skillLevel_.upsert({
    where: { studentId_skillName: { studentId: student.id, skillName } },
    update: { level: index < 2 ? 'ADVANCED' : 'INTERMEDIATE', verifiedByGigs: 3 + index },
    create: { studentId: student.id, skillName, level: index < 2 ? 'ADVANCED' : 'INTERMEDIATE', verifiedByGigs: 3 + index }
  })))

  await Promise.all([
    prisma.portfolioItem.upsert({
      where: { id: 'portfolio-social-campaign' },
      update: {
        title: 'Instagram campaign growth sprint',
        description: 'Planned, designed and reported a two-week social campaign for a student learning product.',
        category: 'Social Media',
        thumbnailUrl: assets.campaign,
        companyName: business.name,
        clientFeedback: 'Aisha delivers high-quality work and understands our brand voice.',
        isFeatured: true,
        impactMetrics: [{ label: 'Reach', value: '120.3K' }, { label: 'Engagement', value: '5.8%' }]
      },
      create: {
        id: 'portfolio-social-campaign',
        studentId: student.id,
        title: 'Instagram campaign growth sprint',
        description: 'Planned, designed and reported a two-week social campaign for a student learning product.',
        category: 'Social Media',
        thumbnailUrl: assets.campaign,
        fileUrls: [],
        companyName: business.name,
        clientFeedback: 'Aisha delivers high-quality work and understands our brand voice.',
        isFeatured: true,
        impactMetrics: [{ label: 'Reach', value: '120.3K' }, { label: 'Engagement', value: '5.8%' }]
      }
    }),
    prisma.portfolioItem.upsert({
      where: { id: 'portfolio-brand-kit' },
      update: {
        title: 'Campus event brand kit',
        description: 'Created event posters, WhatsApp status cards and Canva templates for a campus activation.',
        category: 'Graphic Design',
        thumbnailUrl: assets.marketplace,
        companyName: 'BrandMasters Agency',
        isFeatured: true
      },
      create: {
        id: 'portfolio-brand-kit',
        studentId: student.id,
        title: 'Campus event brand kit',
        description: 'Created event posters, WhatsApp status cards and Canva templates for a campus activation.',
        category: 'Graphic Design',
        thumbnailUrl: assets.marketplace,
        fileUrls: [],
        companyName: 'BrandMasters Agency',
        isFeatured: true
      }
    })
  ])

  await Promise.all([
    prisma.endorsement.upsert({
      where: { id: 'endorsement-brandmasters-sarah' },
      update: { note: 'Aisha delivers high-quality work and understands our brand voice.' },
      create: { id: 'endorsement-brandmasters-sarah', studentId: student.id, companyId: business.id, endorsedByName: 'Sarah K.', endorsedByTitle: 'Creative Director', note: 'Aisha delivers high-quality work and understands our brand voice.', currencyAwarded: 12 }
    }),
    prisma.achievement.upsert({
      where: { id: 'achievement-zumbarl-silver' },
      update: { title: 'Zumbarl Silver', description: 'Score 50+' },
      create: { id: 'achievement-zumbarl-silver', studentId: student.id, type: 'TIER_ACHIEVED', title: 'Zumbarl Silver', description: 'Score 50+', iconKey: 'award' }
    }),
    prisma.certificate.upsert({
      where: { id: 'certificate-social-media-verified' },
      update: { title: 'Verified Social Media Creator', level: 'Intermediate' },
      create: { id: 'certificate-social-media-verified', studentId: student.id, type: 'SKILL_VERIFIED', title: 'Verified Social Media Creator', skillName: 'Social Media', level: 'Intermediate', verificationHash: 'seed-social-media-verified' }
    }),
    prisma.pipelineRelationship.upsert({
      where: { studentId_companyId: { studentId: student.id, companyId: business.id } },
      update: { status: 'ACTIVE', gigsCompleted: 7, avgRatingGiven: 4.8, targetRole: 'Content Creator' },
      create: { studentId: student.id, companyId: business.id, status: 'ACTIVE', gigsCompleted: 7, avgRatingGiven: 4.8, targetRole: 'Content Creator' }
    })
  ])

  await seedCampusContent(campus.id, assets)
  await seedStructuredCampusExperience(campus.id, student.id, assets)

  const opportunity = await prisma.opportunity.upsert({
    where: { id: 'opportunity-social-media-manager' },
    update: {
      companyId: business.id,
      postedByContactId: businessContact.id,
      title: 'Social Media Manager',
      summary: 'Manage Instagram, TikTok and WhatsApp content for a student-facing campaign.',
      description: 'Manage Instagram, TikTok and WhatsApp content for a student-facing campaign.',
      opportunityType: 'gig',
      category: 'Social Media',
      status: 'published',
      visibility: 'public',
      scopeMode: 'deliverable',
      opportunitySplash: { url: assets.campaign, alt: 'Social media campaign work preview' },
      budgetAmount: 8000,
      budgetLabel: 'KES 8,000',
      currency: 'KES',
      requirements: ['Social Media', 'Canva', 'Copywriting'],
      skills: ['Social Media', 'Canva', 'Copywriting'],
      acceptanceCriteria: 'Posts match brand voice and weekly analytics are submitted.',
      revisionLimit: 3,
      publishedAt: new Date(),
      isSeed: true,
      metadata: { seedKey: 'seed-social-media-manager' }
    },
    create: {
      id: 'opportunity-social-media-manager',
      companyId: business.id,
      postedByContactId: businessContact.id,
      title: 'Social Media Manager',
      summary: 'Manage Instagram, TikTok and WhatsApp content for a student-facing campaign.',
      description: 'Manage Instagram, TikTok and WhatsApp content for a student-facing campaign.',
      opportunityType: 'gig',
      category: 'Social Media',
      status: 'published',
      visibility: 'public',
      scopeMode: 'deliverable',
      opportunitySplash: { url: assets.campaign, alt: 'Social media campaign work preview' },
      budgetAmount: 8000,
      budgetLabel: 'KES 8,000',
      currency: 'KES',
      requirements: ['Social Media', 'Canva', 'Copywriting'],
      skills: ['Social Media', 'Canva', 'Copywriting'],
      acceptanceCriteria: 'Posts match brand voice and weekly analytics are submitted.',
      revisionLimit: 3,
      publishedAt: new Date(),
      isSeed: true,
      metadata: { seedKey: 'seed-social-media-manager' }
    }
  })
  if (!opportunity) throw new Error('Failed to seed social media manager opportunity')

  await prisma.bid.upsert({
    where: { opportunityId_studentId: { opportunityId: opportunity.id, studentId: student.id } },
    update: {
      status: 'submitted',
      bidAmount: 8000,
      intentId: 'build-career',
      intentLabel: 'Build Career',
      proposal: 'I can deliver weekly content and performance reports.'
    },
    create: {
      opportunityId: opportunity.id,
      studentId: student.id,
      status: 'submitted',
      bidAmount: 8000,
      intentId: 'build-career',
      intentLabel: 'Build Career',
      proposal: 'I can deliver weekly content and performance reports.'
    }
  })
  await upsertWorkflowRecord(projects, 'seed-social-media-project', {
    opportunityId: opportunity.id,
    businessId: business.id,
    studentId: student.id,
    title: 'Team Social Media Content Creation',
    status: 'planning',
    fundingStatus: 'unfunded',
    scopeLocked: false,
    terms: ['stipend-role', 'attachment', 'internship', 'per-deliverable']
  })
  await upsertWorkflowRecord(campaigns, 'seed-level-up-skills-campaign', {
    businessId: business.id,
    title: 'Level Up Skills',
    type: 'Brand Awareness',
    description: 'Promoting Zetech Studios digital services to help students level up their skills.',
    status: 'published',
    budgetAmount: 50000,
    budget: 'KES 50,000',
    currency: 'KES',
    payoutPerCampaigner: 1500,
    inviteOnlyUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    platforms: ['Instagram', 'TikTok'],
    minimumFollowers: 500,
    proofRequirements: ['Live social link', 'Screenshot proof', 'Reach and engagement stats'],
    acceptedBudget: 0,
    workflow: { proofSubmitted: false, statsGenerated: false, endorsed: false },
    previewImage: assets.campaign,
    thumbnailTitle: 'LEVEL UP YOUR SKILLS',
    thumbnailMeta: '#ZetechPower',
    timelineLabel: 'Ends in',
    timelineValue: '5 days',
    creatorsLimit: 10,
    materials: [{ type: 'image', url: assets.campaign, label: 'Campaign creative' }]
  })
  await upsertWorkflowRecord(shops, 'seed-aisha-campus-shop', {
    studentId: student.id,
    name: "Aisha's Campus Shop",
    campus: 'Zetech University',
    status: 'open',
    score: 88
  })
  await upsertWorkflowRecord(wallets, 'seed-aisha-wallet', {
    ownerType: 'student',
    ownerId: student.id,
    currency: 'KES',
    availableBalance: 0,
    pendingBalance: 0
  })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => prisma.$disconnect())
    .catch(async (error) => {
      process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`)
      await prisma.$disconnect()
      process.exit(1)
    })
}

export {
  seedDatabase
}
