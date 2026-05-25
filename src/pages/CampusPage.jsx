import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FiArrowRight,
  FiBell,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiChevronRight,
  FiClock,
  FiCreditCard,
  FiDownload,
  FiHeart,
  FiHome,
  FiMail,
  FiMessageCircle,
  FiMoreHorizontal,
  FiSearch,
  FiSend,
  FiShield,
  FiShoppingBag,
  FiTruck,
  FiUsers,
} from 'react-icons/fi'
import Seo from '../components/Seo'
import { CAMPUS_SEO } from '../features/seo/constants'
import '../styles/campus.css'
import { Link, useNavigate } from 'react-router-dom'

const SIDEBAR_NAV_ITEMS = [
  { label: 'Home', Icon: FiHome, active: true, href: '/campus' },
  { label: 'Opportunities', Icon: FiBriefcase, href: '/campus/opportunities' },
  { label: 'Explore Campus', Icon: FiCalendar, href: '/campus/explore' },
  { label: 'Learn & Grow', Icon: FiBookOpen },
  { label: 'Community', Icon: FiUsers },
  { label: 'Finance', Icon: FiCreditCard },
  { label: 'Services', Icon: FiTruck },
  { label: 'Messages', Icon: FiMail },
  { label: 'Notifications', Icon: FiBell },
]

const QUICK_ACTIONS = [
  { title: 'Find Work', subtitle: 'Jobs & gigs', Icon: FiBriefcase },
  { title: 'Buy & Sell', subtitle: 'Marketplace', Icon: FiShoppingBag, href: '/campus/opportunities/buy-sell' },
  { title: 'Campus Services', subtitle: 'Food, print, laundry', Icon: FiTruck },
  { title: 'Notes & Papers', subtitle: 'Study resources', Icon: FiBookOpen },
  { title: 'Events', subtitle: "What's happening", Icon: FiCalendar },
  { title: 'Communities', subtitle: 'Clubs & groups', Icon: FiUsers },
]

const RECOMMENDED_GIGS = [
  {
    role: 'Social Media Manager',
    org: 'Rorac Cafe',
    type: 'Part-time',
    pay: 'KSh 8,000 / month',
    opportunityId: 'social-media-manager',
    opportunityUuid: 'c1a7d5c4-9f0a-4d5d-8b06-9f3c2a6e1d11',
    owner: 'ruth-atieno',
    thumbnail: '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp',
  },
  {
    role: 'Graphic Designer',
    org: 'Startup Wind',
    type: 'One-time',
    pay: 'KSh 3,500',
    opportunityId: 'graphic-designer',
    opportunityUuid: 'd7b2f3a9-3c21-4c52-a8d7-5b017e8f2214',
    owner: 'martin-kibe',
    thumbnail: '/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp',
  },
  {
    role: 'Content Writer',
    org: 'StudySync',
    type: 'Remote',
    pay: 'KSh 4,000 / article',
    opportunityId: 'content-writer',
    opportunityUuid: 'f0e4c2a6-75bd-4c0e-9c12-2ab67de49031',
    owner: 'diana-kamau',
    thumbnail: '/assets/index/business_page_images/optimized/justin-buisson-vIluu0IH6Ps-unsplash.webp',
  },
  {
    role: 'Data Entry Clerk',
    org: 'Zuri Agency',
    type: 'Part-time',
    pay: 'KSh 4,000 / month',
    opportunityId: 'data-entry-clerk',
    opportunityUuid: 'a84b1f29-2a3e-4f7c-b9a1-6d90ce5b4e22',
    owner: 'paul-mwangi',
    thumbnail: '/assets/index/business_page_images/optimized/setengah-limasore-qUcZ3TUlgnM-unsplash.webp',
  },
]

const RECOMMENDED_MARKETPLACE = [
  {
    title: 'MacBook Air M1 · 8GB',
    org: 'Campus Deals Market',
    meta: 'Electronics',
    value: 'KSh 74,000',
    thumbnails: [
      '/assets/index/business_page_images/optimized/igor-rodrigues-Wn932wwnpSE-unsplash.webp',
      '/assets/index/business_page_images/optimized/product-school-XZkk5xT8Xrk-unsplash.webp',
      '/assets/index/business_page_images/optimized/ernest-malimon-XLIywCaTs_M-unsplash.webp',
    ],
  },
  {
    title: 'IKEA Study Desk + Lamp',
    org: 'Hostel Finds',
    meta: 'Furniture',
    value: 'KSh 9,500',
    thumbnails: [
      '/assets/index/business_page_images/optimized/mapbox-ZT5v0puBjZI-unsplash.webp',
      '/assets/index/business_page_images/optimized/0xk-y5n-nhkRd7U-unsplash.webp',
      '/assets/index/business_page_images/optimized/toa-heftiba-O3ymvT7Wf9U-unsplash.webp',
    ],
  },
  {
    title: 'Canon EOS M50 Kit',
    org: 'Creator Hub',
    meta: 'Cameras',
    value: 'KSh 52,000',
    thumbnails: [
      '/assets/index/business_page_images/optimized/product-school-XZkk5xT8Xrk-unsplash.webp',
      '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp',
      '/assets/index/business_page_images/optimized/sable-flow-T74mVg__F_k-unsplash.webp',
    ],
  },
  {
    title: 'Gaming Chair · Mesh',
    org: 'Room Upgrade KE',
    meta: 'Lifestyle',
    value: 'KSh 14,300',
    thumbnails: [
      '/assets/index/business_page_images/optimized/ernest-malimon-XLIywCaTs_M-unsplash.webp',
      '/assets/index/business_page_images/optimized/alejandro-escamilla-BbQLHCpVUqA-unsplash.webp',
      '/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp',
    ],
  },
]

