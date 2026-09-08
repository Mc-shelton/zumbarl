import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import {
  addManagedProfileManager,
  createManagedProfile,
  removeManagedProfileManager,
} from "../features/profile/services/managedProfileService";
import {
  createCampusVendor,
  updateCampusVendor,
  reviewStudentKitchen,
  addCampusVendorManager,
  removeCampusVendorManager,
  listZumbarlAds,
  listSuperAdminAccounts,
  publishZumbarlAd,
  readSuperAdminAnalytics,
  readSuperAdminAuditLogs,
  readSuperAdminConfiguration,
  readAcademicCatalog,
  readSuperAdminContent,
  readSuperAdminDashboard,
  readSuperAdminFinance,
  readSuperAdminGigs,
  readSuperAdminSafetyMetrics,
  readSuperAdminScore,
  recordSuperAdminContentAction,
  recordSuperAdminFinancialAction,
  recordSuperAdminGigAction,
  readCampusVendorManagement,
  readSuperAdminKycDocument,
  reviewSuperAdminKyc,
  revokeSuperAdminSessions,
  updateSuperAdminAccount,
  updateAcademicCampus,
  updateAcademicCourse,
  updateAcademicUnit,
  writeSuperAdminConfiguration,
  writeSuperAdminScoreConfiguration,
} from "../features/admin/services/superAdminService";
import "../styles/business.css";

