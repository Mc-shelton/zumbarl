import fs from 'node:fs/promises'
import path from 'node:path'
import { hashPassword } from '../lib/security.js'
import { prisma } from '../lib/prisma.js'
import { copyLocalSeedAsset } from '../adapters/storage/index.js'
import { createPrismaRecordRepository } from '../shared/repositories/index.js'

const projects = createPrismaRecordRepository('projects')

type SeedAssets = Awaited<ReturnType<typeof seedLocalFileAssets>>

const SKILL_CATEGORY_SEEDS = [
  {
    name: 'Marketing & Content',
    skills: ['Social Media', 'Content Creation', 'Content Strategy', 'Copywriting', 'Analytics', 'Video Editing', 'Reporting']
  },
  {
    name: 'Design & Product',
    skills: ['Graphic Design', 'UI/UX Design', 'Figma', 'Canva', 'Web Design', 'Prototyping']
  },
  {
    name: 'Events & Community',
    skills: ['Events', 'Communication', 'Client Communication', 'Campus Activation']
  },
  {
    name: 'Technology',
    skills: ['Web Development', 'Data Analysis', 'HTML', 'CSS']
  }
]

async function upsertWorkflowRecord(repository: ReturnType<typeof createPrismaRecordRepository>, seedKey: string, payload: Record<string, any>) {
  const existing = await repository.findByField('seedKey', seedKey)
  if (existing) return repository.updateById(existing.id, { ...payload, seedKey })
  return repository.create({ ...payload, seedKey })
}

function normalizeSkillName(name: string) {
  return name.trim().replace(/\s+/g, ' ')
}

