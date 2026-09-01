import CampusSidebar from '../components/layout/CampusSidebar'
import Seo from '../components/Seo'
import CampusHeroPanel from '../features/campus/components/CampusHeroPanel'
import CampusHomeHeader from '../features/campus/components/CampusHomeHeader'
import CampusHomeRail from '../features/campus/components/CampusHomeRail'
import CampusProjectInvites from '../features/campus/components/CampusProjectInvites'
import CampusSearchForm from '../features/campus/components/CampusSearchForm'
import useCampusHomeState from '../features/campus/hooks/useCampusHomeState'
import { CAMPUS_SEO } from '../features/seo/constants'
import '../styles/campus.css'

function CampusPage() {
  const {
    assistantPrompts,
    assistantSource,
    chatMessages,
    chatMode,
    discoveryChips,
    discoverySuggestions,
    focusPromptInput,
    handleBackToAi,
    handleMainScroll,
    handlePromptSubmit,
    hero,
    heroCardRef,
    homeError,
    isAssistantThinking,
    isHomeLoading,
    mainScrollRef,
    prompt,
    promptInputRef,
    promptPlaceholder,
    rail,
    reloadHomeExperience,
    resetChatSurface,
    runAssistantPrompt,
    setPrompt,
    showBackToAiButton,
    viewer,
  } = useCampusHomeState()

  return (
    <main className="campus-page">
      <Seo
        title={CAMPUS_SEO.title}
        description={CAMPUS_SEO.description}
        path={CAMPUS_SEO.path}
        keywords={CAMPUS_SEO.keywords}
        jsonLd={[CAMPUS_SEO.pageJsonLd]}
      />

      <div className="campus-stage">
        <div className="campus-shell">
          <CampusSidebar activeItemId="workspace" />

          <section
            className="campus-main campus-workspace-main"
            onScroll={handleMainScroll}
            ref={mainScrollRef}
          >
            <CampusHomeHeader
              onBackToAi={handleBackToAi}
              showBackToAiButton={showBackToAiButton}
              viewer={viewer}
            />
            {isHomeLoading ? (
              <section className="campus-workspace-state" aria-live="polite">
                <span className="campus-workspace-loader" />
                <h2>Bringing your campus together…</h2>
                <p>Loading live gigs, events, people and marketplace picks.</p>
              </section>
            ) : homeError ? (
              <section className="campus-workspace-state is-error" role="alert">
                <img src="/assets/index/bee_nobg.png" alt="" />
                <h2>Your workspace did not load</h2>
                <p>{homeError}</p>
                <button type="button" className="campus-cta-btn" onClick={reloadHomeExperience}>Try again</button>
              </section>
            ) : (
              <>
                <CampusProjectInvites />
                <CampusHeroPanel
                  assistantPrompts={assistantPrompts}
                  assistantSource={assistantSource}
                  chatMessages={chatMessages}
                  chatMode={chatMode}
                  discoveryChips={discoveryChips}
                  discoverySuggestions={discoverySuggestions}
                  hero={hero}
                  heroCardRef={heroCardRef}
                  onResetChat={resetChatSurface}
                  onRunSuggestion={runAssistantPrompt}
                />
                <CampusSearchForm
                  chatMode={chatMode}
                  isThinking={isAssistantThinking}
                  onFocusPrompt={focusPromptInput}
                  onPromptChange={setPrompt}
                  onSubmit={handlePromptSubmit}
                  prompt={prompt}
                  promptInputRef={promptInputRef}
                  promptPlaceholder={promptPlaceholder}
                />
              </>
            )}
          </section>

          {!isHomeLoading && !homeError ? <CampusHomeRail rail={rail} /> : <aside className="campus-rail campus-rail-placeholder" />}
        </div>
      </div>
    </main>
  )
}

export default CampusPage
