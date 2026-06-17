export const SEARCH_HINTS = ['High performance', 'Good for ML & Python', '16GB RAM or more', 'SSD storage', 'Great battery life']
export const SEARCH_TABS = [
  { label: 'All Results', count: 78, active: true },
  { label: 'Marketplace', count: 42 },
  { label: 'People', count: 16 },
  { label: 'Projects', count: 8 },
  { label: 'Resources', count: 12 },
]

export const MARKETPLACE_RESULTS = [
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

export const PEOPLE_WHO_CAN_HELP = [
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

export const TOP_LEARNING_RESOURCES = [
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

export const CAMPUS_FEED_FILTERS = ['All', 'Following', 'For You', 'Announcements', 'Events', 'Marketplace', 'Projects & Work']

export const CAMPUS_STORIES = [
  { id: 'your-story', name: 'Your Story', avatar: '/assets/index/bee_nobg.png', own: true },
  { id: 'mercy-story', name: 'Mercy W.', avatar: '/assets/index/bee_nobg.png' },
  { id: 'dennis-story', name: 'Dennis O.', avatar: '/assets/index/bee_nobg.png', online: true },
  { id: 'achieng-story', name: "Achieng'", avatar: '/assets/index/bee_nobg.png', online: true },
  { id: 'david-story', name: 'David K.', avatar: '/assets/index/bee_nobg.png', online: true },
  { id: 'fatma-story', name: 'Fatma A.', avatar: '/assets/index/bee_nobg.png', online: true },
  { id: 'collins-story', name: 'Collins M.', avatar: '/assets/index/bee_nobg.png', online: true },
]

export const FEED_POSTS = [
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

export const FEED_COMMENTS = {
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

export const EXPLORE_PRODUCT_DETAILS = {
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

export const PEOPLE_YOU_MAY_KNOW = [
  { id: 'mercy-wanjiku', name: 'Mercy Wanjiku', school: 'Kenyatta University' },
  { id: 'brian-odhiambo', name: 'Brian Odhiambo', school: 'Kenyatta University' },
  { id: 'tessy-njoki', name: 'Tessy Njoki', school: 'Kenyatta University', isOnline: true },
]

export const CAMPUS_ANNOUNCEMENTS = [
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

export const UPCOMING_EVENTS = [
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

export const MARKETPLACE_ITEMS = [
  { id: 'textbooks', name: 'Textbooks Bundle', price: 'KSh 1,500', image: '/assets/index/business_page_images/optimized/ernest-malimon-XLIywCaTs_M-unsplash.webp' },
  { id: 'calculators', name: 'Calculators', price: 'KSh 1,000', image: '/assets/index/business_page_images/optimized/igor-rodrigues-Wn932wwnpSE-unsplash.webp' },
  { id: 'mini-fridge', name: 'Hostel Mini Fridge', price: 'KSh 6,500', image: '/assets/index/business_page_images/optimized/mapbox-ZT5v0puBjZI-unsplash.webp' },
]
