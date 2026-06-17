import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi'

export function WorkflowStatusPanel({ actions, items, title }) {
  return (
    <section className="workflow-status-panel">
      <header>
        <h2>{title}</h2>
      </header>
      <div className="workflow-status-grid">
        {items.map((item) => {
          const isBlocked = item.status === 'blocked'

          return (
            <article key={item.label} className={isBlocked ? 'is-blocked' : 'is-done'}>
              {isBlocked ? <FiAlertCircle aria-hidden="true" /> : <FiCheckCircle aria-hidden="true" />}
              <div>
                <strong>{item.label}</strong>
                <p>{item.detail}</p>
              </div>
            </article>
          )
        })}
      </div>
      {actions ? <footer>{actions}</footer> : null}
    </section>
  )
}
