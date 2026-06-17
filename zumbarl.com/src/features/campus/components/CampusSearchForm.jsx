import { FiArrowRight, FiSearch } from 'react-icons/fi'

function CampusSearchForm({
  chatMode,
  onFocusPrompt,
  onPromptChange,
  onSubmit,
  prompt,
  promptInputRef,
  promptPlaceholder,
}) {
  return (
    <form className="campus-search" onSubmit={onSubmit}>
      <FiSearch aria-hidden="true" />
      <input
        ref={promptInputRef}
        type="search"
        placeholder={promptPlaceholder}
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
      />
      <div className="campus-search-actions">
        {!chatMode && (
          <button type="button" className="campus-search-key campus-search-key-btn" onClick={onFocusPrompt}>
            Cmd /
          </button>
        )}
        <button type="submit" className="campus-search-send" aria-label="Send prompt">
          <FiArrowRight aria-hidden="true" />
        </button>
      </div>
    </form>
  )
}

export default CampusSearchForm