function createSkillSlug(name: string) {
  return normalizeSkillName(name)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function ensureSeedSkill(skillName: string, categoryId?: string) {
  const name = normalizeSkillName(skillName)
  return prisma.skill.upsert({
    where: { slug: createSkillSlug(name) },
    update: {
      categoryId,
      status: 'active',
      source: 'seed',
      isSeed: true
    },
    create: {
      categoryId,
      name,
      slug: createSkillSlug(name),
      status: 'active',
      source: 'seed',
      isSeed: true
    }
  })
}

async function seedSkillsCatalog() {
  for (const categorySeed of SKILL_CATEGORY_SEEDS) {
    const categoryName = normalizeSkillName(categorySeed.name)
    const category = await prisma.skillCategory.upsert({
      where: { slug: createSkillSlug(categoryName) },
      update: {
        name: categoryName,
        status: 'active',
        isSeed: true
      },
      create: {
        name: categoryName,
        slug: createSkillSlug(categoryName),
        status: 'active',
        isSeed: true
      }
    })

    for (const skillName of categorySeed.skills) {
      await ensureSeedSkill(skillName, category.id)
    }
  }
}

async function syncSeedOpportunitySkills(opportunityId: string, skillNames: string[]) {
  for (const skillName of skillNames) {
    const skill = await ensureSeedSkill(skillName)
    await prisma.opportunitySkill.upsert({
      where: { opportunityId_skillId: { opportunityId, skillId: skill.id } },
      update: {
        required: true,
        source: 'seed'
      },
      create: {
        opportunityId,
        skillId: skill.id,
        required: true,
        source: 'seed'
      }
    })
  }
}

async function syncSeedStudentSkills(studentId: string, skillNames: string[]) {
  for (const skillName of skillNames) {
    const skill = await ensureSeedSkill(skillName)
    await prisma.studentSkill.upsert({
      where: { studentId_skillId: { studentId, skillId: skill.id } },
      update: {
        level: skillName === 'Social Media' || skillName === 'Graphic Design' ? 'ADVANCED' : 'INTERMEDIATE',
        verifiedByGigs: 3,
        source: 'seed'
      },
      create: {
        studentId,
        skillId: skill.id,
        level: skillName === 'Social Media' || skillName === 'Graphic Design' ? 'ADVANCED' : 'INTERMEDIATE',
        verifiedByGigs: 3,
        source: 'seed'
      }
    })
  }
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
      href: '/campus/opportunities/buy-sell?mode=services',
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
      meta: 'Opportunity',
      value: 'Explore',
      href: '/campus/opportunities',
      sortOrder: 6,
      tags: ['gig', 'job', 'work', 'content', 'creator', 'part-time', 'remote'],
      payload: { type: 'Opportunity', chip: 'Paid work', summary: 'Part-time weekend role. Capture reels and run event socials.' }
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
  const eventStart = new Date()
  eventStart.setDate(eventStart.getDate() + 7)
  eventStart.setHours(14, 0, 0, 0)
  const eventEnd = new Date(eventStart)
  eventEnd.setHours(17, 0, 0, 0)

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
        stockCount: 10,
        payload: {
          serviceMode: 'appointment',
          duration: '45 minutes',
          availabilityText: 'Weekdays, 9:00 AM–5:00 PM',
        },
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
        stockCount: 10,
        payload: {
          serviceMode: 'appointment',
          duration: '45 minutes',
          availabilityText: 'Weekdays, 9:00 AM–5:00 PM',
        },
      }
    }),
    prisma.marketplaceListing.upsert({
      where: { id: 'featured-macbook' },
      update: {
        shopId: shop.id,
        sellerId: studentId,
        campusId,
        title: 'MacBook Air M1',
        description: 'MacBook Air M1 in excellent condition. Lightly used for school and personal projects. Battery health is 95% and the original charger is included.',
        category: 'Electronics',
        listingType: 'PRODUCT',
        condition: 'Like New',
        priceAmount: 75000,
        currency: 'KES',
        images: [assets.event, assets.marketplace, assets.campaign, assets.marketplacePreview],
        deliveryOptions: ['Campus pickup'],
        status: 'ACTIVE',
        stockCount: 1,
        payload: {
          subtitle: 'Powerful. Portable. Perfect for students and creators.',
          brand: 'Apple',
          model: 'MacBook Air M1',
          storage: '256GB SSD',
          ram: '8GB',
          color: 'Space Gray',
          included: 'Charger, Original Box'
        }
      },
      create: {
        id: 'featured-macbook',
        shopId: shop.id,
        sellerId: studentId,
        campusId,
        title: 'MacBook Air M1',
        description: 'MacBook Air M1 in excellent condition. Lightly used for school and personal projects. Battery health is 95% and the original charger is included.',
        category: 'Electronics',
        listingType: 'PRODUCT',
        condition: 'Like New',
        priceAmount: 75000,
        currency: 'KES',
        images: [assets.event, assets.marketplace, assets.campaign, assets.marketplacePreview],
        deliveryOptions: ['Campus pickup'],
        stockCount: 1,
        payload: {
          subtitle: 'Powerful. Portable. Perfect for students and creators.',
          brand: 'Apple',
          model: 'MacBook Air M1',
          storage: '256GB SSD',
          ram: '8GB',
          color: 'Space Gray',
          included: 'Charger, Original Box'
        }
      }
    }),
    prisma.marketplaceListing.upsert({
      where: { id: 'featured-accounting-notes' },
      update: {
        shopId: shop.id,
        sellerId: studentId,
        campusId,
        title: 'Fundamentals of Accounting',
        description: 'Well maintained textbook and concise notes. Ideal for exam prep and revision groups.',
        category: 'Books & Notes',
        listingType: 'PRODUCT',
        condition: 'Used - Good',
        priceAmount: 1200,
        currency: 'KES',
        images: [assets.marketplacePreview, assets.marketplace, assets.event],
        deliveryOptions: ['Campus pickup'],
        locationLabel: 'Zetech University',
        status: 'ACTIVE',
        stockCount: 1,
        payload: {
          subtitle: 'Clean notes and textbook bundle for first-year accounting units.',
          brand: 'Pearson',
          model: 'Fundamentals of Accounting',
          color: 'Multicolor',
          included: 'Textbook + Notes',
          variants: [],
          negotiable: true,
          minimumOffer: 1000,
          pickupInstructions: 'Meet at the student centre during daytime hours.',
          returnPolicy: 'Inspect the bundle during handoff before confirming collection.'
        }
      },
      create: {
        id: 'featured-accounting-notes',
        shopId: shop.id,
        sellerId: studentId,
        campusId,
        title: 'Fundamentals of Accounting',
        description: 'Well maintained textbook and concise notes. Ideal for exam prep and revision groups.',
        category: 'Books & Notes',
        listingType: 'PRODUCT',
        condition: 'Used - Good',
        priceAmount: 1200,
        currency: 'KES',
        images: [assets.marketplacePreview, assets.marketplace, assets.event],
        deliveryOptions: ['Campus pickup'],
        locationLabel: 'Zetech University',
        status: 'ACTIVE',
        stockCount: 1,
        payload: {
          subtitle: 'Clean notes and textbook bundle for first-year accounting units.',
          brand: 'Pearson',
          model: 'Fundamentals of Accounting',
          color: 'Multicolor',
          included: 'Textbook + Notes',
          variants: [],
          negotiable: true,
          minimumOffer: 1000,
          pickupInstructions: 'Meet at the student centre during daytime hours.',
          returnPolicy: 'Inspect the bundle during handoff before confirming collection.'
        }
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
        startsAt: eventStart,
        endsAt: eventEnd,
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
        startsAt: eventStart,
        endsAt: eventEnd,
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
    where: { id: 'roadmap-social-media-creator' },
    update: {
      title: 'Digital Marketing Operator',
      slug: 'digital-marketer',
      description: 'Turn social campaigns, analytics and content evidence into business-ready campaign operations skills.',
      careerFamily: 'Marketing & Design',
      level: 'BEGINNER',
      estimatedWeeks: 6,
      coverImageUrl: assets.campaign,
      skills: ['Content Strategy', 'Canva', 'Analytics', 'Client Communication'],
      outcomes: ['Publish a portfolio-ready campaign', 'Submit analytics proof', 'Prepare for paid creator gigs'],
      campusId,
      status: 'PUBLISHED',
      sortOrder: 1,
      version: 1,
      intents: ['explore', 'earn-while-learning', 'attachment-readiness', 'internship-readiness', 'job-readiness'],
      evidenceWeight: 80,
      testWeight: 20,
      verificationThreshold: 90
    },
    create: {
      id: 'roadmap-social-media-creator',
      campusId,
      title: 'Digital Marketing Operator',
      slug: 'digital-marketer',
      description: 'Turn social campaigns, analytics and content evidence into business-ready campaign operations skills.',
      careerFamily: 'Marketing & Design',
      level: 'BEGINNER',
      estimatedWeeks: 6,
      coverImageUrl: assets.campaign,
      skills: ['Content Strategy', 'Canva', 'Analytics', 'Client Communication'],
      outcomes: ['Publish a portfolio-ready campaign', 'Submit analytics proof', 'Prepare for paid creator gigs'],
      sortOrder: 1,
      version: 1,
      intents: ['explore', 'earn-while-learning', 'attachment-readiness', 'internship-readiness', 'job-readiness'],
      evidenceWeight: 80,
      testWeight: 20,
      verificationThreshold: 90
    }
  })

  const steps = [
    {
      id: 'roadmap-step-content-pillars',
      title: 'Define content pillars',
      description: 'Choose awareness, proof and conversion pillars for a campaign.',
      stepType: 'LEARNING',
      estimatedHours: 2,
      assessment: [
        { id: 'pillars-purpose', prompt: 'What should a content pillar connect?', options: ['Audience need and campaign goal', 'Only the visual colour', 'Only posting frequency'], correctAnswer: 'Audience need and campaign goal' },
        { id: 'pillars-measure', prompt: 'Which signal best validates a conversion pillar?', options: ['A defined action and measurable result', 'A trending sound', 'A longer caption'], correctAnswer: 'A defined action and measurable result' }
      ],
      sortOrder: 1
    },
    {
      id: 'roadmap-step-campaign-assets',
      title: 'Create a mini campaign asset set',
      description: 'Design three posts and one short-form video concept from a brief.',
      stepType: 'PROJECT',
      evidenceType: 'PORTFOLIO_ASSET',
      estimatedHours: 6,
      assessment: [
        { id: 'assets-consistency', prompt: 'What makes an asset set campaign-ready?', options: ['Consistent message, format and CTA', 'Using every font available', 'Removing the campaign objective'], correctAnswer: 'Consistent message, format and CTA' },
        { id: 'assets-accessibility', prompt: 'Which practice improves social asset accessibility?', options: ['Readable contrast and captions', 'Smaller body text', 'Text embedded only in video'], correctAnswer: 'Readable contrast and captions' }
      ],
      sortOrder: 2
    },
    {
      id: 'roadmap-step-analytics-proof',
      title: 'Submit analytics proof',
      description: 'Prepare a simple reach, engagement and learning report.',
      stepType: 'PORTFOLIO',
      evidenceType: 'REPORT',
      estimatedHours: 3,
      assessment: [
        { id: 'analytics-insight', prompt: 'A useful campaign insight should connect a metric to what?', options: ['A decision or next action', 'A decorative chart colour', 'The longest possible report'], correctAnswer: 'A decision or next action' },
        { id: 'analytics-quality', prompt: 'Which report is most credible?', options: ['One with source, period and metric definitions', 'One with rounded numbers only', 'One without a date range'], correctAnswer: 'One with source, period and metric definitions' }
      ],
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

  const competencySeeds = [
    { id: 'competency-content-pillars', slug: 'define-audience-content-pillars', name: 'Define audience-led content pillars', description: 'Connect audience needs, campaign goals and measurable content themes.', level: 'FOUNDATION', skillName: 'Content Strategy', stepId: 'roadmap-step-content-pillars' },
    { id: 'competency-campaign-assets', slug: 'build-campaign-asset-set', name: 'Build a campaign-ready asset set', description: 'Create consistent, accessible assets from a campaign brief.', level: 'PRACTITIONER', skillName: 'Canva', stepId: 'roadmap-step-campaign-assets' },
    { id: 'competency-campaign-analytics', slug: 'interpret-campaign-analytics', name: 'Interpret campaign analytics', description: 'Turn verified reach and engagement data into a clear business recommendation.', level: 'PRACTITIONER', skillName: 'Analytics', stepId: 'roadmap-step-analytics-proof' }
  ]
  for (const item of competencySeeds) {
    const skill = await ensureSeedSkill(item.skillName)
    const competency = await prisma.competency.upsert({
      where: { slug: item.slug },
      update: { skillId: skill.id, name: item.name, description: item.description, level: item.level, status: 'ACTIVE' },
      create: { id: item.id, skillId: skill.id, slug: item.slug, name: item.name, description: item.description, level: item.level }
    })
    await prisma.careerRoadmapStepCompetency.upsert({
      where: { stepId_competencyId: { stepId: item.stepId, competencyId: competency.id } },
      update: { weight: 1, requiredScore: 70 },
      create: { stepId: item.stepId, competencyId: competency.id, weight: 1, requiredScore: 70 }
    })
  }

  const resourceSeeds = [
    {
      id: 'resource-content-pillars-primer',
      stepId: 'roadmap-step-content-pillars',
      title: 'Audience and content pillars primer',
      description: 'A practical worksheet for mapping audience needs to campaign themes.',
      type: 'GUIDE',
      content: {
        durationMinutes: 18,
        objectives: ['Define a specific audience', 'Connect each pillar to a campaign goal', 'Choose a measurable signal for every pillar'],
        sections: [
          { heading: 'Start with the audience problem', body: 'A useful pillar begins with a repeated audience need, question or behaviour—not with a preferred post format.', example: 'First-year students need simple, trustworthy answers about managing their first semester budget.' },
          { heading: 'Give every pillar a job', body: 'Use a balanced set of pillars: awareness introduces the problem, proof builds confidence, and conversion asks for a meaningful next action.', example: 'Budget basics → student success stories → download the weekly planner.' },
          { heading: 'Attach a signal', body: 'Decide how you will know whether the pillar worked before publishing. Use saves or qualified comments for usefulness, and completed actions for conversion.', example: 'Proof pillar: saves and profile visits. Conversion pillar: completed planner downloads.' }
        ]
      },
      practice: {
        title: 'Build a three-pillar campaign map',
        instructions: 'Choose a real campus audience or business brief. Your answers will become reviewable checkpoint evidence.',
        fields: [
          { id: 'audience', label: 'Who exactly is the audience?', prompt: 'Describe one specific group and the situation they are in.', placeholder: 'First-year students living away from home for the first time…' },
          { id: 'goal', label: 'What should change?', prompt: 'State the campaign outcome in one measurable sentence.', placeholder: 'Help 100 students start and maintain a weekly budget…' },
          { id: 'awarenessPillar', label: 'Awareness pillar', prompt: 'Name the theme and explain the audience problem it addresses.', placeholder: 'Money basics: explain common first-semester spending traps…' },
          { id: 'proofPillar', label: 'Proof pillar', prompt: 'Show what evidence or story will build confidence.', placeholder: 'Real student budget makeovers with before-and-after examples…' },
          { id: 'conversionPillar', label: 'Action pillar', prompt: 'Define the action you want the audience to take.', placeholder: 'Download and complete the seven-day budget planner…' },
          { id: 'measurement', label: 'How will you measure it?', prompt: 'Assign at least one useful signal to each pillar.', placeholder: 'Awareness: saves; proof: profile visits; action: planner downloads…' }
        ]
      }
    },
    {
      id: 'resource-campaign-asset-lab',
      stepId: 'roadmap-step-campaign-assets',
      title: 'Campaign asset consistency lab',
      description: 'Practice turning one brief into a coherent social asset set.',
      type: 'LAB',
      content: {
        durationMinutes: 25,
        objectives: ['Translate one message across formats', 'Keep hierarchy and call-to-action consistent', 'Apply basic accessibility checks'],
        sections: [
          { heading: 'Extract the message first', body: 'Write one audience, one promise and one action before opening a design tool.', example: 'For new students: plan your first month confidently—download the free weekly budget.' },
          { heading: 'Design a system, not isolated posts', body: 'Reuse type hierarchy, colour roles, spacing and imagery so every asset is recognisably part of the same campaign.', example: 'One headline scale, one proof style and one CTA treatment across feed, story and WhatsApp assets.' },
          { heading: 'Check accessibility', body: 'Use readable contrast, concise text, captions for video and meaningful alternative descriptions.', example: 'Keep essential instructions out of image-only text and provide captions for spoken content.' }
        ]
      },
      practice: {
        title: 'Plan a coherent asset set',
        instructions: 'Turn your checkpoint campaign into a small production-ready asset plan.',
        fields: [
          { id: 'message', label: 'Core campaign message', prompt: 'Write the audience, promise and action in one sentence.', placeholder: 'For… we help… so that…' },
          { id: 'formats', label: 'Three asset formats', prompt: 'List each format and the role it plays.', placeholder: 'Feed carousel—teach; story—show proof; WhatsApp card—drive action…' },
          { id: 'visualSystem', label: 'Visual system', prompt: 'Define hierarchy, colour roles, imagery and repeated elements.', placeholder: 'Headline 32px bold; deep purple for teaching; green for proof…' },
          { id: 'accessibility', label: 'Accessibility check', prompt: 'Explain contrast, captions and text alternatives.', placeholder: 'All text meets readable contrast; video includes open captions…' },
          { id: 'cta', label: 'Call to action', prompt: 'Write the exact action and destination.', placeholder: 'Download the seven-day planner at…' }
        ]
      }
    },
    {
      id: 'resource-analytics-proof-template',
      stepId: 'roadmap-step-analytics-proof',
      title: 'Verified analytics report template',
      description: 'Capture source, period, definitions, insights and recommended actions.',
      type: 'TEMPLATE',
      content: {
        durationMinutes: 20,
        objectives: ['Document trustworthy metric sources', 'Separate observation from insight', 'Turn results into a decision'],
        sections: [
          { heading: 'Make the data auditable', body: 'Always record the platform, reporting period and metric definitions alongside screenshots or exports.', example: 'Instagram Insights, 1–14 August, reach = unique accounts shown content.' },
          { heading: 'Move from metric to insight', body: 'An observation states what happened. An insight explains why it matters for the campaign goal.', example: 'Saves rose 40% on checklist posts, suggesting the audience values reusable planning content.' },
          { heading: 'Recommend one next action', body: 'Use the strongest evidence to make a specific decision for the next campaign cycle.', example: 'Publish two checklist carousels weekly and test the planner CTA in the final slide.' }
        ]
      },
      practice: {
        title: 'Write an evidence-based campaign review',
        instructions: 'Use real campaign analytics or the latest verified Zumbarl campaign data available to you.',
        fields: [
          { id: 'source', label: 'Data source and period', prompt: 'Name the platform, date range and evidence location.', placeholder: 'Instagram Insights, 1–14 August, screenshot saved in campaign proof…' },
          { id: 'goal', label: 'Campaign goal', prompt: 'State the outcome the campaign was designed to influence.', placeholder: 'Increase qualified visits to the planner landing page…' },
          { id: 'metrics', label: 'Key metrics', prompt: 'List the metrics with their definitions and values.', placeholder: 'Reach: 12,400 unique accounts; link visits: 310…' },
          { id: 'insight', label: 'Main insight', prompt: 'Explain what the results mean—not only what happened.', placeholder: 'Checklist content produced more high-intent saves and visits…' },
          { id: 'recommendation', label: 'Recommended action', prompt: 'Propose one specific change for the next cycle.', placeholder: 'Increase checklist frequency and test a clearer final-slide CTA…' }
        ]
      }
    }
  ]
  for (const [index, item] of resourceSeeds.entries()) {
    const resource = await prisma.learningResource.upsert({
      where: { id: item.id },
      update: { title: item.title, description: item.description, resourceType: item.type, provider: 'Zumbarl', status: 'PUBLISHED', content: item.content, practice: item.practice },
      create: { id: item.id, title: item.title, description: item.description, resourceType: item.type, provider: 'Zumbarl', content: item.content, practice: item.practice }
    })
    await prisma.careerRoadmapStepResource.upsert({
      where: { stepId_resourceId: { stepId: item.stepId, resourceId: resource.id } },
      update: { sortOrder: index + 1 },
      create: { stepId: item.stepId, resourceId: resource.id, sortOrder: index + 1 }
    })
  }

  await prisma.roadmapStepPrerequisite.upsert({
    where: { stepId_prerequisiteStepId: { stepId: 'roadmap-step-campaign-assets', prerequisiteStepId: 'roadmap-step-content-pillars' } },
    update: {},
    create: { stepId: 'roadmap-step-campaign-assets', prerequisiteStepId: 'roadmap-step-content-pillars' }
  })
  await prisma.roadmapStepPrerequisite.upsert({
    where: { stepId_prerequisiteStepId: { stepId: 'roadmap-step-analytics-proof', prerequisiteStepId: 'roadmap-step-campaign-assets' } },
    update: {},
    create: { stepId: 'roadmap-step-analytics-proof', prerequisiteStepId: 'roadmap-step-campaign-assets' }
  })

  const enrollment = await prisma.studentRoadmapEnrollment.upsert({
    where: { studentId_roadmapId: { studentId, roadmapId: roadmap.id } },
    update: {
      status: 'COMPLETED',
      progressPercent: 100,
      currentStepOrder: steps.length,
      completedStepIds: steps.map((step) => step.id),
      intent: 'earn-while-learning',
      lockedAt: new Date(),
      completedAt: new Date(),
      verifiedAt: new Date()
    },
    create: {
      studentId,
      roadmapId: roadmap.id,
      status: 'COMPLETED',
      progressPercent: 100,
      currentStepOrder: steps.length,
      completedStepIds: steps.map((step) => step.id),
      intent: 'earn-while-learning',
      lockedAt: new Date(),
      completedAt: new Date(),
      verifiedAt: new Date()
    }
  })

  for (const step of steps) {
    await prisma.studentRoadmapStepProgress.upsert({
      where: { enrollmentId_stepId: { enrollmentId: enrollment.id, stepId: step.id } },
      update: { evidenceScore: 80, testScore: 20, status: 'COMPLETED', completedAt: new Date() },
      create: { enrollmentId: enrollment.id, stepId: step.id, evidenceScore: 80, testScore: 20, status: 'COMPLETED', completedAt: new Date() }
    })
  }
  await prisma.roadmapEvidence.upsert({
    where: { id: 'evidence-aisha-social-campaign' },
    update: { enrollmentId: enrollment.id, stepId: 'roadmap-step-content-pillars', studentId, competencyId: 'competency-content-pillars', sourceType: 'PORTFOLIO', sourceId: 'portfolio-social-campaign', verificationStatus: 'VERIFIED', scoreAwarded: 64, verifiedAt: new Date() },
    create: { id: 'evidence-aisha-social-campaign', enrollmentId: enrollment.id, stepId: 'roadmap-step-content-pillars', studentId, competencyId: 'competency-content-pillars', sourceType: 'PORTFOLIO', sourceId: 'portfolio-social-campaign', note: 'Verified campaign planning and content strategy portfolio evidence.', verificationStatus: 'VERIFIED', scoreAwarded: 64, verifiedAt: new Date() }
  })
}

async function seedKnowledgeHub(studentId: string, campusId: string, assets: SeedAssets) {
  const [brian, grace] = await Promise.all([
    prisma.studentProfile.findFirst({ where: { user: { email: 'brian.otieno@zumbarl.test' } } }),
    prisma.studentProfile.findFirst({ where: { user: { email: 'grace.wanjiku@zumbarl.test' } } })
  ])
  const libraryOwnerId = brian?.id || studentId
  const groupOwnerId = grace?.id || studentId
  const library = await prisma.knowledgeSpace.upsert({
    where: { slug: 'zetech-digital-library' },
    update: { ownerStudentId: libraryOwnerId, campusId, membershipMode: 'REQUEST', status: 'ACTIVE' },
    create: {
      id: 'knowledge-space-zetech-library',
      ownerStudentId: libraryOwnerId,
      campusId,
      type: 'LIBRARY',
      name: 'Zetech Digital Library',
      slug: 'zetech-digital-library',
      description: 'Student-curated past papers, course books and revision notes for the whole campus.',
      membershipMode: 'REQUEST',
      visibility: 'CAMPUS',
      coverImageUrl: assets.campaign
    }
  })
  const group = await prisma.knowledgeSpace.upsert({
    where: { slug: 'business-and-marketing-study-circle' },
    update: { ownerStudentId: groupOwnerId, campusId, membershipMode: 'REQUEST', status: 'ACTIVE' },
    create: {
      id: 'knowledge-space-marketing-circle',
      ownerStudentId: groupOwnerId,
      campusId,
      type: 'GROUP',
      name: 'Business & Marketing Study Circle',
      slug: 'business-and-marketing-study-circle',
      description: 'Weekly peer revision, reading lists and shared campaign case studies.',
      membershipMode: 'REQUEST',
      visibility: 'CAMPUS',
      coverImageUrl: assets.event
    }
  })
  for (const [space, ownerId] of [[library, libraryOwnerId], [group, groupOwnerId]] as const) {
    await prisma.knowledgeSpaceMembership.upsert({
      where: { spaceId_studentId: { spaceId: space.id, studentId: ownerId } },
      update: { role: 'OWNER', status: 'ACTIVE' },
      create: { spaceId: space.id, studentId: ownerId, role: 'OWNER', status: 'ACTIVE' }
    })
  }
  await prisma.knowledgeSpaceMembership.upsert({
    where: { spaceId_studentId: { spaceId: library.id, studentId } },
    update: { status: 'ACTIVE' },
    create: { spaceId: library.id, studentId, status: 'ACTIVE' }
  })
  await prisma.knowledgeSpaceFollower.upsert({
    where: { spaceId_studentId: { spaceId: group.id, studentId } },
    update: {},
    create: { spaceId: group.id, studentId }
  })
  const resourceSeeds = [
    {
      id: 'knowledge-past-paper-bbit-2025', ownerStudentId: libraryOwnerId, spaceId: library.id,
      title: 'BBIT Database Systems Past Paper', description: 'End-semester paper with a student-reviewed topic guide.',
      resourceType: 'PAST_PAPER', accessMode: 'FREE_READ', subject: 'Database Systems', courseCode: 'BBIT 2204', academicYear: 2025,
      institution: 'Zetech University', previewText: 'Topics covered: relational design, SQL queries, normalization and transaction management.', coverImageUrl: assets.campaign
    },
    {
      id: 'knowledge-book-marketing-research', ownerStudentId: libraryOwnerId, spaceId: library.id,
      title: 'Marketing Research Essentials', description: 'A physical course companion available for two-week borrowing.',
      resourceType: 'BOOK', accessMode: 'BORROW', subject: 'Marketing', courseCode: 'BMK 2102', academicYear: 2024,
      institution: 'Zetech University', previewText: 'A practical introduction to research questions, sampling and interpreting market evidence.', availableCopies: 3, coverImageUrl: assets.marketplace
    },
    {
      id: 'knowledge-notes-accounting', ownerStudentId: studentId, spaceId: library.id,
      title: 'Financial Accounting Revision Notes', description: 'Concise worked examples contributed by Aisha Mwangi.',
      resourceType: 'NOTES', accessMode: 'BUY', subject: 'Financial Accounting', courseCode: 'BAC 1101', academicYear: 2026,
      institution: 'Zetech University', previewText: 'Worked examples for journals, ledgers, trial balances and financial statements.', price: 150, coverImageUrl: assets.launch
    },
    {
      id: 'knowledge-guide-content-strategy', ownerStudentId: groupOwnerId, spaceId: group.id,
      title: 'Campus Campaign Content Strategy Guide', description: 'The study circle’s shared campaign planning guide.',
      resourceType: 'STUDY_GUIDE', accessMode: 'MEMBERS_ONLY', subject: 'Content Strategy', courseCode: 'BMC 2301', academicYear: 2026,
      institution: 'Zetech University', previewText: 'A repeatable framework for audience research, content pillars, production and campaign learning.', coverImageUrl: assets.event
    }
  ]
  for (const resource of resourceSeeds) {
    await prisma.knowledgeResource.upsert({ where: { id: resource.id }, update: resource, create: resource })
  }
  await prisma.knowledgeResourceAccess.upsert({
    where: { resourceId_studentId_action: { resourceId: 'knowledge-past-paper-bbit-2025', studentId, action: 'SAVE' } },
    update: { status: 'ACTIVE' },
    create: { resourceId: 'knowledge-past-paper-bbit-2025', studentId, action: 'SAVE', status: 'ACTIVE' }
  })
}

async function seedDatabase() {
  await seedSkillsCatalog()

  const campus = await prisma.campus.upsert({
    where: { id: 'campus-zetech-university' },
    update: { name: 'Zetech University', city: 'Nairobi', isActive: true },
    create: {
      id: 'campus-zetech-university',
      name: 'Zetech University',
      city: 'Nairobi'
    }
  })
  const kenyattaCampus = await prisma.campus.upsert({
    where: { id: 'campus-kenyatta-university' },
    update: {
      name: 'Kenyatta University',
      city: 'Nairobi',
      locationLabel: 'Kahawa, Nairobi',
      latitude: -1.1802,
      longitude: 36.9275,
      isActive: true
    },
    create: {
      id: 'campus-kenyatta-university',
      name: 'Kenyatta University',
      city: 'Nairobi',
      locationLabel: 'Kahawa, Nairobi',
      latitude: -1.1802,
      longitude: 36.9275
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
      role: 'STUDENT_TRANSITION',
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
      role: 'STUDENT_TRANSITION',
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
      role: 'COMPANY_PIPELINE_PARTNER',
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
      role: 'COMPANY_PIPELINE_PARTNER',
      isActive: true
    }
  })
  const adminUser = await prisma.user.upsert({
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

  const kenyattaProfile = await prisma.managedProfile.upsert({
    where: { slug: 'kenyatta-university-official' },
    update: {
      type: 'campus',
      name: 'Kenyatta University Official',
      handle: 'KU_Official',
      campusId: kenyattaCampus.id,
      locationLabel: 'Kahawa, Nairobi',
      websiteUrl: 'https://www.ku.ac.ke',
      email: 'info@ku.ac.ke',
      details: {
        tagline: 'Discover. Learn. Innovate.',
        studentLife: ['Clubs & societies', 'Sports & recreation', 'Arts & culture', 'Community outreach'],
        services: ['Student affairs', 'Academic support', 'Health services', 'Security and safety'],
        facilities: ['Library', 'Innovation hub', 'Sports facilities', 'Chandaria Auditorium'],
        importantContacts: [{ label: 'General enquiries', value: '+254 20 8703000' }, { label: 'Security hotline', value: '+254 725 471 487' }]
      },
      isVerified: true,
      status: 'active'
    },
    create: {
      id: 'profile-kenyatta-university-official',
      type: 'campus',
      slug: 'kenyatta-university-official',
      name: 'Kenyatta University Official',
      handle: 'KU_Official',
      bio: 'The official Kenyatta University campus profile on Zumbarl.',
      campusId: kenyattaCampus.id,
      locationLabel: 'Kahawa, Nairobi',
      websiteUrl: 'https://www.ku.ac.ke',
      email: 'info@ku.ac.ke',
      details: {
        tagline: 'Discover. Learn. Innovate.',
        studentLife: ['Clubs & societies', 'Sports & recreation', 'Arts & culture', 'Community outreach'],
        services: ['Student affairs', 'Academic support', 'Health services', 'Security and safety'],
        facilities: ['Library', 'Innovation hub', 'Sports facilities', 'Chandaria Auditorium'],
        importantContacts: [{ label: 'General enquiries', value: '+254 20 8703000' }, { label: 'Security hotline', value: '+254 725 471 487' }]
      },
      isVerified: true
    }
  })
  await prisma.managedProfileManager.upsert({
    where: { managedProfileId_userId: { managedProfileId: kenyattaProfile.id, userId: adminUser.id } },
    update: { role: 'owner' },
    create: { managedProfileId: kenyattaProfile.id, userId: adminUser.id, role: 'owner' }
  })
  await prisma.connectPost.upsert({
    where: { id: 'post-ku-innovation-summit' },
    update: {
      managedProfileId: kenyattaProfile.id,
      studentId: null,
      type: 'event',
      body: 'The 3rd Annual Innovation & Entrepreneurship Summit is here! Join industry leaders, alumni and students as we shape the future together.',
      visibility: 'public',
      status: 'published',
      payload: {
        seedKey: 'ku-innovation-summit',
        isPinnedAnnouncement: true,
        eventDate: '2024-05-24',
        eventTime: '9:00 AM - 4:00 PM',
        venue: 'Chandaria Auditorium',
        announcementRequest: { status: 'approved', targetType: 'campus', targetId: kenyattaCampus.id }
      }
    },
    create: {
      id: 'post-ku-innovation-summit',
      managedProfileId: kenyattaProfile.id,
      type: 'event',
      body: 'The 3rd Annual Innovation & Entrepreneurship Summit is here! Join industry leaders, alumni and students as we shape the future together.',
      visibility: 'public',
      status: 'published',
      reactions: {},
      saves: 0,
      reposts: 0,
      payload: {
        seedKey: 'ku-innovation-summit',
        isPinnedAnnouncement: true,
        eventDate: '2024-05-24',
        eventTime: '9:00 AM - 4:00 PM',
        venue: 'Chandaria Auditorium',
        announcementRequest: { status: 'approved', targetType: 'campus', targetId: kenyattaCampus.id }
      }
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
      kycStatus: 'APPROVED',
      transitionUnlockedAt: new Date()
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
      kycStatus: 'APPROVED',
      transitionUnlockedAt: new Date()
    }
  })

  await prisma.connectProfile.upsert({
    where: { studentId: student.id },
    update: {
      payload: {
        socialAccounts: [
          {
            platform: 'Instagram',
            handle: '@aisha_creates',
            followers: 12500,
            averageLikes: 3000,
            averageEngagement: 4000,
            verified: true
          },
          {
            platform: 'TikTok',
            handle: '@aisha_creates',
            followers: 18900,
            averageLikes: 3000,
            averageEngagement: 4000,
            verified: true
          }
        ]
      }
    },
    create: {
      studentId: student.id,
      interests: ['Content creation', 'Digital marketing'],
      payload: {
        socialAccounts: [
          {
            platform: 'Instagram',
            handle: '@aisha_creates',
            followers: 12500,
            averageLikes: 3000,
            averageEngagement: 4000,
            verified: true
          },
          {
            platform: 'TikTok',
            handle: '@aisha_creates',
            followers: 18900,
            averageLikes: 3000,
            averageEngagement: 4000,
            verified: true
          }
        ]
      }
    }
  })

  const candidatePasswordHash = await hashPassword('password123')
  const projectTeamCandidateSeeds = [
    {
      email: 'brian.otieno@zumbarl.test',
      firstName: 'Brian',
      lastName: 'Otieno',
      phone: '+254700100011',
      skills: ['Graphic Design', 'Canva', 'Content Creation']
    },
    {
      email: 'grace.wanjiku@zumbarl.test',
      firstName: 'Grace',
      lastName: 'Wanjiku',
      phone: '+254700100012',
      skills: ['Copywriting', 'Content Strategy', 'Social Media']
    },
    {
      email: 'kevin.mutua@zumbarl.test',
      firstName: 'Kevin',
      lastName: 'Mutua',
      phone: '+254700100013',
      skills: ['Video Editing', 'Analytics', 'Reporting']
    }
  ]

  for (const candidateSeed of projectTeamCandidateSeeds) {
    const name = `${candidateSeed.firstName} ${candidateSeed.lastName}`
    const candidateUser = await prisma.user.upsert({
      where: { email: candidateSeed.email },
      update: {
        name,
        firstName: candidateSeed.firstName,
        lastName: candidateSeed.lastName,
        passwordHash: candidatePasswordHash,
        role: 'STUDENT_STANDARD',
        isActive: true
      },
      create: {
        email: candidateSeed.email,
        name,
        firstName: candidateSeed.firstName,
        lastName: candidateSeed.lastName,
        username: `${candidateSeed.firstName}_${candidateSeed.lastName}`.toLowerCase(),
        phone: candidateSeed.phone,
        passwordHash: candidatePasswordHash,
        role: 'STUDENT_STANDARD',
        isActive: true
      }
    })
    const candidateProfile = await prisma.studentProfile.upsert({
      where: { userId: candidateUser.id },
      update: {
        firstName: candidateSeed.firstName,
        lastName: candidateSeed.lastName,
        campusId: campus.id,
        courseId: course.id,
        avatarUrl: assets.avatar,
        isOpenToHire: true,
        kycStatus: 'APPROVED'
      },
      create: {
        userId: candidateUser.id,
        firstName: candidateSeed.firstName,
        lastName: candidateSeed.lastName,
        dateOfBirth: new Date('2000-01-01T00:00:00.000Z'),
        campusId: campus.id,
        courseId: course.id,
        yearJoined: new Date().getFullYear() - 2,
        courseDuration: course.duration,
        expectedGraduation: new Date(`${new Date().getFullYear() + 2}-12-31T00:00:00.000Z`),
        bio: `${name} is available for collaborative student projects.`,
        careerPath: 'Marketing & Design',
        avatarUrl: assets.avatar,
        isOpenToHire: true,
        kycStatus: 'APPROVED'
      }
    })
    await syncSeedStudentSkills(candidateProfile.id, candidateSeed.skills)
  }

  const business = await prisma.company.upsert({
    where: { registrationNumber: 'ZETECH-STUDIOS-SEED' },
    update: {
      name: 'Zetech Studios',
      sector: 'Marketing',
      size: '2-10',
      description: 'Student-facing creative studio running practical digital campaigns.',
      kycStatus: 'APPROVED',
      isPipelinePartner: true
    },
    create: {
      name: 'Zetech Studios',
      registrationNumber: 'ZETECH-STUDIOS-SEED',
      sector: 'Marketing',
      size: '2-10',
      description: 'Student-facing creative studio running practical digital campaigns.',
      kycStatus: 'APPROVED',
      isPipelinePartner: true
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
  const evergreenValidFrom = new Date()
  const evergreenValidUntil = new Date(evergreenValidFrom)
  evergreenValidUntil.setFullYear(evergreenValidUntil.getFullYear() + 1)

  await prisma.placementAvailability.upsert({
    where: { studentId: student.id },
    update: {
      isSeeking: true,
      placementTypes: ['INTERNSHIP', 'ATTACHMENT', 'FULL_TIME', 'CONTRACT'],
      earliestStartDate: evergreenValidFrom,
      latestStartDate: evergreenValidUntil,
      locations: [],
      workModes: ['REMOTE', 'HYBRID', 'ONSITE'],
      roleInterests: ['Content Creator', 'Social Media Manager', 'Digital Marketing'],
      consentVersion: 'evergreen-seed-v1',
      companyVisibleFields: ['name', 'avatarUrl', 'campus', 'course', 'careerPath', 'skills', 'competencies', 'portfolio'],
      consentedAt: evergreenValidFrom,
      visibleFrom: evergreenValidFrom,
      pausedAt: null,
      expiresAt: evergreenValidUntil
    },
    create: {
      studentId: student.id,
      isSeeking: true,
      placementTypes: ['INTERNSHIP', 'ATTACHMENT', 'FULL_TIME', 'CONTRACT'],
      earliestStartDate: evergreenValidFrom,
      latestStartDate: evergreenValidUntil,
      locations: [],
      workModes: ['REMOTE', 'HYBRID', 'ONSITE'],
      roleInterests: ['Content Creator', 'Social Media Manager', 'Digital Marketing'],
      consentVersion: 'evergreen-seed-v1',
      companyVisibleFields: ['name', 'avatarUrl', 'campus', 'course', 'careerPath', 'skills', 'competencies', 'portfolio'],
      consentedAt: evergreenValidFrom,
      visibleFrom: evergreenValidFrom,
      expiresAt: evergreenValidUntil
    }
  })

  await prisma.evergreenOverride.upsert({
    where: { id: 'evergreen-seed-zetech-qualification' },
    update: {
      subjectType: 'COMPANY',
      subjectId: business.id,
      policy: 'COMPANY_QUALIFICATION',
      reason: 'Seeded qualification override for the Evergreen end-to-end test company.',
      approvedById: adminUser.id,
      status: 'ACTIVE',
      expiresAt: evergreenValidUntil,
      revokedAt: null,
      revokedById: null
    },
    create: {
      id: 'evergreen-seed-zetech-qualification',
      subjectType: 'COMPANY',
      subjectId: business.id,
      policy: 'COMPANY_QUALIFICATION',
      reason: 'Seeded qualification override for the Evergreen end-to-end test company.',
      approvedById: adminUser.id,
      status: 'ACTIVE',
      expiresAt: evergreenValidUntil
    }
  })

  await prisma.evergreenEntitlement.upsert({
    where: { id: 'evergreen-seed-zetech-entitlement' },
    update: {
      companyId: business.id,
      planCode: 'EVERGREEN_TEST_PARTNER',
      status: 'ACTIVE',
      programLimit: 5,
      seatLimit: 25,
      validFrom: evergreenValidFrom,
      validUntil: evergreenValidUntil,
      sourceType: 'SEED_TEST_DATA',
      sourceReference: 'evergreen-seed-zetech-qualification',
      confirmedById: adminUser.id,
      confirmedAt: evergreenValidFrom
    },
    create: {
      id: 'evergreen-seed-zetech-entitlement',
      companyId: business.id,
      planCode: 'EVERGREEN_TEST_PARTNER',
      status: 'ACTIVE',
      programLimit: 5,
      seatLimit: 25,
      validFrom: evergreenValidFrom,
      validUntil: evergreenValidUntil,
      sourceType: 'SEED_TEST_DATA',
      sourceReference: 'evergreen-seed-zetech-qualification',
      confirmedById: adminUser.id,
      confirmedAt: evergreenValidFrom
    }
  })
  const businessProfile = await prisma.managedProfile.upsert({
    where: { slug: 'zetech-studios' },
    update: { type: 'business', name: business.name, handle: 'zetech_studios', companyId: business.id, bio: business.description, isVerified: true, details: { sector: business.sector, size: business.size, services: ['Digital campaigns', 'Creative production'], studentEngagement: ['Paid gigs', 'Internships', 'Portfolio projects'], partnershipTypes: ['Recruitment', 'Events', 'Student projects'] } },
    create: { type: 'business', slug: 'zetech-studios', name: business.name, handle: 'zetech_studios', companyId: business.id, bio: business.description, isVerified: true, details: { sector: business.sector, size: business.size, services: ['Digital campaigns', 'Creative production'], studentEngagement: ['Paid gigs', 'Internships', 'Portfolio projects'], partnershipTypes: ['Recruitment', 'Events', 'Student projects'] } }
  })
  await prisma.managedProfileManager.upsert({ where: { managedProfileId_userId: { managedProfileId: businessProfile.id, userId: businessUser.id } }, update: { role: 'owner' }, create: { managedProfileId: businessProfile.id, userId: businessUser.id, role: 'owner' } })

  const innovationClub = await prisma.communityGroup.upsert({ where: { id: 'group-ku-innovation-club' }, update: { name: 'KU Innovation & Design Club', category: 'club', campus: kenyattaCampus.name, status: 'active' }, create: { id: 'group-ku-innovation-club', name: 'KU Innovation & Design Club', category: 'club', purpose: 'Turn student ideas into practical innovations.', campus: kenyattaCampus.name } })
  const innovationProfile = await prisma.managedProfile.upsert({ where: { slug: 'ku-innovation-design-club' }, update: { type: 'club', name: innovationClub.name, handle: 'ku_innovation', communityGroupId: innovationClub.id, isVerified: true, details: { purpose: innovationClub.purpose, eligibility: 'Open to all Kenyatta University students', patron: 'Directorate of Student Affairs', meetingSchedule: 'Fridays · 4:00 PM', membership: { status: 'open', memberCount: 42 }, focusAreas: ['Innovation', 'Design', 'Entrepreneurship'], governance: ['Chairperson', 'Vice chairperson', 'Secretary', 'Treasurer'], requirements: ['Registered student', 'Accept the club constitution'] } }, create: { type: 'club', slug: 'ku-innovation-design-club', name: innovationClub.name, handle: 'ku_innovation', communityGroupId: innovationClub.id, isVerified: true, details: { purpose: innovationClub.purpose, eligibility: 'Open to all Kenyatta University students', patron: 'Directorate of Student Affairs', meetingSchedule: 'Fridays · 4:00 PM', membership: { status: 'open', memberCount: 42 }, focusAreas: ['Innovation', 'Design', 'Entrepreneurship'], governance: ['Chairperson', 'Vice chairperson', 'Secretary', 'Treasurer'], requirements: ['Registered student', 'Accept the club constitution'] } } })
  await prisma.managedProfileManager.upsert({ where: { managedProfileId_userId: { managedProfileId: innovationProfile.id, userId: adminUser.id } }, update: { role: 'owner' }, create: { managedProfileId: innovationProfile.id, userId: adminUser.id, role: 'owner' } })

  const welfareAssociation = await prisma.communityGroup.upsert({ where: { id: 'group-ku-student-welfare-association' }, update: { name: 'KU Student Welfare Association', category: 'association', campus: kenyattaCampus.name, status: 'active' }, create: { id: 'group-ku-student-welfare-association', name: 'KU Student Welfare Association', category: 'association', purpose: 'Represent student welfare priorities and connect students to support.', campus: kenyattaCampus.name } })
  const welfareProfile = await prisma.managedProfile.upsert({ where: { slug: 'ku-student-welfare-association' }, update: { type: 'association', name: welfareAssociation.name, handle: 'ku_welfare', communityGroupId: welfareAssociation.id, isVerified: true, details: { mandate: welfareAssociation.purpose, constituency: 'All registered KU students', welfareAreas: ['Academic welfare', 'Accommodation', 'Health', 'Safety', 'Accessibility'], leadership: ['Chairperson', 'Secretary', 'Welfare representative'], electionCycle: 'Annual', membership: { status: 'open' }, accountability: ['Constitution', 'Member register', 'Annual elections', 'Semester action plan'] } }, create: { type: 'association', slug: 'ku-student-welfare-association', name: welfareAssociation.name, handle: 'ku_welfare', communityGroupId: welfareAssociation.id, isVerified: true, details: { mandate: welfareAssociation.purpose, constituency: 'All registered KU students', welfareAreas: ['Academic welfare', 'Accommodation', 'Health', 'Safety', 'Accessibility'], leadership: ['Chairperson', 'Secretary', 'Welfare representative'], electionCycle: 'Annual', membership: { status: 'open' }, accountability: ['Constitution', 'Member register', 'Annual elections', 'Semester action plan'] } } })
  await prisma.managedProfileManager.upsert({ where: { managedProfileId_userId: { managedProfileId: welfareProfile.id, userId: adminUser.id } }, update: { role: 'owner' }, create: { managedProfileId: welfareProfile.id, userId: adminUser.id, role: 'owner' } })

  await prisma.communityGroup.upsert({
    where: { id: 'group-zetech-first-year-support' },
    update: {
      name: 'First-Year Peer Support',
      category: 'support-circle',
      purpose: 'A moderated place to talk through settling in, pressure, loneliness and finding the right campus support.',
      rules: ['Protect member privacy', 'Listen without diagnosing', 'Escalate urgent safety concerns'],
      campus: campus.name,
      status: 'active',
      payload: { privacyMode: 'alias', moderationOwner: 'Zetech Student Affairs', activityLabel: 'Ongoing · reply when ready', splashImageUrl: '/assets/wellbeing/first-year-circle-splash.webp', safetyBoundaries: ['No harassment or diagnosis', 'No pressure to reveal identity', 'Safety escalation may involve trained staff'] }
    },
    create: {
      id: 'group-zetech-first-year-support',
      name: 'First-Year Peer Support',
      category: 'support-circle',
      purpose: 'A moderated place to talk through settling in, pressure, loneliness and finding the right campus support.',
      rules: ['Protect member privacy', 'Listen without diagnosing', 'Escalate urgent safety concerns'],
      campus: campus.name,
      status: 'active',
      payload: { privacyMode: 'alias', moderationOwner: 'Zetech Student Affairs', activityLabel: 'Ongoing · reply when ready', splashImageUrl: '/assets/wellbeing/first-year-circle-splash.webp', safetyBoundaries: ['No harassment or diagnosis', 'No pressure to reveal identity', 'Safety escalation may involve trained staff'] }
    }
  })
  await prisma.communityGroup.upsert({
    where: { id: 'group-zetech-recovery-circle' },
    update: {
      name: 'Recovery & Staying Clean Circle',
      category: 'support-circle',
      purpose: 'Peer encouragement and guided campus referrals for students working through substance-use recovery.',
      rules: ['Share from personal experience', 'No sale or promotion of substances', 'Respect privacy and recovery boundaries'],
      campus: campus.name,
      status: 'active',
      payload: { privacyMode: 'alias', moderationOwner: 'Campus Wellness Partner', activityLabel: 'Ongoing · reply when ready', splashImageUrl: '/assets/wellbeing/recovery-circle-splash.webp', safetyBoundaries: ['Peer support is not clinical treatment', 'Immediate risk is escalated to trained support'] }
    },
    create: {
      id: 'group-zetech-recovery-circle',
      name: 'Recovery & Staying Clean Circle',
      category: 'support-circle',
      purpose: 'Peer encouragement and guided campus referrals for students working through substance-use recovery.',
      rules: ['Share from personal experience', 'No sale or promotion of substances', 'Respect privacy and recovery boundaries'],
      campus: campus.name,
      status: 'active',
      payload: { privacyMode: 'alias', moderationOwner: 'Campus Wellness Partner', activityLabel: 'Ongoing · reply when ready', splashImageUrl: '/assets/wellbeing/recovery-circle-splash.webp', safetyBoundaries: ['Peer support is not clinical treatment', 'Immediate risk is escalated to trained support'] }
    }
  })
  await prisma.campusWellbeingResource.upsert({
    where: { id: 'wellbeing-zetech-counseling' },
    update: {
      campusId: campus.id,
      resourceType: 'counselor',
      name: 'Campus counseling request',
      description: 'Request a private one-to-one session. A campus wellbeing coordinator confirms the available counselor and time.',
      contactLabel: 'Request a session',
      href: '/campus/wellbeing?open=booking',
      availability: 'By confirmed appointment',
      isEmergency: false,
      sortOrder: 10,
      status: 'active'
    },
    create: {
      id: 'wellbeing-zetech-counseling',
      campusId: campus.id,
      resourceType: 'counselor',
      name: 'Campus counseling request',
      description: 'Request a private one-to-one session. A campus wellbeing coordinator confirms the available counselor and time.',
      contactLabel: 'Request a session',
      href: '/campus/wellbeing?open=booking',
      availability: 'By confirmed appointment',
      isEmergency: false,
      sortOrder: 10
    }
  })
  await prisma.campusWellbeingResource.upsert({
    where: { id: 'wellbeing-zetech-student-affairs' },
    update: {
      campusId: campus.id,
      resourceType: 'campus-support',
      name: 'Student affairs & safeguarding',
      description: 'Share a named concern when you need a campus support team member to follow up through Zumbarl.',
      contactLabel: 'Send a check-in',
      href: '/campus/wellbeing?open=check-in',
      availability: 'Campus working hours',
      isEmergency: false,
      sortOrder: 20,
      status: 'active'
    },
    create: {
      id: 'wellbeing-zetech-student-affairs',
      campusId: campus.id,
      resourceType: 'campus-support',
      name: 'Student affairs & safeguarding',
      description: 'Share a named concern when you need a campus support team member to follow up through Zumbarl.',
      contactLabel: 'Send a check-in',
      href: '/campus/wellbeing?open=check-in',
      availability: 'Campus working hours',
      isEmergency: false,
      sortOrder: 20
    }
  })
  await prisma.campusWellbeingResource.upsert({
    where: { id: 'wellbeing-emergency-guidance' },
    update: {
      campusId: null,
      resourceType: 'urgent-guidance',
      name: 'Urgent safety help',
      description: 'If there is immediate danger, move toward another person and use your campus emergency service or nearest emergency department.',
      contactLabel: 'Open safety help',
      href: '/help',
      availability: 'Use immediately when needed',
      isEmergency: true,
      sortOrder: 100,
      status: 'active'
    },
    create: {
      id: 'wellbeing-emergency-guidance',
      resourceType: 'urgent-guidance',
      name: 'Urgent safety help',
      description: 'If there is immediate danger, move toward another person and use your campus emergency service or nearest emergency department.',
      contactLabel: 'Open safety help',
      href: '/help',
      availability: 'Use immediately when needed',
      isEmergency: true,
      sortOrder: 100
    }
  })
  const laptopChama = await prisma.communityGroup.upsert({
    where: { id: 'group-zetech-laptop-chama' },
    update: { name: 'Laptop Access Chama', category: 'chama', purpose: 'Save together toward laptops and essential study equipment with a visible member ledger.', rules: ['Contributions stay visible to members', 'Withdrawals follow member approval', 'No off-platform collection'], campus: campus.name, contributionAmount: 500, contributionCadence: 'Monthly', status: 'active' },
    create: { id: 'group-zetech-laptop-chama', name: 'Laptop Access Chama', category: 'chama', purpose: 'Save together toward laptops and essential study equipment with a visible member ledger.', rules: ['Contributions stay visible to members', 'Withdrawals follow member approval', 'No off-platform collection'], campus: campus.name, contributionAmount: 500, contributionCadence: 'Monthly', status: 'active', walletBalance: 3500 }
  })
  await prisma.communityGroupMembership.upsert({
    where: { groupId_studentId: { groupId: laptopChama.id, studentId: student.id } },
    update: { status: 'active', role: 'member' },
    create: { groupId: laptopChama.id, studentId: student.id, status: 'active', role: 'member', payload: { participationMode: 'named' } }
  })
  await prisma.companyWallet.upsert({
    where: { companyId: business.id },
    update: {},
    create: { companyId: business.id }
  })

  const seedOpportunities = [
    {
      id: 'opportunity-social-media-manager-zetech',
      title: 'Social Media Manager',
      description: 'Manage Instagram, TikTok and WhatsApp content for a student-facing campaign.',
      image: assets.campaign,
      category: 'Social Media',
      engagementMode: 'Remote',
      skills: ['Social Media', 'Content Strategy', 'Canva', 'Copywriting'],
      budgetAmount: 15000,
      applicationDeadline: new Date('2026-07-24T00:00:00.000Z'),
      duration: '40 hours estimated',
      maxApplicants: 18
    },
    {
      id: 'opportunity-campus-activation-brandmasters',
      title: 'Campus Activation Support',
      description: 'Support a campus launch activation, collect student feedback, and submit event engagement notes.',
      image: assets.event,
      category: 'Sales Marketing',
      engagementMode: 'Hybrid',
      skills: ['Events', 'Communication', 'Reporting'],
      budgetAmount: 8000,
      applicationDeadline: new Date('2026-07-18T00:00:00.000Z'),
      duration: '24 hours estimated',
      maxApplicants: 12
    },
    {
      id: 'opportunity-web-design-zetech',
      title: 'Landing Page Designer',
      description: 'Design a concise campaign landing page and hand over responsive assets for implementation.',
      image: assets.marketplace,
      category: 'Web Development',
      engagementMode: 'Remote',
      skills: ['UI/UX Design', 'Figma', 'Web Design'],
      budgetAmount: 25000,
      applicationDeadline: new Date('2026-08-02T00:00:00.000Z'),
      duration: '32 hours estimated',
      maxApplicants: 10
    }
  ]

  for (const item of seedOpportunities) {
    const seededOpportunity = await prisma.opportunity.upsert({
      where: { id: item.id },
      update: {
        companyId: business.id,
        postedByContactId: businessContact.id,
        title: item.title,
        summary: item.description,
        description: item.description,
        opportunityType: 'gig',
        category: item.category,
        status: 'published',
        visibility: 'public',
        scopeMode: 'deliverable',
        opportunitySplash: { url: item.image, alt: `${item.title} thumbnail` },
        budgetAmount: item.budgetAmount,
        budgetLabel: `KES ${item.budgetAmount.toLocaleString('en-KE')}`,
        currency: 'KES',
        skills: item.skills,
        requirements: item.skills,
        engagementMode: item.engagementMode,
        mode: item.engagementMode,
        duration: item.duration,
        applicationDeadline: item.applicationDeadline,
        deadlineLabel: item.applicationDeadline.toISOString(),
        publishedAt: new Date(),
        isSeed: true,
        metadata: { seedKey: item.id, maxApplicants: item.maxApplicants }
      },
      create: {
        id: item.id,
        companyId: business.id,
        postedByContactId: businessContact.id,
        title: item.title,
        summary: item.description,
        description: item.description,
        opportunityType: 'gig',
        category: item.category,
        status: 'published',
        visibility: 'public',
        scopeMode: 'deliverable',
        opportunitySplash: { url: item.image, alt: `${item.title} thumbnail` },
        budgetAmount: item.budgetAmount,
        budgetLabel: `KES ${item.budgetAmount.toLocaleString('en-KE')}`,
        currency: 'KES',
        skills: item.skills,
        requirements: item.skills,
        engagementMode: item.engagementMode,
        mode: item.engagementMode,
        duration: item.duration,
        applicationDeadline: item.applicationDeadline,
        deadlineLabel: item.applicationDeadline.toISOString(),
        publishedAt: new Date(),
        isSeed: true,
        metadata: { seedKey: item.id, maxApplicants: item.maxApplicants }
      }
    })
    await syncSeedOpportunitySkills(seededOpportunity.id, item.skills)
  }

  const scoreRefreshedAt = new Date()
  const scoreNextRefreshAt = new Date(scoreRefreshedAt)
  scoreNextRefreshAt.setDate(scoreNextRefreshAt.getDate() + 18)
  const typedScoreOutcomeCount = await prisma.engagementOutcome.count({ where: { studentId: student.id } })
  const seededScore = await prisma.zumbarlScore.upsert({
    where: { studentId: student.id },
    update: typedScoreOutcomeCount ? {} : {
      currentScore: 74,
      tier: 'SILVER',
      confidence: 'ESTABLISHED',
      qualityScore: 76,
      volumeScore: 64,
      loyaltyScore: 68,
      trustScore: 82,
      deliveryScore: 94,
      reliabilityScore: 94,
      professionalismScore: 82,
      relationshipScore: 68,
      avgRating: 4.6,
      deliveryRate: 94,
      totalGigsCompleted: 23,
      repeatClientRate: 7,
      endorsementCount: 3,
      effectiveEngagements: 12,
      uniqueClients: 7,
      conservativeLowerBound: 70,
      qualityGateActive: false,
      lastRefreshedAt: scoreRefreshedAt,
      nextRefreshAt: scoreNextRefreshAt
    },
    create: {
      studentId: student.id,
      currentScore: 74,
      tier: 'SILVER',
      confidence: 'ESTABLISHED',
      qualityScore: 76,
      volumeScore: 64,
      loyaltyScore: 68,
      trustScore: 82,
      deliveryScore: 94,
      reliabilityScore: 94,
      professionalismScore: 82,
      relationshipScore: 68,
      avgRating: 4.6,
      deliveryRate: 94,
      totalGigsCompleted: 23,
      repeatClientRate: 7,
      endorsementCount: 3,
      effectiveEngagements: 12,
      uniqueClients: 7,
      conservativeLowerBound: 70,
      qualityGateActive: false,
      lastRefreshedAt: scoreRefreshedAt,
      nextRefreshAt: scoreNextRefreshAt
    }
  })

  // Preserve the pre-Bayesian demo/history score as a one-time migration prior.
  // New typed outcomes adjust this baseline; they do not reset an established
  // student to provisional simply because older raw reviews were unavailable.
  const migrationBaseline = await prisma.scoreSnapshot.findFirst({
    where: { studentId: student.id, snapshotReason: 'MIGRATION_BASELINE' }
  })
  if (!migrationBaseline && typedScoreOutcomeCount === 0) {
    await prisma.scoreSnapshot.create({
      data: {
        scoreId: seededScore.id,
        studentId: student.id,
        score: 74,
        tier: 'SILVER',
        confidence: 'ESTABLISHED',
        qualityScore: 76,
        volumeScore: 64,
        loyaltyScore: 68,
        trustScore: 82,
        deliveryScore: 94,
        reliabilityScore: 94,
        professionalismScore: 82,
        relationshipScore: 68,
        effectiveEngagements: 12,
        uniqueClients: 7,
        totalEngagements: 23,
        conservativeLowerBound: 70,
        snapshotReason: 'MIGRATION_BASELINE'
      }
    })
  }

  const existingMainWallet = await prisma.wallet.findFirst({
    where: { studentId: student.id, type: 'MAIN' },
    orderBy: { createdAt: 'asc' }
  })
  if (existingMainWallet) {
    await prisma.wallet.update({
      where: { id: existingMainWallet.id },
      data: { balance: 7850, pendingBalance: 1200, currency: 'KES' }
    })
  } else {
    await prisma.wallet.create({
      data: { studentId: student.id, type: 'MAIN', balance: 7850, pendingBalance: 1200, currency: 'KES' }
    })
  }

  await Promise.all(['Social Media', 'Graphic Design', 'Canva', 'Copywriting', 'Analytics', 'Video Editing'].map((skillName, index) => prisma.skillLevel_.upsert({
    where: { studentId_skillName: { studentId: student.id, skillName } },
    update: { level: index < 2 ? 'ADVANCED' : 'INTERMEDIATE', verifiedByGigs: 3 + index },
    create: { studentId: student.id, skillName, level: index < 2 ? 'ADVANCED' : 'INTERMEDIATE', verifiedByGigs: 3 + index }
  })))
  await syncSeedStudentSkills(student.id, ['Social Media', 'Graphic Design', 'Canva', 'Copywriting', 'Analytics', 'Video Editing'])

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

  const marketplaceBuyer = await prisma.user.findUnique({
    where: { email: 'brian.otieno@zumbarl.test' },
    include: { studentProfile: true }
  })
  if (marketplaceBuyer?.studentProfile) {
    const aishaOrderItem = {
      listingId: 'marketplace-aisha-template-pack',
      sellerId: student.id,
      title: 'Campus campaign template pack',
      description: 'Editable Canva templates for campus events, flyers and WhatsApp status promos.',
      image: assets.marketplace,
      quantity: 1,
      unitAmount: 750,
      currency: 'KES',
      fulfilment: { method: 'digital', location: 'Canva link sent through Zumbarl Messages', fee: 0, quoted: true },
      deliveryOptions: ['Instant download', 'Canva link']
    }
    await prisma.marketplaceOrder.upsert({
      where: { id: 'order-aisha-template-pack-new' },
      update: {
        studentId: marketplaceBuyer.studentProfile.id,
        items: [aishaOrderItem],
        totalAmount: 750,
        currency: 'KES',
        status: 'paid',
        fulfillmentStatus: 'seller_confirmation',
        handoffType: 'drop-off',
        handoffSpot: 'Digital delivery through Zumbarl Messages',
        paymentReference: 'ZMB-AISHA-001',
        payload: { buyerUserId: marketplaceBuyer.id, buyerName: 'Brian Otieno', seeded: true }
      },
      create: {
        id: 'order-aisha-template-pack-new',
        studentId: marketplaceBuyer.studentProfile.id,
        items: [aishaOrderItem],
        totalAmount: 750,
        currency: 'KES',
        status: 'paid',
        fulfillmentStatus: 'seller_confirmation',
        handoffType: 'drop-off',
        handoffSpot: 'Digital delivery through Zumbarl Messages',
        paymentReference: 'ZMB-AISHA-001',
        payload: { buyerUserId: marketplaceBuyer.id, buyerName: 'Brian Otieno', seeded: true }
      }
    })
  }

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
      requirements: ['Social Media', 'Content Strategy', 'Canva', 'Copywriting'],
      skills: ['Social Media', 'Content Strategy', 'Canva', 'Copywriting'],
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
      requirements: ['Social Media', 'Content Strategy', 'Canva', 'Copywriting'],
      skills: ['Social Media', 'Content Strategy', 'Canva', 'Copywriting'],
      acceptanceCriteria: 'Posts match brand voice and weekly analytics are submitted.',
      revisionLimit: 3,
      publishedAt: new Date(),
      isSeed: true,
      metadata: { seedKey: 'seed-social-media-manager' }
    }
  })
  if (!opportunity) throw new Error('Failed to seed social media manager opportunity')
  await syncSeedOpportunitySkills(opportunity.id, ['Social Media', 'Content Strategy', 'Canva', 'Copywriting'])

  await prisma.bid.upsert({
    where: { opportunityId_studentId: { opportunityId: opportunity.id, studentId: student.id } },
    update: {
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
  const socialMediaProjectDefaults = {
    seedKey: 'seed-team-social-media-project',
    opportunityId: opportunity.id,
    businessId: business.id,
    studentId: student.id,
    ownerId: studentUser.id,
    title: 'Team Social Media Content Creation',
    status: 'planning',
    fundingStatus: 'unfunded',
    scopeLocked: false,
    hasTeam: true,
    terms: ['stipend-role', 'attachment', 'internship', 'per-deliverable']
  }
  const existingSocialMediaProject = await prisma.workflowRecord.findUnique({ where: { id: 'team-social-media-content-creation' } })
  const existingSocialMediaProjectData = existingSocialMediaProject?.data
    && typeof existingSocialMediaProject.data === 'object'
    && !Array.isArray(existingSocialMediaProject.data)
      ? existingSocialMediaProject.data as Record<string, any>
      : {}
  await prisma.workflowRecord.upsert({
    where: { id: 'team-social-media-content-creation' },
    update: {
      collection: 'projects',
      data: {
        ...socialMediaProjectDefaults,
        ...existingSocialMediaProjectData
      }
    },
    create: {
      id: 'team-social-media-content-creation',
      collection: 'projects',
      data: socialMediaProjectDefaults
    }
  })
  const campaignSeed = {
    businessId: business.id,
    title: 'Level Up Skills',
    type: 'Brand Awareness',
    description: 'Promoting Zetech Studios digital services to help students level up their skills.',
    status: 'published',
    budgetAmount: 50000,
    budget: 'KES 50,000',
    currency: 'KES',
    payoutPerCampaigner: 1500,
    inviteOnlyUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    platforms: ['Instagram', 'TikTok'],
    minimumFollowers: 500,
    proofRequirements: ['Live social link', 'Screenshot proof', 'Reach and engagement stats'],
    workflow: { proofSubmitted: false, statsGenerated: false, endorsed: false },
    previewImage: assets.campaign,
    thumbnailTitle: 'LEVEL UP YOUR SKILLS',
    thumbnailMeta: '#ZetechPower',
    timelineLabel: 'Ends in',
    timelineValue: '5 days',
    creatorsLimit: 10,
    materials: [{ type: 'image', url: assets.campaign, label: 'Campaign creative' }]
  }
  await prisma.marketingCampaign.upsert({
    where: { seedKey: 'seed-level-up-skills-campaign' },
    update: campaignSeed,
    create: { seedKey: 'seed-level-up-skills-campaign', ...campaignSeed }
  })
  await seedKnowledgeHub(student.id, campus.id, assets)
  const existingWallet = await prisma.wallet.findFirst({ where: { studentId: student.id, type: 'MAIN' } })
  if (!existingWallet) {
    await prisma.wallet.create({
      data: { studentId: student.id, type: 'MAIN', balance: 0, pendingBalance: 0, currency: 'KES' }
    })
  }
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
