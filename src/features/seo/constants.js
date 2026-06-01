export const SEO_BASE_URL = 'https://zumbarl.com'
export const SEO_DEFAULT_IMAGE = `${SEO_BASE_URL}/assets/index/bee.png`
export const SEO_DEFAULT_IMAGE_ALT = 'Zumbarl bee logo'
export const SEO_DEFAULT_KEYWORDS =
  'Zumbarl, campus talent, student gigs, SME growth, business talent pipeline, training programs, talent orchestration, campus opportunities, digital resources'
export const ZUMBARL_PHILOSOPHY =
  'Zumbarl is a suite of integrated campus tools that helps students balance campus reality, social life, and professional growth. Zumbarl connects students to gigs, work, support, opportunities, and everyday campus essentials.'

const buildWebPageJsonLd = ({ title, description, path }) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: title,
  description,
  url: `${SEO_BASE_URL}${path}`,
})

const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Zumbarl',
  url: SEO_BASE_URL,
  logo: SEO_DEFAULT_IMAGE,
  description: ZUMBARL_PHILOSOPHY,
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'help@zumbarl.com',
      areaServed: 'KE',
      availableLanguage: ['English'],
    },
  ],
}

const WEBSITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Zumbarl',
  url: SEO_BASE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SEO_BASE_URL}/help?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}

export const SEO_SHARED_JSON_LD = [ORGANIZATION_JSON_LD, WEBSITE_JSON_LD]

export const HOME_SEO = {
  title: 'Zumbarl | Campus Talent Bridge for SMEs and Institutions',
  description: ZUMBARL_PHILOSOPHY,
  path: '/',
  keywords:
    'Zumbarl, campus platform, student opportunities, campus services, SME collaboration, student growth, gigs',
  pageJsonLd: buildWebPageJsonLd({
    title: 'Zumbarl | Campus Talent Bridge for SMEs and Institutions',
    description: ZUMBARL_PHILOSOPHY,
    path: '/',
  }),
}

export const BUSINESS_SEO = {
  title: 'Zumbarl Business | Talent, Training, and Orchestration',
  description: `${ZUMBARL_PHILOSOPHY} For businesses, Zumbarl enables engagement through gigs, talent training, and orchestration.`,
  path: '/business',
  keywords:
    'Zumbarl business, SME opportunities, campus gigs, talent training, graduate talent pipeline, business orchestration',
  pageJsonLd: buildWebPageJsonLd({
    title: 'Zumbarl Business | Talent, Training, and Orchestration',
    description: `${ZUMBARL_PHILOSOPHY} For businesses, Zumbarl enables engagement through gigs, talent training, and orchestration.`,
    path: '/business',
  }),
}

export const HELP_SEO = {
  title: 'Zumbarl Help | Support, Contact, and Offices',
  description: `${ZUMBARL_PHILOSOPHY} Get support from Zumbarl AI or a human advisor, and reach official support channels.`,
  path: '/help',
  keywords:
    'Zumbarl help, Zumbarl support, customer support, emergency contacts, office locations, report a bug',
  pageJsonLd: buildWebPageJsonLd({
    title: 'Zumbarl Help | Support, Contact, and Offices',
    description: `${ZUMBARL_PHILOSOPHY} Get support from Zumbarl AI or a human advisor, and reach official support channels.`,
    path: '/help',
  }),
}

export const LOGIN_SEO = {
  title: 'Zumbarl Login | Access Your Workspace',
  description:
    'Sign in to Zumbarl to manage campus opportunities, student gigs, and business collaboration in one workspace.',
  path: '/login',
  keywords: 'Zumbarl login, sign in, campus platform account access, business workspace login',
  pageJsonLd: buildWebPageJsonLd({
    title: 'Zumbarl Login | Access Your Workspace',
    description:
      'Sign in to Zumbarl to manage campus opportunities, student gigs, and business collaboration in one workspace.',
    path: '/login',
  }),
}

export const REGISTER_SEO = {
  title: 'Zumbarl Register | Create Your Account',
  description:
    'Create a Zumbarl account to connect with campus talent opportunities, support services, and SME collaboration tools.',
  path: '/register',
  keywords: 'Zumbarl register, sign up, create account, campus talent platform onboarding',
  pageJsonLd: buildWebPageJsonLd({
    title: 'Zumbarl Register | Create Your Account',
    description:
      'Create a Zumbarl account to connect with campus talent opportunities, support services, and SME collaboration tools.',
    path: '/register',
  }),
}

export const CAMPUS_SEO = {
  title: 'Zumbarl Campus | Student Portal Dashboard',
  description:
    'Manage student gigs, communities, finances, services, and campus events from your Zumbarl student dashboard.',
  path: '/campus',
  keywords:
    'Zumbarl campus, student dashboard, campus opportunities, student wallet, campus events, study resources',
  pageJsonLd: buildWebPageJsonLd({
    title: 'Zumbarl Campus | Student Portal Dashboard',
    description:
      'Manage student gigs, communities, finances, services, and campus events from your Zumbarl student dashboard.',
    path: '/campus',
  }),
}

export const CAMPUS_OPPORTUNITIES_SEO = {
  title: 'Zumbarl Opportunities | Jobs and Gigs',
  description:
    'Discover student jobs, freelance gigs, internships, and remote opportunities tailored to your skills.',
  path: '/campus/opportunities',
  keywords:
    'Zumbarl opportunities, campus jobs, student gigs, internships, remote student work, freelance opportunities',
  pageJsonLd: buildWebPageJsonLd({
    title: 'Zumbarl Opportunities | Jobs and Gigs',
    description:
      'Discover student jobs, freelance gigs, internships, and remote opportunities tailored to your skills.',
    path: '/campus/opportunities',
  }),
}