const RECOMMENDED_COMMUNITIES = [
  {
    title: 'Campus Founders Circle',
    org: 'Innovation Hub',
    meta: '1,240 members',
    value: 'Join now',
    thumbnail: '/assets/index/business_page_images/optimized/alejandro-escamilla-BbQLHCpVUqA-unsplash.webp',
  },
  {
    title: 'Zetech Design Guild',
    org: 'Creative Club',
    meta: '860 members',
    value: 'Open discussions',
    thumbnail: '/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp',
  },
  {
    title: 'Data & AI Study Group',
    org: 'Learning Network',
    meta: '1,030 members',
    value: 'Weekly sessions',
    thumbnail: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
  },
  {
    title: 'Film & Media Circle',
    org: 'Community Lounge',
    meta: '540 members',
    value: 'Meetup Friday',
    thumbnail: '/assets/index/business_page_images/optimized/toa-heftiba-O3ymvT7Wf9U-unsplash.webp',
  },
]

const RECOMMENDED_EVENTS = [
  {
    title: 'Tech Career Fast Track',
    org: 'Main Hall',
    meta: 'Sat · 2:00 PM',
    value: 'Free · 220 seats',
    thumbnail: '/assets/index/business_page_images/optimized/sable-flow-T74mVg__F_k-unsplash.webp',
  },
  {
    title: 'Startup Pitch Night',
    org: 'Block C Arena',
    meta: 'Thu · 6:30 PM',
    value: 'KSh 300 ticket',
    thumbnail: '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp',
  },
  {
    title: 'UI/UX Portfolio Clinic',
    org: 'Online',
    meta: 'Mon · 7:00 PM',
    value: 'Free registration',
    thumbnail: '/assets/index/business_page_images/optimized/justin-buisson-vIluu0IH6Ps-unsplash.webp',
  },
  {
    title: 'Campus Wellness Day',
    org: 'Sports Ground',
    meta: 'Sun · 10:00 AM',
    value: 'Open for all',
    thumbnail: '/assets/index/business_page_images/optimized/leeder-bose-ne0gCdlSoew-unsplash.webp',
  },
]

const RECOMMENDED_SERVICES = [
  {
    title: '24/7 Print & Binding',
    org: 'Print Hub',
    meta: 'Open now',
    value: 'From KSh 10/page',
    thumbnail: '/assets/index/business_page_images/optimized/bruno-ngarukiye-IzEcrYJ1G34-unsplash.webp',
  },
  {
    title: 'Laundry Pickup Express',
    org: 'Hostel Services',
    meta: 'Pickup in 30 mins',
    value: 'From KSh 150',
    thumbnail: '/assets/index/business_page_images/optimized/0xk-y5n-nhkRd7U-unsplash.webp',
  },
  {
    title: 'Assignment Proofreading',
    org: 'Study Assist',
    meta: '2-hour turnaround',
    value: 'From KSh 500',
    thumbnail: '/assets/index/business_page_images/optimized/omar-lopez-1qfy-jDc_jo-unsplash.webp',
  },
  {
    title: 'Laptop Repair Desk',
    org: 'Tech Support KE',
    meta: 'Same-day fixes',
    value: 'Diagnostic free',
    thumbnail: '/assets/index/business_page_images/optimized/setengah-limasore-qUcZ3TUlgnM-unsplash.webp',
  },
]

const GIG_RECOMMENDATIONS = RECOMMENDED_GIGS.map((gig) => ({
  title: gig.role,
  org: gig.org,
  meta: gig.type,
  value: gig.pay,
  opportunityId: gig.opportunityId,
  opportunityUuid: gig.opportunityUuid,
  owner: gig.owner,
  thumbnail: gig.thumbnail,
}))

