import Header from '../components/home/Header'
import { HelpContactSection, HelpHero } from '../components/help'

function HelpPage() {
  return (
    <main className="page help-page">
      <Header />
      <HelpHero />
      <HelpContactSection />
    </main>
  )
}

export default HelpPage
