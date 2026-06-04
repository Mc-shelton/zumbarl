import BusinessValuesPanel from './BusinessValuesPanel'
import EnterpriseCollage from './EnterpriseCollage'
import EnterpriseJoinCta from './EnterpriseJoinCta'
import EnterpriseSpotlight from './EnterpriseSpotlight'

function BusinessEnterpriseSection() {
  return (
    <>
      <section
        className="business-enterprise"
        aria-label="Enterprise story and values"
      >
        <EnterpriseSpotlight />
        <EnterpriseJoinCta />
        <EnterpriseCollage />
      </section>
      <BusinessValuesPanel />
    </>
  )
}

export default BusinessEnterpriseSection
