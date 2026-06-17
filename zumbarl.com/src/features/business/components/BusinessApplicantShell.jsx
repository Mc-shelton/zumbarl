export function BusinessApplicantShell({ children, sidebar }) {
  return (
    <main className="campus-page business-profile-page">
      <div className="business-profile-shell">
        {sidebar}
        <section className="business-profile-content">{children}</section>
      </div>
    </main>
  )
}
