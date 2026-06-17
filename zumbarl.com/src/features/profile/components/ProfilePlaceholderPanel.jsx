function ProfilePlaceholderPanel({ activeTab }) {
  return (
    <section className="campus-profile-surface campus-profile-tab-panel">
      <header className="campus-profile-card-head">
        <h2>{activeTab}</h2>
        <button type="button" className="campus-link-btn">View all</button>
      </header>
      <p className="campus-profile-tab-copy">
        {activeTab} content is now active. This tab is wired and ready for the dedicated {activeTab.toLowerCase()} module.
      </p>
    </section>
  )
}

export default ProfilePlaceholderPanel
