import { FiChevronDown, FiPlusCircle } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import CampusTopActions from '../../../components/layout/CampusTopActions'
import { Breadcrumb } from '../../../components/ui'
import { PROFILE_TOP_VIEWER } from '../constants'

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
      <CampusTopActions
        className="campus-profile-top-actions"
        primaryAction={(
          <Link to="/campus/opportunities" className="campus-profile-find-btn">
            <FiPlusCircle aria-hidden="true" />
            Find Opportunities
            <FiChevronDown aria-hidden="true" />
          </Link>
        )}
        userButtonClassName="campus-profile-user-btn"
        viewer={PROFILE_TOP_VIEWER}
      />
    </header>
  )
}

export default ProfileTopBar
