import { useState } from 'react'
import Footer from '../components/Footer'
import Header from '../components/home/Header'
import { AiConversationPopup, HelpContactSection, HelpHero, HelpOfficesSection, SupportChatWidget } from '../components/help'
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
