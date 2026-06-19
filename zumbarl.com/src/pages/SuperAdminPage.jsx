import { useCallback, useEffect, useMemo, useState } from 'react'
import Seo from '../components/Seo'
import {
  listSuperAdminAccounts,
  readSuperAdminAnalytics,
  readSuperAdminAuditLogs,
  readSuperAdminConfiguration,
  readSuperAdminContent,
  readSuperAdminDashboard,
  readSuperAdminFinance,
  readSuperAdminGigs,
  readSuperAdminSafetyMetrics,
  readSuperAdminScore,
  recordSuperAdminContentAction,
  recordSuperAdminFinancialAction,
  recordSuperAdminGigAction,
  revokeSuperAdminSessions,
  updateSuperAdminAccount,
  writeSuperAdminConfiguration,
  writeSuperAdminScoreConfiguration,
} from '../features/admin/services/superAdminService'
import '../styles/business.css'

const MODULES = [
  { id: 'overview', label: 'Overview' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'finance', label: 'Finance' },
  { id: 'gigs', label: 'Gigs' },
  { id: 'score', label: 'Score' },
  { id: 'safety', label: 'Safety' },
  { id: 'content', label: 'Content' },
  { id: 'configuration', label: 'Config' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'audit', label: 'Audit' },
]

function MetricTile({ label, value, note }) {
  return (
    <article className="super-admin-metric-tile">
      <span>{label}</span>
      <strong>{value ?? 0}</strong>
      {note ? <small>{note}</small> : null}
    </article>
  )
}

function Panel({ title, eyebrow, children, actions }) {
  return (
    <section className="super-admin-panel">
      <header className="super-admin-panel-header">
        <div>
          {eyebrow ? <span>{eyebrow}</span> : null}
          <h2>{title}</h2>
        </div>
        {actions}
      </header>
      {children}
    </section>
  )
}

