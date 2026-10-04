import { FiBriefcase, FiSearch } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import CampusTopActions from '../../../components/layout/CampusTopActions'

function CampusHomeHeader({ onBackToAi, showBackToAiButton, viewer }) {
  return (
    <header className="campus-header">
      <div className="campus-header-copy">
        <span className="campus-header-eyebrow">Your campus workspace</span>
        <h1>Good morning{viewer?.firstName ? `, ${viewer.firstName}` : ''}.</h1>
        <p>What would you like to move forward today?</p>
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
              <FiBriefcase aria-hidden="true" /> Opportunities
            </Link>
          </>
        )}
        showUserButton={false}
      />
    </header>
  )
}

export default CampusHomeHeader
