import { TabNav } from '../../../components/ui'

function ProfileTabs({ activeTab, onTabChange, tabs }) {
  return (
    <section className="campus-profile-tabs-wrap">
      <TabNav
        activeId={activeTab}
        ariaLabel="Profile tabs"
        className="campus-profile-tabs"
        items={tabs.map((tab) => ({ id: tab, label: tab }))}
        onChange={onTabChange}
      />
    </section>
  )
}

export default ProfileTabs
