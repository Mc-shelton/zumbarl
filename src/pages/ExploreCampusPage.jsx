import {
  FiArrowRight,
  FiBell,
  FiBookmark,
  FiBookOpen,
  FiChevronLeft,
  FiChevronDown,
  FiChevronRight,
  FiBriefcase,
  FiCalendar,
  FiClock,
  FiCreditCard,
  FiImage,
  FiHeart,
  FiHome,
  FiInfo,
  FiMail,
  FiMapPin,
  FiMessageCircle,
  FiPlus,
  FiRepeat,
  FiSearch,
  FiShoppingBag,
  FiSmile,
  FiSliders,
  FiStar,
  FiTruck,
  FiUsers,
  FiX,
} from 'react-icons/fi'
import { BsPinAngleFill } from 'react-icons/bs'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Seo from '../components/Seo'
import { CAMPUS_EXPLORE_SEO } from '../features/seo/constants'
import '../styles/campus.css'
import '../styles/explore-campus.css'

const SIDEBAR_NAV_ITEMS = [
  { label: 'Home', Icon: FiHome, active: false, href: '/campus' },
  { label: 'Opportunities', Icon: FiBriefcase, active: false, href: '/campus/opportunities' },
  { label: 'Explore Campus', Icon: FiCalendar, active: true, href: '/campus/explore' },
  { label: 'Learn & Grow', Icon: FiBookOpen, active: false },
  { label: 'Community', Icon: FiUsers, active: false },
  { label: 'Finance', Icon: FiCreditCard, active: false },
  { label: 'Services', Icon: FiTruck, active: false },
  { label: 'Messages', Icon: FiMail, active: false },
  { label: 'Notifications', Icon: FiBell, active: false },
]

const SEARCH_HINTS = ['High performance', 'Good for ML & Python', '16GB RAM or more', 'SSD storage', 'Great battery life']
const SEARCH_TABS = [
  { label: 'All Results', count: 78, active: true },
  { label: 'Marketplace', count: 42 },
  { label: 'People', count: 16 },
  { label: 'Projects', count: 8 },
  { label: 'Resources', count: 12 },
]

const MARKETPLACE_RESULTS = [
  {
    id: 'lenovo-ideapad-5',
    title: 'Lenovo IdeaPad 5',
    spec: '16GB RAM, 512GB SSD',
    price: '$950',
    condition: 'Excellent condition',
    seller: 'David K.',
    school: 'Kenyatta University',
    image: '/assets/index/business_page_images/optimized/justin-buisson-vIluu0IH6Ps-unsplash.webp',
  },
  {
    id: 'hp-pavilion-15',
    title: 'HP Pavilion 15',
    spec: '16GB RAM, 512GB SSD',
    price: '$899',
    condition: 'Very good condition',
    seller: 'Mercy W.',
    school: 'Kenyatta University',
    image: '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp',
  },
  {
    id: 'dell-inspiron-3520',
    title: 'Dell Inspiron 15 3520',
    spec: '16GB RAM, 512GB SSD',
    price: '$920',
    condition: 'Excellent condition',
    seller: 'Collins M.',
    school: 'Kenyatta University',
    image: '/assets/index/business_page_images/optimized/product-school-XZkk5xT8Xrk-unsplash.webp',
  },
  {
    id: 'acer-aspire-5',
    title: 'Acer Aspire 5',
    spec: '16GB RAM, 512GB SSD',
    price: '$850',
    condition: 'Good condition',
    seller: 'Dennis O.',
    school: 'Kenyatta University',
    image: '/assets/index/business_page_images/optimized/sable-flow-T74mVg__F_k-unsplash.webp',
  },
]

const PEOPLE_WHO_CAN_HELP = [
  {
    id: 'achieng',
    name: "Achieng' O.",
    role: 'Data Science Student',
    school: 'Kenyatta University',
    skills: ['Python', 'ML', 'R'],
    avatar: '/assets/index/bee_nobg.png',
    isOnline: true,
  },
  {
    id: 'david',
    name: 'David K.',
    role: 'Data Analyst',
    school: 'Kenyatta University',
    skills: ['SQL', 'Python', 'Power BI'],
    avatar: '/assets/index/bee_nobg.png',
    isOnline: true,
  },
  {
    id: 'fatma',
    name: 'Fatma A.',
    role: 'AI & ML Enthusiast',
    school: 'Kenyatta University',
    skills: ['Deep Learning', 'Python'],
    avatar: '/assets/index/bee_nobg.png',
    isOnline: true,
  },
  {
    id: 'brian',
    name: 'Brian O.',
    role: 'Data Science Mentor',
    school: 'Kenyatta University',
    skills: ['Mentor'],
    avatar: '/assets/index/bee_nobg.png',
    isOnline: true,
  },
]

const TOP_LEARNING_RESOURCES = [
  {
    id: 'resource-laptops',
    title: 'Best Laptops for Data Science in 2024',
    meta: 'Article · 5 min read',
    image: '/assets/index/business_page_images/optimized/ernest-malimon-XLIywCaTs_M-unsplash.webp',
  },
  {
    id: 'resource-python-libs',
    title: 'Python Libraries for Data Science',
    meta: 'Guide · 12 min read',
    image: '/assets/index/business_page_images/optimized/alejandro-escamilla-BbQLHCpVUqA-unsplash.webp',
  },
  {
    id: 'resource-roadmap',
    title: 'Data Science Roadmap',
    meta: 'Guide · 8 min read',
    image: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
  },
]

const CAMPUS_FEED_FILTERS = ['All', 'Following', 'For You', 'Announcements', 'Events', 'Marketplace', 'Projects & Work']

