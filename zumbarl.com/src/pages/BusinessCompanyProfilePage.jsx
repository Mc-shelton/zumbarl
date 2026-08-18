import { useEffect, useMemo, useState } from "react";
import {
  FiBriefcase,
  FiCheckCircle,
  FiEdit3,
  FiExternalLink,
  FiGlobe,
  FiMapPin,
  FiShield,
  FiTarget,
  FiUsers,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import { BusinessWorkspaceSidebar } from "../features/business/components/BusinessApplicantSidebar";
import { BusinessWorkspaceHeader } from "../features/business/components/BusinessWorkspaceHeader";
import { hydrateBusinessProfileFromBackend } from "../features/business/services/businessProfileService";
import { listBackendBusinessOpportunities } from "../features/business/services/persistBusinessOpportunity";
import "../styles/campus.css";
import "../styles/business.css";
import "../styles/business-company-profile.css";

const TABS = ["Overview", "Opportunities", "People", "Updates"];

function statusLabel(value) {
  return String(value || "pending")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function BusinessCompanyProfilePage() {
  const [profile, setProfile] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [activeTab, setActiveTab] = useState("Overview");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      hydrateBusinessProfileFromBackend(),
      listBackendBusinessOpportunities().catch(() => ({ data: [] })),
    ])
      .then(([company, response]) => {
        if (!active) return;
        setProfile(company);
        setOpportunities(
          Array.isArray(response) ? response : response?.data || [],
        );
      })
      .catch(
        (reason) =>
          active &&
          setError(
            reason.message || "The company profile could not be loaded.",
          ),
      );
    return () => {
      active = false;
    };
  }, []);

  const published = useMemo(
    () =>
      opportunities.filter(
        (item) =>
          !["draft", "draft ready"].includes(
            String(item.status || item.visibility).toLowerCase(),
          ),
      ),
    [opportunities],
  );
  const completedFields = profile
    ? [
        profile.name,
        profile.description,
        profile.industry,
        profile.website,
        profile.location,
        profile.logoUrl,
      ].filter(Boolean).length
    : 0;
  const completeness = Math.round((completedFields / 6) * 100);

  if (error)
    return (
      <main className="business-company-state">
        <h1>Unable to load company profile</h1>
        <p>{error}</p>
        <Link to="/business/settings">Open company settings</Link>
      </main>
    );
  if (!profile)
    return (
      <main className="business-company-state">Loading company profile…</main>
    );

  return (
    <main className="campus-page business-workspace-page business-company-page">
      <Seo
        title={`${profile.name} | Company Profile`}
        description={profile.description || `${profile.name} on Zumbarl`}
        path="/business/company-profile"
      />
      <div className="campus-stage">
        <div className="campus-shell business-workspace-shell">
          <BusinessWorkspaceSidebar activeItemId="company" />
          <section className="campus-main business-workspace-main business-company-main">
            <BusinessWorkspaceHeader
              title="Company Profile"
              description="Manage how students, partners and campus communities see your organization."
              primaryActionHref="/business/opportunities/create"
              primaryActionLabel="Post Opportunity"
            />

            <section className="business-company-identity">
              <div className="business-company-cover">
                <span>{profile.industry || "Organization"}</span>
              </div>
              <div className="business-company-intro">
                <div className="business-company-logo">
                  {profile.logoUrl ? (
                    <img src={profile.logoUrl} alt={`${profile.name} logo`} />
                  ) : (
                    <strong>{profile.name?.slice(0, 2).toUpperCase()}</strong>
                  )}
                </div>
                <div>
                  <small>
                    {profile.industry} ·{" "}
                    {profile.teamSize || "Team size not set"}
                  </small>
                  <h1>
                    {profile.name}
                    {profile.verificationStatus === "verified" ? (
                      <FiCheckCircle aria-label="Verified business" />
                    ) : null}
                  </h1>
                  <p>
                    {profile.description ||
                      "Add a company description to tell campus talent what your organization does."}
                  </p>
                  <footer>
                    {profile.location ? (
                      <span>
                        <FiMapPin /> {profile.location}
                      </span>
                    ) : null}
                    {profile.website ? (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <FiGlobe />{" "}
                        {profile.website.replace(/^https?:\/\//, "")}{" "}
                        <FiExternalLink />
                      </a>
                    ) : null}
                  </footer>
                </div>
                <aside>
                  <Link to="/business/settings">
                    <FiEdit3 /> Edit profile
                  </Link>
                  <Link
                    className="is-primary"
                    to="/business/opportunities/create"
                  >
                    <FiBriefcase /> Create opportunity
                  </Link>
                </aside>
              </div>
            </section>

            <section className="business-company-metrics">
              <article>
                <strong>{published.length}</strong>
                <span>Live opportunities</span>
              </article>
              <article>
                <strong>{opportunities.length}</strong>
                <span>Total briefs</span>
              </article>
              <article>
                <strong>{statusLabel(profile.verificationStatus)}</strong>
                <span>Verification</span>
              </article>
              <article>
                <strong>{completeness}%</strong>
                <span>Profile complete</span>
              </article>
            </section>

            <nav
              className="business-company-tabs"
              aria-label="Company profile sections"
            >
              {TABS.map((tab) => (
                <button
                  type="button"
                  key={tab}
                  className={activeTab === tab ? "is-active" : ""}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </nav>

            {activeTab === "Overview" ? (
              <div className="business-company-layout">
                <section>
                  <article className="business-company-card">
                    <h2>About {profile.name}</h2>
                    <p>
                      {profile.description ||
                        "Your company story has not been added yet."}
                    </p>
                  </article>
                  <article className="business-company-card">
                    <h2>
                      <FiTarget /> What we hire for
                    </h2>
                    {profile.hiringGoals?.length ? (
                      <div className="business-company-tags">
                        {profile.hiringGoals.map((goal) => (
                          <span key={goal}>{goal}</span>
                        ))}
                      </div>
                    ) : (
                      <p>
                        Add hiring goals so students understand the skills and
                        outcomes your team needs.
                      </p>
                    )}
                  </article>
                  <article className="business-company-card">
                    <h2>Campus engagement</h2>
                    <div className="business-company-pillars">
                      <div>
                        <FiBriefcase />
                        <strong>Opportunities</strong>
                        <span>
                          Publish clear paid briefs, internships and project
                          work.
                        </span>
                      </div>
                      <div>
                        <FiUsers />
                        <strong>Talent relationships</strong>
                        <span>
                          Build lasting relationships with students and campus
                          communities.
                        </span>
                      </div>
                      <div>
                        <FiTarget />
                        <strong>Partnerships</strong>
                        <span>
                          Show the kinds of collaborations your organization is
                          open to.
                        </span>
                      </div>
                    </div>
                  </article>
                </section>
                <aside>
                  <article className="business-company-card">
                    <h2>Company details</h2>
                    <dl>
                      <div>
                        <dt>Industry</dt>
                        <dd>{profile.industry || "Not provided"}</dd>
                      </div>
                      <div>
                        <dt>Company size</dt>
                        <dd>{profile.teamSize || "Not provided"}</dd>
                      </div>
                      <div>
                        <dt>Location</dt>
                        <dd>{profile.location || "Not provided"}</dd>
                      </div>
                      <div>
                        <dt>Member since</dt>
                        <dd>
                          {profile.createdAt
                            ? new Date(profile.createdAt).toLocaleDateString(
                                "en-KE",
                                { month: "long", year: "numeric" },
                              )
                            : "Not available"}
                        </dd>
                      </div>
                    </dl>
                  </article>
                  <article className="business-company-card business-company-trust">
                    <FiShield />
                    <div>
                      <h2>Trust & verification</h2>
                      <p>
                        {profile.verificationStatus === "verified"
                          ? "This company has completed Zumbarl business verification."
                          : "Complete business verification to strengthen trust with students and partners."}
                      </p>
                      <Link to="/business/kyc">
                        {profile.verificationStatus === "verified"
                          ? "View verification"
                          : "Complete verification"}
                      </Link>
                    </div>
                  </article>
                </aside>
              </div>
            ) : null}

            {activeTab === "Opportunities" ? (
              <section className="business-company-list">
                <header>
                  <div>
                    <h2>Opportunities</h2>
                    <p>
                      Work, projects and pathways published by {profile.name}.
                    </p>
                  </div>
                  <Link to="/business/opportunities/create">
                    Create opportunity
                  </Link>
                </header>
                {opportunities.length ? (
                  opportunities.map((item) => (
                    <article key={item.id}>
                      <div>
                        <small>
                          {statusLabel(item.status || item.visibility)}
                        </small>
                        <h3>
                          {item.title || item.name || "Untitled opportunity"}
                        </h3>
                        <p>
                          {item.summary ||
                            item.description ||
                            "Open the opportunity workspace for full details."}
                        </p>
                      </div>
                      <Link to="/business/opportunities">Manage</Link>
                    </article>
                  ))
                ) : (
                  <div className="business-company-empty">
                    <FiBriefcase />
                    <h3>No opportunities yet</h3>
                    <p>
                      Create your first brief to start meeting campus talent.
                    </p>
                  </div>
                )}
              </section>
            ) : null}
            {activeTab === "People" ? (
              <section className="business-company-list">
                <header>
                  <div>
                    <h2>People and page access</h2>
                    <p>
                      Company pages belong to the organization and can be
                      managed by authorized users.
                    </p>
                  </div>
                  <Link to="/business/settings">Manage access</Link>
                </header>
                <div className="business-company-empty">
                  <FiUsers />
                  <h3>Build your company team</h3>
                  <p>
                    Invite colleagues to help manage the profile, opportunities,
                    messages and partnerships.
                  </p>
                </div>
              </section>
            ) : null}
            {activeTab === "Updates" ? (
              <section className="business-company-list">
                <header>
                  <div>
                    <h2>Company updates</h2>
                    <p>
                      News, milestones and campus-facing announcements from your
                      organization.
                    </p>
                  </div>
                </header>
                <div className="business-company-empty">
                  <FiTarget />
                  <h3>No updates published</h3>
                  <p>
                    Publishing tools will appear here as your company starts
                    engaging its campus audience.
                  </p>
                </div>
              </section>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
