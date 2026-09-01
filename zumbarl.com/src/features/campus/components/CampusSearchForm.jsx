import { FiArrowRight, FiZap } from 'react-icons/fi'

function CampusSearchForm({
  chatMode,
  onFocusPrompt,
  onPromptChange,
  onSubmit,
  prompt,
  promptInputRef,
  promptPlaceholder,
  isThinking,
}) {
  return (
    <form className="campus-search campus-copilot-search" onSubmit={onSubmit} aria-busy={isThinking}>
      <FiZap aria-hidden="true" />
      <input
        ref={promptInputRef}
        type="search"
        placeholder={promptPlaceholder}
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
        disabled={isThinking}
        aria-label="Ask Zumbarl about your campus"
      />
      <div className="campus-search-actions">
        {!chatMode && (
          <button type="button" className="campus-search-key campus-search-key-btn" onClick={onFocusPrompt}>
            Cmd /
          </button>
        )}
        <button type="submit" className="campus-search-send" aria-label="Ask Zumbarl" disabled={isThinking || !prompt.trim()}>
          <span>{isThinking ? 'Searching' : 'Ask Zumbarl'}</span>
          <FiArrowRight aria-hidden="true" />
        </button>
      </div>
    </form>
  )
}

export default CampusSearchForm