const CAMPUS_STORIES = [
  { id: 'your-story', name: 'Your Story', avatar: '/assets/index/bee_nobg.png', own: true },
  { id: 'mercy-story', name: 'Mercy W.', avatar: '/assets/index/bee_nobg.png' },
  { id: 'dennis-story', name: 'Dennis O.', avatar: '/assets/index/bee_nobg.png', online: true },
  { id: 'achieng-story', name: "Achieng'", avatar: '/assets/index/bee_nobg.png', online: true },
  { id: 'david-story', name: 'David K.', avatar: '/assets/index/bee_nobg.png', online: true },
  { id: 'fatma-story', name: 'Fatma A.', avatar: '/assets/index/bee_nobg.png', online: true },
  { id: 'collins-story', name: 'Collins M.', avatar: '/assets/index/bee_nobg.png', online: true },
]

const FEED_POSTS = [
  {
    id: 'aisha-post',
    author: 'Aisha Mwangi',
    handle: '@aisha.mwangi',
    avatar: '/assets/index/bee_nobg.png',
    time: '3h ago',
    tag: 'Product',
    shopProductRef: 'canvas-tote-bag',
    copy: 'Just launched my handmade beaded bracelets collection! Each piece is unique and made with love.',
    stats: { likes: 128, comments: 24, reposts: 12 },
    gallery: [
      '/assets/index/business_page_images/optimized/ernest-malimon-XLIywCaTs_M-unsplash.webp',
      '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
      '/assets/index/business_page_images/optimized/justin-buisson-vIluu0IH6Ps-unsplash.webp',
      '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp',
      '/assets/index/business_page_images/optimized/product-school-XZkk5xT8Xrk-unsplash.webp',
      '/assets/index/business_page_images/optimized/sable-flow-T74mVg__F_k-unsplash.webp',
    ],
  },
  {
    id: 'collins-post',
    author: 'Collins Otieno',
    handle: '@collins.dev',
    avatar: '/assets/index/bee_nobg.png',
    time: '5h ago',
    tag: 'Project',
    copy: 'Just completed my latest data dashboard for analyzing student performance trends. Built using Python, SQL and Power BI.',
    stats: { likes: 92, comments: 11, reposts: 8 },
    gallery: ['/assets/index/business_page_images/optimized/alejandro-escamilla-BbQLHCpVUqA-unsplash.webp'],
  },
]

const FEED_COMMENTS = {
  'aisha-post': [
    { id: 'a1', author: 'Mercy Wanjiku', handle: '@mercy.w', time: '1h', avatar: '/assets/index/bee_nobg.png', text: 'These are beautiful. Proud of your launch!' },
    { id: 'a2', author: 'David K.', handle: '@davidk', time: '52m', avatar: '/assets/index/bee_nobg.png', text: 'Love the color mixes. Do you deliver on campus?' },
    { id: 'a3', author: 'Tessy Njoki', handle: '@tessy', time: '34m', avatar: '/assets/index/bee_nobg.png', text: 'I need two of these for graduation week.' },
  ],
  'collins-post': [
    { id: 'c1', author: 'Brian Odhiambo', handle: '@brian.o', time: '48m', avatar: '/assets/index/bee_nobg.png', text: 'Clean dashboard layout. Which chart lib did you use?' },
    { id: 'c2', author: 'Fatma A.', handle: '@fatma.ai', time: '27m', avatar: '/assets/index/bee_nobg.png', text: 'Great work. The KPI cards are clear and readable.' },
  ],
}

const EXPLORE_PRODUCT_DETAILS = {
  'canvas-tote-bag': {
    id: 'canvas-tote-bag',
    seller: 'Aisha Mwangi',
    title: 'Canvas Tote Bag',
    price: 'KES 980',
    badge: 'New Arrival',
    description: 'Roomy eco-friendly tote bag for classes, errands and weekend plans.',
    rating: '4.9',
    reviews: 48,
    sold: 156,
    gallery: [
      '/assets/index/business_page_images/optimized/igor-rodrigues-Wn932wwnpSE-unsplash.webp',
      '/assets/index/business_page_images/optimized/annie-spratt-hCb3lIB8L8E-unsplash.webp',
      '/assets/index/business_page_images/optimized/sable-flow-T74mVg__F_k-unsplash.webp',
      '/assets/index/business_page_images/optimized/ernest-malimon-XLIywCaTs_M-unsplash.webp',
    ],
    featureChips: [
      { label: 'Material', value: 'Canvas' },
      { label: 'Category', value: 'Lifestyle' },
      { label: 'Stock', value: '24 left' },
      { label: 'Delivery', value: '24h' },
    ],
    summary: 'Crafted for campus life, this tote handles books, groceries, and daily carry with ease.',
    details: [
      'Inner zip pocket for valuables.',
      'Soft shoulder straps with reinforced stitching.',
      'Easy to clean and water-resistant lining.',
      'Available in neutral and pastel tones.',
    ],
    colors: ['#f0dfcb', '#8b5e3a', '#d4c2aa', '#9ca8bf'],
    posts: [
      {
        id: 'canvas-post-1',
        title: 'Everyday Looks',
        date: 'May 5',
        caption: 'Simple styling for lectures and errands.',
        image: '/assets/index/business_page_images/optimized/ernest-malimon-XLIywCaTs_M-unsplash.webp',
        likes: 63,
        comments: 10,
      },
      {
        id: 'canvas-post-2',
        title: 'What Fits Inside',
        date: '4d ago',
        caption: 'Fits notebooks, laptop sleeve and essentials.',
        image: '/assets/index/business_page_images/optimized/sable-flow-T74mVg__F_k-unsplash.webp',
        likes: 42,
        comments: 7,
      },
    ],
  },
}

const PEOPLE_YOU_MAY_KNOW = [
  { id: 'mercy-wanjiku', name: 'Mercy Wanjiku', school: 'Kenyatta University' },
  { id: 'brian-odhiambo', name: 'Brian Odhiambo', school: 'Kenyatta University' },
  { id: 'tessy-njoki', name: 'Tessy Njoki', school: 'Kenyatta University', isOnline: true },
]