function AdminActionForm({ fields, submitLabel, onSubmit, initialValues = {} }) {
  const [values, setValues] = useState(initialValues)

  function updateValue(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    await onSubmit(values)
    setValues(initialValues)
  }

  return (
    <form className="super-admin-action-form" onSubmit={handleSubmit}>
      {fields.map((field) => (
        <label key={field.name}>
          <span>{field.label}</span>
          {field.type === 'select' ? (
            <select value={values[field.name] || ''} onChange={(event) => updateValue(field.name, event.target.value)} required={field.required}>
              <option value="">Select</option>
              {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          ) : field.type === 'textarea' ? (
            <textarea value={values[field.name] || ''} onChange={(event) => updateValue(field.name, event.target.value)} required={field.required} />
          ) : (
            <input type={field.type || 'text'} value={values[field.name] || ''} onChange={(event) => updateValue(field.name, event.target.value)} required={field.required} />
          )}
        </label>
      ))}
      <button type="submit">{submitLabel}</button>
    </form>
  )
}

function AccountsPanel({ accounts, onRefresh, onAction }) {
  return (
    <Panel title="User & Account Management" eyebrow="Full account visibility">
      <div className="super-admin-table-wrap">
        <table className="super-admin-table">
          <thead>
            <tr><th>User</th><th>Role</th><th>Status</th><th>KYC</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {(accounts?.data || []).map((user) => (
              <tr key={user.id}>
                <td><strong>{user.name || user.email}</strong><span>{user.email}</span></td>
                <td>{user.role}</td>
                <td>{user.isActive === false ? 'Suspended' : 'Active'}</td>
                <td>{user.studentProfile?.kycStatus || user.companyContact?.company?.kycStatus || 'Pending'}</td>
                <td>
                  <button type="button" onClick={() => onAction(() => updateSuperAdminAccount(user.id, { status: user.isActive === false ? 'active' : 'suspended', reason: 'Super admin account control' }))}>{user.isActive === false ? 'Reactivate' : 'Suspend'}</button>
                  <button type="button" onClick={() => onAction(() => revokeSuperAdminSessions(user.id, { reason: 'Super admin security action' }))}>Revoke sessions</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="super-admin-secondary-btn" type="button" onClick={onRefresh}>Refresh accounts</button>
    </Panel>
  )
}

function SuperAdminPage() {
  const [activeModule, setActiveModule] = useState('overview')
  const [data, setData] = useState({})
  const [accounts, setAccounts] = useState(null)
  const [status, setStatus] = useState('Loading admin workspace...')
  const [error, setError] = useState('')

  const metrics = useMemo(() => data.dashboard?.metrics || {}, [data.dashboard?.metrics])
  const activePayload = data[activeModule]

  const loadModule = useCallback(async (moduleId) => {
    setError('')
    setStatus('Loading...')
    try {
      const loaders = {
        overview: readSuperAdminDashboard,
        finance: readSuperAdminFinance,
        gigs: readSuperAdminGigs,
        score: readSuperAdminScore,
        safety: readSuperAdminSafetyMetrics,
        content: readSuperAdminContent,
        configuration: readSuperAdminConfiguration,
        analytics: readSuperAdminAnalytics,
        audit: readSuperAdminAuditLogs,
      }
      if (moduleId === 'accounts') {
        const response = await listSuperAdminAccounts('?pageSize=25')
        setAccounts(response)
      } else if (loaders[moduleId]) {
        const response = await loaders[moduleId]()
        setData((current) => ({ ...current, [moduleId === 'overview' ? 'dashboard' : moduleId]: response }))
      }
      setStatus('Ready')
    } catch (requestError) {
      setError(requestError.message || 'Could not load Super Admin data')
      setStatus('Error')
    }
  }, [])

  async function performAction(action) {
    setError('')
    try {
      await action()
      await loadModule(activeModule)
      setStatus('Action recorded and audited')
    } catch (requestError) {
      setError(requestError.message || 'Action failed')
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadModule(activeModule)
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [activeModule, loadModule])

  const summaryTiles = useMemo(() => ([
    ['Users', metrics.users],
    ['Students', metrics.students],
    ['Companies', metrics.businesses],
    ['Opportunities', metrics.opportunities],
    ['Projects', metrics.projects],
    ['Open moderation', metrics.openModerationCases],
  ]), [metrics])

  return (
    <main className="super-admin-page">
      <Seo title="Super Admin | Zumbarl" description="Zumbarl Super Admin control workspace." path="/admin/super-admin" />
      <section className="super-admin-shell">
        <header className="super-admin-hero">
          <div>
            <span>Zumbarl internal</span>
            <h1>Super Admin</h1>
            <p>Account, finance, gig, score, safety, content, configuration, analytics, and audit controls.</p>
          </div>
          <div className="super-admin-status">{status}</div>
        </header>

        {error ? <p className="super-admin-error">{error}</p> : null}

        <nav className="super-admin-tabs" aria-label="Super Admin modules">
          {MODULES.map((module) => (
            <button key={module.id} type="button" className={activeModule === module.id ? 'is-active' : ''} onClick={() => setActiveModule(module.id)}>{module.label}</button>
          ))}
        </nav>

        {activeModule === 'overview' ? (
          <>
            <section className="super-admin-metrics-grid">
              {summaryTiles.map(([label, value]) => <MetricTile key={label} label={label} value={value} />)}
            </section>
            <Panel title="Operating Boundaries" eyebrow="Access principles">
              <div className="super-admin-boundary-grid">
                <article><strong>Everything audited</strong><span>Every write action records actor, entity, before/after state, and reason.</span></article>
                <article><strong>Safety silo respected</strong><span>Super Admin receives aggregate safety metrics only, not report content.</span></article>
                <article><strong>Financial controls</strong><span>Money movement actions are recorded as requiring step-up confirmation.</span></article>
              </div>
            </Panel>
          </>
        ) : null}

        {activeModule === 'accounts' ? <AccountsPanel accounts={accounts} onRefresh={() => loadModule('accounts')} onAction={performAction} /> : null}

        {activeModule === 'finance' ? (
          <Panel title="Financial Oversight" eyebrow="Transactions, escrow, wallets, advances">
            <section className="super-admin-metrics-grid compact">
              <MetricTile label="Volume" value={activePayload?.summary?.totalVolume} />
              <MetricTile label="Escrows" value={activePayload?.summary?.escrowHolds} />
              <MetricTile label="Active advances" value={activePayload?.summary?.activeAdvances} />
            </section>
            <AdminActionForm submitLabel="Record financial action" onSubmit={(payload) => performAction(() => recordSuperAdminFinancialAction(payload))} fields={[{ name: 'action', label: 'Action', type: 'select', required: true, options: [{ value: 'escrow_release', label: 'Escrow release' }, { value: 'escrow_refund', label: 'Escrow refund' }, { value: 'fee_change', label: 'Fee change' }, { value: 'chama_freeze', label: 'Chama freeze' }] }, { name: 'scopeId', label: 'Scope ID' }, { name: 'reason', label: 'Reason', required: true }]} />
          </Panel>
        ) : null}

        {activeModule === 'gigs' ? (
          <Panel title="Gig & Marketplace Oversight" eyebrow="Disputes, flags, templates">
            <section className="super-admin-metrics-grid compact"><MetricTile label="Open" value={activePayload?.summary?.open} /><MetricTile label="Disputed" value={activePayload?.summary?.disputed} /><MetricTile label="Projects" value={activePayload?.summary?.projects} /></section>
            <AdminActionForm submitLabel="Record gig action" onSubmit={(payload) => performAction(() => recordSuperAdminGigAction(payload))} fields={[{ name: 'action', label: 'Action', type: 'select', required: true, options: [{ value: 'resolve_dispute', label: 'Resolve dispute' }, { value: 'remove_listing', label: 'Remove listing' }, { value: 'verify_deliverable', label: 'Verify deliverable' }, { value: 'retire_template', label: 'Retire template' }] }, { name: 'entityId', label: 'Entity ID' }, { name: 'reason', label: 'Reason', required: true }]} />
          </Panel>
        ) : null}

        {activeModule === 'score' ? (
          <Panel title="Score, Pipeline & Career Control" eyebrow="Versioned forward-only configuration">
            <section className="super-admin-metrics-grid compact"><MetricTile label="Scores" value={activePayload?.summary?.scoresTracked} /><MetricTile label="Endorsements" value={activePayload?.summary?.endorsements} /><MetricTile label="Certificates" value={activePayload?.summary?.certificates} /></section>
            <AdminActionForm submitLabel="Create score configuration" onSubmit={(payload) => performAction(() => writeSuperAdminScoreConfiguration(payload))} fields={[{ name: 'name', label: 'Configuration name', required: true }, { name: 'effectiveFrom', label: 'Effective from' }, { name: 'reason', label: 'Reason', required: true }]} />
          </Panel>
        ) : null}

        {activeModule === 'safety' ? (
          <Panel title="Safety System Oversight" eyebrow="Aggregate metrics only">
            <section className="super-admin-metrics-grid compact"><MetricTile label="Total reports" value={activePayload?.summary?.totalReports} /><MetricTile label="Open reports" value={activePayload?.summary?.openReports} /><MetricTile label="Safety officers" value={activePayload?.summary?.safetyOfficerCount} /></section>
            <p className="super-admin-boundary-note">This module intentionally does not expose individual report content.</p>
          </Panel>
        ) : null}

        {activeModule === 'content' ? (
          <Panel title="Content Moderation" eyebrow="Flagged content and review actions">
            <section className="super-admin-metrics-grid compact"><MetricTile label="Cases" value={activePayload?.summary?.moderationCases} /><MetricTile label="Open" value={activePayload?.summary?.openCases} /><MetricTile label="Queued" value={activePayload?.summary?.queuedContent} /></section>
            <AdminActionForm submitLabel="Record content action" onSubmit={(payload) => performAction(() => recordSuperAdminContentAction(payload))} fields={[{ name: 'action', label: 'Action', type: 'select', required: true, options: [{ value: 'remove', label: 'Remove' }, { value: 'restore', label: 'Restore' }, { value: 'dismiss', label: 'Dismiss' }, { value: 'dissolve_group', label: 'Dissolve group' }] }, { name: 'contentId', label: 'Content ID' }, { name: 'reason', label: 'Reason', required: true }]} />
          </Panel>
        ) : null}

        {activeModule === 'configuration' ? (
          <Panel title="System Configuration" eyebrow="Flags, templates, integrations, protective rules">
            <section className="super-admin-metrics-grid compact"><MetricTile label="Campuses" value={activePayload?.campuses?.length} /><MetricTile label="Feature flags" value={activePayload?.featureFlags?.length} /><MetricTile label="Rules" value={activePayload?.protectiveRules?.length} /></section>
            <AdminActionForm submitLabel="Save configuration" onSubmit={(payload) => performAction(() => writeSuperAdminConfiguration(payload))} fields={[{ name: 'kind', label: 'Kind', type: 'select', required: true, options: [{ value: 'feature_flag', label: 'Feature flag' }, { value: 'notification_template', label: 'Notification template' }, { value: 'integration_health', label: 'Integration health' }, { value: 'protective_rule', label: 'Protective rule' }, { value: 'platform_setting', label: 'Platform setting' }] }, { name: 'key', label: 'Key', required: true }, { name: 'value', label: 'Value' }, { name: 'reason', label: 'Reason', required: true }]} />
          </Panel>
        ) : null}

        {activeModule === 'analytics' ? (
          <Panel title="Analytics & Reporting" eyebrow="Platform health and funnel">
            <section className="super-admin-metrics-grid compact"><MetricTile label="GMV" value={activePayload?.summary?.grossMerchandiseValue} /><MetricTile label="Revenue" value={activePayload?.summary?.revenue} /><MetricTile label="Placements" value={activePayload?.summary?.placements} /></section>
          </Panel>
        ) : null}

        {activeModule === 'audit' ? (
          <Panel title="Audit Log & Security" eyebrow="Append-only admin trail">
            <div className="super-admin-table-wrap"><table className="super-admin-table"><thead><tr><th>Action</th><th>Entity</th><th>Actor</th><th>IP address</th><th>Time</th></tr></thead><tbody>{(activePayload?.data || []).map((log) => <tr key={log.id}><td>{log.action}</td><td>{log.entityType} / {log.entityId}</td><td>{log.userId}</td><td>{log.ipAddress || 'Not captured'}</td><td>{new Date(log.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div>
          </Panel>
        ) : null}
      </section>
    </main>
  )
}

export default SuperAdminPage
