import { useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiBarChart2,
  FiCheckCircle,
  FiCopy,
  FiDownload,
  FiExternalLink,
  FiFileText,
  FiImage,
  FiLink,
  FiLock,
  FiMousePointer,
  FiRepeat,
  FiSend,
  FiUploadCloud,
} from "react-icons/fi";
import { Link, Navigate, useParams } from "react-router-dom";
import CampusSidebar from "../components/layout/CampusSidebar";
import Seo from "../components/Seo";
import {
  acceptBusinessMarketingCampaign,
  getBusinessMarketingCampaignFromBackend,
  submitBusinessMarketingCampaignProof,
} from "../features/business/services/businessMarketingService";
import { normalizeZumbarlFileUrl } from "../lib/normalizeZumbarlFileUrl";
import { uploadZumbarlFile } from "../lib/uploadZumbarlFile";
import "../styles/campus.css";
import "../styles/opportunities.css";

const MARKETING_MATERIAL_PREVIEWS = {
  "level-up-skills":
    "/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp",
  "summer-collection-launch":
    "/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp",
  "stay-hydrated":
    "/assets/index/business_page_images/optimized/bruno-ngarukiye-IzEcrYJ1G34-unsplash.webp",
};

const PICKUP_ERRORS = {
  campaign_not_open: "This campaign is not open for pickup.",
  campaign_closed: "This campaign has already closed.",
  creator_metrics_below_threshold:
    "Your verified creator metrics do not meet this campaign's requirements.",
  campaign_creator_limit_reached:
    "All creator slots were claimed before this request completed.",
  campaign_budget_limit_reached:
    "The remaining campaign budget has already been claimed.",
};

const PLATFORM_POST_HINTS = {
  Instagram: "https://instagram.com/p/…",
  TikTok: "https://tiktok.com/@creator/video/…",
  YouTube: "https://youtube.com/watch?v=…",
  Facebook: "https://facebook.com/…",
  X: "https://x.com/creator/status/…",
  LinkedIn: "https://linkedin.com/posts/…",
};

const PLATFORM_ABBREVIATIONS = {
  Instagram: "IG",
  TikTok: "TT",
  YouTube: "YT",
  Facebook: "FB",
  LinkedIn: "IN",
  X: "X",
};

function getMarketingMaterialPreview(campaign) {
  const primaryMaterial = campaign.materials?.[0];
  return normalizeZumbarlFileUrl(
    (primaryMaterial?.type === "image"
      ? primaryMaterial.previewUrl || primaryMaterial.url
      : "") ||
      campaign.previewImage,
    primaryMaterial,
  ) ||
    MARKETING_MATERIAL_PREVIEWS[campaign.id] ||
    "/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp";
}

