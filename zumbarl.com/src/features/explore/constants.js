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
  {
    id: 'your-story',
    name: 'Brian Otieno',
    shortName: 'Your Story',
    handle: '@brian.otieno',
    campus: 'Zetech University',
    avatar: '/assets/index/bee_nobg.png',
    own: true,
    items: [
      {
        id: 'brian-campus-survival',
        type: 'video',
        media: '/assets/index/Zumbarl__Campus_Survival.mp4',
        poster: '/assets/index/business_page_images/optimized/sayan-nath-RP1uj-umiKk-unsplash.webp',
        title: 'Campus survival, one shortcut at a time',
        caption: 'The little systems that make lectures, deadlines, and campus life easier.',
        time: 'Just now',
        likes: 34,
        comments: 6,
        duration: 12000,
      },
      {
        id: 'brian-between-classes',
        type: 'image',
        media: '/assets/index/business_page_images/optimized/justin-buisson-vIluu0IH6Ps-unsplash.webp',
        title: 'Between classes',
        caption: 'Quick reset before the next sprint planning session.',
        time: '18m',
        likes: 21,
        comments: 3,
      },
    ],
  },
  {
    id: 'mercy-story',
    name: 'Mercy Wanjiku',
    shortName: 'Mercy W.',
    handle: '@mercy.w',
    campus: 'Kenyatta University',
    avatar: '/assets/index/bee_nobg.png',
    items: [
      {
        id: 'mercy-market',
        type: 'image',
        media: '/assets/index/business_page_images/optimized/sable-flow-T74mVg__F_k-unsplash.webp',
        title: 'Market day finds',
        caption: 'Found the best handmade pieces for graduation week. Campus creators are unmatched.',
        storyKind: 'product',
        product: {
          id: 'mercy-graduation-bracelet',
          name: 'Graduation bead bracelet',
          price: 'KES 650',
          description: 'Handmade campus-color bead bracelet with same-day pickup at Kenyatta University.',
          image: '/assets/index/business_page_images/optimized/sable-flow-T74mVg__F_k-unsplash.webp',
          gallery: [
            '/assets/index/business_page_images/optimized/sable-flow-T74mVg__F_k-unsplash.webp',
            '/assets/index/business_page_images/optimized/product-school-XZkk5xT8Xrk-unsplash.webp',
            '/assets/index/business_page_images/optimized/toa-heftiba-O3ymvT7Wf9U-unsplash.webp',
          ],
          specs: [
            { label: 'Material', value: 'Glass seed beads' },
            { label: 'Size', value: 'Adjustable' },
            { label: 'Condition', value: 'New · handmade' },
            { label: 'Fulfilment', value: 'Same-day campus pickup' },
          ],
        },
        time: '12m',
        likes: 128,
        comments: 24,
      },
      {
        id: 'mercy-study-break',
        type: 'image',
        media: '/assets/index/business_page_images/optimized/toa-heftiba-O3ymvT7Wf9U-unsplash.webp',
        title: 'A well-earned study break',
        caption: 'Good food, better company, then back to the library.',
        time: '1h',
        likes: 94,
        comments: 11,
      },
      {
        id: 'mercy-community',
        type: 'image',
        media: '/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp',
        title: 'Women in product meetup',
        caption: 'A room full of ideas, generous feedback, and future collaborators.',
        time: '3h',
        likes: 76,
        comments: 9,
      },
    ],
  },
  {
    id: 'dennis-story',
    name: 'Dennis Odhiambo',
    shortName: 'Dennis O.',
    handle: '@dennis.codes',
    campus: 'Kenyatta University',
    avatar: '/assets/index/bee_nobg.png',
    online: true,
    items: [
      { id: 'dennis-build', type: 'image', media: '/assets/index/business_page_images/optimized/sayan-nath-RP1uj-umiKk-unsplash.webp', title: 'Building after class', caption: 'A tiny feature shipped today is still a feature shipped.', time: '22m', likes: 63, comments: 8 },
      { id: 'dennis-desk', type: 'image', media: '/assets/index/business_page_images/optimized/alejandro-escamilla-BbQLHCpVUqA-unsplash.webp', title: 'Tonight’s setup', caption: 'SQL, headphones, and a deadline. We move.', time: '2h', likes: 47, comments: 5 },
    ],
  },
  {
    id: 'achieng-story',
    name: "Achieng' Otieno",
    shortName: "Achieng'",
    handle: '@achieng.data',
    campus: 'Kenyatta University',
    avatar: '/assets/index/bee_nobg.png',
    online: true,
    items: [
      { id: 'achieng-session', type: 'image', media: '/assets/index/business_page_images/optimized/vlad-hilitanu-1FI2QAYPa-Y-unsplash.webp', title: 'Community data session', caption: 'Explaining a hard idea until it finally clicks for everyone.', time: '36m', likes: 88, comments: 14 },
      { id: 'achieng-notes', type: 'image', media: '/assets/index/business_page_images/optimized/annie-spratt-hCb3lIB8L8E-unsplash.webp', title: 'Notes worth keeping', caption: 'Three things I learned from today’s mentor session.', time: '4h', likes: 51, comments: 7 },
    ],
  },
  {
    id: 'david-story',
    name: 'David Kamau',
    shortName: 'David K.',
    handle: '@david.analytics',
    campus: 'Kenyatta University',
    avatar: '/assets/index/bee_nobg.png',
    online: true,
    items: [
      { id: 'david-demo', type: 'image', media: '/assets/index/business_page_images/optimized/product-school-XZkk5xT8Xrk-unsplash.webp', title: 'Dashboard demo day', caption: 'From a messy dataset to a story the whole room understood.', time: '48m', likes: 102, comments: 16 },
      { id: 'david-team', type: 'image', media: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp', title: 'The team behind the charts', caption: 'Credit belongs to the people asking better questions.', time: '5h', likes: 69, comments: 8 },
    ],
  },
  {
    id: 'fatma-story',
    name: 'Fatma Ali',
    shortName: 'Fatma A.',
    handle: '@fatma.ai',
    campus: 'Kenyatta University',
    avatar: '/assets/index/bee_nobg.png',
    online: true,
    items: [
      { id: 'fatma-lab', type: 'image', media: '/assets/index/business_page_images/optimized/mapbox-ZT5v0puBjZI-unsplash.webp', title: 'AI lab diary', caption: 'Today’s model was wrong in an interesting way. That counts as progress.', time: '1h', likes: 116, comments: 19 },
      { id: 'fatma-roadmap', type: 'image', media: '/assets/index/business_page_images/optimized/igor-rodrigues-Wn932wwnpSE-unsplash.webp', title: 'Learning roadmap check-in', caption: 'One concept, one project, one week at a time.', time: '6h', likes: 72, comments: 10 },
    ],
  },
  {
    id: 'collins-story',
    name: 'Collins Otieno',
    shortName: 'Collins M.',
    handle: '@collins.dev',
    campus: 'Kenyatta University',
    avatar: '/assets/index/bee_nobg.png',
    online: true,
    items: [
      { id: 'collins-project', type: 'image', media: '/assets/index/business_page_images/optimized/bruno-ngarukiye-IzEcrYJ1G34-unsplash.webp', title: 'Project handoff', caption: 'Clean files, clear notes, happy client. That is the whole goal.', time: '1h', likes: 97, comments: 13 },
      { id: 'collins-campus', type: 'image', media: '/assets/index/business_page_images/optimized/setengah-limasore-qUcZ3TUlgnM-unsplash.webp', title: 'Campus after the rain', caption: 'Taking the long route home today.', time: '7h', likes: 81, comments: 6 },
    ],
  },
]

export const EXPLORE_PRODUCT_DETAILS = {
  'canvas-tote-bag': {
    id: 'canvas-tote-bag',
    seller: 'Aisha Mwangi',
    sellerUsername: 'aisha_mwangi',
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
