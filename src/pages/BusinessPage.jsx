import Footer from '../components/Footer'
import {
  BusinessEngagementOpportunities,
  BusinessEnterpriseSection,
  BusinessHero,
  BusinessTrustStrip,
} from '../components/business'
import Header from '../components/home/Header'
import '../styles/business.css'

function BusinessPage() {
  return (
    <main className="page business-page">
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