function formatCampaignDate(value) {
  if (!value) return "Open";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StudentMarketingCampaignPage() {
  const { campaignId } = useParams();
  const [backendCampaign, setBackendCampaign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [proofSubmitted, setProofSubmitted] = useState(false);
  const [proofNotes, setProofNotes] = useState("");
  const [proofEntries, setProofEntries] = useState([]);
  const [uploadingPlatform, setUploadingPlatform] = useState("");
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [proofResult, setProofResult] = useState(null);
  const [copiedValue, setCopiedValue] = useState("");
  const campaign = backendCampaign;

  useEffect(() => {
    let isActive = true;

    const refreshCampaign = () => getBusinessMarketingCampaignFromBackend(campaignId)
      .then((result) => {
        if (isActive && result) {
          setBackendCampaign(result);
          setAccepted(
            result.acceptances?.some((item) => item.status === "accepted") ||
              false,
          );
          setProofSubmitted(Boolean(result.proofs?.length));
          setProofEntries((currentEntries) => {
            const existingEntries = new Map(
              currentEntries.map((entry) => [entry.platform.toLowerCase(), entry]),
            );
            return (result.platforms?.length ? result.platforms : ["Instagram"]).map(
              (platform) => existingEntries.get(platform.toLowerCase()) || {
                platform,
                postUrl: "",
                analyticsScreenshot: null,
              },
            );
          });
          setProofResult(result.proofs?.[0] || null);
        }
      })
      .catch((reason) => {
        if (isActive)
          setError(reason.message || "Campaign could not be loaded.");
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    refreshCampaign();
    const refreshInterval = window.setInterval(refreshCampaign, 15000);

    return () => {
      isActive = false;
      window.clearInterval(refreshInterval);
    };
  }, [campaignId]);

  if (isLoading)
    return <main className="business-company-state">Loading campaign…</main>;
  if (!campaign) return <Navigate to="/campus/opportunities" replace />;

  const primaryMaterial = campaign.materials?.find((material) => material.url);
  const acceptance = campaign.acceptances?.find((item) => item.status === "accepted");
  const trackingUrl = acceptance?.trackingUrl
    ? new URL(acceptance.trackingUrl, window.location.origin).toString()
    : "";

  const eligibility = campaign.eligibility || {
    eligible:
      Number(campaign.minimumFollowers || 0) === 0 &&
      Number(campaign.minimumLikes || 0) === 0 &&
      Number(campaign.minimumEngagement || 0) === 0,
    requirements: {
      followers: Number(campaign.minimumFollowers || 0),
      likes: Number(campaign.minimumLikes || 0),
      engagement: Number(campaign.minimumEngagement || 0),
    },
  };
  const isEligible = Boolean(eligibility.eligible);
  const remainingBudget = Math.max(
    0,
    Number(campaign.budgetAmount || 0) - Number(campaign.acceptedBudget || 0),
  );
  const remainingSlots = Math.max(
    0,
    campaign.creatorsLimit == null
      ? Math.floor(
          remainingBudget / Math.max(1, Number(campaign.payoutPerCampaigner || 0)),
        )
      : Number(campaign.creatorsLimit) -
          Number(campaign.acceptedCreatorsCount || 0),
  );
  const criteria = [
    eligibility.requirements?.followers
      ? `${Number(eligibility.requirements.followers).toLocaleString()} followers`
      : "",
    eligibility.requirements?.likes
      ? `${Number(eligibility.requirements.likes).toLocaleString()} average likes`
      : "",
    eligibility.requirements?.engagement
      ? `${Number(eligibility.requirements.engagement).toLocaleString()} average engagements`
      : "",
  ].filter(Boolean);
  const creatorMetrics = eligibility.metrics || {};
  const metricComparisons = [
    {
      key: "followers",
      label: "Followers",
      current: Number(creatorMetrics.followers || 0),
      required: Number(eligibility.requirements?.followers || 0),
    },
    {
      key: "likes",
      label: "Average likes",
      current: Number(creatorMetrics.likes || 0),
      required: Number(eligibility.requirements?.likes || 0),
    },
    {
      key: "engagement",
      label: "Average engagements",
      current: Number(creatorMetrics.engagement || 0),
      required: Number(eligibility.requirements?.engagement || 0),
    },
  ].filter((metric) => metric.required > 0);
  const canClaim =
    isEligible &&
    !accepted &&
    remainingSlots > 0 &&
    remainingBudget >= Number(campaign.payoutPerCampaigner || 0);
  const completedPostUrls = proofEntries.filter((entry) => entry.postUrl).length;
  const completedScreenshots = proofEntries.filter((entry) => entry.analyticsScreenshot).length;
  const proofReady = Boolean(
    proofEntries.length && proofEntries.every((entry) => entry.postUrl && entry.analyticsScreenshot),
  );
  const eligibilityMessage = accepted
    ? "This campaign is in your active campaigns. Download the material and publish when ready."
    : isEligible
      ? criteria.length
        ? `You qualify with your verified ${criteria.join(", ")}.`
        : "You’re eligible to pick up this campaign."
      : eligibility.hasVerifiedAccount
        ? "Your verified account does not yet meet every campaign requirement. Review your numbers below."
        : `Connect a verified ${campaign.platforms.join(" or ")} account to qualify.`;
  async function acceptCampaign() {
    setError("");
    setIsClaiming(true);
    try {
      const result = await acceptBusinessMarketingCampaign(campaign.id);
      if (result?.accepted === false)
        throw new Error(
          PICKUP_ERRORS[result.reason] || "This campaign cannot be picked up.",
        );
      setAccepted(true);
      const refreshed = await getBusinessMarketingCampaignFromBackend(campaign.id);
      if (refreshed) setBackendCampaign(refreshed);
    } catch (reason) {
      setError(reason.message || "Campaign could not be accepted.");
    } finally {
      setIsClaiming(false);
    }
  }
  async function submitProof() {
    setError("");
    setIsSubmittingProof(true);
    try {
      const incompletePlatform = proofEntries.find(
        (entry) => !entry.postUrl || !entry.analyticsScreenshot,
      );
      if (incompletePlatform) {
        throw new Error(`Add the post URL and analytics screenshot for ${incompletePlatform.platform}.`);
      }
      const posts = proofEntries.map((entry) => ({
        postUrl: entry.postUrl,
        platform: entry.platform,
      }));
      const result = await submitBusinessMarketingCampaignProof(campaign.id, {
        posts,
        postUrl: posts[0].postUrl,
        platform: posts[0].platform,
        analyticsScreenshots: proofEntries.map((entry) => ({
          uploadId: entry.analyticsScreenshot.id,
          platform: entry.platform,
        })),
        notes: proofNotes,
      });
      if (result?.submitted === false)
        throw new Error("Pick up this campaign before submitting proof.");
      setProofSubmitted(true);
      setProofResult(result);
    } catch (reason) {
      setError(reason.message || "Proof could not be submitted.");
    } finally {
      setIsSubmittingProof(false);
    }
  }

  async function uploadAnalyticsScreenshot(file, platform) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image of your platform analytics.");
      return;
    }
    setError("");
    setUploadingPlatform(platform);
    try {
      const upload = await uploadZumbarlFile(file, {
        scope: "social-metrics",
        metadata: {
          purpose: "campaign-analytics-proof",
          campaignId: campaign.id,
          platform,
        },
      });
      setProofEntries((entries) => entries.map((entry) => (
        entry.platform === platform ? { ...entry, analyticsScreenshot: upload } : entry
      )));
    } catch (reason) {
      setError(reason.message || "Analytics screenshot could not be uploaded.");
    } finally {
      setUploadingPlatform("");
    }
  }

  async function copyTrackingValue(value, key) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(key);
      window.setTimeout(() => setCopiedValue(""), 1800);
    } catch {
      setError("Copying is unavailable in this browser. Select and copy the value manually.");
    }
  }

  return (
    <main className="campus-page opportunities-page student-marketing-page">
      <Seo
        title={`${campaign.title} | Student Marketing Campaign | Zumbarl`}
        description="Pick up a Zumbarl student creator campaign, submit proof, and track endorsement readiness."
        path={`/campus/opportunities/marketing/${campaign.id}`}
      />

      <div className="campus-stage">
        <div className="campus-shell opportunities-bid-shell">
          <CampusSidebar activeItemId="opportunities" />

          <section className="campus-main opportunities-main opportunities-bid-main">
            <nav className="student-marketing-back">
              <Link to="/campus/opportunities?tab=marketing">
                <FiArrowLeft aria-hidden="true" /> Back to marketing
              </Link>
            </nav>

            <section className="opportunities-bid-form-card student-marketing-hero">
              <div className="student-marketing-hero-copy">
                <div className="student-marketing-kicker">
                  <span>{campaign.type || "Creator campaign"}</span>
                  <em>{remainingSlots} slots available</em>
                </div>
                <h1>{campaign.title}</h1>
                <p>{campaign.description}</p>
                <ul className="student-marketing-platforms" aria-label="Campaign platforms">
                  {campaign.platforms.map((platform) => (
                    <li key={platform}>{platform}</li>
                  ))}
                </ul>
                <dl className="student-marketing-summary">
                  <div>
                    <dt>Creator payout</dt>
                    <dd>{campaign.currency} {Number(campaign.payoutPerCampaigner || 0).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt>Slots available</dt>
                    <dd>{remainingSlots}</dd>
                  </div>
                  <div>
                    <dt>Campaign closes</dt>
                    <dd>{formatCampaignDate(campaign.endsAt)}</dd>
                  </div>
                </dl>
                <p className={`student-marketing-eligibility${isEligible ? " is-eligible" : ""}`}>
                  <FiCheckCircle aria-hidden="true" />
                  {eligibilityMessage}
                </p>
                {!isEligible && eligibility.hasVerifiedAccount && metricComparisons.length ? (
                  <div className="student-marketing-metric-comparison">
                    <header>
                      <strong>Your verified {creatorMetrics.platform || "creator"} account</strong>
                      <span>Current / required</span>
                    </header>
                    <dl>
                      {metricComparisons.map((metric) => {
                        const requirementMet = metric.current >= metric.required;
                        return (
                          <div key={metric.key} className={requirementMet ? "is-met" : "is-below"}>
                            <dt>{metric.label}</dt>
                            <dd>
                              <strong>{metric.current.toLocaleString()}</strong>
                              <span>of {metric.required.toLocaleString()}</span>
                              <em>{requirementMet ? "Met" : `${(metric.required - metric.current).toLocaleString()} more needed`}</em>
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </div>
                ) : null}
                {accepted ? (
                  <div className="student-marketing-active-status">
                    <FiCheckCircle aria-hidden="true" />
                    <div><strong>Campaign active</strong><span>Your tracking kit and proof workspace are ready below.</span></div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="opportunities-detail-bid-btn student-marketing-pickup-btn"
                    disabled={!canClaim || isClaiming}
                    onClick={acceptCampaign}
                  >
                    <FiCheckCircle aria-hidden="true" />
                    {isClaiming ? "Picking up…" : "Pick up campaign"}
                  </button>
                )}
              </div>

              <figure className="student-marketing-hero-media">
                {primaryMaterial?.type === "video" ? (
                  <video
                    src={normalizeZumbarlFileUrl(primaryMaterial.previewUrl || primaryMaterial.url, primaryMaterial)}
                    poster={getMarketingMaterialPreview(campaign)}
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={getMarketingMaterialPreview(campaign)}
                    alt={`${campaign.title} campaign creative`}
                  />
                )}
                <figcaption>Approved campaign creative</figcaption>
              </figure>
            </section>

            {error ? (
              <p className="super-admin-error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="student-marketing-info-grid">
              <section className="opportunities-bid-form-card student-marketing-materials">
                <header>
                  <span>Campaign assets</span>
                  <h2>Ready-to-post materials</h2>
                  <p>
                    {isEligible
                      ? "Download the approved creative and use it exactly as provided."
                      : "Downloads unlock when your verified account meets every campaign requirement."}
                  </p>
                </header>
                <div className="student-marketing-material-list">
                  {(campaign.materials || [])
                    .filter((material) => material.url)
                    .map((material) => (
                      <article key={material.id || material.url}>
                        <span aria-hidden="true"><FiFileText /></span>
                        <div>
                          <strong>{material.title || "Campaign material"}</strong>
                          <small>{material.fileName || `${material.type || "Creative"} asset`}</small>
                        </div>
                        {isEligible ? (
                          <a
                            href={normalizeZumbarlFileUrl(material.url, material)}
                            target="_blank"
                            rel="noreferrer"
                            download
                          >
                            <FiDownload aria-hidden="true" /> Download
                          </a>
                        ) : (
                          <button type="button" disabled title="Meet the campaign requirements to download this material">
                            <FiLock aria-hidden="true" /> Locked
                          </button>
                        )}
                      </article>
                    ))}
                </div>
              </section>

              <section className="opportunities-bid-form-card student-marketing-brief">
                <header>
                  <span>Campaign brief</span>
                  <h2>What to include</h2>
                </header>
                <dl>
                  <div>
                    <dt>Objective</dt>
                    <dd>{campaign.objective || "Promote the campaign to your audience."}</dd>
                  </div>
                  <div>
                    <dt>Proof required</dt>
                    <dd>{campaign.proofRequirements?.join(", ") || "Live post URL"}</dd>
                  </div>
                  <div>
                    <dt>Hashtags</dt>
                    <dd>{campaign.hashtags?.join(" ") || "None specified"}</dd>
                  </div>
                </dl>
              </section>
            </div>

            {accepted ? (
              <section className="opportunities-bid-form-card student-marketing-progress-card">
                <header className="student-marketing-progress-header">
                  <div className="student-marketing-tracking-intro">
                    <span aria-hidden="true"><FiBarChart2 /></span>
                    <div>
                      <h2>Live campaign progress</h2>
                      <p>Share your unique link and watch the audience response build in real time.</p>
                    </div>
                  </div>
                  <em><i /> Live · refreshes automatically</em>
                </header>
                <div className="student-marketing-progress-grid">
                  <article className="student-marketing-click-total" aria-live="polite">
                    <span aria-hidden="true"><FiMousePointer /></span>
                    <div>
                      <strong>{Number(acceptance?.trackingClicks || 0).toLocaleString()}</strong>
                      <p>Unique {Number(acceptance?.trackingClicks || 0) === 1 ? "click" : "clicks"}</p>
                    </div>
                  </article>
                  <article className="student-marketing-click-total is-visits" aria-live="polite">
                    <span aria-hidden="true"><FiRepeat /></span>
                    <div>
                      <strong>{Number(acceptance?.trackingVisits || 0).toLocaleString()}</strong>
                      <p>Total {Number(acceptance?.trackingVisits || 0) === 1 ? "visit" : "visits"}</p>
                    </div>
                  </article>
                  <div className="student-marketing-tracking-values">
                    {trackingUrl ? (
                      <div className="student-marketing-copy-field">
                        <span><FiLink aria-hidden="true" /> Tracked link</span>
                        <code title={trackingUrl}>{trackingUrl}</code>
                        <a href={trackingUrl} target="_blank" rel="noreferrer" aria-label="Open tracked link"><FiExternalLink /></a>
                        <button type="button" onClick={() => copyTrackingValue(trackingUrl, "link")}>
                          {copiedValue === "link" ? <FiCheckCircle /> : <FiCopy />}
                          {copiedValue === "link" ? "Copied" : "Copy"}
                        </button>
                      </div>
                    ) : null}
                    {acceptance?.promoCode ? (
                      <div className="student-marketing-copy-field is-code">
                        <span>Promo code</span>
                        <code>{acceptance.promoCode}</code>
                        <button type="button" onClick={() => copyTrackingValue(acceptance.promoCode, "code")}>
                          {copiedValue === "code" ? <FiCheckCircle /> : <FiCopy />}
                          {copiedValue === "code" ? "Copied" : "Copy"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>
            ) : null}

            {accepted && !proofSubmitted ? (
              <section className="opportunities-bid-form-card student-marketing-proof">
                <header className="student-marketing-proof-header">
                  <div>
                    <span>Complete campaign</span>
                    <h2>Submit your campaign results</h2>
                    <p>Add the published post and a screenshot of its performance. The business will receive everything in one review package.</p>
                  </div>
                  <em>Draft</em>
                </header>

                <div className="student-marketing-proof-workspace">
                  <div className="student-marketing-proof-form">
                    <section className="student-marketing-proof-step">
                      <header>
                        <span>1</span>
                        <div>
                          <h3>Published posts</h3>
                          <p>Add the live URL for every platform included in this campaign.</p>
                        </div>
                      </header>
                      <div className="student-marketing-platform-proof-list">
                        {proofEntries.map((entry) => {
                          const inputId = `campaign-proof-link-${entry.platform.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
                          return (
                            <article key={entry.platform}>
                              <span className={`student-marketing-platform-badge is-${entry.platform.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} aria-hidden="true">{PLATFORM_ABBREVIATIONS[entry.platform] || entry.platform.slice(0, 2).toUpperCase()}</span>
                              <div className="opportunities-bid-field">
                                <label htmlFor={inputId}>{entry.platform} post URL</label>
                                <div className="student-marketing-input-icon">
                                  <FiLink aria-hidden="true" />
                                  <input
                                    id={inputId}
                                    type="url"
                                    value={entry.postUrl}
                                    onChange={(event) => setProofEntries((entries) => entries.map((item) => (
                                      item.platform === entry.platform ? { ...item, postUrl: event.target.value } : item
                                    )))}
                                    placeholder={PLATFORM_POST_HINTS[entry.platform] || "https://…"}
                                    required
                                  />
                                </div>
                              </div>
                              <em className={entry.postUrl ? "is-complete" : ""}>
                                {entry.postUrl ? <FiCheckCircle /> : null}
                                {entry.postUrl ? "Added" : "Required"}
                              </em>
                            </article>
                          );
                        })}
                      </div>
                      <p className="student-marketing-platform-count">
                        {proofEntries.map((entry) => entry.platform).join(" · ")} · {completedPostUrls}/{proofEntries.length} URLs added
                      </p>
                    </section>

                    <section className="student-marketing-proof-step">
                      <header>
                        <span>2</span>
                        <div><h3>Performance screenshots</h3><p>Upload the matching insights screen for each platform.</p></div>
                      </header>
                      <div className="student-marketing-platform-upload-list">
                        {proofEntries.map((entry) => {
                          const isUploading = uploadingPlatform === entry.platform;
                          return (
                            <label key={entry.platform} className={`student-marketing-analytics-upload${entry.analyticsScreenshot ? " has-file" : ""}`}>
                              <span className={`student-marketing-platform-badge is-${entry.platform.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} aria-hidden="true">{PLATFORM_ABBREVIATIONS[entry.platform] || entry.platform.slice(0, 2).toUpperCase()}</span>
                              <span className="student-marketing-upload-icon" aria-hidden="true">
                                {entry.analyticsScreenshot ? <FiCheckCircle /> : <FiUploadCloud />}
                              </span>
                              <strong>{isUploading ? `Reading ${entry.platform} screenshot…` : entry.analyticsScreenshot?.fileName || `${entry.platform} analytics`}</strong>
                              <span>{entry.analyticsScreenshot ? "Ready to submit · Click to replace" : "Include your account handle and at least two metrics"}</span>
                              <em>{entry.analyticsScreenshot ? "Replace" : "Browse"}</em>
                              <input
                                type="file"
                                accept="image/*"
                                disabled={Boolean(uploadingPlatform)}
                                onChange={(event) => uploadAnalyticsScreenshot(event.target.files?.[0], entry.platform)}
                              />
                            </label>
                          );
                        })}
                      </div>
                      <p className="student-marketing-platform-count">{completedScreenshots}/{proofEntries.length} screenshots ready</p>
                    </section>

                    <section className="student-marketing-proof-step">
                      <header>
                        <span>3</span>
                        <div><h3>Context for the reviewer <em>Optional</em></h3><p>Call out anything the screenshot does not make clear.</p></div>
                      </header>
                      <div className="opportunities-bid-field">
                        <textarea
                          id="campaign-proof-summary"
                          aria-label="Proof notes"
                          value={proofNotes}
                          onChange={(event) => setProofNotes(event.target.value)}
                          placeholder="For example: the post was published as a collaboration with the brand account."
                        />
                      </div>
                    </section>
                  </div>

                  <aside className="student-marketing-proof-review">
                    <span className="student-marketing-review-icon" aria-hidden="true"><FiImage /></span>
                    <h3>Ready for review?</h3>
                    <p>We’ll verify the post, read the analytics screenshot, and package the results for the business.</p>
                    <ul>
                      <li className={completedPostUrls === proofEntries.length ? "is-complete" : ""}><FiCheckCircle /> Post URLs ({completedPostUrls}/{proofEntries.length})</li>
                      <li className={completedScreenshots === proofEntries.length ? "is-complete" : ""}><FiCheckCircle /> Analytics screenshots ({completedScreenshots}/{proofEntries.length})</li>
                      <li><FiCheckCircle /> Tracking clicks attached automatically</li>
                    </ul>
                    <button
                      type="button"
                      className="opportunities-detail-bid-btn"
                      disabled={!proofReady || Boolean(uploadingPlatform) || isSubmittingProof}
                      onClick={submitProof}
                    >
                      {isSubmittingProof ? "Verifying analytics…" : "Submit for review"}
                      <FiSend aria-hidden="true" />
                    </button>
                    <small>You can’t edit the package while it is under review.</small>
                  </aside>
                </div>
              </section>
            ) : null}

            {proofSubmitted ? (
              <section className="opportunities-bid-form-card student-marketing-proof-success">
                <span aria-hidden="true"><FiCheckCircle /></span>
                <div>
                  <h2>Proof submitted</h2>
                  <p>{proofResult?.status === "verified_screenshot"
                    ? "Your post and analytics screenshot were verified."
                    : "Your proof was received and flagged for business review."}</p>
                </div>
              </section>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}

export default StudentMarketingCampaignPage;
