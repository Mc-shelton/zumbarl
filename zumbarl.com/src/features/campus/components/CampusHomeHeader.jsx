import { FiSearch } from 'react-icons/fi'
import CampusTopActions from '../../../components/layout/CampusTopActions'

function CampusHomeHeader({ onBackToAi, showBackToAiButton }) {
  return (
    <header className="campus-header">
      <div className="campus-header-copy">
        <h1>Good morning, Brian</h1>
        <p>What are we doing today?</p>
      </div>
      <CampusTopActions
        className="campus-header-actions"
        primaryAction={(
          <>
            <button
              type="button"
              className={`campus-cta-btn campus-cta-btn-secondary campus-back-ai-btn${
                showBackToAiButton ? ' is-visible' : ''
              }`}
              onClick={onBackToAi}
              tabIndex={showBackToAiButton ? 0 : -1}
              aria-hidden={!showBackToAiButton}
            >
              <FiSearch aria-hidden="true" />
              Back to AI
            </button>
            <button type="button" className="campus-cta-btn">
              Opportunities
            </button>
          </>
        )}
        showUserButton={false}
      />
    </header>
  )
}

export default CampusHomeHeader