const MODULES = [
  { id: "overview", label: "Overview" },
  { id: "accounts", label: "Accounts" },
  { id: "kyc", label: "KYC Review" },
  { id: "finance", label: "Finance" },
  { id: "gigs", label: "Gigs" },
  { id: "score", label: "Score" },
  { id: "safety", label: "Safety" },
  { id: "content", label: "Content" },
  { id: "pages", label: "Pages" },
  { id: "ads", label: "Zumbarl Ads" },
  { id: "catalog", label: "Academic Data" },
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
            {(accounts?.data || []).map((user) => {
              const kycStatus = user.studentProfile?.kycStatus || user.companyContact?.company?.kycStatus || "PENDING";
              return <tr key={user.id}>
                <td>
                  <strong>{user.name || user.email}</strong>
                  <span>{user.email}</span>
                </td>
                <td>{user.role}</td>
                <td>{user.isActive === false ? "Suspended" : "Active"}</td>
                <td><div className="super-admin-kyc-cell"><strong>{String(kycStatus).replaceAll("_", " ")}</strong>{user.studentProfile ? <small>Review in the KYC Review page</small> : null}</div></td>
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
            })}
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

const REQUIRED_STUDENT_KYC_DOCUMENTS = [
  { type: "NATIONAL_ID", label: "National ID" },
  { type: "STUDENT_ID", label: "Student ID" },
];

function KycReviewPanel({ accounts, onRefresh, onAction }) {
  const [filter, setFilter] = useState("pending");
  const [viewingDocumentId, setViewingDocumentId] = useState("");
  const [reviewingUserId, setReviewingUserId] = useState("");
  const students = (accounts?.data || []).filter((user) => user.studentProfile);
  const statusOf = (user) => String(user.studentProfile?.kycStatus || "PENDING").toUpperCase();
  const pending = students.filter((user) => statusOf(user) === "UNDER_REVIEW");
  const approved = students.filter((user) => statusOf(user) === "APPROVED");
  const rejected = students.filter((user) => statusOf(user) === "REJECTED");
  const visible = filter === "pending"
    ? pending
    : filter === "reviewed"
      ? students.filter((user) => ["APPROVED", "REJECTED"].includes(statusOf(user)))
      : students;

  async function viewKycDocument(userId, documentId) {
    const previewWindow = window.open("", "_blank");
    if (previewWindow) previewWindow.opener = null;
    setViewingDocumentId(documentId);
    try {
      const blob = await readSuperAdminKycDocument(userId, documentId);
      const objectUrl = URL.createObjectURL(blob);
      if (previewWindow) previewWindow.location.href = objectUrl;
      else window.open(objectUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      previewWindow?.close();
      window.alert(error.message || "The KYC document could not be opened.");
    } finally {
      setViewingDocumentId("");
    }
  }

  async function review(user, status) {
    const reason = status === "REJECTED"
      ? window.prompt(`Why is ${user.name || user.email}'s KYC being rejected?`)
      : "National ID and Student ID reviewed and approved by platform admin.";
    if (!reason?.trim()) return;
    setReviewingUserId(user.id);
    try {
      await onAction(() => reviewSuperAdminKyc(user.id, { status, reason: reason.trim() }));
    } finally {
      setReviewingUserId("");
    }
  }

  return (
    <Panel
      title="Student KYC Review"
      eyebrow="Identity verification queue"
      actions={<button className="super-admin-secondary-btn" type="button" onClick={onRefresh}>Refresh queue</button>}
    >
      <section className="super-admin-metrics-grid compact">
        <MetricTile label="Pending review" value={pending.length} />
        <MetricTile label="Approved" value={approved.length} />
        <MetricTile label="Rejected" value={rejected.length} />
      </section>
      <p className="super-admin-boundary-note">Review both required documents before making a decision. KYC documents open through authenticated private storage and are not exposed as public links.</p>
      <nav className="super-admin-kyc-filters" aria-label="KYC review filters">
        {[{ id: "pending", label: `Pending (${pending.length})` }, { id: "reviewed", label: "Reviewed" }, { id: "all", label: "All students" }].map((item) => <button type="button" key={item.id} className={filter === item.id ? "is-active" : ""} onClick={() => setFilter(item.id)}>{item.label}</button>)}
      </nav>
      <div className="super-admin-kyc-review-list">
        {visible.map((user) => {
          const profile = user.studentProfile;
          const documents = profile.kycDocuments || [];
          const documentsByType = new Map(documents.map((document) => [document.documentType, document]));
          const status = statusOf(user);
          const hasRequiredDocuments = REQUIRED_STUDENT_KYC_DOCUMENTS.every((requirement) => documentsByType.has(requirement.type));
          const canReview = status === "UNDER_REVIEW";
          const latestSubmission = documents.reduce((latest, document) => !latest || new Date(document.createdAt) > new Date(latest) ? document.createdAt : latest, null);
          return <article key={user.id} className="super-admin-kyc-review-card">
            <header>
              <div className="super-admin-kyc-applicant-avatar">{String(user.name || user.email || "S").slice(0, 1).toUpperCase()}</div>
              <div><h3>{user.name || `${profile.firstName} ${profile.lastName}`}</h3><p>{user.email}{user.username ? ` · @${String(user.username).replace(/^@/, "")}` : ""}</p></div>
              <span className={`super-admin-kyc-status is-${status.toLowerCase()}`}>{status.replaceAll("_", " ")}</span>
            </header>
            <div className="super-admin-kyc-applicant-meta">
              <span><small>Student ID number</small><strong>{profile.studentIdNumber || "Not provided"}</strong></span>
              <span><small>Account status</small><strong>{user.isVerified ? "Verified" : "Not verified"}</strong></span>
              <span><small>Submitted</small><strong>{latestSubmission ? new Date(latestSubmission).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" }) : "No submission"}</strong></span>
            </div>
            <section className="super-admin-kyc-documents" aria-label={`${user.name || "Student"} documents`}>
              {REQUIRED_STUDENT_KYC_DOCUMENTS.map((requirement) => {
                const document = documentsByType.get(requirement.type);
                return <div key={requirement.type} className={document ? "is-submitted" : "is-missing"}>
                  <span><strong>{requirement.label}</strong><small>{document ? String(document.status).replaceAll("_", " ") : "Missing"}</small></span>
                  {document ? <button type="button" disabled={viewingDocumentId === document.id} onClick={() => viewKycDocument(user.id, document.id)}>{viewingDocumentId === document.id ? "Opening…" : "View document"}</button> : null}
                </div>;
              })}
            </section>
            {canReview && !hasRequiredDocuments ? <p className="super-admin-kyc-incomplete">Approval is locked until both required documents are submitted.</p> : null}
            {canReview ? <footer>
              <button type="button" className="is-reject" disabled={reviewingUserId === user.id} onClick={() => review(user, "REJECTED")}>Reject KYC</button>
              <button type="button" className="is-approve" disabled={!hasRequiredDocuments || reviewingUserId === user.id} onClick={() => review(user, "APPROVED")}>Approve KYC</button>
            </footer> : null}
          </article>;
        })}
        {!visible.length ? <div className="super-admin-kyc-empty"><strong>No KYC submissions here</strong><span>{filter === "pending" ? "New student submissions will appear in this review queue." : "No students match this filter."}</span></div> : null}
      </div>
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
  const [academicCampuses, setAcademicCampuses] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [campusForm, setCampusForm] = useState({ campusId: "", name: "", slug: "", managerId: "", managerRole: "admin", bio: "" });
  const [serviceForm, setServiceForm] = useState({ type: "hotel", name: "", slug: "", campusId: "", managerId: "", managerRole: "editor", bio: "", deliveryFee: "100" });
  const [notice, setNotice] = useState("");
  const [editingCampus, setEditingCampus] = useState(null);
  const [editingVendor, setEditingVendor] = useState(null);
  const [reviewingKitchenId, setReviewingKitchenId] = useState("");
  const [removingCampusManagerId, setRemovingCampusManagerId] = useState("");

  const users = accounts?.data || [];
  const vendorManagers = users.filter((user) => user.studentProfile?.id);
  const pendingKitchens = vendors.filter((vendor) => vendor.type === "student_kitchen" && String(vendor.approvalStatus || vendor.status).toLowerCase() === "pending");

  useEffect(() => {
    Promise.all([readCampusVendorManagement(), readAcademicCatalog()])
      .then(([management, catalog]) => {
        setCampuses(management?.campuses || []);
        setVendors(management?.vendors || []);
        setAcademicCampuses(catalog?.campuses || []);
      })
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
      campusId: type === "campus" ? form.campusId : undefined,
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
      setCampusForm({ campusId: "", name: "", slug: "", managerId: "", managerRole: "admin", bio: "" });
      setNotice(`${page.name} was created and assigned.`);
      onAction(() => Promise.resolve());
    } catch (requestError) { setNotice(requestError.message || "Campus page could not be created."); }
  }

  async function submitService(event) {
    event.preventDefault();
    const parent = campuses.find((campus) => campus.id === serviceForm.campusId);
    if (!parent) return;
    try {
      const vendor = await createCampusVendor({
        type: serviceForm.type,
        name: serviceForm.name,
        campusManagedProfileId: parent.id,
        managerUserId: serviceForm.managerId,
        description: serviceForm.bio,
        deliveryFee: Number(serviceForm.deliveryFee || 0),
      });
      setVendors((current) => [...current, vendor]);
      setServiceForm({ type: "hotel", name: "", slug: "", campusId: "", managerId: "", managerRole: "editor", bio: "", deliveryFee: "100" });
      setNotice(`${vendor.name} is now a vendor under ${parent.name}. Its manager can run inventory, orders, posts, and promotions.`);
      onAction(() => Promise.resolve());
    } catch (requestError) { setNotice(requestError.message || "The campus vendor could not be created."); }
  }

  async function assignManager(event) {
    event.preventDefault();
    const user = users.find((candidate) => candidate.id === editingCampus.managerId);
    if (!user) return;
    try {
      await addManagedProfileManager(editingCampus.id, { email: user.email, role: editingCampus.managerRole });
      const managers = [...(editingCampus.managers || []).filter((manager) => manager.user?.id !== user.id), { role: editingCampus.managerRole, user }];
      setCampuses((current) => current.map((campus) => campus.id === editingCampus.id
        ? { ...campus, managers }
        : campus));
      setEditingCampus((current) => ({ ...current, managers, managerId: "" }));
      setNotice(`${user.name || user.email} is now assigned to ${editingCampus.name}.`);
    } catch (requestError) { setNotice(requestError.message || "The manager could not be assigned."); }
  }

  async function unassignManager(campus, manager) {
    setRemovingCampusManagerId(manager.user.id);
    try {
      await removeManagedProfileManager(campus.id, manager.user.id);
      const managers = (campus.managers || []).filter((candidate) => candidate.user?.id !== manager.user.id);
      setCampuses((current) => current.map((item) => item.id === campus.id
        ? { ...item, managers }
        : item));
      setEditingCampus((current) => current?.id === campus.id ? { ...current, managers } : current);
      setNotice(`${manager.user.name || manager.user.email} was removed from ${campus.name}.`);
    } catch (requestError) {
      setNotice(requestError.message || "The manager could not be removed.");
    } finally {
      setRemovingCampusManagerId("");
    }
  }

  async function saveVendor(event) {
    event.preventDefault();
    try {
      const updatedVendor = await updateCampusVendor(editingVendor.id, {
        name: editingVendor.name,
        type: editingVendor.type,
        description: editingVendor.description || null,
        deliveryFee: Number(editingVendor.errandFee || 0),
        locationLabel: editingVendor.locationLabel || null,
        campusManagedProfileId: editingVendor.campusManagedProfileId,
      });
      setVendors((current) => current.map((vendor) => vendor.id === updatedVendor.id ? updatedVendor : vendor));
      setEditingVendor((current) => ({ ...current, ...updatedVendor, assignmentUserId: "", assignmentRole: "editor" }));
      setNotice(`${updatedVendor.name} was updated.`);
    } catch (requestError) { setNotice(requestError.message || "The vendor could not be updated."); }
  }

  async function assignVendorManager(event) {
    event.preventDefault();
    const user = vendorManagers.find((candidate) => candidate.id === editingVendor.assignmentUserId);
    if (!user) return;
    try {
      const assignment = await addCampusVendorManager(editingVendor.id, { email: user.email, role: editingVendor.assignmentRole });
      const managers = [...(editingVendor.managers || []).filter((manager) => manager.user?.id !== user.id), assignment];
      setEditingVendor((current) => ({ ...current, managers, assignmentUserId: "" }));
      setVendors((current) => current.map((vendor) => vendor.id === editingVendor.id ? { ...vendor, managers } : vendor));
      setNotice(`${user.name || user.email} is now a ${assignment.role} for ${editingVendor.name}.`);
    } catch (requestError) { setNotice(requestError.message || "The vendor assignment could not be saved."); }
  }

  async function unassignVendorManager(manager) {
    try {
      await removeCampusVendorManager(editingVendor.id, manager.user.id);
      const managers = (editingVendor.managers || []).filter((candidate) => candidate.user?.id !== manager.user.id);
      setEditingVendor((current) => ({ ...current, managers }));
      setVendors((current) => current.map((vendor) => vendor.id === editingVendor.id ? { ...vendor, managers } : vendor));
      setNotice(`${manager.user.name || manager.user.email} was removed from ${editingVendor.name}.`);
    } catch (requestError) { setNotice(requestError.message || "The vendor assignment could not be removed."); }
  }

  async function reviewKitchen(kitchen, decision) {
    setReviewingKitchenId(kitchen.id);
    try {
      const updated = await reviewStudentKitchen(kitchen.id, {
        decision,
        reason: decision === "approved" ? "Kitchen page approved by platform admin." : "Kitchen page requires changes before approval.",
      });
      setVendors((current) => current.map((vendor) => vendor.id === updated.id ? updated : vendor));
      setNotice(`${updated.name} was ${decision}.`);
      onAction(() => Promise.resolve());
    } catch (requestError) {
      setNotice(requestError.message || "The student kitchen review could not be saved.");
    } finally {
      setReviewingKitchenId("");
    }
  }

  const managerFields = (form, setter, candidates = users) => (
    <>
      <label><span>Assign manager</span><select required value={form.managerId} onChange={(event) => update(setter, "managerId", event.target.value)}><option value="">Select a user</option>{candidates.map((user) => <option key={user.id} value={user.id}>{user.name || user.email} · {user.email}</option>)}</select></label>
      <label><span>Manager role</span><select value={form.managerRole} onChange={(event) => update(setter, "managerRole", event.target.value)}><option value="admin">Admin</option><option value="editor">Editor</option></select></label>
    </>
  );

  return <Panel title="Campus Pages & Vendors" eyebrow="Campus identities and operating vendors">
    <p className="super-admin-boundary-note">Create verified campus pages here. Hotels, barber shops, and other services are linked vendors with their own inventory, orders, posts, and promotions—not child pages.</p>
    {notice ? <p className="super-admin-boundary-note">{notice}</p> : null}
    <section className="super-admin-kitchen-review">
      <header><div><span>Student-owned pages</span><h3>Student kitchen approvals</h3></div><strong>{pendingKitchens.length} pending</strong></header>
      {pendingKitchens.length ? <div className="super-admin-kitchen-review-list">{pendingKitchens.map((kitchen) => {
        const owner = kitchen.ownerDetails || kitchen.manager || {};
        const contact = kitchen.contact || {};
        const approvalBlockers = [
          !owner.kycReady ? "Approve the National ID and Student ID documents" : null,
        ].filter(Boolean);
        const canApprove = approvalBlockers.length === 0;
        return <article key={kitchen.id}>
          <header>
            <span className="super-admin-kitchen-avatar">{String(kitchen.name || "K").slice(0, 1).toUpperCase()}</span>
            <div><h4>{kitchen.name}</h4><p>{kitchen.campus?.name || kitchen.campus || "Campus"} · {kitchen.locationLabel || "Pickup location not provided"}</p></div>
            <em>Pending approval</em>
          </header>
          <p className="super-admin-kitchen-description">{kitchen.description || "No kitchen description was provided."}</p>
          <div className="super-admin-kitchen-details">
            <section><span>Student owner</span><strong>{owner.name || "Student owner"}</strong><small>{owner.username ? `@${String(owner.username).replace(/^@/, "")}` : "No username"} · Student ID: {owner.studentIdNumber || "Not provided"}</small></section>
            <section><span>Owner contact</span><strong>{owner.email ? <a href={`mailto:${owner.email}`}>{owner.email}</a> : "Email not provided"}</strong><small>{owner.phone ? <a href={`tel:${owner.phone}`}>{owner.phone}</a> : "Phone not provided"}</small></section>
            <section><span>Kitchen contact</span><strong>{contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : "Uses owner email"}</strong><small>{contact.phone ? <a href={`tel:${contact.phone}`}>{contact.phone}</a> : "Uses owner phone"}</small></section>
            <section><span>Account checks</span><strong>KYC: {owner.kycReady ? "APPROVED" : "INCOMPLETE"}</strong><small>{owner.isVerified ? "Verified Zumbarl account" : "Account not verified"} · Submitted {kitchen.submittedAt ? new Date(kitchen.submittedAt).toLocaleDateString("en-KE", { dateStyle: "medium" }) : "recently"}</small></section>
          </div>
          <section className="super-admin-kitchen-admins"><span>Page administrators & contacts</span>{(kitchen.managers || []).map((manager) => <div key={manager.user.id}><strong>{manager.user.name || manager.user.email}</strong><small>{manager.role} · <a href={`mailto:${manager.user.email}`}>{manager.user.email}</a>{manager.user.phone ? <> · <a href={`tel:${manager.user.phone}`}>{manager.user.phone}</a></> : null}</small></div>)}</section>
          {approvalBlockers.length ? <p className="super-admin-kitchen-approval-lock"><strong>Approval locked</strong><span>{approvalBlockers.join(" · ")}</span></p> : null}
          <footer className="super-admin-kitchen-review-actions"><button type="button" disabled={reviewingKitchenId === kitchen.id} onClick={() => reviewKitchen(kitchen, "rejected")}>Reject</button><button className={`is-approve${canApprove ? "" : " is-locked"}`} title={canApprove ? "Approve this kitchen" : approvalBlockers.join(". ")} type="button" disabled={!canApprove || reviewingKitchenId === kitchen.id} onClick={() => reviewKitchen(kitchen, "approved")}>Approve kitchen</button></footer>
        </article>;
      })}</div> : <p>No student kitchens are waiting for review.</p>}
    </section>
    <div className="super-admin-page-management-grid">
      <form className="super-admin-action-form" onSubmit={submitCampus}><h3>Create campus page</h3><label><span>University</span><select required value={campusForm.campusId} onChange={(event) => { const selected = academicCampuses.find((campus) => campus.id === event.target.value); setCampusForm((current) => ({ ...current, campusId: event.target.value, name: selected?.name || "", slug: slugify(selected?.name || "") })); }}><option value="">Select a university</option>{academicCampuses.filter((campus) => !campus.managedProfile).map((campus) => <option key={campus.id} value={campus.id}>{campus.name}{campus.branch ? ` · ${campus.branch}` : ""}</option>)}</select><small>The page name and university relationship come from this selection.</small></label><label><span>Slug (optional)</span><input value={campusForm.slug} onChange={(event) => update(setCampusForm, "slug", event.target.value)} placeholder="zetech-university" /></label><label><span>Description</span><textarea value={campusForm.bio} onChange={(event) => update(setCampusForm, "bio", event.target.value)} /></label>{managerFields(campusForm, setCampusForm)}<button type="submit">Create campus page</button></form>
      <form className="super-admin-action-form" onSubmit={submitService}><h3>Create campus vendor</h3><label><span>Vendor type</span><select value={serviceForm.type} onChange={(event) => update(setServiceForm, "type", event.target.value)}><option value="hotel">Hotel</option><option value="barber_shop">Barber shop</option><option value="service">Other campus service</option></select></label><label><span>Vendor name</span><input required value={serviceForm.name} onChange={(event) => update(setServiceForm, "name", event.target.value)} placeholder="e.g. Zetech Campus Hotel" /></label><label><span>Campus page</span><select required value={serviceForm.campusId} onChange={(event) => update(setServiceForm, "campusId", event.target.value)}><option value="">Select a campus page</option>{campuses.map((campus) => <option key={campus.id} value={campus.id}>{campus.name}</option>)}</select></label><label><span>Errand delivery pay (KSh)</span><input max="5000" min="0" required step="1" type="number" value={serviceForm.deliveryFee} onChange={(event) => update(setServiceForm, "deliveryFee", event.target.value)} /><small>Every errander receives this amount after a completed delivery.</small></label><label><span>Description</span><textarea value={serviceForm.bio} onChange={(event) => update(setServiceForm, "bio", event.target.value)} /></label>{managerFields(serviceForm, setServiceForm, vendorManagers)}<button type="submit">Create vendor</button></form>
    </div>
    {campuses.length ? <div className="super-admin-boundary-grid">{campuses.map((campus) => { const campusVendors = vendors.filter((vendor) => vendor.campusManagedProfileId === campus.id); return <article key={campus.id}><strong>{campus.name}</strong><span>{campusVendors.length ? `${campusVendors.length} linked vendor${campusVendors.length === 1 ? "" : "s"}` : "No vendors linked yet."}</span>{campusVendors.length ? <div className="super-admin-vendor-list">{campusVendors.map((vendor) => <div key={vendor.id}><span><b>{vendor.name}</b><small>{String(vendor.type).replaceAll("_", " ")} · {vendor._count?.listings || 0} inventory items</small></span><span className="super-admin-vendor-actions"><em>Vendor</em><button type="button" onClick={() => setEditingVendor({ ...vendor, assignmentUserId: "", assignmentRole: "editor" })}>Edit vendor</button></span></div>)}</div> : null}<button type="button" onClick={() => setEditingCampus({ ...campus, managerId: "", managerRole: "editor" })}>Edit campus assignments</button></article>; })}</div> : null}
    {editingCampus ? <div className="super-admin-assignment-editor"><header><div><span>Manager assignments</span><h3>{editingCampus.name}</h3></div><button type="button" onClick={() => setEditingCampus(null)}>Close</button></header><div className="super-admin-assignment-list">{(editingCampus.managers || []).map((manager) => <div key={manager.user.id}><span><strong>{manager.user.name || manager.user.email}</strong><small>{manager.user.email} · {manager.role}</small></span>{manager.role === "owner" ? <em>Owner</em> : <button type="button" disabled={removingCampusManagerId === manager.user.id} onClick={() => unassignManager(editingCampus, manager)}>{removingCampusManagerId === manager.user.id ? "Removing…" : "Remove"}</button>}</div>)}{!(editingCampus.managers || []).length ? <p>No managers assigned yet.</p> : null}</div><form className="super-admin-assignment-form" onSubmit={assignManager}><label><span>Add user</span><select required value={editingCampus.managerId} onChange={(event) => setEditingCampus((current) => ({ ...current, managerId: event.target.value }))}><option value="">Select a user</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name || user.email} · {user.email}</option>)}</select></label><label><span>Role</span><select value={editingCampus.managerRole} onChange={(event) => setEditingCampus((current) => ({ ...current, managerRole: event.target.value }))}><option value="admin">Admin</option><option value="editor">Editor</option></select></label><button type="submit">Assign manager</button></form></div> : null}
    {editingVendor ? <div className="super-admin-assignment-editor"><header><div><span>Vendor settings & assignments</span><h3>{editingVendor.name}</h3></div><button type="button" onClick={() => setEditingVendor(null)}>Close</button></header><form className="super-admin-assignment-form super-admin-vendor-edit-form" onSubmit={saveVendor}><label><span>Vendor name</span><input required value={editingVendor.name} onChange={(event) => setEditingVendor((current) => ({ ...current, name: event.target.value }))} /></label><label><span>Vendor type</span><select value={editingVendor.type} onChange={(event) => setEditingVendor((current) => ({ ...current, type: event.target.value }))}><option value="hotel">Hotel</option><option value="student_kitchen">Student kitchen</option><option value="barber_shop">Barber shop</option><option value="service">Other service</option></select></label><label><span>Campus</span><select value={editingVendor.campusManagedProfileId || ""} onChange={(event) => setEditingVendor((current) => ({ ...current, campusManagedProfileId: event.target.value }))}>{campuses.map((campus) => <option key={campus.id} value={campus.id}>{campus.name}</option>)}</select></label><label><span>Location</span><input value={editingVendor.locationLabel || ""} onChange={(event) => setEditingVendor((current) => ({ ...current, locationLabel: event.target.value }))} /></label><label><span>Errand delivery pay (KSh)</span><input max="5000" min="0" required step="1" type="number" value={editingVendor.errandFee ?? ""} onChange={(event) => setEditingVendor((current) => ({ ...current, errandFee: event.target.value }))} /></label><label><span>Description</span><textarea value={editingVendor.description || ""} onChange={(event) => setEditingVendor((current) => ({ ...current, description: event.target.value }))} /></label><button type="submit">Save vendor</button></form><div className="super-admin-assignment-list">{(editingVendor.managers || []).map((manager) => <div key={manager.user.id}><span><strong>{manager.user.name || manager.user.email}</strong><small>{manager.user.email} · {manager.role}</small></span>{manager.role === "owner" ? <em>Owner</em> : <button type="button" onClick={() => unassignVendorManager(manager)}>Remove</button>}</div>)}</div><form className="super-admin-assignment-form" onSubmit={assignVendorManager}><label><span>Add or change operator</span><select required value={editingVendor.assignmentUserId} onChange={(event) => setEditingVendor((current) => ({ ...current, assignmentUserId: event.target.value }))}><option value="">Select a user</option>{vendorManagers.map((user) => <option key={user.id} value={user.id}>{user.name || user.email} · {user.email}</option>)}</select></label><label><span>Vendor role</span><select value={editingVendor.assignmentRole} onChange={(event) => setEditingVendor((current) => ({ ...current, assignmentRole: event.target.value }))}><option value="admin">Admin</option><option value="editor">Editor</option></select></label><button type="submit">Save assignment</button></form></div> : null}
  </Panel>;
}

const ACADEMIC_CATALOG_SECTIONS = [
  { id: "campuses", label: "Institutions & campuses" },
  { id: "courses", label: "Courses" },
  { id: "units", label: "Units" },
];

function AcademicCatalogPanel({ catalog, onRefresh }) {
  const [section, setSection] = useState("campuses");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const records = catalog?.[section] || [];
  const visibleRecords = records.filter((record) => {
    const searchable = section === "campuses"
      ? [record.name, record.branch, record.city, record.locationLabel]
      : [record.name, record.category];
    return searchable.filter(Boolean).join(" ").toLowerCase().includes(query.trim().toLowerCase());
  });

  function editRecord(type, record) {
    setError("");
    setNotice("");
    if (type === "campuses") {
      setEditing({ type, id: record.id, name: record.name, branch: record.branch || "", city: record.city, locationLabel: record.locationLabel || "", latitude: record.latitude ?? "", longitude: record.longitude ?? "", isActive: record.isActive, reason: "" });
    } else if (type === "courses") {
      setEditing({ type, id: record.id, name: record.name, category: record.category, duration: record.duration, reason: "" });
    } else {
      setEditing({ type, id: record.id, name: record.name, reason: "" });
    }
  }

  function updateEditing(name, value) {
    setEditing((current) => ({ ...current, [name]: value }));
  }

  async function saveRecord(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSaving(true);
    try {
      if (editing.type === "campuses") {
        await updateAcademicCampus(editing.id, {
          name: editing.name,
          branch: editing.branch.trim() || null,
          city: editing.city,
          locationLabel: editing.locationLabel.trim() || null,
          latitude: editing.latitude === "" ? null : Number(editing.latitude),
          longitude: editing.longitude === "" ? null : Number(editing.longitude),
          isActive: editing.isActive,
          reason: editing.reason,
        });
      } else if (editing.type === "courses") {
        await updateAcademicCourse(editing.id, { name: editing.name, category: editing.category, duration: Number(editing.duration), reason: editing.reason });
      } else {
        await updateAcademicUnit(editing.id, { name: editing.name, reason: editing.reason });
      }
      setNotice(`${editing.name} was updated. Linked student and learning records keep the same database relationship.`);
      setEditing(null);
      await onRefresh();
    } catch (requestError) {
      setError(requestError.message || "The academic record could not be updated.");
    } finally {
      setIsSaving(false);
    }
  }

  const studentSummary = (record) => {
    const count = record._count?.students || 0;
    const names = (record.students || []).map((student) => `${student.firstName} ${student.lastName}`.trim()).join(", ");
    return names ? `${count} student${count === 1 ? "" : "s"} · ${names}${count > (record.students || []).length ? "…" : ""}` : `${count} student${count === 1 ? "" : "s"}`;
  };

  return <Panel title="Academic Data" eyebrow="Registration-created catalog records" actions={<button className="super-admin-secondary-btn" type="button" onClick={onRefresh}>Refresh catalog</button>}>
    <p className="super-admin-boundary-note">Students can add a missing institution or course during registration, and contributors can introduce units through Learn resources. Review and correct those database records here; edits retain all linked students and resources.</p>
    {notice ? <p className="super-admin-catalog-notice" role="status">{notice}</p> : null}
    {error ? <p className="super-admin-error" role="alert">{error}</p> : null}
    <section className="super-admin-metrics-grid compact">
      <MetricTile label="Institutions & campuses" value={catalog?.campuses?.length} />
      <MetricTile label="Courses" value={catalog?.courses?.length} />
      <MetricTile label="Units" value={catalog?.units?.length} />
    </section>
    <div className="super-admin-catalog-toolbar">
      <nav className="super-admin-kyc-filters" aria-label="Academic catalog sections">
        {ACADEMIC_CATALOG_SECTIONS.map((item) => <button type="button" key={item.id} className={section === item.id ? "is-active" : ""} onClick={() => { setSection(item.id); setQuery(""); setEditing(null); }}>{item.label}</button>)}
      </nav>
      <label><span className="sr-only">Search academic data</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${section === "campuses" ? "institutions or campuses" : section}`} /></label>
    </div>
    <div className="super-admin-table-wrap">
      <table className="super-admin-table super-admin-catalog-table">
        <thead><tr>{section === "campuses" ? <><th>Institution</th><th>Location</th><th>Status</th><th>Linked records</th></> : section === "courses" ? <><th>Course</th><th>Category</th><th>Duration</th><th>Linked students</th></> : <><th>Unit</th><th>Normalized key</th><th>Learning resources</th></>}<th>Action</th></tr></thead>
        <tbody>
          {visibleRecords.map((record) => <tr key={record.id}>
            {section === "campuses" ? <><td><strong>{record.name}</strong><span>{record.branch || "No branch specified"}</span></td><td>{record.city}<span>{record.locationLabel || "No precise location"}</span></td><td><strong>{record.isActive ? "Active" : "Hidden"}</strong><span>{record.managedProfile ? `Public page: ${record.managedProfile.name}` : "No linked public page"}</span></td><td><strong>{studentSummary(record)}</strong></td></> : null}
            {section === "courses" ? <><td><strong>{record.name}</strong></td><td>{record.category}</td><td>{record.duration} year{record.duration === 1 ? "" : "s"}</td><td><strong>{studentSummary(record)}</strong></td></> : null}
            {section === "units" ? <><td><strong>{record.name}</strong></td><td>{record.normalizedName}</td><td>{record._count?.resources || 0} resource{record._count?.resources === 1 ? "" : "s"}</td></> : null}
            <td><button type="button" onClick={() => editRecord(section, record)}>Edit</button></td>
          </tr>)}
          {!visibleRecords.length ? <tr><td colSpan="5">No matching academic records.</td></tr> : null}
        </tbody>
      </table>
    </div>
    {editing ? <div className="super-admin-assignment-editor super-admin-catalog-editor">
      <header><div><span>Edit {editing.type === "campuses" ? "institution or campus" : editing.type === "courses" ? "course" : "unit"}</span><h3>{editing.name}</h3></div><button type="button" onClick={() => setEditing(null)}>Close</button></header>
      <form className="super-admin-assignment-form super-admin-catalog-edit-form" onSubmit={saveRecord}>
        <label><span>Name</span><input required minLength="2" value={editing.name} onChange={(event) => updateEditing("name", event.target.value)} /></label>
        {editing.type === "campuses" ? <>
          <label><span>Branch or campus</span><input value={editing.branch} onChange={(event) => updateEditing("branch", event.target.value)} placeholder="Optional" /></label>
          <label><span>City</span><input required value={editing.city} onChange={(event) => updateEditing("city", event.target.value)} /></label>
          <label><span>Full location</span><input value={editing.locationLabel} onChange={(event) => updateEditing("locationLabel", event.target.value)} placeholder="Optional" /></label>
          <label><span>Latitude</span><input type="number" step="any" min="-90" max="90" value={editing.latitude} onChange={(event) => updateEditing("latitude", event.target.value)} /></label>
          <label><span>Longitude</span><input type="number" step="any" min="-180" max="180" value={editing.longitude} onChange={(event) => updateEditing("longitude", event.target.value)} /></label>
          <label><span>Registration visibility</span><select value={editing.isActive ? "active" : "hidden"} onChange={(event) => updateEditing("isActive", event.target.value === "active")}><option value="active">Active — students can select it</option><option value="hidden">Hidden — existing links remain</option></select></label>
        </> : null}
        {editing.type === "courses" ? <>
          <label><span>Category</span><select value={editing.category} onChange={(event) => updateEditing("category", event.target.value)}><option value="STEM">STEM</option><option value="BUSINESS">Business</option><option value="COMMERCE">Commerce</option><option value="ARTS">Arts or humanities</option><option value="OTHER">Other</option></select></label>
          <label><span>Duration</span><select value={editing.duration} onChange={(event) => updateEditing("duration", event.target.value)}>{Array.from({ length: 10 }, (_, index) => index + 1).map((years) => <option key={years} value={years}>{years} year{years === 1 ? "" : "s"}</option>)}</select></label>
        </> : null}
        <label className="is-wide"><span>Reason for change</span><textarea required minLength="3" value={editing.reason} onChange={(event) => updateEditing("reason", event.target.value)} placeholder="Recorded in the audit log" /></label>
        <button type="submit" disabled={isSaving}>{isSaving ? "Saving…" : "Save academic record"}</button>
      </form>
    </div> : null}
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
        catalog: readAcademicCatalog,
        configuration: readSuperAdminConfiguration,
        analytics: readSuperAdminAnalytics,
        audit: readSuperAdminAuditLogs,
      };
      if (moduleId === "accounts" || moduleId === "pages" || moduleId === "kyc") {
        const response = await listSuperAdminAccounts(moduleId === "kyc" ? "?pageSize=100" : "?pageSize=25");
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

        <nav className="super-admin-tabs zumbarl-segmented-tabs" aria-label="Super Admin modules">
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

        {activeModule === "kyc" ? (
          <KycReviewPanel
            accounts={accounts}
            onRefresh={() => loadModule("kyc")}
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
            <Link className="super-admin-secondary-btn" to="/admin/student-care">
              Open restricted Student Care workspace
            </Link>
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

        {activeModule === "catalog" ? (
          <AcademicCatalogPanel catalog={activePayload} onRefresh={() => loadModule("catalog")} />
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