const RECOMMENDATION_SECTIONS = [
  {
    id: 'gigs',
    title: 'Recommended for you',
    subtitle: 'Gigs based on your activity',
    items: GIG_RECOMMENDATIONS,
  },
  {
    id: 'marketplace',
    title: 'Marketplace recommendations',
    subtitle: 'Popular picks around campus',
    items: RECOMMENDED_MARKETPLACE,
  },
  {
    id: 'communities',
    title: 'Community recommendations',
    subtitle: 'Groups you may like',
    items: RECOMMENDED_COMMUNITIES,
  },
  {
    id: 'events',
    title: 'Event recommendations',
    subtitle: "What's happening this week",
    items: RECOMMENDED_EVENTS,
  },
  {
    id: 'services',
    title: 'Service recommendations',
    subtitle: 'Useful services near you',
    items: RECOMMENDED_SERVICES,
  },
]

const TRUST_POINTS = [
  {
    title: 'Verified & Safe',
    body: 'Trusted users, secure payments, real support.',
    Icon: FiShield,
    tone: 'purple',
  },
  {
    title: 'Made for Students',
    body: 'Simple, mobile-first and data friendly.',
    Icon: FiBookOpen,
    tone: 'lavender',
  },
  {
    title: 'Save & Plan',
    body: 'Budget, save and achieve more with ease.',
    Icon: FiCreditCard,
    tone: 'mint',
  },
  {
    title: 'Grow Together',
    body: 'Communities that support your journey.',
    Icon: FiUsers,
    tone: 'pink',
  },
]

const GROUPS = [
  { name: 'Gigs volume', value: 'KSh 3,200 / 5,000', progress: 64 },
  { name: 'Avg. rating', value: 'KSh 1,450 / 3,000', progress: 48 },
  { name: 'Delivery rate', value: 'KSh 4,000 / 10,000', progress: 40 },
]

const PORTFOLIO_STATS = [
  {
    label: 'Zumbarl Score',
    value: '74',
    detail: 'Tier 3 · Silver',
    trend: '↑ 6 this month',
  },
  {
    label: 'Pipeline Stage',
    value: '8/8',
    detail: '18 rated · 5 pending',
    trend: '↑ 3 this month',
  },
]

const EVENTS = [
  {
    date: 'MAY 24',
    title: 'Freshers Party',
    time: '6:00 PM · Zetech Grounds',
    attendees: '+86',
    thumbnail: '/assets/index/business_page_images/optimized/leeder-bose-ne0gCdlSoew-unsplash.webp',
  },
  {
    date: 'MAY 27',
    title: 'Career Talk: Tech Careers',
    time: '2:00 PM · Online',
    attendees: '+120',
    thumbnail: '/assets/index/business_page_images/optimized/sable-flow-T74mVg__F_k-unsplash.webp',
  },
]

const DISCOVERY_LIBRARY = [
  {
    id: 'app-wallet',
    type: 'App',
    title: 'Student Wallet',
    summary: 'Send money, split hostel bills and pay campus vendors fast.',
    chip: 'Finance',
    keywords: ['app', 'wallet', 'money', 'pay', 'finance', 'send', 'split'],
  },
  {
    id: 'app-study-room',
    type: 'App',
    title: 'Study Room',
    summary: 'Find revision groups, tutors and curated notes by unit.',
    chip: 'Learning',
    keywords: ['app', 'study', 'notes', 'book', 'revision', 'tutor', 'class'],
  },
  {
    id: 'market-laptop',
    type: 'Marketplace',
    title: 'Used MacBook Air M1',
    summary: 'Verified seller near campus, includes charger and carry bag.',
    chip: 'Marketplace',
    keywords: ['product', 'marketplace', 'laptop', 'electronics', 'buy', 'sell'],
  },
  {
    id: 'person-mentor',
    type: 'Person',
    title: 'Grace Wanjiku · Product Mentor',
    summary: 'Helps students prepare portfolios and product case studies.',
    chip: 'People',
    keywords: ['people', 'person', 'mentor', 'coach', 'portfolio', 'career'],
  },
  {
    id: 'book-soft-skills',
    type: 'Book',
    title: 'Soft Skills for Campus Leaders',
    summary: 'Practical guide for communication, teamwork and leadership.',
    chip: 'Books',
    keywords: ['book', 'books', 'leadership', 'communication', 'learn', 'library'],
  },
  {
    id: 'gig-creator',
    type: 'Gig',
    title: 'Event Content Creator',
    summary: 'Part-time weekend role. Capture reels and run event socials.',
    chip: 'Gigs',
    keywords: ['gig', 'job', 'work', 'content', 'creator', 'part-time', 'remote'],
  },
  {
    id: 'service-print',
    type: 'Service',
    title: '24/7 Print & Bind Hub',
    summary: 'Print assignments, bind projects and schedule pickup.',
    chip: 'Services',
    keywords: ['service', 'print', 'project', 'assignment', 'pickup'],
  },
  {
    id: 'community-founders',
    type: 'Community',
    title: 'Campus Founders Circle',
    summary: 'Weekly startup meetups for builders, designers and coders.',
    chip: 'Community',
    keywords: ['community', 'club', 'startup', 'founders', 'group', 'people'],
  },
]

