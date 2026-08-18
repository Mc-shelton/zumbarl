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
      skills: ['Social Media', 'Canva', 'Copywriting'],
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
  await syncSeedOpportunitySkills(opportunity.id, ['Social Media', 'Canva', 'Copywriting'])

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
  await prisma.workflowRecord.upsert({
    where: { id: 'team-social-media-content-creation' },
    update: {
      collection: 'projects',
      data: {
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
    },
    create: {
      id: 'team-social-media-content-creation',
      collection: 'projects',
      data: {
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
