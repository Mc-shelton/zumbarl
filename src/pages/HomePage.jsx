import Footer from '../components/Footer'
import Seo from '../components/Seo'
import {
  AppsWall,
  CommunityProof,
  GrowthCta,
  Header,
  Hero,
  WheelStory,
} from '../components/home'
import { HOME_SEO } from '../features/seo/constants'

function HomePage() {
  return (
    <main className="page">
      <Seo
        title={HOME_SEO.title}
        description={HOME_SEO.description}
        path={HOME_SEO.path}
        keywords={HOME_SEO.keywords}
        jsonLd={[HOME_SEO.pageJsonLd]}
      />
      <Header />
      <div id="wrap" className="x_wd">
        <Hero />
        <AppsWall />
        <WheelStory />
        <CommunityProof />
        <GrowthCta />
      </div>
      <Footer />
    </main>
  )
}

export default HomePage
