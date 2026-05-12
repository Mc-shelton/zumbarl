import { useState } from 'react'
import Footer from '../components/Footer'
import Seo from '../components/Seo'
import Header from '../components/home/Header'
import { AiConversationPopup, HelpContactSection, HelpHero, HelpOfficesSection, SupportChatWidget } from '../components/help'
import { HELP_SEO } from '../features/seo/constants'
import '../styles/help.css'

function HelpPage() {
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false)
  const [isAiPopupOpen, setIsAiPopupOpen] = useState(false)
  const [aiSeedPrompt, setAiSeedPrompt] = useState(null)

  const handleAskAi = (query) => {
    setAiSeedPrompt({
      id: Date.now(),
      text: query,
    })
    setIsAiPopupOpen(true)
  }

  return (
    <main className="page help-page">
      <Seo
        title={HELP_SEO.title}
        description={HELP_SEO.description}
        path={HELP_SEO.path}
        keywords={HELP_SEO.keywords}
        jsonLd={[HELP_SEO.pageJsonLd]}
      />
      <Header />
      <HelpHero onAskAi={handleAskAi} onAskHuman={() => setIsSupportChatOpen(true)} />
      <HelpContactSection />
      <HelpOfficesSection />
      <Footer />
      <AiConversationPopup isOpen={isAiPopupOpen} onClose={() => setIsAiPopupOpen(false)} seedPrompt={aiSeedPrompt} />
      <SupportChatWidget isOpen={isSupportChatOpen} onClose={() => setIsSupportChatOpen(false)} />
    </main>
  )
}

export default HelpPage
