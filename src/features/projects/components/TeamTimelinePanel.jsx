function TeamTimelinePanel() {
  const rows = [
    { label: 'Milestones', items: [{ text: 'Project Started', offset: 4, width: 2, type: 'flag' }, { text: 'Content Strategy', offset: 14, width: 2, type: 'flag' }, { text: 'Content Production', offset: 52, width: 2, type: 'flag' }, { text: 'Content Review', offset: 66, width: 2, type: 'flag' }, { text: 'Project Delivery', offset: 78, width: 2, type: 'flag' }] },
    { label: 'Sprint 1: Planning', detail: 'Apr 28 - May 4 · Completed', items: [{ offset: 6, width: 16, type: 'complete' }, { offset: 10, width: 13, type: 'complete' }, { offset: 13, width: 12, type: 'complete' }] },
    { label: 'Sprint 2: Content Production', detail: 'May 6 - May 19 · In Progress', items: [{ offset: 28, width: 42, type: 'progress' }, { offset: 28, width: 22, type: 'progress' }, { offset: 31, width: 28, type: 'progress' }, { offset: 41, width: 24, type: 'progress' }, { offset: 49, width: 30, type: 'progress' }] },
    { label: 'Sprint 3: Review & Optimization', detail: 'May 20 - May 24 · Upcoming', items: [{ offset: 70, width: 17, type: 'upcoming' }, { offset: 70, width: 15, type: 'upcoming' }, { offset: 70, width: 12, type: 'upcoming' }, { offset: 70, width: 11, type: 'upcoming' }] },
    { label: 'Sprint 4: Delivery', detail: 'May 25 - May 28 · Upcoming', items: [{ offset: 89, width: 10, type: 'upcoming' }] },
  ]

  return (
    <section className="team-timeline-panel">
      <div className="team-tab-tools">
        <button type="button" className="project-soft-btn">Today</button>
        <button type="button" className="project-soft-btn">‹</button>
        <button type="button" className="project-soft-btn">›</button>
        <strong className="team-timeline-month">May 2024</strong>
        <span className="team-timeline-spacer" />
        <button type="button" className="project-soft-btn">Zoom - +</button>
        <button type="button" className="project-soft-btn">Filters</button>
        <button type="button" className="project-soft-btn">View: Weeks</button>
      </div>
      <section className="project-card team-gantt">
        <header>
          <span>Task / Milestone</span>
          {['Apr 28 - May 4 W18', 'May 5 - May 11 W19', 'May 12 - May 18 W20', 'May 19 - May 25 W21', 'May 26 - Jun 1 W22'].map((week) => (
            <strong key={week}>{week}</strong>
          ))}
        </header>
        <div className="team-gantt-today"><span>Today</span></div>
        {rows.map((row) => (
          <article key={row.label}>
            <div>
              <strong>{row.label}</strong>
              {row.detail ? <em>{row.detail}</em> : null}
            </div>
            <div className="team-gantt-grid">
              {row.items.map((item, index) => (
                <i
                  key={`${row.label}-${index}`}
                  className={`is-${item.type}`}
                  style={{ '--offset': `${item.offset}%`, '--width': `${item.width}%` }}
                >
                  {item.text ? <b>{item.text}</b> : null}
                </i>
              ))}
            </div>
          </article>
        ))}
      </section>
    </section>
  )
}

export default TeamTimelinePanel
