function Button({
  children,
  className = '',
  tone = 'ghost',
  type = 'button',
  ...props
}) {
  const classes = ['ui-button', tone ? `is-${tone}` : '', className].filter(Boolean).join(' ')

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  )
}

export default Button
