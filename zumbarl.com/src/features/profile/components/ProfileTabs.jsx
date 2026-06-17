function ProfileTabs({ activeTab, onTabChange, tabs }) {
  return (
    <section className="campus-profile-tabs-wrap">
      <nav className="campus-profile-tabs" aria-label="Profile tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? 'is-active' : ''}
            aria-selected={activeTab === tab}
            onClick={() => onTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>
    </section>
  )
}

export default ProfileTabs
