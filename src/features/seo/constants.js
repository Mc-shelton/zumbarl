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