export const CAMPUS_BUY_SELL_SEO = {
  title: 'Zumbarl Opportunities | Buy and Sell',
  description:
    'Browse student marketplace listings for electronics, books, furniture, fashion, and campus services.',
  path: '/campus/opportunities/buy-sell',
  keywords:
    'Zumbarl buy and sell, campus marketplace, student marketplace, campus products, campus services, second-hand items',
  pageJsonLd: buildWebPageJsonLd({
    title: 'Zumbarl Opportunities | Buy and Sell',
    description:
      'Browse student marketplace listings for electronics, books, furniture, fashion, and campus services.',
    path: '/campus/opportunities/buy-sell',
  }),
}

export const CAMPUS_CART_SEO = {
  title: 'Zumbarl Cart | Review and Checkout',
  description:
    'Review your selected campus products, adjust quantities, apply promo codes, and proceed to secure checkout.',
  path: '/campus/cart',
  keywords:
    'Zumbarl cart, campus cart, student marketplace checkout, order summary, campus shopping',
  pageJsonLd: buildWebPageJsonLd({
    title: 'Zumbarl Cart | Review and Checkout',
    description:
      'Review your selected campus products, adjust quantities, apply promo codes, and proceed to secure checkout.',
    path: '/campus/cart',
  }),
}

export const CAMPUS_CART_PAYMENT_SEO = {
  title: 'Zumbarl Checkout | Payment',
  description:
    'Select a payment method and complete your campus marketplace checkout securely on Zumbarl.',
  path: '/campus/cart/payment',
  keywords:
    'Zumbarl checkout payment, campus payment, student marketplace checkout, secure payment',
  pageJsonLd: buildWebPageJsonLd({
    title: 'Zumbarl Checkout | Payment',
    description:
      'Select a payment method and complete your campus marketplace checkout securely on Zumbarl.',
    path: '/campus/cart/payment',
  }),
}

export const CAMPUS_CART_REVIEW_SEO = {
  title: 'Zumbarl Checkout | Review Order',
  description:
    'Review delivery details, payment information, and order items before placing your campus marketplace order.',
  path: '/campus/cart/review',
  keywords:
    'Zumbarl review order, checkout review, campus order confirmation, student marketplace order review',
  pageJsonLd: buildWebPageJsonLd({
    title: 'Zumbarl Checkout | Review Order',
    description:
      'Review delivery details, payment information, and order items before placing your campus marketplace order.',
    path: '/campus/cart/review',
  }),
}

export const CAMPUS_CART_ORDER_PLACED_SEO = {
  title: 'Zumbarl Checkout | Order Placed',
  description:
    'View your order confirmation, delivery timeline, and next steps after placing your campus marketplace order.',
  path: '/campus/cart/order-placed',
  keywords:
    'Zumbarl order placed, order confirmation, campus checkout success, student marketplace order status',
  pageJsonLd: buildWebPageJsonLd({
    title: 'Zumbarl Checkout | Order Placed',
    description:
      'View your order confirmation, delivery timeline, and next steps after placing your campus marketplace order.',
    path: '/campus/cart/order-placed',
  }),
}

export const CAMPUS_EXPLORE_SEO = {
  title: 'Zumbarl Explore Campus | Stories, Events, and Community',
  description:
    'Discover campus stories, announcements, student projects, events, and marketplace activity in one live feed.',
  path: '/campus/explore',
  keywords:
    'Zumbarl explore campus, campus feed, student stories, campus events, campus announcements, student marketplace',
  pageJsonLd: buildWebPageJsonLd({
    title: 'Zumbarl Explore Campus | Stories, Events, and Community',
    description:
      'Discover campus stories, announcements, student projects, events, and marketplace activity in one live feed.',
    path: '/campus/explore',
  }),
}

export const CAMPUS_PLACE_BID_SEO = {
  title: 'Zumbarl Place Bid | Submit Proposal',
  description:
    'Submit your proposal, pricing, delivery timeline, and supporting documents for a selected campus gig.',
  path: '/campus/opportunities/place-bid',
  keywords:
    'Zumbarl place bid, submit proposal, campus gig proposal, student freelance bid, opportunity application',
  pageJsonLd: buildWebPageJsonLd({
    title: 'Zumbarl Place Bid | Submit Proposal',
    description:
      'Submit your proposal, pricing, delivery timeline, and supporting documents for a selected campus gig.',
    path: '/campus/opportunities/place-bid',
  }),
}

export const CAMPUS_PROFILE_SEO = {
  title: 'Zumbarl Profile | Student Performance Dashboard',
  description:
    'Track your Zumbarl score, gigs completed, endorsements, earnings, and profile activity in one place.',
  path: '/campus/profile',
  keywords:
    'Zumbarl profile, student profile, campus portfolio, student endorsements, gig performance, earnings dashboard',
  pageJsonLd: buildWebPageJsonLd({
    title: 'Zumbarl Profile | Student Performance Dashboard',
    description:
      'Track your Zumbarl score, gigs completed, endorsements, earnings, and profile activity in one place.',
    path: '/campus/profile',
  }),
}
