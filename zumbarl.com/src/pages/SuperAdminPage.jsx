import { useCallback, useEffect, useMemo, useState } from "react";
import Seo from "../components/Seo";
import {
  addManagedProfileManager,
  createManagedProfile,
  listMyManagedProfiles,
  removeManagedProfileManager,
} from "../features/profile/services/managedProfileService";
import {
  listZumbarlAds,
  listSuperAdminAccounts,
  publishZumbarlAd,
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
} from "../features/admin/services/superAdminService";
import "../styles/business.css";

const MODULES = [
  { id: "overview", label: "Overview" },
  { id: "accounts", label: "Accounts" },
  { id: "finance", label: "Finance" },
  { id: "gigs", label: "Gigs" },
  { id: "score", label: "Score" },
  { id: "safety", label: "Safety" },
  { id: "content", label: "Content" },
  { id: "pages", label: "Pages" },
  { id: "ads", label: "Zumbarl Ads" },
  { id: "configuration", label: "Config" },
  { id: "analytics", label: "Analytics" },
  { id: "audit", label: "Audit" },
];

function MetricTile({ label, value, note }) {
  return (
    <article className="super-admin-metric-tile">
      <span>{label}</span>
      <strong>{value ?? 0}</strong>
      {note ? <small>{note}</small> : null}
    </article>
  );
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
  );
}

function AdminActionForm({
  fields,
  submitLabel,
  onSubmit,
  initialValues = {},
}) {
  const [values, setValues] = useState(initialValues);

  function updateValue(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(values);
    setValues(initialValues);
  }

  return (
    <form className="super-admin-action-form" onSubmit={handleSubmit}>
      {fields.map((field) => (
        <label key={field.name}>
          <span>{field.label}</span>
          {field.type === "select" ? (
            <select
              value={values[field.name] || ""}
              onChange={(event) => updateValue(field.name, event.target.value)}
              required={field.required}
            >
              <option value="">Select</option>
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : field.type === "textarea" ? (
            <textarea
              value={values[field.name] || ""}
              onChange={(event) => updateValue(field.name, event.target.value)}
              required={field.required}
            />
          ) : (
            <input
              type={field.type || "text"}
              value={values[field.name] || ""}
              onChange={(event) => updateValue(field.name, event.target.value)}
              required={field.required}
            />
          )}
        </label>
      ))}
      <button type="submit">{submitLabel}</button>
    </form>
  );
}

function AccountsPanel({ accounts, onRefresh, onAction }) {
  return (
    <Panel title="User & Account Management" eyebrow="Full account visibility">
      <div className="super-admin-table-wrap">
        <table className="super-admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>KYC</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(accounts?.data || []).map((user) => (
              <tr key={user.id}>
                <td>
                  <strong>{user.name || user.email}</strong>
                  <span>{user.email}</span>
                </td>
                <td>{user.role}</td>
                <td>{user.isActive === false ? "Suspended" : "Active"}</td>
                <td>
                  {user.studentProfile?.kycStatus ||
                    user.companyContact?.company?.kycStatus ||
                    "Pending"}
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() =>
                      onAction(() =>
                        updateSuperAdminAccount(user.id, {
                          status:
                            user.isActive === false ? "active" : "suspended",
                          reason: "Super admin account control",
                        }),
                      )
                    }
                  >
                    {user.isActive === false ? "Reactivate" : "Suspend"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onAction(() =>
                        revokeSuperAdminSessions(user.id, {
                          reason: "Super admin security action",
                        }),
                      )
                    }
                  >
                    Revoke sessions
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        className="super-admin-secondary-btn"
        type="button"
        onClick={onRefresh}
      >
        Refresh accounts
      </button>
    </Panel>
  );
}