const CAMPUS_ANNOUNCEMENTS = [
  {
    id: 'exam-timetable',
    title: 'Exams Timetable Released',
    detail: 'Check the exam timetable for May/June semester.',
    time: '2h ago',
  },
  {
    id: 'clubs-drive',
    title: 'KU Clubs Recruitment Drive',
    detail: 'Join various clubs and grow your talents.',
    time: '5h ago',
  },
  {
    id: 'fee-reminder',
    title: 'Fee Payment Reminder',
    detail: 'Second installment deadline is 31st May.',
    time: '1d ago',
  },
]

const UPCOMING_EVENTS = [
  {
    id: 'innovation-summit',
    title: 'Innovation & Entrepreneurship Summit',
    dateTime: '24 May, 2024 · 9:00 AM',
    location: 'Chandaria Auditorium',
    image: '/assets/index/business_page_images/optimized/sable-flow-T74mVg__F_k-unsplash.webp',
  },
  {
    id: 'career-fair',
    title: 'Career Fair 2024',
    dateTime: '31 May, 2024 · 10:00 AM',
    location: 'Main Campus Grounds',
    image: '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp',
  },
  {
    id: 'code-coffee',
    title: 'Code & Coffee Meetup',
    dateTime: '7 June, 2024 · 4:00 PM',
    location: 'School of Computing',
    image: '/assets/index/business_page_images/optimized/product-school-XZkk5xT8Xrk-unsplash.webp',
  },
]

const MARKETPLACE_ITEMS = [
  { id: 'textbooks', name: 'Textbooks Bundle', price: 'KSh 1,500', image: '/assets/index/business_page_images/optimized/ernest-malimon-XLIywCaTs_M-unsplash.webp' },
  { id: 'calculators', name: 'Calculators', price: 'KSh 1,000', image: '/assets/index/business_page_images/optimized/igor-rodrigues-Wn932wwnpSE-unsplash.webp' },
  { id: 'mini-fridge', name: 'Hostel Mini Fridge', price: 'KSh 6,500', image: '/assets/index/business_page_images/optimized/mapbox-ZT5v0puBjZI-unsplash.webp' },
]

