import { FiArrowRight, FiPlusCircle } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import CampusTopActions from '../../../components/layout/CampusTopActions'
import { Breadcrumb } from '../../../components/ui'

function ProfileTopBar({ activeTab }) {
  return (
    <header className="campus-profile-topbar">
      <Breadcrumb
        className="campus-profile-breadcrumb"
        items={[
          { label: 'My Profile' },
          { label: activeTab },
        ]}
      />
      <div className="campus-profile-mobile-title">
        <span>My profile</span>
        <strong>{activeTab}</strong>
      </div>
      <CampusTopActions
        className="campus-profile-top-actions"
        primaryAction={(
          <Link to="/campus/opportunities" className="campus-profile-find-btn">
            <FiPlusCircle aria-hidden="true" />
            Find Opportunities
            <FiArrowRight aria-hidden="true" />
          </Link>
        )}
        userButtonClassName="campus-profile-user-btn"
      />
    </header>
  )
}

export default ProfileTopBar
