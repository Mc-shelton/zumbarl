function StatusPill({ children, className = '', tone = 'gray' }) {
  const classes = ['ui-status-pill', `tone-${tone}`, className].filter(Boolean).join(' ')

  return <span className={classes}>{children}</span>
}

export default StatusPill
