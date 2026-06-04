import { FiChevronDown, FiMessageCircle, FiMoreHorizontal, FiPlus } from 'react-icons/fi'

function TeamInvoicesPanel() {
  const invoices = [
    {
      id: 'INV-0007',
      title: 'Milestone: Content Review',
      detail: 'Review and approve all content across platforms',
      issueDate: 'May 20, 2024',
      dueDate: 'May 27, 2024',
      amount: 'KES 5,000',
      status: 'Draft',
      tone: 'draft',
    },
    {
      id: 'INV-0006',
      title: 'Milestone: Content Production',
      detail: 'Create and design content across platforms',
      issueDate: 'May 12, 2024',
      dueDate: 'May 20, 2024',
      amount: 'KES 7,500',
      status: 'Sent',
      tone: 'sent',
    },
    {
      id: 'INV-0005',
      title: 'Milestone: Content Strategy',
      detail: 'Define content pillars, audience personas and strategy',
      issueDate: 'May 5, 2024',
      dueDate: 'May 12, 2024',
      amount: 'KES 4,000',
      status: 'Paid',
      tone: 'paid',
    },
    {
      id: 'INV-0004',
      title: 'Milestone: Project Started',
      detail: 'Project kickoff and alignment with team',
      issueDate: 'Apr 28, 2024',
      dueDate: 'May 5, 2024',
      amount: 'KES 3,000',
      status: 'Paid',
      tone: 'paid',
    },
    {
      id: 'INV-0003',
      title: 'Additional: Ad Creative',
      detail: 'Additional ad creatives for campaign',
      issueDate: 'May 15, 2024',
      dueDate: 'May 22, 2024',
      amount: 'KES 2,500',
      status: 'Overdue',
      tone: 'overdue',
    },
    {
      id: 'INV-0002',
      title: 'Additional: Revisions',
      detail: 'Additional revisions and adjustments',
      issueDate: 'May 8, 2024',
      dueDate: 'May 15, 2024',
      amount: 'KES 1,500',
      status: 'Paid',
      tone: 'paid',
    },
    {
      id: 'INV-0001',
      title: 'Advance Payment',
      detail: 'Initial advance payment',
      issueDate: 'Apr 25, 2024',
      dueDate: 'Apr 28, 2024',
      amount: 'KES 1,500',
      status: 'Paid',
      tone: 'paid',
    },
  ]

  return (
    <section className="team-invoices-panel">
      <div className="team-tab-tools">
        <label>
          <FiMessageCircle aria-hidden="true" />
          <input type="search" placeholder="Search invoices..." />
        </label>
        <button type="button" className="project-soft-btn">Filters</button>
        <button type="button" className="project-primary-btn">
          <FiPlus aria-hidden="true" />
          Create Invoice
        </button>
      </div>
      <section className="project-card team-invoice-table">
        <h2>Invoices (7)</h2>
        <div className="team-invoice-row is-head">
          <span>Invoice #</span><span>Milestone / Description</span><span>Issue Date</span><span>Due Date</span><span>Amount</span><span>Status</span><span>Actions</span>
        </div>
        {invoices.map((invoice) => (
          <div key={invoice.id} className="team-invoice-row">
            <span className="team-invoice-id">{invoice.id}</span>
            <span className="team-invoice-description">
              <strong>{invoice.title}</strong>
              <em>{invoice.detail}</em>
            </span>
            <span>{invoice.issueDate}</span>
            <span>{invoice.dueDate}</span>
            <span>{invoice.amount}</span>
            <span className={`team-invoice-status is-${invoice.tone}`}>{invoice.status}</span>
            <button type="button" aria-label={`More actions for ${invoice.id}`}>
              <FiMoreHorizontal aria-hidden="true" />
            </button>
          </div>
        ))}
        <footer className="team-invoice-footer">
          <span>Showing 1 to 7 of 7 invoices</span>
          <div>
            <button type="button">‹</button>
            <button type="button" className="is-active">1</button>
            <button type="button">›</button>
            <button type="button">10 / page <FiChevronDown aria-hidden="true" /></button>
          </div>
        </footer>
      </section>
    </section>
  )
}

export default TeamInvoicesPanel
