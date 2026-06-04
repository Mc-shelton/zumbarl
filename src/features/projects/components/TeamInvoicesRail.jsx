import { FiCheck } from 'react-icons/fi'

function TeamInvoicesRail() {
  return (
    <aside className="campus-rail project-workspace-rail team-project-rail" aria-label="Invoice details">
      <section className="campus-rail-card team-rail-card team-invoice-summary-card">
        <h3>Invoice Summary</h3>
        <dl>
          <div><dt>Total Invoiced</dt><dd>KES 25,000</dd></div>
          <div><dt>Paid</dt><dd className="is-paid">KES 10,000</dd></div>
          <div><dt>Pending</dt><dd className="is-pending">KES 12,500</dd></div>
          <div><dt>Overdue</dt><dd className="is-overdue">KES 2,500</dd></div>
        </dl>
        <p><span>Outstanding</span><strong>KES 15,000</strong></p>
      </section>
      <section className="campus-rail-card team-rail-card team-payment-overview-card">
        <h3>Payment Overview</h3>
        <div>
          <strong className="team-payment-ring">40%<span>Paid</span></strong>
          <ul>
            <li><i className="is-paid" />Paid <strong>40%</strong></li>
            <li><i className="is-pending" />Pending <strong>50%</strong></li>
            <li><i className="is-overdue" />Overdue <strong>10%</strong></li>
          </ul>
        </div>
      </section>
      <section className="campus-rail-card team-rail-card team-recent-payments-card">
        <header>
          <h3>Recent Payments</h3>
          <button type="button">View all</button>
        </header>
        {[
          ['INV-0004', 'May 3, 2024'],
          ['INV-0001', 'May 7, 2024'],
          ['INV-0002', 'May 10, 2024'],
        ].map(([invoice, date]) => (
          <article key={invoice}>
            <span><FiCheck aria-hidden="true" /></span>
            <strong>{invoice}</strong>
            <em>{date}</em>
          </article>
        ))}
      </section>
    </aside>
  )
}

export default TeamInvoicesRail