const DISCOVERY_DEFAULT_CHIPS = ['Apps', 'Marketplace', 'People', 'Books', 'Gigs']

const SEARCH_PROMPT_HINTS = [
  'Find weekend gigs near me',
  'Show affordable hostels near campus',
  'Find used calculus books under KSh 1,000',
  'Connect me with product design mentors',
  "What's happening on campus this week?",
]

const CHAT_PROMPT_HINTS = [
  'Find 3 remote writing gigs for beginners',
  'Show book deals and delivery options',
  'Help me find mentors in software engineering',
  'Recommend student groups for designers',
]

function getDiscoverySuggestions(prompt) {
  const normalizedPrompt = prompt.trim().toLowerCase()
  if (!normalizedPrompt) {
    return DISCOVERY_LIBRARY.slice(0, 5)
  }

  const terms = normalizedPrompt.split(/\s+/).filter(Boolean)
  const ranked = DISCOVERY_LIBRARY.map((item) => {
    const searchableText = `${item.type} ${item.title} ${item.summary} ${item.keywords.join(' ')}`.toLowerCase()
    const score = terms.reduce((total, term) => {
      if (!searchableText.includes(term)) {
        return total
      }
      return total + (item.keywords.includes(term) ? 3 : 1)
    }, 0)
    return { ...item, score }
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  return ranked.length > 0 ? ranked.slice(0, 5) : DISCOVERY_LIBRARY.slice(0, 5)
}

function getAssistantReply(prompt, suggestions) {
  const suggestionTitles = suggestions.slice(0, 2).map((item) => item.title).join(' and ')
  if (!suggestionTitles) {
    return `I can help you explore ${prompt}. I can pull apps, people, products, books or gigs next.`
  }
  return `I found matches for "${prompt}". Start with ${suggestionTitles}. I can narrow by budget, location or urgency.`
}

function CampusPage() {
  const navigate = useNavigate()
  const mainScrollRef = useRef(null)
  const heroCardRef = useRef(null)
  const promptInputRef = useRef(null)
  const [prompt, setPrompt] = useState('')
  const [chatMode, setChatMode] = useState(false)
  const [activePrompt, setActivePrompt] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [activeMarketplaceHover, setActiveMarketplaceHover] = useState('')
  const [activeMarketplaceSlide, setActiveMarketplaceSlide] = useState(0)
  const [showBackToAiButton, setShowBackToAiButton] = useState(false)
  const [hintIndex, setHintIndex] = useState(0)
  const [hintText, setHintText] = useState('')
  const [hintDeleting, setHintDeleting] = useState(false)

  const activeHints = chatMode ? CHAT_PROMPT_HINTS : SEARCH_PROMPT_HINTS

  useEffect(() => {
    const currentHint = activeHints[hintIndex % activeHints.length]
    const hintFullyTyped = hintText === currentHint
    const hintEmpty = hintText.length === 0

    let delay = hintDeleting ? 42 : 72
    if (!hintDeleting && hintFullyTyped) {
      delay = 1300
    }
    if (hintDeleting && hintEmpty) {
      delay = 240
    }

    const timeoutId = setTimeout(() => {
      if (!hintDeleting && !hintFullyTyped) {
        setHintText(currentHint.slice(0, hintText.length + 1))
        return
      }

      if (!hintDeleting && hintFullyTyped) {
        setHintDeleting(true)
        return
      }

      if (hintDeleting && !hintEmpty) {
        setHintText(currentHint.slice(0, hintText.length - 1))
        return
      }

      setHintDeleting(false)
      setHintIndex((previous) => (previous + 1) % activeHints.length)
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [activeHints, hintDeleting, hintIndex, hintText])

  useEffect(() => {
    if (!activeMarketplaceHover) {
      return undefined
    }

    const intervalId = setInterval(() => {
      setActiveMarketplaceSlide((current) => current + 1)
    }, 1150)

    return () => clearInterval(intervalId)
  }, [activeMarketplaceHover])

  useEffect(() => {
    const handleShortcutFocus = (event) => {
      const usedCommandOrControl = event.metaKey || event.ctrlKey
      if (!usedCommandOrControl || event.key !== '/') {
        return
      }

      event.preventDefault()
      const promptInput = promptInputRef.current
      if (!promptInput) {
        return
      }

      promptInput.focus()
    }

    window.addEventListener('keydown', handleShortcutFocus)
    return () => window.removeEventListener('keydown', handleShortcutFocus)
  }, [])

  const discoverySuggestions = useMemo(
    () => getDiscoverySuggestions(chatMode ? activePrompt : ''),
    [chatMode, activePrompt]
  )

  const discoveryChips = useMemo(() => {
    if (!chatMode) {
      return DISCOVERY_DEFAULT_CHIPS
    }
    const chips = discoverySuggestions.map((item) => item.chip)
    return [...new Set(chips)].slice(0, 5)
  }, [chatMode, discoverySuggestions])

  const handlePromptSubmit = (event) => {
    event.preventDefault()
    const trimmedPrompt = prompt.trim()

    if (!trimmedPrompt) {
      return
    }

    const suggestions = getDiscoverySuggestions(trimmedPrompt)
    const userMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: trimmedPrompt,
    }
    const assistantMessage = {
      id: `${Date.now()}-assistant`,
      role: 'assistant',
      content: getAssistantReply(trimmedPrompt, suggestions),
    }

    setActivePrompt(trimmedPrompt)
    setChatMode(true)
    setChatMessages((previous) => [...previous, userMessage, assistantMessage])
    setPrompt('')
    setHintIndex(0)
    setHintText('')
    setHintDeleting(false)
  }

  const resetChatSurface = () => {
    setChatMode(false)
    setActivePrompt('')
    setPrompt('')
    setChatMessages([])
    setHintIndex(0)
    setHintText('')
    setHintDeleting(false)
  }

  const handleMainScroll = (event) => {
    const scrollTop = event.currentTarget.scrollTop
    const collapseDistance = 150
    const progress = Math.min(scrollTop / collapseDistance, 1)
    event.currentTarget.style.setProperty('--campus-header-progress', progress.toFixed(3))

    const heroCard = heroCardRef.current
    if (!heroCard) {
      return
    }

    const heroBottom = heroCard.offsetTop + heroCard.offsetHeight
    const shouldShowBackToAi = scrollTop > heroBottom - 120
    setShowBackToAiButton((previous) =>
      previous === shouldShowBackToAi ? previous : shouldShowBackToAi
    )
  }

  const handleBackToAi = () => {
    const mainScroller = mainScrollRef.current
    const heroCard = heroCardRef.current
    if (!mainScroller || !heroCard) {
      return
    }

    mainScroller.scrollTo({
      top: Math.max(heroCard.offsetTop - 10, 0),
      behavior: 'smooth',
    })
  }

  const focusPromptInput = () => {
    const promptInput = promptInputRef.current
    if (!promptInput) {
      return
    }
    promptInput.focus()
  }

  const promptPlaceholder = `${chatMode ? 'Ask Zumbarl AI: ' : 'Try: '}${hintText || activeHints[0]}${
    hintDeleting ? '' : '|'
  }`

  const openRecommendedGig = (opportunityUuid, owner) => {
    const params = new URLSearchParams()
    if (typeof opportunityUuid === 'string' && opportunityUuid.trim() !== '') {
      params.set('opportunity', opportunityUuid)
    }
    if (typeof owner === 'string' && owner.trim() !== '') {
      params.set('owner', owner)
    }
    navigate(`/campus/opportunities?${params.toString()}`)
  }

  const renderRecommendationCard = (sectionId, item) => {
    if (sectionId === 'gigs') {
      return (
        <article
          key={`${sectionId}-${item.title}`}
          className="campus-gig-card"
          role="button"
          tabIndex={0}
          aria-label={`Open ${item.title} gig`}
          onClick={() => openRecommendedGig(item.opportunityUuid, item.owner)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' && event.key !== ' ') {
              return
            }
            event.preventDefault()
            openRecommendedGig(item.opportunityUuid, item.owner)
          }}
        >
          <img className="campus-gig-cover" src={item.thumbnail} alt={`${item.title} thumbnail`} loading="lazy" />
          <div className="campus-gigs-card-wrap">
            <img className="campus-gig-company-avatar" src="/assets/index/bee_nobg.png" alt={`${item.org} logo`} loading="lazy" />
            <div className="campus-gig-body">
              <h4>{item.title}</h4>
              <div className="campus-gig-detail">
                <p>{item.org}</p>
              </div>
              <span>{item.meta}</span>
              <strong>{item.value}</strong>
            </div>
          </div>
        </article>
      )
    }

    if (sectionId === 'marketplace') {
      const marketplaceKey = `${sectionId}-${item.title}`
      const marketplaceImages = item.thumbnails && item.thumbnails.length > 0 ? item.thumbnails : [item.thumbnail]
      const isHovered = activeMarketplaceHover === marketplaceKey && marketplaceImages.length > 1
      const imageIndex = isHovered ? activeMarketplaceSlide % marketplaceImages.length : 0
      const activeImage = marketplaceImages[imageIndex]

      return (
        <article key={`${sectionId}-${item.title}`} className="campus-reco-card campus-market-card">
          <div
            className="campus-market-media"
            onMouseEnter={() => {
              if (marketplaceImages.length < 2) {
                return
              }
              setActiveMarketplaceHover(marketplaceKey)
              setActiveMarketplaceSlide(1)
            }}
            onMouseLeave={() => {
              setActiveMarketplaceHover('')
              setActiveMarketplaceSlide(0)
            }}
          >
            <img
              key={`${marketplaceKey}-${imageIndex}`}
              className={`campus-market-cover${isHovered ? ' is-slideshow' : ''}`}
              src={activeImage}
              alt={`${item.title} thumbnail`}
              loading="lazy"
            />
          </div>
          <div className="campus-market-body">
            <h4>{item.title}</h4>
            <p>{item.org}</p>
            <div className="campus-market-foot">
              <span>{item.meta}</span>
              <strong>{item.value}</strong>
            </div>
          </div>
        </article>
      )
    }

    if (sectionId === 'communities') {
      return (
        <article key={`${sectionId}-${item.title}`} className="campus-reco-card campus-community-card">
          <div className="campus-community-head">
            <img className="campus-community-avatar" src={item.thumbnail} alt={`${item.title} thumbnail`} loading="lazy" />
            <div>
              <h4>{item.title}</h4>
              <p>{item.org}</p>
            </div>
          </div>
          <span>{item.meta}</span>
          <strong>{item.value}</strong>
        </article>
      )
    }

    if (sectionId === 'events') {
      return (
        <article key={`${sectionId}-${item.title}`} className="campus-reco-card campus-event-reco-card">
          <img className="campus-event-reco-cover" src={item.thumbnail} alt={`${item.title} thumbnail`} loading="lazy" />
          <div className="campus-event-reco-body">
            <h4>{item.title}</h4>
            <p>{item.org}</p>
            <span>{item.meta}</span>
            <strong>{item.value}</strong>
          </div>
        </article>
      )
    }

    return (
      <article key={`${sectionId}-${item.title}`} className="campus-reco-card campus-service-card">
        <div className="campus-service-head">
          <img className="campus-service-avatar" src={item.thumbnail} alt={`${item.title} thumbnail`} loading="lazy" />
          <div>
            <h4>{item.title}</h4>
            <p>{item.org}</p>
          </div>
        </div>
        <span>{item.meta}</span>
        <strong>{item.value}</strong>
      </article>
    )
  }

  return (
    <main className="campus-page">
      <Seo
        title={CAMPUS_SEO.title}
        description={CAMPUS_SEO.description}
        path={CAMPUS_SEO.path}
        keywords={CAMPUS_SEO.keywords}
        jsonLd={[CAMPUS_SEO.pageJsonLd]}
      />

      <div className="campus-stage">
        <div className="campus-shell">
          <aside className="campus-sidebar" aria-label="Student portal navigation">
            <Link className="campus-brand" to="/" aria-label="Zumbarl logo">
            <img className="campus-brand-logo" src="/assets/index/bee_nobg.png" alt="Zumbarl bee logo" />
            <span className="campus-brand-text">zumbarl.</span>
          </Link>

            <nav className="campus-nav">
              {SIDEBAR_NAV_ITEMS.map(({ label, Icon, active, href }) =>
                href ? (
                  <Link
                    key={label}
                    to={href}
                    className={`campus-nav-item${active ? ' is-active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                ) : (
                  <button
                    key={label}
                    type="button"
                    className={`campus-nav-item${active ? ' is-active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                )
              )}
            </nav>

            <Link className="campus-profile-card" to="/campus/profile" aria-label="Student profile">
              <img className="campus-avatar" src="/assets/index/bee_nobg.png" alt="Brian Mwangi" />
              <div>
                <p className="campus-profile-name">Brian Mwangi</p>
                <p className="campus-profile-meta meta-category">Student</p>
                <p className="campus-profile-meta">Kenyatta University</p>
              </div>
              <FiChevronRight aria-hidden="true" />
            </Link>

            <section className="campus-sidebar-card">
              <h3>Invite your friends</h3>
              <p>Bring your squad and earn rewards together.</p>
              <button type="button" className="campus-pill-btn">
                Invite Now
                <FiArrowRight aria-hidden="true" />
              </button>
            </section>
          </aside>

          <section className="campus-main" onScroll={handleMainScroll} ref={mainScrollRef}>
            <header className="campus-header">
              <div className="campus-header-copy">
                <h1>Good morning, Brian 👋</h1>
                <p>What are we doing today?</p>
              </div>
              <div className="campus-header-actions">
                <button
                  type="button"
                  className={`campus-cta-btn campus-cta-btn-secondary campus-back-ai-btn${
                    showBackToAiButton ? ' is-visible' : ''
                  }`}
                  onClick={handleBackToAi}
                  tabIndex={showBackToAiButton ? 0 : -1}
                  aria-hidden={!showBackToAiButton}
                >
                  <FiSearch aria-hidden="true" />
                  Back to AI
                </button>
                <button type="button" className="campus-cta-btn">
                  {/* <FiPlus aria-hidden="true" /> */}
                  Opportunities
                </button>
                <button type="button" className="campus-icon-btn" aria-label="Open messages">
                  <FiMessageCircle aria-hidden="true" />
                  <span className="campus-badge">3</span>
                </button>
                <button type="button" className="campus-icon-btn" aria-label="Open notifications">
                  <FiBell aria-hidden="true" />
                  <span className="campus-badge">6</span>
                </button>
              </div>
            </header>

            <article ref={heroCardRef} className={`campus-hero-card${chatMode ? ' is-chat-mode' : ''}`}>
              {!chatMode ? (
                <section className="campus-splash-panel" aria-label="Campus splash">
                  <div className="campus-hero-copy">
                    <p className="campus-kicker">
                      <span className="growth-cta-highlight">simple</span>, sure{' '}
                      <span className="growth-cta-highlight growth-cta-underlined-dark">growth</span>
                    </p>
                    <h2>
                      Let me help you find things<br/> <span className="x_wd_yellow_highlight_bold_05">around!</span>
                    </h2>
                    <p>Earn, learn, connect, grow and thrive in your student journey at Zumbarl.</p>
                    <div className="campus-chip-row" role="list" aria-label="Student goals">
                      <span className="campus-chip chip-earn">Earn</span>
                      <span className="campus-chip chip-learn">Learn</span>
                      <span className="campus-chip chip-connect">Connect</span>
                      <span className="campus-chip chip-grow">Grow</span>
                    </div>
                  </div>
                  <div className="campus-phone-scene" aria-hidden="true">
                    <div className="campus-orbit" />
                    <div className="campus-orbit orbit-two" />
                    <div className="campus-phone">
                      <img src="/assets/index/bee_nobg.png"  alt="zumbarl logo" />
                      <p>zumbarl</p>
                    </div>
                    <div className="campus-floating-icon icon-purple">
                      <FiBriefcase />
                    </div>
                    <div className="campus-floating-icon icon-green">
                      <FiBookOpen />
                    </div>
                    <div className="campus-floating-icon icon-orange">
                      <FiBookOpen />
                    </div>
                    <div className="campus-floating-icon icon-pink">
                      <FiHeart />
                    </div>
                  </div>
                </section>
              ) : (
                <section className="campus-chat-panel" aria-label="AI search conversation">
                  <header className="campus-chat-head">
                    <div>
                      <p>Zumbarl AI Assistant</p>
                      <span>Type naturally and discover apps, products, people, books and gigs.</span>
                    </div>
                    <button type="button" className="campus-link-btn" onClick={resetChatSurface}>
                      Back to splash
                    </button>
                  </header>
                  <div className="campus-chat-thread" aria-live="polite">
                    {chatMessages.map((message) => (
                      <article
                        key={message.id}
                        className={`campus-chat-bubble${message.role === 'user' ? ' is-user' : ' is-assistant'}`}
                      >
                        <span>{message.role === 'user' ? 'You' : 'Zumbarl AI'}</span>
                        <p>{message.content}</p>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              <aside className="campus-discovery-panel" aria-label="Smart suggestions">
                <div className="campus-discovery-head">
                  <h3>{chatMode ? 'Suggestions' : 'Quick start'}</h3>
                  <p>
                    {chatMode
                      ? `Based on: chat`
                      : 'Apps, products, people, books, gigs and services.'}
                  </p>
                </div>
                <div className="campus-discovery-chip-row" role="list" aria-label="Suggestion categories">
                  {discoveryChips.map((chip) => (
                    <span key={chip} className="campus-discovery-chip">
                      {chip}
                    </span>
                  ))}
                </div>
                <div className="campus-discovery-grid">
                  {discoverySuggestions.map((item) => (
                    <article key={item.id} className="campus-discovery-card">
                      <p className="campus-discovery-type">{item.type}</p>
                      <h4>{item.title}</h4>
                      <p>{item.summary}</p>
                      <span>
                        Explore
                        <FiArrowRight aria-hidden="true" />
                      </span>
                    </article>
                  ))}
                </div>
              </aside>
            </article>

            <form className="campus-search" onSubmit={handlePromptSubmit}>
              <FiSearch aria-hidden="true" />
              <input
                ref={promptInputRef}
                type="search"
                placeholder={promptPlaceholder}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
              />
              <div className="campus-search-actions">
                {!chatMode && (
                  <button type="button" className="campus-search-key campus-search-key-btn" onClick={focusPromptInput}>
                    ⌘ /
                  </button>
                )}
                <button type="submit" className="campus-search-send" aria-label="Send prompt">
                  <FiArrowRight aria-hidden="true" />
                </button>
              </div>
            </form>

            <section className="campus-section">
              <h3>What would you like to do?</h3>
              <div className="campus-actions-grid">
                {QUICK_ACTIONS.map(({ title, subtitle, Icon, href }) =>
                  href ? (
                    <Link key={title} to={href} className="campus-action-card" aria-label={`Open ${title}`}>
                      <div className="campus-action-icon">
                        <Icon aria-hidden="true" />
                      </div>
                      <h4>{title}</h4>
                      <p>{subtitle}</p>
                    </Link>
                  ) : (
                    <article key={title} className="campus-action-card">
                      <div className="campus-action-icon">
                        <Icon aria-hidden="true" />
                      </div>
                      <h4>{title}</h4>
                      <p>{subtitle}</p>
                    </article>
                  )
                )}
                <article className="campus-action-card is-more">
                  <div className="campus-action-icon">
                    <FiMoreHorizontal aria-hidden="true" />
                  </div>
                  <h4>More</h4>
                  <p>Explore all</p>
                </article>
              </div>
            </section>

            {RECOMMENDATION_SECTIONS.map((section, index) => (
              <section key={section.id} className="campus-section">
                {index === 0 ? (
                  <div className="campus-section-head">
                    <div>
                      <h3>{section.title}</h3>
                      <p>{section.subtitle}</p>
                    </div>
                    <button type="button" className="campus-link-btn">
                      View all
                    </button>
                  </div>
                ) : (
                  <div className="campus-reco-strip">
                    <p>{section.subtitle}</p>
                    <button type="button" className="campus-link-btn">
                      View all
                    </button>
                  </div>
                )}

                <div className={`campus-gigs-grid campus-gigs-grid-${section.id}`}>
                  {section.items.map((item) => renderRecommendationCard(section.id, item))}
                </div>
              </section>
            ))}

            <section className="campus-trust-strip" aria-label="Why students use Zumbarl">
              {TRUST_POINTS.map(({ title, body, Icon, tone }) => (
                <article key={title} className={`campus-trust-card tone-${tone}`}>
                  <div className="campus-trust-icon">
                    <Icon aria-hidden="true" />
                  </div>
                  <div>
                    <h4>{title}</h4>
                    <p>{body}</p>
                  </div>
                </article>
              ))}
            </section>
          </section>

          <aside className="campus-rail">
            <section className="campus-rail-card">
              <header>
                <h3>My Wallet</h3>
                <button type="button" className="campus-link-btn">View all</button>
              </header>
              <div className="campus-wallet">
                <p>Total Balance</p>
                <h4>KSh 7,850</h4>
                <span>Wallet · Main</span>
                <div className="campus-wallet-actions">
                  <button type="button">
                    <FiSend aria-hidden="true" />
                    Send
                  </button>
                  <button type="button">
                    <FiDownload aria-hidden="true" />
                    Request
                  </button>
                  <button type="button">
                    <FiCreditCard aria-hidden="true" />
                    Save
                  </button>
                  <button type="button">
                    <FiClock aria-hidden="true" />
                    History
                  </button>
                </div>
              </div>
            </section>

            <section className="campus-rail-card">
              <header>
                <h3>Your Portfolio</h3>
                <button type="button" className="campus-link-btn">View all</button>
              </header>
              <section className="campus-portfolio-overview" aria-label="Portfolio highlights">
                <p className="campus-portfolio-meta">Strathmore University · Year 3 · Marketing & Design</p>
                <div className="campus-portfolio-stats">
                  {PORTFOLIO_STATS.map((stat) => (
                    <article key={stat.label} className="campus-portfolio-stat">
                      <p className="campus-portfolio-stat-label">{stat.label}</p>
                      <p className="campus-portfolio-stat-value">{stat.value}</p>
                      <p className="campus-portfolio-stat-detail">{stat.detail}</p>
                      <p className="campus-portfolio-stat-trend">{stat.trend}</p>
                    </article>
                  ))}
                </div>
              </section>
              <div className="campus-rail-list is-portfolio">
                {GROUPS.map((group) => (
                  <article key={group.name} className="campus-list-item">
                    <div className="campus-list-head">
                      <div>
                        <h4>{group.name}</h4>
                        <p>{group.value}</p>
                      </div>
                      <button type="button" className="campus-icon-btn plain" aria-label={`Manage ${group.name}`}>
                        <FiMoreHorizontal aria-hidden="true" />
                      </button>
                    </div>
                    <div className="campus-progress">
                      <span style={{ width: `${group.progress}%` }} />
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="campus-rail-card">
              <header>
                <h3>Upcoming Events</h3>
                <button type="button" className="campus-link-btn">View all</button>
              </header>
              <div className="campus-rail-list">
                {EVENTS.map((event) => (
                  <article key={event.title} className="campus-event-item">
                    <img className="campus-event-thumb" src={event.thumbnail} alt={`${event.title} thumbnail`} loading="lazy" />
                    <div>
                      <h4>{event.title}</h4>
                      <p>{event.time}</p>
                      <span>{event.attendees} attending</span>
                    </div>
                    <button type="button" className="campus-join-btn">Join</button>
                  </article>
                ))}
              </div>
            </section>

            <section className="campus-rail-card">
              <article className="campus-papers">
                <div className="campus-paper-icon">
                  <FiBookOpen aria-hidden="true" />
                </div>
                <div>
                  <h4>New Past Papers</h4>
                  <p>12 new past papers uploaded</p>
                </div>
                <FiChevronRight aria-hidden="true" />
              </article>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default CampusPage