function ZumbarlAdsPanel({ ads, onAction }) {
  const records = ads?.data || [];
  const pendingCount = records.filter((ad) => ad.status === "pending_review").length;
  const publishedCount = records.filter((ad) => ad.status === "published").length;

  return (
    <Panel title="Zumbarl Ads" eyebrow="Campaign promotion review queue">
      <section className="super-admin-metrics-grid compact">
        <MetricTile label="Pending review" value={pendingCount} />
        <MetricTile label="Published" value={publishedCount} />
        <MetricTile label="Stored requests" value={records.length} />
      </section>
      <p className="super-admin-boundary-note">
        Published records are ready for future Zumbarl Ads placements. No placement surface is enabled yet.
      </p>
      <div className="super-admin-table-wrap">
        <table className="super-admin-table super-admin-ads-table">
          <thead>
            <tr>
              <th>Creative</th>
              <th>Campaign</th>
              <th>Ad copy</th>
              <th>Status</th>
              <th>Requested</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {records.map((ad) => {
              const materials = Array.isArray(ad.campaign?.materials)
                ? ad.campaign.materials
                : [];
              const previewImage =
                ad.campaign?.previewImage ||
                materials.find((material) => material.type === "image")?.url;
              return (
                <tr key={ad.id}>
                  <td>
                    {previewImage ? (
                      <img className="super-admin-ad-thumb" src={previewImage} alt="" />
                    ) : (
                      <span className="super-admin-ad-thumb is-empty">Ad</span>
                    )}
                  </td>
                  <td>
                    <strong>{ad.campaign?.title || "Campaign"}</strong>
                    <span>{ad.campaignId}</span>
                  </td>
                  <td>
                    <strong>{ad.headline}</strong>
                    <span>{ad.description}</span>
                    {ad.callToAction ? <small>{ad.callToAction}</small> : null}
                  </td>
                  <td><span className={`super-admin-ad-status is-${ad.status}`}>{ad.status.replaceAll("_", " ")}</span></td>
                  <td>{new Date(ad.createdAt).toLocaleString()}</td>
                  <td>
                    <button
                      type="button"
                      disabled={ad.status !== "pending_review"}
                      onClick={() => onAction(() => publishZumbarlAd(ad.id))}
                    >
                      {ad.status === "published" ? "Published" : "Publish"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {!records.length ? (
              <tr><td colSpan="6">No Zumbarl Ads requests have been submitted yet.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function ManagedPagesPanel({ accounts, onAction }) {
  const [campuses, setCampuses] = useState([]);
  const [campusForm, setCampusForm] = useState({ name: "", slug: "", managerId: "", managerRole: "admin", bio: "" });
  const [serviceForm, setServiceForm] = useState({ type: "hotel", name: "", slug: "", campusId: "", managerId: "", managerRole: "editor", bio: "" });
  const [notice, setNotice] = useState("");
  const [editingCampus, setEditingCampus] = useState(null);

  const users = accounts?.data || [];

  useEffect(() => {
    listMyManagedProfiles()
      .then((response) => setCampuses((response?.data || []).filter((page) => page.type === "campus")))
      .catch(() => {});
  }, []);
  const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const update = (setter, name, value) => setter((current) => ({ ...current, [name]: value }));

  async function createPage(form, type, parent) {
    const slug = slugify(form.slug || form.name);
    const page = await createManagedProfile({
      type,
      name: form.name,
      slug,
      handle: slug.replaceAll("-", "_").slice(0, 40),
      bio: form.bio,
      details: parent ? { campusManagedProfileId: parent.id, campusName: parent.name } : {},
    });
    if (form.managerId) await addManagedProfileManager(page.id, { email: users.find((user) => user.id === form.managerId)?.email, role: form.managerRole });
    return page;
  }

  async function submitCampus(event) {
    event.preventDefault();
    try {
      const page = await createPage(campusForm, "campus");
      setCampuses((current) => [...current, page]);
      setCampusForm({ name: "", slug: "", managerId: "", managerRole: "admin", bio: "" });
      setNotice(`${page.name} was created and assigned.`);
      onAction(() => Promise.resolve());
    } catch (requestError) { setNotice(requestError.message || "Campus page could not be created."); }
  }

  async function submitService(event) {
    event.preventDefault();
    const parent = campuses.find((campus) => campus.id === serviceForm.campusId);
    if (!parent) return;
    try {
      const page = await createPage(serviceForm, serviceForm.type, parent);
      setServiceForm({ type: "hotel", name: "", slug: "", campusId: "", managerId: "", managerRole: "editor", bio: "" });
      setNotice(`${page.name} was created under ${parent.name} and assigned.`);
      onAction(() => Promise.resolve());
    } catch (requestError) { setNotice(requestError.message || "Service page could not be created."); }
  }

  async function assignManager(event) {
    event.preventDefault();
    const user = users.find((candidate) => candidate.id === editingCampus.managerId);
    if (!user) return;
    try {
      await addManagedProfileManager(editingCampus.id, { email: user.email, role: editingCampus.managerRole });
      setCampuses((current) => current.map((campus) => campus.id === editingCampus.id
        ? { ...campus, managers: [...(campus.managers || []).filter((manager) => manager.user?.id !== user.id), { role: editingCampus.managerRole, user }] }
        : campus));
      setEditingCampus((current) => ({ ...current, managerId: "" }));
      setNotice(`${user.name || user.email} is now assigned to ${editingCampus.name}.`);
    } catch (requestError) { setNotice(requestError.message || "The manager could not be assigned."); }
  }

  async function unassignManager(campus, manager) {
    try {
      await removeManagedProfileManager(campus.id, manager.user.id);
      setCampuses((current) => current.map((item) => item.id === campus.id
        ? { ...item, managers: (item.managers || []).filter((candidate) => candidate.user?.id !== manager.user.id) }
        : item));
      setNotice(`${manager.user.name || manager.user.email} was removed from ${campus.name}.`);
    } catch (requestError) { setNotice(requestError.message || "The manager could not be removed."); }
  }

  const managerFields = (form, setter) => (
    <>
      <label><span>Assign manager</span><select required value={form.managerId} onChange={(event) => update(setter, "managerId", event.target.value)}><option value="">Select a user</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name || user.email} · {user.email}</option>)}</select></label>
      <label><span>Manager role</span><select value={form.managerRole} onChange={(event) => update(setter, "managerRole", event.target.value)}><option value="admin">Admin</option><option value="editor">Editor</option></select></label>
    </>
  );

  return <Panel title="Campus Pages & Services" eyebrow="Admin-created identities and assignments">
    <p className="super-admin-boundary-note">Create verified campus pages here, assign a Zumbarl user to manage them, then add internal services such as hotels and barber shops beneath the campus page.</p>
    {notice ? <p className="super-admin-boundary-note">{notice}</p> : null}
    <div className="super-admin-page-management-grid">
      <form className="super-admin-action-form" onSubmit={submitCampus}><h3>Create campus page</h3><label><span>Campus name</span><input required value={campusForm.name} onChange={(event) => update(setCampusForm, "name", event.target.value)} placeholder="e.g. Zetech University" /></label><label><span>Slug (optional)</span><input value={campusForm.slug} onChange={(event) => update(setCampusForm, "slug", event.target.value)} placeholder="zetech-university" /></label><label><span>Description</span><textarea value={campusForm.bio} onChange={(event) => update(setCampusForm, "bio", event.target.value)} /></label>{managerFields(campusForm, setCampusForm)}<button type="submit">Create campus page</button></form>
      <form className="super-admin-action-form" onSubmit={submitService}><h3>Create internal service</h3><label><span>Service type</span><select value={serviceForm.type} onChange={(event) => update(setServiceForm, "type", event.target.value)}><option value="hotel">Hotel</option><option value="barber_shop">Barber shop</option><option value="service">Other campus service</option></select></label><label><span>Service name</span><input required value={serviceForm.name} onChange={(event) => update(setServiceForm, "name", event.target.value)} placeholder="e.g. Zetech Campus Hotel" /></label><label><span>Campus page</span><select required value={serviceForm.campusId} onChange={(event) => update(setServiceForm, "campusId", event.target.value)}><option value="">Select a campus page</option>{campuses.map((campus) => <option key={campus.id} value={campus.id}>{campus.name}</option>)}</select></label><label><span>Description</span><textarea value={serviceForm.bio} onChange={(event) => update(setServiceForm, "bio", event.target.value)} /></label>{managerFields(serviceForm, setServiceForm)}<button type="submit">Create service page</button></form>
    </div>
    {campuses.length ? <div className="super-admin-boundary-grid">{campuses.map((campus) => <article key={campus.id}><strong>{campus.name}</strong><span>Campus page ready for internal service pages.</span><button type="button" onClick={() => setEditingCampus({ ...campus, managerId: "", managerRole: "editor" })}>Edit assignments</button></article>)}</div> : null}
    {editingCampus ? <div className="super-admin-assignment-editor"><header><div><span>Manager assignments</span><h3>{editingCampus.name}</h3></div><button type="button" onClick={() => setEditingCampus(null)}>Close</button></header><div className="super-admin-assignment-list">{(editingCampus.managers || []).map((manager) => <div key={manager.user.id}><span><strong>{manager.user.name || manager.user.email}</strong><small>{manager.user.email} · {manager.role}</small></span>{manager.role === "owner" ? <em>Owner</em> : <button type="button" onClick={() => unassignManager(editingCampus, manager)}>Remove</button>}</div>)}{!(editingCampus.managers || []).length ? <p>No managers assigned yet.</p> : null}</div><form className="super-admin-assignment-form" onSubmit={assignManager}><label><span>Add user</span><select required value={editingCampus.managerId} onChange={(event) => setEditingCampus((current) => ({ ...current, managerId: event.target.value }))}><option value="">Select a user</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name || user.email} · {user.email}</option>)}</select></label><label><span>Role</span><select value={editingCampus.managerRole} onChange={(event) => setEditingCampus((current) => ({ ...current, managerRole: event.target.value }))}><option value="admin">Admin</option><option value="editor">Editor</option></select></label><button type="submit">Assign manager</button></form></div> : null}
  </Panel>;
}

function SuperAdminPage() {
  const [activeModule, setActiveModule] = useState("overview");
  const [data, setData] = useState({});
  const [accounts, setAccounts] = useState(null);
  const [status, setStatus] = useState("Loading admin workspace...");
  const [error, setError] = useState("");

  const metrics = useMemo(
    () => data.dashboard?.metrics || {},
    [data.dashboard?.metrics],
  );
  const activePayload = data[activeModule];

  const loadModule = useCallback(async (moduleId) => {
    setError("");
    setStatus("Loading...");
    try {
      const loaders = {
        overview: readSuperAdminDashboard,
        finance: readSuperAdminFinance,
        gigs: readSuperAdminGigs,
        score: readSuperAdminScore,
        safety: readSuperAdminSafetyMetrics,
        content: readSuperAdminContent,
        ads: listZumbarlAds,
        configuration: readSuperAdminConfiguration,
        analytics: readSuperAdminAnalytics,
        audit: readSuperAdminAuditLogs,
      };
      if (moduleId === "accounts" || moduleId === "pages") {
        const response = await listSuperAdminAccounts("?pageSize=25");
        setAccounts(response);
      } else if (loaders[moduleId]) {
        const response = await loaders[moduleId]();
        setData((current) => ({
          ...current,
          [moduleId === "overview" ? "dashboard" : moduleId]: response,
        }));
      }
      setStatus("Ready");
    } catch (requestError) {
      setError(requestError.message || "Could not load Super Admin data");
      setStatus("Error");
    }
  }, []);

  async function performAction(action) {
    setError("");
    try {
      await action();
      await loadModule(activeModule);
      setStatus("Action recorded and audited");
    } catch (requestError) {
      setError(requestError.message || "Action failed");
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadModule(activeModule);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [activeModule, loadModule]);

  const summaryTiles = useMemo(
    () => [
      ["Users", metrics.users],
      ["Students", metrics.students],
      ["Companies", metrics.businesses],
      ["Opportunities", metrics.opportunities],
      ["Projects", metrics.projects],
      ["Open moderation", metrics.openModerationCases],
    ],
    [metrics],
  );

  return (
    <main className="super-admin-page">
      <Seo
        title="Super Admin | Zumbarl"
        description="Zumbarl Super Admin control workspace."
        path="/admin/super-admin"
      />
      <section className="super-admin-shell">
        <header className="super-admin-hero">
          <div>
            <span>Zumbarl internal</span>
            <h1>Super Admin</h1>
            <p>
              Account, finance, gig, score, safety, content, configuration,
              analytics, and audit controls.
            </p>
          </div>
          <div className="super-admin-status">{status}</div>
        </header>

        {error ? <p className="super-admin-error">{error}</p> : null}

        <nav className="super-admin-tabs" aria-label="Super Admin modules">
          {MODULES.map((module) => (
            <button
              key={module.id}
              type="button"
              className={activeModule === module.id ? "is-active" : ""}
              onClick={() => setActiveModule(module.id)}
            >
              {module.label}
            </button>
          ))}
        </nav>

        {activeModule === "overview" ? (
          <>
            <section className="super-admin-metrics-grid">
              {summaryTiles.map(([label, value]) => (
                <MetricTile key={label} label={label} value={value} />
              ))}
            </section>
            <Panel title="Operating Boundaries" eyebrow="Access principles">
              <div className="super-admin-boundary-grid">
                <article>
                  <strong>Everything audited</strong>
                  <span>
                    Every write action records actor, entity, before/after
                    state, and reason.
                  </span>
                </article>
                <article>
                  <strong>Safety silo respected</strong>
                  <span>
                    Super Admin receives aggregate safety metrics only, not
                    report content.
                  </span>
                </article>
                <article>
                  <strong>Financial controls</strong>
                  <span>
                    Money movement actions are recorded as requiring step-up
                    confirmation.
                  </span>
                </article>
              </div>
            </Panel>
          </>
        ) : null}

        {activeModule === "accounts" ? (
          <AccountsPanel
            accounts={accounts}
            onRefresh={() => loadModule("accounts")}
            onAction={performAction}
          />
        ) : null}

        {activeModule === "finance" ? (
          <Panel
            title="Financial Oversight"
            eyebrow="Transactions, escrow, wallets, advances"
          >
            <section className="super-admin-metrics-grid compact">
              <MetricTile
                label="Volume"
                value={activePayload?.summary?.totalVolume}
              />
              <MetricTile
                label="Escrows"
                value={activePayload?.summary?.escrowHolds}
              />
              <MetricTile
                label="Active advances"
                value={activePayload?.summary?.activeAdvances}
              />
            </section>
            <AdminActionForm
              submitLabel="Record financial action"
              onSubmit={(payload) =>
                performAction(() => recordSuperAdminFinancialAction(payload))
              }
              fields={[
                {
                  name: "action",
                  label: "Action",
                  type: "select",
                  required: true,
                  options: [
                    { value: "escrow_release", label: "Escrow release" },
                    { value: "escrow_refund", label: "Escrow refund" },
                    { value: "fee_change", label: "Fee change" },
                    { value: "chama_freeze", label: "Chama freeze" },
                  ],
                },
                { name: "scopeId", label: "Scope ID" },
                { name: "reason", label: "Reason", required: true },
              ]}
            />
          </Panel>
        ) : null}

        {activeModule === "gigs" ? (
          <Panel
            title="Gig & Marketplace Oversight"
            eyebrow="Disputes, flags, templates"
          >
            <section className="super-admin-metrics-grid compact">
              <MetricTile label="Open" value={activePayload?.summary?.open} />
              <MetricTile
                label="Disputed"
                value={activePayload?.summary?.disputed}
              />
              <MetricTile
                label="Projects"
                value={activePayload?.summary?.projects}
              />
            </section>
            <AdminActionForm
              submitLabel="Record gig action"
              onSubmit={(payload) =>
                performAction(() => recordSuperAdminGigAction(payload))
              }
              fields={[
                {
                  name: "action",
                  label: "Action",
                  type: "select",
                  required: true,
                  options: [
                    { value: "resolve_dispute", label: "Resolve dispute" },
                    { value: "remove_listing", label: "Remove listing" },
                    {
                      value: "verify_deliverable",
                      label: "Verify deliverable",
                    },
                    { value: "retire_template", label: "Retire template" },
                  ],
                },
                { name: "entityId", label: "Entity ID" },
                { name: "reason", label: "Reason", required: true },
              ]}
            />
          </Panel>
        ) : null}

        {activeModule === "score" ? (
          <Panel
            title="Score, Pipeline & Career Control"
            eyebrow="Versioned forward-only configuration"
          >
            <section className="super-admin-metrics-grid compact">
              <MetricTile
                label="Scores"
                value={activePayload?.summary?.scoresTracked}
              />
              <MetricTile
                label="Endorsements"
                value={activePayload?.summary?.endorsements}
              />
              <MetricTile
                label="Certificates"
                value={activePayload?.summary?.certificates}
              />
            </section>
            <AdminActionForm
              submitLabel="Create score configuration"
              onSubmit={(payload) =>
                performAction(() => writeSuperAdminScoreConfiguration(payload))
              }
              fields={[
                { name: "name", label: "Configuration name", required: true },
                { name: "effectiveFrom", label: "Effective from" },
                { name: "reason", label: "Reason", required: true },
              ]}
            />
          </Panel>
        ) : null}

        {activeModule === "safety" ? (
          <Panel
            title="Safety System Oversight"
            eyebrow="Aggregate metrics only"
          >
            <section className="super-admin-metrics-grid compact">
              <MetricTile
                label="Total reports"
                value={activePayload?.summary?.totalReports}
              />
              <MetricTile
                label="Open reports"
                value={activePayload?.summary?.openReports}
              />
              <MetricTile
                label="Safety officers"
                value={activePayload?.summary?.safetyOfficerCount}
              />
            </section>
            <p className="super-admin-boundary-note">
              This module intentionally does not expose individual report
              content.
            </p>
          </Panel>
        ) : null}

        {activeModule === "content" ? (
          <Panel
            title="Content Moderation"
            eyebrow="Flagged content and review actions"
          >
            <section className="super-admin-metrics-grid compact">
              <MetricTile
                label="Cases"
                value={activePayload?.summary?.moderationCases}
              />
              <MetricTile
                label="Open"
                value={activePayload?.summary?.openCases}
              />
              <MetricTile
                label="Queued"
                value={activePayload?.summary?.queuedContent}
              />
            </section>
            <AdminActionForm
              submitLabel="Record content action"
              onSubmit={(payload) =>
                performAction(() => recordSuperAdminContentAction(payload))
              }
              fields={[
                {
                  name: "action",
                  label: "Action",
                  type: "select",
                  required: true,
                  options: [
                    { value: "remove", label: "Remove" },
                    { value: "restore", label: "Restore" },
                    { value: "dismiss", label: "Dismiss" },
                    { value: "dissolve_group", label: "Dissolve group" },
                  ],
                },
                { name: "contentId", label: "Content ID" },
                { name: "reason", label: "Reason", required: true },
              ]}
            />
          </Panel>
        ) : null}

        {activeModule === "ads" ? (
          <ZumbarlAdsPanel ads={activePayload} onAction={performAction} />
        ) : null}

        {activeModule === "pages" ? (
          <ManagedPagesPanel accounts={accounts} onAction={performAction} />
        ) : null}

        {activeModule === "configuration" ? (
          <Panel
            title="System Configuration"
            eyebrow="Flags, templates, integrations, protective rules"
          >
            <section className="super-admin-metrics-grid compact">
              <MetricTile
                label="Campuses"
                value={activePayload?.campuses?.length}
              />
              <MetricTile
                label="Feature flags"
                value={activePayload?.featureFlags?.length}
              />
              <MetricTile
                label="Rules"
                value={activePayload?.protectiveRules?.length}
              />
            </section>
            <h3>Navigation feature tags</h3>
            <p className="super-admin-boundary-note">
              Choose whether a navigation item displays an admin-managed label
              such as New, Beta, Featured, or Updated. Select Hidden to remove
              its label.
            </p>
            <AdminActionForm
              submitLabel="Update navigation tag"
              onSubmit={(payload) =>
                performAction(() =>
                  writeSuperAdminConfiguration({
                    kind: "feature_flag",
                    key: `navigation.${payload.item}`,
                    label: payload.tag === "hidden" ? "" : payload.tag,
                    enabled: payload.tag !== "hidden",
                    reason: payload.reason,
                  }),
                )
              }
              fields={[
                {
                  name: "item",
                  label: "Navigation item",
                  type: "select",
                  required: true,
                  options: [
                    {
                      value: "business.marketing",
                      label: "Business · Marketing",
                    },
                  ],
                },
                {
                  name: "tag",
                  label: "Feature tag",
                  type: "select",
                  required: true,
                  options: [
                    { value: "hidden", label: "Hidden" },
                    { value: "New", label: "New" },
                    { value: "Beta", label: "Beta" },
                    { value: "Featured", label: "Featured" },
                    { value: "Updated", label: "Updated" },
                  ],
                },
                { name: "reason", label: "Reason", required: true },
              ]}
            />
            <h3>Zumbarl Delivery pricing</h3>
            <p className="super-admin-boundary-note">
              Courier quote = base fare + billable kilometres × per-kilometre
              rate, constrained by the minimum, maximum, and service radius.
            </p>
            <AdminActionForm
              submitLabel="Update delivery pricing"
              onSubmit={(payload) =>
                performAction(() =>
                  writeSuperAdminConfiguration({
                    kind: "platform_setting",
                    key: "zumbarl_delivery",
                    value: JSON.stringify({
                      active: payload.active === "true",
                      baseFee: Number(payload.baseFee),
                      perKmFee: Number(payload.perKmFee),
                      freeRadiusKm: Number(payload.freeRadiusKm),
                      minimumFee: Number(payload.minimumFee),
                      maximumFee: Number(payload.maximumFee),
                      maximumDistanceKm: Number(payload.maximumDistanceKm),
                    }),
                    reason: payload.reason,
                  }),
                )
              }
              fields={[
                {
                  name: "active",
                  label: "Service status",
                  type: "select",
                  required: true,
                  options: [
                    { value: "true", label: "Active" },
                    { value: "false", label: "Paused" },
                  ],
                },
                {
                  name: "baseFee",
                  label: "Base fare (KES)",
                  type: "number",
                  required: true,
                },
                {
                  name: "perKmFee",
                  label: "Price per km (KES)",
                  type: "number",
                  required: true,
                },
                {
                  name: "freeRadiusKm",
                  label: "Free radius (km)",
                  type: "number",
                  required: true,
                },
                {
                  name: "minimumFee",
                  label: "Minimum quote (KES)",
                  type: "number",
                  required: true,
                },
                {
                  name: "maximumFee",
                  label: "Maximum quote (KES)",
                  type: "number",
                  required: true,
                },
                {
                  name: "maximumDistanceKm",
                  label: "Maximum distance (km)",
                  type: "number",
                  required: true,
                },
                { name: "reason", label: "Reason", required: true },
              ]}
            />
            <AdminActionForm
              submitLabel="Save configuration"
              onSubmit={(payload) =>
                performAction(() => writeSuperAdminConfiguration(payload))
              }
              fields={[
                {
                  name: "kind",
                  label: "Kind",
                  type: "select",
                  required: true,
                  options: [
                    { value: "feature_flag", label: "Feature flag" },
                    {
                      value: "notification_template",
                      label: "Notification template",
                    },
                    {
                      value: "integration_health",
                      label: "Integration health",
                    },
                    { value: "protective_rule", label: "Protective rule" },
                    { value: "platform_setting", label: "Platform setting" },
                  ],
                },
                { name: "key", label: "Key", required: true },
                { name: "value", label: "Value" },
                { name: "reason", label: "Reason", required: true },
              ]}
            />
          </Panel>
        ) : null}

        {activeModule === "analytics" ? (
          <Panel
            title="Analytics & Reporting"
            eyebrow="Platform health and funnel"
          >
            <section className="super-admin-metrics-grid compact">
              <MetricTile
                label="GMV"
                value={activePayload?.summary?.grossMerchandiseValue}
              />
              <MetricTile
                label="Revenue"
                value={activePayload?.summary?.revenue}
              />
              <MetricTile
                label="Placements"
                value={activePayload?.summary?.placements}
              />
            </section>
          </Panel>
        ) : null}

        {activeModule === "audit" ? (
          <Panel title="Audit Log & Security" eyebrow="Append-only admin trail">
            <div className="super-admin-table-wrap">
              <table className="super-admin-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Actor</th>
                    <th>IP address</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {(activePayload?.data || []).map((log) => (
                    <tr key={log.id}>
                      <td>{log.action}</td>
                      <td>
                        {log.entityType} / {log.entityId}
                      </td>
                      <td>{log.userId}</td>
                      <td>{log.ipAddress || "Not captured"}</td>
                      <td>{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        ) : null}
      </section>
    </main>
  );
}

export default SuperAdminPage;
