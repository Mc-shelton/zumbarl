import { useEffect, useMemo, useState } from "react";
import {
  FiBarChart2,
  FiCalendar,
  FiCamera,
  FiCheck,
  FiCheckCircle,
  FiEdit3,
  FiExternalLink,
  FiFileText,
  FiGlobe,
  FiMail,
  FiMapPin,
  FiPhone,
  FiPlus,
  FiShare2,
  FiTrash2,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { Link, useParams } from "react-router-dom";
import CampusSidebar from "../components/layout/CampusSidebar";
import Seo from "../components/Seo";
import { uploadZumbarlFile } from "../lib/uploadZumbarlFile";
import ExplorePostComposer from "../features/explore/components/ExplorePostComposer";
import ExploreStoryComposer from "../features/explore/components/ExploreStoryComposer";
import ManagedEntityFeed from "../features/explore/components/ManagedEntityFeed";
import { createStory } from "../features/explore/services/storyService";
import {
  createManagedProfilePost,
  listMyManagedProfiles,
  readManagedProfile,
  setManagedProfileFollow,
  updateManagedProfile,
  updateManagedProfilePost,
} from "../features/profile/services/managedProfileService";
import "../styles/campus.css";
import "../styles/explore-campus.css";
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

const MANAGED_PROFILE_ROLE_COPY = {
  owner: "Owns the page and oversees its identity, access, and direction.",
  admin: "Manages the page team, information, events, and published updates.",
  editor: "Keeps page information current and publishes community content.",
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
    coverImageUrl: record.coverImageUrl || "",
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
  const [isPostComposerOpen, setIsPostComposerOpen] = useState(false);
  const [composerInitialType, setComposerInitialType] = useState("post");
  const [isStoryComposerOpen, setIsStoryComposerOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverError, setCoverError] = useState("");
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
  const eventPosts = posts.filter(
    (post) => String(post.type || post.payload?.type || "").toLowerCase() === "event",
  );
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
  function openPageComposer(type = "post") {
    setComposerInitialType(type);
    setIsPostComposerOpen(true);
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
  async function changeCover(file) {
    if (!file) return;
    setUploadingCover(true);
    setCoverError("");
    try {
      const upload = await uploadZumbarlFile(file, {
        scope: "managed-profile",
        metadata: { managedProfileId: profile.id, purpose: "profile-cover" },
      });
      const coverImageUrl = upload.url || upload.previewUrl;
      if (!coverImageUrl) throw new Error("The uploaded cover could not be read.");
      const updated = await updateManagedProfile(profile.id, { coverImageUrl });
      setProfile((current) => ({ ...current, ...updated, coverImageUrl }));
      setDraft((current) => ({ ...current, coverImageUrl }));
    } catch (error) {
      setCoverError(error.message || "The cover image could not be updated.");
    } finally {
      setUploadingCover(false);
    }
  }
  async function publishPost(payload) {
    await createManagedProfilePost(profile.id, payload);
    await load();
    switchTab(payload.type === "event" ? "events" : "posts");
    setIsPostComposerOpen(false);
  }
  async function publishStory(story) {
    await createStory({
      title: story.title,
      text: story.caption,
      mediaUrl: story.media,
      mediaType: story.type,
      poster: story.poster,
      storyKind: story.storyKind,
      visibility: "campus",
      context: "managed-page",
      managedProfileId: profile.id,
      trimStart: story.trimStart,
      trimEnd: story.trimEnd,
    });
    setIsStoryComposerOpen(false);
  }
  async function editPost(postId, payload) {
    await updateManagedProfilePost(profile.id, postId, payload);
    await load();
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
    <section className={`managed-profile-feed managed-profile-connect-feed${activeTab === "posts" ? " is-posts-tab" : ""}`}>
      <header className="managed-profile-connect-head">
        <div><span>Explore Campus</span><h2>Posts & stories</h2><p>Updates published here use {profile.name}’s page identity and appear across Explore Campus.</p></div>
        {canManage ? <div className="managed-profile-connect-actions"><button type="button" onClick={() => setIsStoryComposerOpen(true)}>Create story</button><button type="button" onClick={() => openPageComposer("post")}><FiPlus /> Create post</button></div> : null}
      </header>
      {posts.length ? (
        <ManagedEntityFeed
          identity={{ id: profile.id, slug: profile.slug, profileType: profile.type, name: profile.name, handle: `@${profile.handle}`, avatar: profile.avatarUrl, campus: profile.campus?.name || profile.locationLabel }}
          onEditPost={canManage ? editPost : null}
          posts={posts}
        />
      ) : (
        <div className="managed-profile-empty">
          <FiFileText />
          <h3>No updates yet</h3>
          <p>{canManage ? `Share ${profile.name}’s first post or story.` : "Updates published by this page will appear here."}</p>
        </div>
      )}
    </section>
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
                  ? { backgroundImage: `linear-gradient(105deg, rgba(28, 45, 82, .34), rgba(27, 122, 117, .14)), url(${profile.coverImageUrl})` }
                  : undefined
              }
            >
              <div className="managed-profile-cover-actions">
                {canManage ? (
                  <label className="managed-profile-cover-upload">
                    <FiCamera />
                    <span>{uploadingCover ? "Uploading…" : "Change cover"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingCover}
                      onChange={(event) => {
                        changeCover(event.target.files?.[0]);
                        event.target.value = "";
                      }}
                    />
                  </label>
                ) : null}
                <button type="button" aria-label="Share page">
                  <FiShare2 />
                </button>
              </div>
              {coverError ? <p className="managed-profile-cover-error">{coverError}</p> : null}
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
                {profile.details?.tagline ? <p>{profile.details.tagline}</p> : null}
                <small>
                  {[
                    profile.locationLabel || profile.campus?.city,
                    `${followerCount.toLocaleString()} followers`,
                    `${profile._count?.posts || 0} updates`,
                  ].filter(Boolean).join(" · ")}
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
            <div className="managed-profile-tabs-wrap">
              <nav className="managed-profile-tabs zumbarl-segmented-tabs">
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
            </div>
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
                    <h2>Contact info</h2>
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
            {activeTab === "events" ? (
              <section className="managed-profile-feed managed-profile-connect-feed is-posts-tab">
                <header className="managed-profile-connect-head">
                  <div>
                    <span>Campus calendar</span>
                    <h2>Events</h2>
                    <p>Publish gatherings, talks, deadlines, and campus moments from {profile.name}.</p>
                  </div>
                  {canManage ? (
                    <div className="managed-profile-connect-actions">
                      <button type="button" onClick={() => openPageComposer("event")}>
                        <FiCalendar /> Create event
                      </button>
                    </div>
                  ) : null}
                </header>
                {eventPosts.length ? (
                  <ManagedEntityFeed
                    identity={{ id: profile.id, slug: profile.slug, profileType: profile.type, name: profile.name, handle: `@${profile.handle}`, avatar: profile.avatarUrl, campus: profile.campus?.name || profile.locationLabel }}
                    onEditPost={canManage ? editPost : null}
                    posts={eventPosts}
                  />
                ) : (
                  <div className="managed-profile-empty">
                    <FiCalendar />
                    <h3>No events yet</h3>
                    <p>{canManage ? "Create the first event for this page." : "Events published by this page will appear here."}</p>
                  </div>
                )}
              </section>
            ) : null}
            {activeTab === "people" ? (
              <section className="managed-profile-people">
                <header className="managed-profile-people-head">
                  <div>
                    <span>Page team</span>
                    <h2>People behind this page</h2>
                    <p>The team trusted to represent {profile.name} across Zumbarl.</p>
                  </div>
                  <strong>{profile.managers?.length || 0} members</strong>
                </header>
                <div className="managed-profile-people-grid">
                  {(profile.managers || []).map((manager) => (
                    <article className={`is-${manager.role}`} key={manager.user.id}>
                      <span className="managed-profile-people-avatar">
                        {manager.user.avatarUrl ? <img src={manager.user.avatarUrl} alt="" /> : manager.user.name?.slice(0, 1) || "Z"}
                      </span>
                      <div className="managed-profile-people-identity">
                        <strong>{manager.user.name}</strong>
                        <small>@{manager.user.username || "member"}</small>
                      </div>
                      <em>{manager.role}</em>
                      <p>{MANAGED_PROFILE_ROLE_COPY[manager.role] || "Helps maintain and represent this page."}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
            {!["home", "about", "posts", "events", "people"].includes(activeTab) ? (
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
                      Page tagline
                      <input
                        value={draft.tagline}
                        maxLength={160}
                        placeholder="A short identity line shown beneath the page name"
                        onChange={(event) =>
                          setDraft({ ...draft, tagline: event.target.value })
                        }
                      />
                      <small>Keep this concise. It is separate from the longer About description.</small>
                    </label>
                    <label>
                      About description
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
                    <h3>Contact info</h3>
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
      {canManage ? <ExplorePostComposer
        eyebrow="Page voice"
        identity={{ name: profile.name, avatarUrl: profile.avatarUrl }}
        initialType={composerInitialType}
        isOpen={isPostComposerOpen}
        onClose={() => setIsPostComposerOpen(false)}
        onPublish={publishPost}
        placeholder={composerInitialType === "event" ? `Tell people what to expect at this ${profile.name} event…` : `Share an update from ${profile.name} with Explore Campus…`}
        publishLabel={composerInitialType === "event" ? "Publish event" : "Publish as page"}
        title={composerInitialType === "event" ? `Create an event as ${profile.name}` : `Post as ${profile.name}`}
      /> : null}
      {canManage ? <ExploreStoryComposer
        allowProductStories={false}
        isOpen={isStoryComposerOpen}
        onClose={() => setIsStoryComposerOpen(false)}
        onPublish={publishStory}
        publishingAs={{ name: profile.name }}
      /> : null}
    </main>
  );
}
