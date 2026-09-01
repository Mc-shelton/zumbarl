import { FiSearch } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import CampusTopActions from '../../../components/layout/CampusTopActions'

function CampusHomeHeader({ onBackToAi, showBackToAiButton, viewer }) {
  return (
    <header className="campus-header">
      <div className="campus-header-copy">
        <h1>Good morning{viewer?.firstName ? `, ${viewer.firstName}` : ''}</h1>
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
            <Link to="/campus/opportunities" className="campus-cta-btn">
              Opportunities
            </Link>
          </>
        )}
        showUserButton={false}
      />
    </header>
  )
}

export default CampusHomeHeader
