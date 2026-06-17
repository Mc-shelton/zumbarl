function PersonRow({ avatar, badge, className = '', name, subtitle }) {
  const classes = ['ui-person-row', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <img src={avatar} alt={`${name} avatar`} />
      <div>
        <strong>{name} {badge || null}</strong>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
    </div>
  )
}

export default PersonRow