function ExploreCampusPage() {
  const mainScrollContainerRef = useRef(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const activeQuery = (searchParams.get('q') || '').trim()
  const isSearchMode = activeQuery.length > 0
  const [searchInput, setSearchInput] = useState(activeQuery)
  const [isStoriesVisible, setIsStoriesVisible] = useState(true)
  const [mediaViewerState, setMediaViewerState] = useState(null)
  const [activeRailProductId, setActiveRailProductId] = useState(null)
  const [activeRailProductImageIndex, setActiveRailProductImageIndex] = useState(0)
  const [activeRailProductTab, setActiveRailProductTab] = useState('details')
  const isStoriesVisibleRef = useRef(true)
  const scrollMetaRef = useRef({
    lastOffset: 0,
    direction: 0,
    travel: 0,
    cooldownUntil: 0,
  })

  const TOP_LOCK_OFFSET = 40
  const HIDE_TRAVEL_THRESHOLD = 72
  const SHOW_TRAVEL_THRESHOLD = 40
  const SCROLL_DELTA_EPSILON = 1
  const TOGGLE_COOLDOWN_MS = 260

  const getWrappedGalleryIndex = (nextIndex, galleryLength) => {
    if (galleryLength <= 0) {
      return 0
    }

    return ((nextIndex % galleryLength) + galleryLength) % galleryLength
  }

  useEffect(() => {
    setSearchInput(activeQuery)
  }, [activeQuery])

  useEffect(() => {
    isStoriesVisibleRef.current = isStoriesVisible
  }, [isStoriesVisible])

  useEffect(() => {
    if (!isSearchMode) {
      return
    }

    setActiveRailProductId(null)
    setActiveRailProductImageIndex(0)
    setActiveRailProductTab('details')
  }, [isSearchMode])

  useEffect(() => {
    if (!mediaViewerState) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow

    const handleModalKeys = (event) => {
      if (event.key === 'Escape') {
        setMediaViewerState(null)
      }

      if (event.key === 'ArrowRight') {
        setMediaViewerState((current) => {
          if (!current) {
            return current
          }

          const post = FEED_POSTS.find((candidate) => candidate.id === current.postId)
          if (!post) {
            return current
          }

          return {
            ...current,
            imageIndex: getWrappedGalleryIndex(current.imageIndex + 1, post.gallery.length),
          }
        })
      }

      if (event.key === 'ArrowLeft') {
        setMediaViewerState((current) => {
          if (!current) {
            return current
          }

          const post = FEED_POSTS.find((candidate) => candidate.id === current.postId)
          if (!post) {
            return current
          }

          return {
            ...current,
            imageIndex: getWrappedGalleryIndex(current.imageIndex - 1, post.gallery.length),
          }
        })
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleModalKeys)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleModalKeys)
    }
  }, [mediaViewerState])

  useEffect(() => {
    if (isSearchMode) {
      setIsStoriesVisible(true)
      return undefined
    }

    const getCurrentScrollOffset = () => {
      const mainScrollContainer = mainScrollContainerRef.current

      if (mainScrollContainer && mainScrollContainer.scrollHeight > mainScrollContainer.clientHeight) {
        return mainScrollContainer.scrollTop
      }

      return window.scrollY || document.documentElement.scrollTop || 0
    }

    scrollMetaRef.current = {
      lastOffset: getCurrentScrollOffset(),
      direction: 0,
      travel: 0,
      cooldownUntil: 0,
    }

    const handleScroll = () => {
      const now = performance.now()
      const meta = scrollMetaRef.current
      const currentScrollY = getCurrentScrollOffset()
      const delta = currentScrollY - meta.lastOffset

      if (Math.abs(delta) < SCROLL_DELTA_EPSILON) {
        meta.lastOffset = currentScrollY
        return
      }

      if (now < meta.cooldownUntil) {
        meta.lastOffset = currentScrollY
        return
      }

      const direction = delta > 0 ? 1 : -1

      if (direction !== meta.direction) {
        meta.direction = direction
        meta.travel = 0
      }

      meta.travel += Math.abs(delta)

      if (currentScrollY <= TOP_LOCK_OFFSET) {
        if (!isStoriesVisibleRef.current) {
          setIsStoriesVisible(true)
          isStoriesVisibleRef.current = true
        }

        meta.direction = 0
        meta.travel = 0
      } else if (isStoriesVisibleRef.current && direction === 1 && meta.travel >= HIDE_TRAVEL_THRESHOLD) {
        setIsStoriesVisible(false)
        isStoriesVisibleRef.current = false
        meta.direction = 0
        meta.travel = 0
        meta.cooldownUntil = now + TOGGLE_COOLDOWN_MS
      } else if (!isStoriesVisibleRef.current && direction === -1 && meta.travel >= SHOW_TRAVEL_THRESHOLD) {
        setIsStoriesVisible(true)
        isStoriesVisibleRef.current = true
        meta.direction = 0
        meta.travel = 0
        meta.cooldownUntil = now + TOGGLE_COOLDOWN_MS
      }

      meta.lastOffset = currentScrollY
    }

    const mainScrollContainer = mainScrollContainerRef.current

    if (mainScrollContainer) {
      mainScrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      if (mainScrollContainer) {
        mainScrollContainer.removeEventListener('scroll', handleScroll)
      }

      window.removeEventListener('scroll', handleScroll)
    }
  }, [isSearchMode])

  const handleSearchSubmit = (event) => {
    event.preventDefault()

    const nextQuery = searchInput.trim()
    const nextParams = new URLSearchParams(searchParams)

    if (nextQuery) {
      nextParams.set('q', nextQuery)
    } else {
      nextParams.delete('q')
    }

    setSearchParams(nextParams)
  }

  const handleClearSearch = () => {
    setSearchInput('')

    if (!isSearchMode) {
      return
    }

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('q')
    setSearchParams(nextParams)
  }

  const openMediaViewer = (postId, imageIndex) => {
    setMediaViewerState({ postId, imageIndex })
  }

  const closeMediaViewer = () => {
    setMediaViewerState(null)
  }

  const handleViewProduct = (post) => {
    if (!post.shopProductRef) {
      return
    }

    if (!EXPLORE_PRODUCT_DETAILS[post.shopProductRef]) {
      return
    }

    setActiveRailProductId(post.shopProductRef)
    setActiveRailProductImageIndex(0)
    setActiveRailProductTab('details')
  }

  const stepMediaViewer = (direction) => {
    setMediaViewerState((current) => {
      if (!current) {
        return current
      }

      const post = FEED_POSTS.find((candidate) => candidate.id === current.postId)
      if (!post) {
        return current
      }

      return {
        ...current,
        imageIndex: getWrappedGalleryIndex(current.imageIndex + direction, post.gallery.length),
      }
    })
  }

  const activeMediaPost = mediaViewerState
    ? FEED_POSTS.find((candidate) => candidate.id === mediaViewerState.postId) || null
    : null
  const activeMediaIndex = activeMediaPost
    ? Math.min(Math.max(mediaViewerState?.imageIndex ?? 0, 0), activeMediaPost.gallery.length - 1)
    : 0
  const activeMediaImage = activeMediaPost ? activeMediaPost.gallery[activeMediaIndex] : null
  const activeMediaComments = activeMediaPost ? FEED_COMMENTS[activeMediaPost.id] || [] : []
  const activeRailProduct = activeRailProductId ? EXPLORE_PRODUCT_DETAILS[activeRailProductId] || null : null
  const activeRailProductGallery = activeRailProduct?.gallery || []
  const normalizedRailProductImageIndex = activeRailProductGallery.length
    ? getWrappedGalleryIndex(activeRailProductImageIndex, activeRailProductGallery.length)
    : 0
  const activeRailProductImage = activeRailProductGallery[normalizedRailProductImageIndex] || null

  const handleStepRailProductImage = (direction) => {
    if (!activeRailProductGallery.length) {
      return
    }

    setActiveRailProductImageIndex((current) => getWrappedGalleryIndex(current + direction, activeRailProductGallery.length))
  }

  return (
    <main className="campus-page explore-campus-page">
      <Seo
        title={CAMPUS_EXPLORE_SEO.title}
        description={CAMPUS_EXPLORE_SEO.description}
        path={CAMPUS_EXPLORE_SEO.path}
        keywords={CAMPUS_EXPLORE_SEO.keywords}
        jsonLd={[CAMPUS_EXPLORE_SEO.pageJsonLd]}
      />

      <div className="campus-stage">
        <div className={`campus-shell explore-campus-shell${activeRailProduct ? ' is-product-detail-open' : ''}`}>
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

          <section ref={mainScrollContainerRef} className="campus-main explore-campus-main">
            <div className="explore-campus-sticky-head">
              <section className="explore-campus-topbar" aria-label="Search and quick actions">
                <form className="explore-campus-global-search" onSubmit={handleSearchSubmit}>
                  <button type="submit" className="explore-campus-search-submit" aria-label="Search explore campus">
                    <FiSearch aria-hidden="true" />
                  </button>
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search for people, posts, events, and more..."
                    aria-label="Search explore campus"
                  />
                  {searchInput ? (
                    <button type="button" aria-label="Clear search" className="explore-campus-search-clear" onClick={handleClearSearch}>
                      <FiX aria-hidden="true" />
                    </button>
                  ) : (
                    <span className="explore-campus-search-slot" aria-hidden="true" />
                  )}
                </form>

                <button type="button" className="explore-campus-discover-btn">
                  <FiPlus aria-hidden="true" />
                  Explore
                </button>

                <div className="explore-campus-header-actions">
                  <button type="button" className="campus-icon-btn" aria-label="Open messages">
                    <FiMessageCircle aria-hidden="true" />
                    <span className="campus-badge">3</span>
                  </button>
                  <button type="button" className="campus-icon-btn" aria-label="Open notifications">
                    <FiBell aria-hidden="true" />
                    <span className="campus-badge">6</span>
                  </button>
                  <button type="button" className="explore-campus-user-btn" aria-label="Open profile menu">
                    <img src="/assets/index/bee_nobg.png" alt="Brian avatar" />
                    <FiChevronDown aria-hidden="true" />
                  </button>
                </div>
              </section>

              {isSearchMode ? (
                <section className="explore-campus-ai-search-card" aria-label="AI search summary">
                  <p className="explore-campus-breadcrumb">
                    <span>Explore Campus</span>
                    <FiChevronRight aria-hidden="true" />
                    <strong>Search</strong>
                  </p>

                  <header className="explore-campus-ai-head">
                    <div>
                      <h1>
                        <FiSearch aria-hidden="true" />
                        AI Search
                        <span>BETA</span>
                      </h1>
                      <p>Powered by AI to help you find the best results, faster.</p>
                    </div>
                    <button type="button" className="explore-campus-how-btn">
                      How it works
                      <FiInfo aria-hidden="true" />
                    </button>
                  </header>

                  <section className="explore-campus-ai-summary">
                    <p>
                      I found <strong>78 relevant results</strong> for <strong>&ldquo;{activeQuery}&rdquo;</strong> across the campus community,
                      marketplace, and resources.
                    </p>
                    <p className="explore-campus-ai-hints-label">Top picks based on your search:</p>
                    <div className="explore-campus-ai-hints">
                      {SEARCH_HINTS.map((hint) => (
                        <span key={hint}>{hint}</span>
                      ))}
                    </div>
                  </section>

                  <section className="explore-campus-tabs-row">
                    <nav className="explore-campus-tabs" aria-label="Search result categories">
                      {SEARCH_TABS.map((tab) => (
                        <button key={tab.label} type="button" className={tab.active ? 'is-active' : ''}>
                          {tab.label} ({tab.count})
                        </button>
                      ))}
                    </nav>
                    <button type="button" className="explore-campus-filter-btn">
                      <FiSliders aria-hidden="true" />
                      Filter
                    </button>
                  </section>
                </section>
              ) : (
                <section className="explore-campus-feed-hero" aria-label="Explore campus feed">
                  <p className="explore-campus-breadcrumb">
                    <span>Campus</span>
                    <FiChevronRight aria-hidden="true" />
                    <strong>Explore Campus</strong>
                  </p>

                  <header className="explore-campus-feed-hero-head">
                    <div>
                      <h1>Explore Campus</h1>
                      <p>Discover what&apos;s happening around campus. Connect, engage and stay updated.</p>
                    </div>
                    <div className="explore-campus-feed-hero-actions">
                      <button type="button" className="explore-campus-ghost-btn">
                        <FiUsers aria-hidden="true" />
                        Find Friends
                      </button>
                      <button type="button" className="explore-campus-ghost-btn">
                        <FiUsers aria-hidden="true" />
                        Invite Friends
                      </button>
                    </div>
                  </header>

                  <nav className="explore-campus-feed-tabs" aria-label="Explore campus feed filters">
                    {CAMPUS_FEED_FILTERS.map((filter, index) => (
                      <button key={filter} type="button" className={index === 0 ? 'is-active' : ''}>
                        {filter}
                      </button>
                    ))}
                  </nav>

                  <section className={`explore-campus-stories${isStoriesVisible ? '' : ' is-hidden'}`} aria-label="Stories">
                    <h2>Stories</h2>
                    <div className="explore-campus-stories-row">
                      {CAMPUS_STORIES.map((story) => (
                        <article key={story.id} className="explore-campus-story-item">
                          <div className={`explore-campus-story-avatar${story.own ? ' is-own' : ''}`}>
                            <img src={story.avatar} alt={story.name} loading="lazy" />
                            {story.own ? <span className="explore-campus-story-plus">+</span> : null}
                            {story.online ? <span className="explore-campus-story-online" /> : null}
                          </div>
                          <p>{story.name}</p>
                        </article>
                      ))}
                      <button type="button" className="explore-campus-story-more" aria-label="More stories">
                        <FiChevronRight aria-hidden="true" />
                      </button>
                    </div>
                  </section>
                </section>
              )}
            </div>

            {isSearchMode ? (
              <>
                <section className="explore-campus-results-card" aria-label="Marketplace results">
                  <header className="explore-campus-results-head">
                    <h2>
                      <FiBriefcase aria-hidden="true" />
                      Marketplace
                    </h2>
                    <button type="button" className="campus-link-btn">See all 42</button>
                  </header>
                  <div className="explore-campus-market-grid">
                    {MARKETPLACE_RESULTS.map((item) => (
                      <article key={item.id} className="explore-campus-market-result">
                        <button type="button" className="explore-campus-wishlist-btn" aria-label={`Save ${item.title}`}>
                          <FiHeart aria-hidden="true" />
                        </button>
                        <img src={item.image} alt={item.title} loading="lazy" />
                        <h3>{item.title}</h3>
                        <p className="explore-campus-market-meta">{item.spec}</p>
                        <p className="explore-campus-market-price">{item.price}</p>
                        <p className="explore-campus-market-condition">{item.condition}</p>
                        <div className="explore-campus-market-owner">
                          <img src="/assets/index/bee_nobg.png" alt={item.seller} loading="lazy" />
                          <div>
                            <strong>{item.seller}</strong>
                            <span>{item.school}</span>
                          </div>
                        </div>
                      </article>
                    ))}
                    <button type="button" className="explore-campus-market-next" aria-label="More marketplace results">
                      <FiChevronRight aria-hidden="true" />
                    </button>
                  </div>
                </section>

                <section className="explore-campus-results-card" aria-label="People who can help">
                  <header className="explore-campus-results-head">
                    <h2>
                      <FiUsers aria-hidden="true" />
                      People who can help
                    </h2>
                    <button type="button" className="campus-link-btn">See all 16</button>
                  </header>
                  <div className="explore-campus-help-grid">
                    {PEOPLE_WHO_CAN_HELP.map((person) => (
                      <article key={person.id} className="explore-campus-help-card">
                        <div className="explore-campus-help-head">
                          <div className="explore-campus-help-avatar">
                            <img src={person.avatar} alt={person.name} loading="lazy" />
                            {person.isOnline ? <span aria-label="Online" /> : null}
                          </div>
                          <div>
                            <h3>{person.name}</h3>
                            <p>{person.role}</p>
                            <span>{person.school}</span>
                          </div>
                        </div>
                        <div className="explore-campus-help-skills">
                          {person.skills.map((skill) => (
                            <em key={`${person.id}-${skill}`}>{skill}</em>
                          ))}
                        </div>
                        <button type="button" className="explore-campus-connect-btn">Connect</button>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="explore-campus-results-card" aria-label="Top learning resources">
                  <header className="explore-campus-results-head">
                    <h2>
                      <FiBookOpen aria-hidden="true" />
                      Top learning resources
                    </h2>
                    <button type="button" className="campus-link-btn">See all 12</button>
                  </header>
                  <div className="explore-campus-resource-grid">
                    {TOP_LEARNING_RESOURCES.map((resource) => (
                      <article key={resource.id} className="explore-campus-resource-card">
                        <img src={resource.image} alt={resource.title} loading="lazy" />
                        <div>
                          <h3>{resource.title}</h3>
                          <p>{resource.meta}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <>
                <section className="explore-campus-composer-card" aria-label="Create a post">
                  <div className="explore-campus-composer-head">
                    <img src="/assets/index/bee_nobg.png" alt="Brian avatar" loading="lazy" />
                    <button type="button" className="explore-campus-composer-input">What&apos;s happening on campus?</button>
                  </div>
                  <div className="explore-campus-composer-actions">
                    <button type="button">
                      <FiImage aria-hidden="true" />
                      Photo/Video
                    </button>
                    <button type="button">
                      <FiCalendar aria-hidden="true" />
                      Event
                    </button>
                    <button type="button">
                      <FiBriefcase aria-hidden="true" />
                      Poll
                    </button>
                    <button type="button">
                      <FiSmile aria-hidden="true" />
                      Feeling/Activity
                    </button>
                    <button type="button" className="explore-campus-post-btn">Post</button>
                  </div>
                </section>

                <article className="explore-campus-feed-card explore-campus-pinned-card" aria-label="Pinned announcement">
                  <header className="explore-campus-feed-head">
                    <p className="explore-campus-pinned-label">
                      <BsPinAngleFill aria-hidden="true" />
                      Pinned Announcement
                    </p>
                    <button type="button" className="explore-campus-more-btn" aria-label="More announcement options">
                      ...
                    </button>
                  </header>

                  <div className="explore-campus-feed-author">
                    <img src="/assets/index/bee_nobg.png" alt="Kenyatta University Official" loading="lazy" />
                    <div>
                      <h3>Kenyatta University Official</h3>
                      <p>@KU_Official · 2h ago</p>
                    </div>
                  </div>

                  <p className="explore-campus-feed-copy">
                    The 3rd Annual Innovation & Entrepreneurship Summit is here! Join industry leaders, alumni and students as we shape the
                    future together.
                  </p>

                  <footer className="explore-campus-pinned-meta">
                    <span>
                      <FiCalendar aria-hidden="true" />
                      24 May, 2024
                    </span>
                    <span>
                      <FiClock aria-hidden="true" />
                      9:00 AM - 4:00 PM
                    </span>
                    <span>
                      <FiMapPin aria-hidden="true" />
                      Chandaria Auditorium
                    </span>
                    <button type="button" className="explore-campus-learn-btn">Learn More</button>
                  </footer>
                </article>

                {FEED_POSTS.map((post) => (
                  <article key={post.id} className="explore-campus-feed-card" aria-label={`${post.author} post`}>
                    <header className="explore-campus-feed-head">
                      <div className="explore-campus-feed-author">
                        <img src="/assets/index/bee_nobg.png" alt={post.author} loading="lazy" />
                        <div>
                          <h3>
                            {post.author} <span>{post.handle}</span>
                          </h3>
                          <p>
                            <span>{post.time}</span>
                            <em>{post.tag}</em>
                            {post.tag === 'Product' && post.shopProductRef ? (
                              <button
                                type="button"
                                className="explore-campus-view-product-chip"
                                onClick={() => handleViewProduct(post)}
                              >
                                View product
                              </button>
                            ) : null}
                          </p>
                        </div>
                      </div>
                      <button type="button" className="explore-campus-more-btn" aria-label={`More options for ${post.author}`}>
                        ...
                      </button>
                    </header>

                    <p className="explore-campus-feed-copy">{post.copy}</p>

                    <div className={`explore-campus-feed-gallery${post.gallery.length === 1 ? ' is-single' : ''}`}>
                      {(post.gallery.length > 3 ? post.gallery.slice(0, 3) : post.gallery).map((image, index) => {
                        const hiddenCount = post.gallery.length - 3

                        return (
                          <button
                            key={`${post.id}-${image}`}
                            type="button"
                            className="explore-campus-feed-gallery-item"
                            onClick={() => openMediaViewer(post.id, index)}
                            aria-label={`Open image ${index + 1} from ${post.author} post`}
                          >
                            <img src={image} alt={`${post.author} post`} loading="lazy" />
                            {hiddenCount > 0 && index === 2 ? (
                              <span className="explore-campus-feed-gallery-badge">+{hiddenCount}</span>
                            ) : null}
                          </button>
                        )
                      })}
                    </div>

                    <footer className="explore-campus-feed-stats">
                      <button type="button">
                        <FiHeart aria-hidden="true" />
                        {post.stats.likes}
                      </button>
                      <button type="button">
                        <FiMessageCircle aria-hidden="true" />
                        {post.stats.comments}
                      </button>
                      <button type="button">
                        <FiRepeat aria-hidden="true" />
                        {post.stats.reposts}
                      </button>
                      <button type="button" className="explore-campus-save-btn" aria-label={`Save ${post.author} post`}>
                        <FiBookmark aria-hidden="true" />
                      </button>
                    </footer>
                  </article>
                ))}
              </>
            )}
          </section>

          <aside className="campus-rail explore-campus-rail" aria-label="Explore campus side panels">
            {activeRailProduct ? (
              <section className="campus-rail-card explore-campus-right-card explore-campus-product-detail-card">
                <header className="explore-campus-product-detail-topbar">
                  <button
                    type="button"
                    className="explore-campus-product-more-btn"
                    onClick={() => setActiveRailProductTab('details')}
                  >
                    More details
                  </button>
                  <div>
                    <button
                      type="button"
                      aria-label="Previous product image"
                      onClick={() => handleStepRailProductImage(-1)}
                    >
                      <FiChevronLeft aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next product image"
                      onClick={() => handleStepRailProductImage(1)}
                    >
                      <FiChevronRight aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label="Close product details"
                      onClick={() => {
                        setActiveRailProductId(null)
                        setActiveRailProductImageIndex(0)
                        setActiveRailProductTab('details')
                      }}
                    >
                      <FiX aria-hidden="true" />
                    </button>
                  </div>
                </header>

                {activeRailProductImage ? (
                  <section className="explore-campus-product-gallery">
                    <div className="explore-campus-product-thumbs">
                      {activeRailProductGallery.map((image, index) => (
                        <button
                          key={`${activeRailProduct.id}-thumb-${index}`}
                          type="button"
                          className={index === normalizedRailProductImageIndex ? 'is-active' : ''}
                          aria-label={`Show product image ${index + 1}`}
                          onClick={() => setActiveRailProductImageIndex(index)}
                        >
                          <img src={image} alt={`${activeRailProduct.title} thumbnail ${index + 1}`} loading="lazy" />
                        </button>
                      ))}
                    </div>
                    <div className="explore-campus-product-hero">
                      <img src={activeRailProductImage} alt={`${activeRailProduct.title} preview`} loading="lazy" />
                      <em>{activeRailProduct.badge}</em>
                      <span>{normalizedRailProductImageIndex + 1}/{activeRailProductGallery.length}</span>
                    </div>
                  </section>
                ) : null}

                <div className="explore-campus-product-title-row">
                  <div>
                    <h3>{activeRailProduct.title}</h3>
                    <p>by {activeRailProduct.seller}</p>
                  </div>
                  <strong>{activeRailProduct.price}</strong>
                </div>

                <p className="explore-campus-product-rating">
                  <FiStar aria-hidden="true" />
                  {activeRailProduct.rating} ({activeRailProduct.reviews} reviews) · {activeRailProduct.sold} sold
                </p>

                <p className="explore-campus-product-description">{activeRailProduct.description}</p>

                <div className="explore-campus-product-chip-grid">
                  {activeRailProduct.featureChips.map((chip) => (
                    <article key={`${activeRailProduct.id}-${chip.label}`}>
                      <p>{chip.label}</p>
                      <strong>{chip.value}</strong>
                    </article>
                  ))}
                </div>

                <div className="explore-campus-product-actions">
                  <button type="button" className="explore-campus-product-action-btn is-primary">
                    <FiShoppingBag aria-hidden="true" />
                    Add to Cart
                  </button>
                  <button type="button" className="explore-campus-product-action-btn is-ghost">Buy Now</button>
                </div>

                <div className="explore-campus-product-switcher">
                  <button
                    type="button"
                    className={activeRailProductTab === 'details' ? 'is-active' : ''}
                    onClick={() => setActiveRailProductTab('details')}
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    className={activeRailProductTab === 'posts' ? 'is-active' : ''}
                    onClick={() => setActiveRailProductTab('posts')}
                  >
                    Posts ({activeRailProduct.posts.length})
                  </button>
                </div>

                {activeRailProductTab === 'details' ? (
                  <section className="explore-campus-product-copy">
                    <h4>Product Details</h4>
                    <p>{activeRailProduct.summary}</p>
                    <ul>
                      {activeRailProduct.details.map((detail) => (
                        <li key={`${activeRailProduct.id}-${detail}`}>{detail}</li>
                      ))}
                    </ul>
                    <h4>Available Colors</h4>
                    <div className="explore-campus-product-color-row">
                      {activeRailProduct.colors.map((color) => (
                        <span key={`${activeRailProduct.id}-${color}`} style={{ background: color }} />
                      ))}
                    </div>
                    <footer className="explore-campus-product-footer">
                      <p>
                        <FiMapPin aria-hidden="true" />
                        Ships from Nairobi, Kenya
                      </p>
                      <p>
                        <FiRepeat aria-hidden="true" />
                        7-day easy returns
                      </p>
                    </footer>
                  </section>
                ) : (
                  <section className="explore-campus-product-posts">
                    {activeRailProduct.posts.map((post) => (
                      <article key={post.id}>
                        <img src={post.image} alt={post.title} loading="lazy" />
                        <div>
                          <h4>{post.title}</h4>
                          <p>{post.caption}</p>
                          <span>{post.date}</span>
                        </div>
                        <footer>
                          <p>
                            <FiHeart aria-hidden="true" />
                            {post.likes}
                          </p>
                          <p>
                            <FiMessageCircle aria-hidden="true" />
                            {post.comments}
                          </p>
                        </footer>
                      </article>
                    ))}
                  </section>
                )}
              </section>
            ) : (
              <>
                <section className="campus-rail-card explore-campus-right-card">
                  <header>
                    <h3>People You May Know</h3>
                    <button type="button" className="campus-link-btn">See All</button>
                  </header>

                  <div className="explore-campus-people-list">
                    {PEOPLE_YOU_MAY_KNOW.map((person) => (
                      <article key={person.id} className="explore-campus-person-item">
                        <div className="explore-campus-person-avatar">
                          <img src="/assets/index/bee_nobg.png" alt={person.name} />
                          {person.isOnline ? <span /> : null}
                        </div>
                        <div>
                          <h4>{person.name}</h4>
                          <p>{person.school}</p>
                        </div>
                        <button type="button" className="explore-campus-follow-btn">Follow</button>
                        <button type="button" className="explore-campus-close-btn" aria-label={`Dismiss ${person.name}`}>
                          <FiX aria-hidden="true" />
                        </button>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="campus-rail-card explore-campus-right-card">
                  <header>
                    <h3>Campus Announcements</h3>
                    <button type="button" className="campus-link-btn">See All</button>
                  </header>

                  <div className="explore-campus-announcement-list">
                    {CAMPUS_ANNOUNCEMENTS.map((announcement) => (
                      <article key={announcement.id}>
                        <h4>{announcement.title}</h4>
                        <p>{announcement.detail}</p>
                        <span>{announcement.time}</span>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="campus-rail-card explore-campus-right-card">
                  <header>
                    <h3>Upcoming Events</h3>
                    <button type="button" className="campus-link-btn">See All</button>
                  </header>

                  <div className="explore-campus-events-list">
                    {UPCOMING_EVENTS.map((event) => (
                      <article key={event.id} className="explore-campus-event-item">
                        <div>
                          <h4>{event.title}</h4>
                          <p>
                            <FiClock aria-hidden="true" />
                            {event.dateTime}
                          </p>
                          <span>
                            <FiMapPin aria-hidden="true" />
                            {event.location}
                          </span>
                        </div>
                        <img src={event.image} alt={event.title} loading="lazy" />
                      </article>
                    ))}
                  </div>
                </section>

                <section className="campus-rail-card explore-campus-right-card">
                  <header>
                    <h3>Marketplace</h3>
                    <button type="button" className="campus-link-btn">See All</button>
                  </header>

                  <div className="explore-campus-market-list">
                    {MARKETPLACE_ITEMS.map((item) => (
                      <article key={item.id} className="explore-campus-market-item">
                        <img src={item.image} alt={item.name} loading="lazy" />
                        <div>
                          <h4>{item.name}</h4>
                          <p>{item.price}</p>
                        </div>
                        <button type="button" aria-label={`Open ${item.name}`}>
                          <FiShoppingBag aria-hidden="true" />
                        </button>
                      </article>
                    ))}
                  </div>
                </section>
              </>
            )}
          </aside>

          {activeMediaPost && activeMediaImage ? (
            <section className="explore-campus-media-modal" role="dialog" aria-modal="true" aria-label="Post media viewer" onClick={closeMediaViewer}>
              <div className="explore-campus-media-content" onClick={(event) => event.stopPropagation()}>
                <section className="explore-campus-media-frame">
                  <button type="button" className="explore-campus-media-close" onClick={closeMediaViewer} aria-label="Close media viewer">
                    <FiX aria-hidden="true" />
                  </button>

                  <div className="explore-campus-media-stage">
                    <button
                      type="button"
                      className="explore-campus-media-nav prev"
                      onClick={() => stepMediaViewer(-1)}
                      aria-label="Previous image"
                    >
                      <FiChevronLeft aria-hidden="true" />
                    </button>

                    <img src={activeMediaImage} alt={`${activeMediaPost.author} shared media`} className="explore-campus-media-image" />

                    <button
                      type="button"
                      className="explore-campus-media-nav next"
                      onClick={() => stepMediaViewer(1)}
                      aria-label="Next image"
                    >
                      <FiChevronRight aria-hidden="true" />
                    </button>

                    <p className="explore-campus-media-count">
                      {activeMediaIndex + 1} / {activeMediaPost.gallery.length}
                    </p>
                  </div>
                </section>

                <aside className="explore-campus-media-comments" aria-label="Post comments">
                  <header>
                    <h3>Comments</h3>
                    <span>{activeMediaPost.stats.comments} comments</span>
                  </header>

                  <section className="explore-campus-media-post-context">
                    <div className="explore-campus-media-post-head">
                      <img
                        src={activeMediaPost.avatar || '/assets/index/bee_nobg.png'}
                        alt={activeMediaPost.author}
                        loading="lazy"
                      />
                      <div>
                        <h4>{activeMediaPost.author}</h4>
                        <span>{activeMediaPost.handle}</span>
                      </div>
                    </div>
                    <p>{activeMediaPost.copy}</p>
                  </section>

                  <div className="explore-campus-media-thread">
                    {activeMediaComments.map((comment) => (
                      <article key={comment.id}>
                        <img
                          className="explore-campus-media-comment-avatar"
                          src={comment.avatar || '/assets/index/bee_nobg.png'}
                          alt={comment.author}
                          loading="lazy"
                        />
                        <div className="explore-campus-media-comment-body">
                          <div className="explore-campus-media-comment-head">
                            <strong>{comment.author}</strong>
                            <span>{comment.handle} · {comment.time}</span>
                          </div>
                          <p>{comment.text}</p>
                        </div>
                      </article>
                    ))}
                  </div>

                  <form className="explore-campus-media-comment-box" onSubmit={(event) => event.preventDefault()}>
                    <input type="text" placeholder="Add a comment..." aria-label="Add a comment" />
                    <button type="submit">Post</button>
                  </form>
                </aside>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  )
}

export default ExploreCampusPage
