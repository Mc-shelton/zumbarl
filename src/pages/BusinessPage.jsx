import Footer from '../components/Footer'
import Seo from '../components/Seo'
import {
  BusinessEngagementOpportunities,
  BusinessEnterpriseSection,
  BusinessHero,
  BusinessTrustStrip,
} from '../components/business'
import Header from '../components/home/Header'
import { BUSINESS_SEO } from '../features/seo/constants'
import '../styles/business.css'

function BusinessPage() {
  return (
    <main className="page business-page">
      <Seo
        title={BUSINESS_SEO.title}
        description={BUSINESS_SEO.description}
        path={BUSINESS_SEO.path}
        keywords={BUSINESS_SEO.keywords}
        jsonLd={[BUSINESS_SEO.pageJsonLd]}
      />
      <Header />
      <BusinessHero />
      <BusinessEngagementOpportunities />
      <BusinessEnterpriseSection />
      <BusinessTrustStrip />
      <Footer />
    </main>
  )
}

export default BusinessPage
