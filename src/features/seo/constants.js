export const SEO_BASE_URL = 'https://zumbarl.com'
export const SEO_DEFAULT_IMAGE = `${SEO_BASE_URL}/assets/index/bee_nobg.png`
export const SEO_DEFAULT_IMAGE_ALT = 'Zumbarl bee logo'
export const SEO_DEFAULT_KEYWORDS =
  'Zumbarl, campus talent, student gigs, SME growth, business talent pipeline, training programs, talent orchestration, campus opportunities, digital resources'

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
  description:
    'Zumbarl connects students and businesses through gigs, training, and long-term talent development.',
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
  description:
    'Zumbarl helps students and SMEs connect through structured gigs, campus services, and long-term growth opportunities.',
  path: '/',
  keywords:
    'Zumbarl, campus platform, student opportunities, campus services, SME collaboration, student growth, gigs',
  pageJsonLd: buildWebPageJsonLd({
    title: 'Zumbarl | Campus Talent Bridge for SMEs and Institutions',
    description:
      'Zumbarl helps students and SMEs connect through structured gigs, campus services, and long-term growth opportunities.',
    path: '/',
  }),
}

export const BUSINESS_SEO = {
  title: 'Zumbarl Business | Talent, Training, and Orchestration',
  description:
    'Grow your business with Zumbarl through three engagement models: gigs, talent training, and long-term talent orchestration.',
  path: '/business',
  keywords:
    'Zumbarl business, SME opportunities, campus gigs, talent training, graduate talent pipeline, business orchestration',
  pageJsonLd: buildWebPageJsonLd({
    title: 'Zumbarl Business | Talent, Training, and Orchestration',
    description:
      'Grow your business with Zumbarl through three engagement models: gigs, talent training, and long-term talent orchestration.',
    path: '/business',
  }),
}

export const HELP_SEO = {
  title: 'Zumbarl Help | Support, Contact, and Offices',
  description:
    'Get support from Zumbarl AI or a human advisor, reach emergency contacts, and find official Zumbarl office and campus hub details.',
  path: '/help',
  keywords:
    'Zumbarl help, Zumbarl support, customer support, emergency contacts, office locations, report a bug',
  pageJsonLd: buildWebPageJsonLd({
    title: 'Zumbarl Help | Support, Contact, and Offices',
    description:
      'Get support from Zumbarl AI or a human advisor, reach emergency contacts, and find official Zumbarl office and campus hub details.',
    path: '/help',
  }),
}
