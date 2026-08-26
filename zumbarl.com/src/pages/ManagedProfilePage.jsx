import { useEffect, useMemo, useState } from "react";
import {
  FiBarChart2,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiEdit3,
  FiExternalLink,
  FiFileText,
  FiGlobe,
  FiMail,
  FiMapPin,
  FiMessageCircle,
  FiPhone,
  FiPlus,
  FiShare2,
  FiThumbsUp,
  FiTrash2,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { Link, useParams } from "react-router-dom";
import CampusSidebar from "../components/layout/CampusSidebar";
import Seo from "../components/Seo";
import {
  createManagedProfilePost,
  listMyManagedProfiles,
  readManagedProfile,
  setManagedProfileFollow,
  updateManagedProfile,
} from "../features/profile/services/managedProfileService";
import "../styles/campus.css";
import "../styles/managed-profile.css";
import "../styles/managed-profile-about.css";
import "../styles/managed-profile-social.css";

const TYPE_META = {
  campus: {
    label: "University",
    primary: "Visit campus hub",
    tabs: ["home", "about", "posts", "events", "people"],
  },
  club: {
    label: "Student club",
    primary: "Join club",
    tabs: ["home", "about", "posts", "events", "people"],
  },
  association: {
    label: "Student association",
    primary: "Join association",
    tabs: ["home", "about", "posts", "initiatives", "people"],
  },
  business: {
    label: "Business",
    primary: "View opportunities",
    tabs: ["home", "about", "posts", "opportunities", "people"],
  },
};
const LABELS = {
  studentLife: "Student life",
  services: "Student services",
  facilities: "Facilities",
  importantContacts: "Important contacts",
  purpose: "Purpose",
  eligibility: "Who can join",
  patron: "Patron",
  meetingSchedule: "Meetings",
  membership: "Membership",
  focusAreas: "Focus areas",
  governance: "Leadership",
  requirements: "How to join",
  mandate: "Mandate",
  constituency: "Who we represent",
  welfareAreas: "Welfare & advocacy",
  leadership: "Leadership",
  electionCycle: "Elections",
  accountability: "Governance & accountability",
  sector: "Industry",
  size: "Organization size",
  studentEngagement: "For students",
  partnershipTypes: "Campus partnerships",
};
function Value({ value }) {
  if (Array.isArray(value))
    return (
      <ul>
        {value.map((item) => (
          <li key={typeof item === "string" ? item : JSON.stringify(item)}>
            {typeof item === "string" ? item : `${item.label}: ${item.value}`}
          </li>
        ))}
      </ul>
    );
  if (value && typeof value === "object")
    return (
      <p>
        <strong>{value.memberCount || value.status || "Open"}</strong>
        {value.memberCount ? " members" : ""}
      </p>
    );
  return <p>{String(value || "Not provided")}</p>;
}

function serializeDetailValue(value) {
  if (Array.isArray(value))
    return value
      .map((item) =>
        item && typeof item === "object"
          ? `${item.label ?? ""}: ${item.value ?? ""}`
          : String(item),
      )
      .join("\n");
  if (value && typeof value === "object")
    return Object.entries(value)
      .map(([key, item]) => `${key}: ${String(item)}`)
      .join("\n");
  return value === null || value === undefined ? "" : String(value);
}

function parseDetailValue(text, original) {
  const lines = String(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const splitLine = (line) => {
    const separator = line.indexOf(":");
    return separator === -1
      ? [line, ""]
      : [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
  };
  if (Array.isArray(original)) {
    const objectItems =
      original.length > 0 &&
      original.every(
        (item) => item && typeof item === "object" && !Array.isArray(item),
      );
    if (objectItems)
      return lines.map((line) => {
        const [label, value] = splitLine(line);
        return { label, value };
      });
    return lines;
  }
  if (original && typeof original === "object") {
    const parsed = {};
    for (const line of lines) {
      const [key, value] = splitLine(line);
      const number = Number(value);
      parsed[key] = value !== "" && !Number.isNaN(number) ? number : value;
    }
    return parsed;
  }
  return String(text).trim();
}

function buildDraft(record) {
  const details =
    record.details &&
    typeof record.details === "object" &&
    !Array.isArray(record.details)
      ? record.details
      : {};
  return {
    name: record.name || "",
    tagline: typeof details.tagline === "string" ? details.tagline : "",
    bio: record.bio || "",
    websiteUrl: record.websiteUrl || "",
    email: record.email || "",
    phone: record.phone || "",
    locationLabel: record.locationLabel || "",
    detailsEntries: Object.entries(details)
      .filter(([key]) => key !== "tagline")
      .map(([key, value]) => ({
        id: `${key}-${Math.random().toString(36).slice(2, 8)}`,
        key,
        text: serializeDetailValue(value),
        original: value,
      })),
  };
}

export default function ManagedProfilePage() {
  const { profileSlug } = useParams();
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [canManage, setCanManage] = useState(false);
  const [activeTab, setActiveTab] = useState(
    () => window.location.hash.replace("#", "") || "home",
  );
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [postBody, setPostBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editorError, setEditorError] = useState("");
  const load = () => {
    setLoadError("");
    return Promise.all([
      readManagedProfile(profileSlug),
      listMyManagedProfiles().catch(() => ({ data: [] })),
    ])
      .then(([record, mine]) => {
        setProfile(record);
        setDraft(buildDraft(record));
        setCanManage((mine.data || []).some((item) => item.id === record.id));
      })
      .catch((error) => {
        setLoadError(error.message || "The organization could not be loaded.");
      });
  };
  useEffect(() => {
    let active = true;
    Promise.all([
      readManagedProfile(profileSlug),
      listMyManagedProfiles().catch(() => ({ data: [] })),
    ])
      .then(([record, mine]) => {
        if (!active) return;
        setProfile(record);
        setDraft(buildDraft(record));
        setCanManage((mine.data || []).some((item) => item.id === record.id));
      })
      .catch((error) => {
        if (active)
          setLoadError(
            error.message || "The organization could not be loaded.",
          );
      });
    return () => {
      active = false;
    };
  }, [profileSlug]);
  const meta = TYPE_META[profile?.type] || TYPE_META.club;
  const sections = useMemo(
    () =>
      Object.entries(profile?.details || {}).filter(
        ([key]) => key !== "tagline",
      ),
    [profile],
  );
  if (loadError)
    return (
      <main className="managed-profile-loading">
        <h1>We couldn’t load this organization</h1>
        <p>{loadError}</p>
        <button onClick={load}>Try again</button>
      </main>
    );
  if (!profile)
    return (
      <main className="managed-profile-loading">Loading organization…</main>
    );
  const posts = profile.posts || [];
  const followerCount = profile._count?.followers || 0;
  const attachedServices = profile.attachedServices || [];
  const foundedYear = profile.foundedAt
    ? new Date(profile.foundedAt).getFullYear()
    : null;
  const contactRows = [
    profile.websiteUrl && {
      label: "Website",
      value: profile.websiteUrl.replace(/^https?:\/\//, ""),
      icon: <FiGlobe />,
      href: profile.websiteUrl,
      external: true,
    },
    profile.email && {
      label: "Email",
      value: profile.email,
      icon: <FiMail />,
      href: `mailto:${profile.email}`,
    },
    profile.phone && {
      label: "Phone",
      value: profile.phone,
      icon: <FiPhone />,
      href: `tel:${profile.phone.replace(/\s+/g, "")}`,
    },
    (profile.locationLabel || profile.campus?.city) && {
      label: "Location",
      value: profile.locationLabel || profile.campus?.city,
      icon: <FiMapPin />,
    },
    foundedYear && {
      label: "Founded",
      value: String(foundedYear),
      icon: <FiCalendar />,
    },
  ].filter(Boolean);
  const primaryHref =
    profile.type === "campus"
      ? `/campus/explore?campus=${encodeURIComponent(profile.campus?.name || profile.name)}`
      : profile.type === "business"
        ? `/campus/opportunities?organization=${encodeURIComponent(profile.slug)}`
        : null;
  function switchTab(tab) {
    setActiveTab(tab);
    window.history.replaceState(null, "", `#${tab}`);
  }
  async function follow() {
    const result = await setManagedProfileFollow(
      profile.id,
      !profile.isFollowing,
    );
    setProfile({
      ...profile,
      isFollowing: result.isFollowing,
      _count: { ...profile._count, followers: result.followerCount },
    });
  }
  async function publish(event) {
    event.preventDefault();
    if (!postBody.trim()) return;
    setSaving(true);
    try {
      await createManagedProfilePost(profile.id, {
        body: postBody,
        type: "post",
        visibility: "public",
      });
      setPostBody("");
      await load();
      setActiveTab("posts");
    } finally {
      setSaving(false);
    }
  }
  function updateDetailEntry(id, patch) {
    setDraft((current) => ({
      ...current,
      detailsEntries: current.detailsEntries.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry,
      ),
    }));
  }
  function addDetailEntry() {
    setDraft((current) => ({
      ...current,
      detailsEntries: [
        ...current.detailsEntries,
        {
          id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          key: "",
          text: "",
          original: null,
        },
      ],
    }));
  }
  function removeDetailEntry(id) {
    setDraft((current) => ({
      ...current,
      detailsEntries: current.detailsEntries.filter(
        (entry) => entry.id !== id,
      ),
    }));
  }
  function buildProfilePayload() {
    const details = {};
    if (draft.tagline.trim()) details.tagline = draft.tagline.trim();
    for (const entry of draft.detailsEntries) {
      const key = entry.key.trim();
      if (!key) continue;
      details[key] = parseDetailValue(entry.text, entry.original);
    }
    return {
      name: draft.name.trim(),
      bio: draft.bio.trim() || null,
      websiteUrl: draft.websiteUrl.trim() || null,
      email: draft.email.trim() || null,
      phone: draft.phone.trim() || null,
      locationLabel: draft.locationLabel.trim() || null,
      details,
    };
  }
  async function save(event) {
    event.preventDefault();
    setSavingProfile(true);
    setEditorError("");
    try {
      await updateManagedProfile(profile.id, buildProfilePayload());
      await load();
      setEditing(false);
    } catch (error) {
      setEditorError(error.message || "The changes could not be saved.");
    } finally {
      setSavingProfile(false);
    }
  }
  const activity = (
    <div className="managed-profile-feed">
      {canManage ? (
        <form className="managed-profile-composer" onSubmit={publish}>
          <img
            width="46"
            height="46"
            src={profile.avatarUrl || "/assets/index/bee_nobg.png"}
            alt=""
          />
          <textarea
            value={postBody}
            onChange={(event) => setPostBody(event.target.value)}
            placeholder={`Post an update as ${profile.name}`}
          />
          <footer>
            <span>
              <FiFileText /> Share news, events or opportunities
            </span>
            <button disabled={saving || !postBody.trim()}>
              {saving ? "Posting…" : "Post"}
            </button>
          </footer>
        </form>
      ) : null}
      {posts.length ? (
        posts.map((post) => (
          <article className="managed-profile-post" key={post.id}>
            {post.payload?.isPinnedAnnouncement ||
            post.payload?.announcementRequest?.status === "approved" ? (
              <b className="managed-profile-featured">
                <FiCheckCircle /> Featured announcement
              </b>
            ) : null}
            <header>
              <img
                width="46"
                height="46"
                src={profile.avatarUrl || "/assets/index/bee_nobg.png"}
                alt=""
              />
              <div>
                <strong>{profile.name}</strong>
                <span>
                  @{profile.handle} ·{" "}
                  {new Date(post.createdAt).toLocaleDateString("en-KE")}
                </span>
              </div>
            </header>
            <p>{post.body}</p>
            <footer>
              <button>
                <FiThumbsUp /> Like
              </button>
              <button>
                <FiMessageCircle /> Comment
              </button>
              <button>
                <FiShare2 /> Share
              </button>
            </footer>
          </article>
        ))
      ) : (
        <div className="managed-profile-empty">
          <FiFileText />
          <h3>No updates yet</h3>
          <p>Updates published by this page will appear here.</p>
        </div>
      )}
    </div>
  );
  return (
    <main className="campus-page managed-profile-page">
      <Seo
        title={`${profile.name} | Zumbarl`}
        description={profile.bio || meta.label}
        path={`/campus/organizations/${profile.slug}`}
      />
      <div className="campus-stage">
        <div className="campus-shell managed-profile-shell">
          <CampusSidebar />
          <section className="managed-profile-main">
            <div
              className="managed-profile-cover"
              style={
                profile.coverImageUrl
                  ? { backgroundImage: `url(${profile.coverImageUrl})` }
                  : undefined
              }
            >
              <button aria-label="Share page">
                <FiShare2 />
              </button>
            </div>
            <header className="managed-profile-hero">
              <img
                className="managed-profile-avatar"
                width="120"
                height="120"
                src={profile.avatarUrl || "/assets/index/bee_nobg.png"}
                alt=""
              />
              <div className="managed-profile-copy">
                <span>{meta.label}</span>
                <h1>
                  {profile.name}
                  {profile.isVerified ? (
                    <FiCheckCircle aria-label="Verified" />
                  ) : null}
                </h1>
                <p>{profile.details?.tagline || profile.bio}</p>
                <small>
                  {profile.locationLabel || profile.campus?.city} ·{" "}
                  {followerCount.toLocaleString()} followers ·{" "}
                  {profile._count?.posts || 0} updates
                </small>
              </div>
              <aside>
                <button
                  className={
                    profile.isFollowing ? "is-following" : "is-primary"
                  }
                  onClick={follow}
                >
                  {profile.isFollowing ? (
                    <>
                      <FiCheck /> Following
                    </>
                  ) : (
                    <>
                      <FiPlus /> Follow
                    </>
                  )}
                </button>
                {primaryHref ? (
                  <Link className="is-primary" to={primaryHref}>
                    {meta.primary}
                  </Link>
                ) : (
                  <button className="is-primary" onClick={follow}>
                    {profile.isFollowing ? "Joined" : meta.primary}
                  </button>
                )}
                {profile.websiteUrl ? (
                  <a href={profile.websiteUrl} target="_blank" rel="noreferrer">
                    <FiGlobe /> Website <FiExternalLink />
                  </a>
                ) : null}
                {canManage ? (
                  <button onClick={() => setEditing(true)}>
                    <FiEdit3 /> Admin view
                  </button>
                ) : null}
              </aside>
            </header>
            <nav className="managed-profile-tabs">
              {meta.tabs.map((tab) => (
                <button
                  key={tab}
                  className={activeTab === tab ? "is-active" : ""}
                  onClick={() => switchTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </nav>
            {activeTab === "home" ? (
              <div className="managed-profile-layout">
                <section>
                  <article className="managed-profile-about-card">
                    <header>
                      <h2>About</h2>
                      <button onClick={() => switchTab("about")}>
                        See all details
                      </button>
                    </header>
                    <p>{profile.bio}</p>
                    <div>
                      {profile.websiteUrl ? (
                        <a href={profile.websiteUrl}>
                          <FiGlobe />
                          {profile.websiteUrl.replace(/^https?:\/\//, "")}
                        </a>
                      ) : null}
                      {profile.locationLabel ? (
                        <span>
                          <FiMapPin />
                          {profile.locationLabel}
                        </span>
                      ) : null}
                      {profile.email ? (
                        <a href={`mailto:${profile.email}`}>
                          <FiMail />
                          {profile.email}
                        </a>
                      ) : null}
                    </div>
                  </article>
                  <h2 className="managed-profile-section-title">
                    Featured updates
                  </h2>
                  {activity}
                </section>
                <aside className="managed-profile-rail">
                  <article>
                    <h3>Page highlights</h3>
                    <p>
                      <FiUsers />
                      <span>
                        <strong>{followerCount}</strong> followers
                      </span>
                    </p>
                    <p>
                      <FiBarChart2 />
                      <span>
                        <strong>{profile._count?.posts || 0}</strong> published
                        updates
                      </span>
                    </p>
                    <p>
                      <FiCheckCircle />
                      <span>
                        <strong>
                          {profile.isVerified ? "Verified" : "Unverified"}
                        </strong>{" "}
                        organization
                      </span>
                    </p>
                  </article>
                  <article>
                    <h3>People behind this page</h3>
                    {(profile.managers || []).slice(0, 4).map((manager) => (
                      <div
                        className="managed-profile-person"
                        key={manager.user.id}
                      >
                        <span>{manager.user.name?.slice(0, 1) || "Z"}</span>
                        <div>
                          <strong>{manager.user.name}</strong>
                          <small>{manager.role}</small>
                        </div>
                      </div>
                    ))}
                  </article>
                </aside>
              </div>
            ) : null}
            {activeTab === "about" ? (
              <div className="managed-profile-about-layout">
                <section className="managed-profile-about-overview">
                  <header><span>Campus overview</span><h2>Everything happening around {profile.name}</h2><p>{profile.bio || "Your campus hub for services, facilities, student life, and official updates."}</p></header>
                  <div className="managed-profile-about-facts">
                    <article><FiMapPin /><span><small>Location</small><strong>{profile.locationLabel || profile.campus?.city || "Campus"}</strong></span></article>
                    <article><FiUsers /><span><small>Followers</small><strong>{followerCount.toLocaleString()}</strong></span></article>
                    <article><FiCheckCircle /><span><small>Trust status</small><strong>{profile.isVerified ? "Verified campus" : "Campus page"}</strong></span></article>
                  </div>
                </section>
                <section className="managed-profile-about-bio">
                  <header className="managed-profile-about-head">
                    <div>
                      <span>About</span>
                      <h2>Who we are</h2>
                    </div>
                    {canManage ? (
                      <button
                        className="managed-profile-about-edit"
                        onClick={() => setEditing(true)}
                      >
                        <FiEdit3 /> Edit
                      </button>
                    ) : null}
                  </header>
                  {profile.details?.tagline ? (
                    <em className="managed-profile-about-tagline">
                      “{profile.details.tagline}”
                    </em>
                  ) : null}
                  <p>{profile.bio || "This page has not added a bio yet."}</p>
                </section>
                <section className="managed-profile-about-contact">
                  <header className="managed-profile-about-head">
                    <div>
                      <span>Contact info</span>
                      <h2>Contact & links</h2>
                    </div>
                    {canManage ? (
                      <button
                        className="managed-profile-about-edit"
                        onClick={() => setEditing(true)}
                      >
                        <FiEdit3 /> Edit
                      </button>
                    ) : null}
                  </header>
                  {contactRows.length ? (
                    <div className="managed-profile-contact-list">
                      {contactRows.map((row) =>
                        row.href ? (
                          <a
                            key={row.label}
                            href={row.href}
                            {...(row.external
                              ? { target: "_blank", rel: "noreferrer" }
                              : {})}
                          >
                            {row.icon}
                            <span>
                              <small>{row.label}</small>
                              <strong>{row.value}</strong>
                            </span>
                          </a>
                        ) : (
                          <span key={row.label}>
                            {row.icon}
                            <span>
                              <small>{row.label}</small>
                              <strong>{row.value}</strong>
                            </span>
                          </span>
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="managed-profile-about-empty">
                      {canManage
                        ? "Add a website, email, phone number or location so people can reach this page."
                        : "No contact information has been added yet."}
                    </p>
                  )}
                </section>
                {attachedServices.length ? (
                  <section className="managed-profile-services">
                    <header>
                      <div>
                        <span>On campus</span>
                        <h2>Campus vendors</h2>
                      </div>
                      <small>{attachedServices.length} available</small>
                    </header>
                    <div>
                      {attachedServices.map((service) => {
                        const type =
                          service.type === "barber_shop"
                            ? "Barber shop"
                            : service.type === "hotel"
                              ? "Hotel"
                              : "Campus service";
                        return (
                          <Link
                            className="managed-profile-service-card"
                            to={`/campus/opportunities/buy-sell?shop=${encodeURIComponent(service.slug || service.id)}`}
                            key={service.id}
                          >
                            <img
                              src={service.avatarUrl || "/assets/index/bee_nobg.png"}
                              alt=""
                            />
                            <span>
                              <small>{type} vendor</small>
                              <strong>{service.name}</strong>
                              <em>
                                {service.bio ||
                                  service.locationLabel ||
                                  "View vendor inventory"}
                              </em>
                              <b>
                                {service._count?.listings || 0} inventory items ·{" "}
                                Orders enabled{" "}
                                <FiExternalLink />
                              </b>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                ) : canManage ? (
                  <section className="managed-profile-services is-empty">
                    <header>
                      <div>
                        <span>On campus</span>
                        <h2>Campus vendors</h2>
                      </div>
                    </header>
                    <p>
                      Campus vendors created by Zumbarl administrators for
                      this university — such as hotels and barber shops — will
                      be listed here once active.
                    </p>
                  </section>
                ) : null}
                <section className="managed-profile-about-more">
                  <header className="managed-profile-about-head">
                    <div>
                      <span>Page details</span>
                      <h2>More about {profile.name}</h2>
                    </div>
                    {canManage ? (
                      <button
                        className="managed-profile-about-edit"
                        onClick={() => setEditing(true)}
                      >
                        <FiEdit3 /> Edit details
                      </button>
                    ) : null}
                  </header>
                  {sections.length ? (
                    <div className="managed-profile-grid managed-profile-about-details">
                      {sections.map(([key, value]) => (
                        <article key={key}>
                          <h2>
                            {LABELS[key] || key.replace(/([A-Z])/g, " $1")}
                          </h2>
                          <Value value={value} />
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="managed-profile-about-empty">
                      {canManage
                        ? "Add sections like “Student life”, “Facilities” or “Important contacts” from the editor."
                        : "This page has not published any extra details yet."}
                    </p>
                  )}
                </section>
              </div>
            ) : null}
            {activeTab === "posts" ? activity : null}
            {activeTab === "people" ? (
              <section className="managed-profile-people">
                <h2>People who manage and represent this page</h2>
                {(profile.managers || []).map((manager) => (
                  <article key={manager.user.id}>
                    <span>{manager.user.name?.slice(0, 1) || "Z"}</span>
                    <div>
                      <strong>{manager.user.name}</strong>
                      <p>
                        @{manager.user.username || "member"} · {manager.role}
                      </p>
                    </div>
                  </article>
                ))}
              </section>
            ) : null}
            {!["home", "about", "posts", "people"].includes(activeTab) ? (
              <section className="managed-profile-empty">
                <h2>{activeTab[0].toUpperCase() + activeTab.slice(1)}</h2>
                <p>This page has not published any {activeTab} yet.</p>
              </section>
            ) : null}
            {editing ? (
              <div
                className="managed-profile-editor"
                onClick={(event) => {
                  if (event.target === event.currentTarget)
                    setEditing(false);
                }}
              >
                <form onSubmit={save}>
                  <header>
                    <div>
                      <span>Admin tools</span>
                      <h2>Edit page info</h2>
                      <p>
                        Update how {profile.name} appears to everyone on
                        Zumbarl.
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Close editor"
                      onClick={() => setEditing(false)}
                    >
                      <FiX />
                    </button>
                  </header>
                  <section>
                    <h3>Basics</h3>
                    <label>
                      Page name
                      <input
                        value={draft.name}
                        required
                        onChange={(event) =>
                          setDraft({ ...draft, name: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      Tagline
                      <input
                        value={draft.tagline}
                        placeholder="A short line shown under the page name"
                        onChange={(event) =>
                          setDraft({ ...draft, tagline: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      Bio
                      <textarea
                        rows={4}
                        maxLength={1000}
                        value={draft.bio}
                        placeholder="Tell people what this page is about"
                        onChange={(event) =>
                          setDraft({ ...draft, bio: event.target.value })
                        }
                      />
                    </label>
                  </section>
                  <section>
                    <h3>Contact & links</h3>
                    <label>
                      Website
                      <input
                        type="url"
                        value={draft.websiteUrl}
                        placeholder="https://…"
                        onChange={(event) =>
                          setDraft({ ...draft, websiteUrl: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      Contact email
                      <input
                        type="email"
                        value={draft.email}
                        placeholder="info@example.ac.ke"
                        onChange={(event) =>
                          setDraft({ ...draft, email: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      Phone
                      <input
                        value={draft.phone}
                        placeholder="+254 …"
                        onChange={(event) =>
                          setDraft({ ...draft, phone: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      Location
                      <input
                        value={draft.locationLabel}
                        placeholder="e.g. Rongai, Nairobi"
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            locationLabel: event.target.value,
                          })
                        }
                      />
                    </label>
                  </section>
                  <section>
                    <header>
                      <h3>Page details</h3>
                      <button type="button" onClick={addDetailEntry}>
                        <FiPlus /> Add section
                      </button>
                    </header>
                    {draft.detailsEntries.length ? (
                      draft.detailsEntries.map((entry) => (
                        <div
                          className="managed-profile-detail-row"
                          key={entry.id}
                        >
                          <div>
                            <input
                              value={entry.key}
                              placeholder="Section title (e.g. Student life)"
                              onChange={(event) =>
                                updateDetailEntry(entry.id, {
                                  key: event.target.value,
                                })
                              }
                            />
                            <button
                              type="button"
                              aria-label="Remove section"
                              onClick={() => removeDetailEntry(entry.id)}
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={entry.text}
                            placeholder={
                              "One item per line — lists become bullet points.\nUse “Label: value” lines for contact entries."
                            }
                            onChange={(event) =>
                              updateDetailEntry(entry.id, {
                                text: event.target.value,
                              })
                            }
                          />
                        </div>
                      ))
                    ) : (
                      <p>
                        No detail sections yet. Add ones like “Student life”,
                        “Facilities” or “Important contacts”.
                      </p>
                    )}
                  </section>
                  {editorError ? (
                    <p className="managed-profile-editor-error">
                      {editorError}
                    </p>
                  ) : null}
                  <footer>
                    <button type="button" onClick={() => setEditing(false)}>
                      Cancel
                    </button>
                    <button className="is-primary" disabled={savingProfile}>
                      {savingProfile ? "Saving…" : "Save changes"}
                    </button>
                  </footer>
                </form>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
