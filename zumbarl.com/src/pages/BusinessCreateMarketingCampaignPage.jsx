import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiInfo,
  FiSave,
  FiSend,
  FiTrash2,
  FiUploadCloud,
} from "react-icons/fi";
import { Breadcrumb } from "../components/ui";
import Seo from "../components/Seo";
import { BusinessWorkspaceSidebar } from "../features/business/components/BusinessApplicantSidebar";
import { BusinessWorkspaceHeader } from "../features/business/components/BusinessWorkspaceHeader";
import {
  MARKETING_CAMPAIGN_STEPS,
  useMarketingCampaignCreate,
} from "../features/business/hooks/useMarketingCampaignCreate";
import "../styles/campus.css";
import "../styles/business.css";
import "../styles/marketing-campaign-create.css";

const OBJECTIVES = [
  "Brand awareness",
  "Engagement",
  "Website traffic",
  "Leads and conversions",
  "Event promotion",
  "Product launch",
];
const PLATFORMS = ["Instagram", "TikTok", "YouTube", "Facebook", "X"];
const FORMATS = [
  "Short-form video",
  "Story",
  "Feed post",
  "Carousel",
  "Long-form video",
];
const PROOFS = [
  "Live post URL",
  "Post screenshot",
  "Platform insights screenshot",
  "Reach and engagement metrics",
];

function ChoiceGroup({ label, name, options, selected, onToggle }) {
  return (
    <fieldset className="marketing-choice-group">
      <legend>{label}</legend>
      <div>
        {options.map((option) => (
          <label
            key={option}
            className={selected.includes(option) ? "is-selected" : ""}
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onToggle(name, option)}
            />
            <span>
              {selected.includes(option) && <FiCheck />}
              {option}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function CampaignStep({ campaign }) {
  const { activeStep, form, update, toggle } = campaign;
  if (activeStep === 1)
    return (
      <section className="marketing-form-card">
        <h2>Campaign goal</h2>
        <p>
          Define the business outcome and the message creators should
          communicate.
        </p>
        <div className="marketing-form-grid">
          <label>
            Campaign title <strong>*</strong>
            <input
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="e.g. Back-to-campus product launch"
            />
          </label>
          <label>
            Objective <strong>*</strong>
            <select
              value={form.objective}
              onChange={(event) => update("objective", event.target.value)}
            >
              {OBJECTIVES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="is-wide">
            Campaign brief <strong>*</strong>
            <textarea
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Describe the product, key message, desired audience response, and what success means."
            />
          </label>
          <label className="is-wide">
            Call to action
            <input
              value={form.callToAction}
              onChange={(event) => update("callToAction", event.target.value)}
              placeholder="e.g. Register, visit the store, or use a promo code"
            />
          </label>
          <label className="is-wide">
            Campaign destination URL
            <input
              type="url"
              value={form.destinationUrl}
              onChange={(event) => update("destinationUrl", event.target.value)}
              placeholder="https://your-site.example/offer"
            />
            <small>Each creator receives a unique tracked version of this link.</small>
          </label>
        </div>
      </section>
    );
  if (activeStep === 2)
    return (
      <section className="marketing-form-card">
        <h2>Audience and creator eligibility</h2>
        <p>Choose where the campaign runs and the creators it needs.</p>
        <ChoiceGroup
          label="Platforms *"
          name="platforms"
          options={PLATFORMS}
          selected={form.platforms}
          onToggle={toggle}
        />
        <div className="marketing-form-grid">
          <label>
            Target audience <strong>*</strong>
            <input
              value={form.targetAudience}
              onChange={(event) => update("targetAudience", event.target.value)}
              placeholder="e.g. Students aged 18–24 interested in tech"
            />
          </label>
          <label>
            Priority campuses
            <input
              value={form.campuses}
              onChange={(event) => update("campuses", event.target.value)}
              placeholder="e.g. KU, Zetech, USIU"
            />
          </label>
          <label>
            Audience interests
            <input
              value={form.interests}
              onChange={(event) => update("interests", event.target.value)}
              placeholder="Technology, gaming, student life"
            />
          </label>
          <label>
            Creator slots <strong>*</strong>
            <input
              type="number"
              min="1"
              value={form.creatorsLimit}
              onChange={(event) => update("creatorsLimit", event.target.value)}
            />
          </label>
          <label>
            Minimum followers
            <input
              type="number"
              min="0"
              value={form.minimumFollowers}
              onChange={(event) =>
                update("minimumFollowers", event.target.value)
              }
            />
            <small>Set to zero when follower count is not required.</small>
          </label>
          <label>
            Minimum average likes
            <input
              type="number"
              min="0"
              value={form.minimumLikes}
              onChange={(event) => update("minimumLikes", event.target.value)}
            />
            <small>Average likes per post on a verified account.</small>
          </label>
          <label>
            Minimum average engagement
            <input
              type="number"
              min="0"
              value={form.minimumEngagement}
              onChange={(event) =>
                update("minimumEngagement", event.target.value)
              }
            />
            <small>Average total engagements per post.</small>
          </label>
        </div>
      </section>
    );
  if (activeStep === 3)
    return (
      <section className="marketing-form-card">
        <h2>Content, assets, and proof</h2>
        <p>
          Tell creators exactly what to deliver and how completion will be
          verified.
        </p>
        <ChoiceGroup
          label="Content formats *"
          name="contentFormats"
          options={FORMATS}
          selected={form.contentFormats}
          onToggle={toggle}
        />
        <ChoiceGroup
          label="Required proof *"
          name="proofRequirements"
          options={PROOFS}
          selected={form.proofRequirements}
          onToggle={toggle}
        />
        <div className="marketing-form-grid">
          <label>
            Campaign hashtags
            <input
              value={form.hashtags}
              onChange={(event) => update("hashtags", event.target.value)}
              placeholder="#Zumbarl, #CampusCreators"
            />
          </label>
          <label className="is-wide">
            Creator instructions and brand safety
            <textarea
              value={form.instructions}
              onChange={(event) => update("instructions", event.target.value)}
              placeholder="Required mentions, prohibited claims, disclosure language, tone, and approval rules."
            />
          </label>
          <section className="marketing-media-upload is-wide">
            <header>
              <div>
                <h3>Campaign media *</h3>
                <p>
                  Upload the final image or video students should publish. This
                  is the exact creative they will download and use.
                </p>
              </div>
            </header>
            {form.materials[0] ? (
              <article className="marketing-media-preview">
                {form.materials[0].type === "video" ? (
                  <video
                    src={form.materials[0].previewUrl || form.materials[0].url}
                    controls
                    muted
                  />
                ) : (
                  <img
                    src={form.materials[0].previewUrl || form.materials[0].url}
                    alt="Campaign creative preview"
                  />
                )}
                <div>
                  <strong>{form.materials[0].title}</strong>
                  <span>
                    {form.materials[0].mimeType || form.materials[0].type}
                    {form.materials[0].sizeBytes
                      ? ` · ${(form.materials[0].sizeBytes / 1024 / 1024).toFixed(1)} MB`
                      : ""}
                  </span>
                  <em>
                    {campaign.isUploadingMaterial
                      ? "Uploading…"
                      : "Ready for creators"}
                  </em>
                </div>
                <button
                  type="button"
                  disabled={campaign.isUploadingMaterial}
                  onClick={campaign.removeMaterial}
                  aria-label="Remove campaign media"
                >
                  <FiTrash2 aria-hidden="true" />
                </button>
              </article>
            ) : (
              <label className="marketing-media-dropzone">
                <FiUploadCloud aria-hidden="true" />
                <strong>Upload campaign image or video</strong>
                <span>PNG, JPG, WebP, GIF, MP4, WebM or MOV · up to 50 MB</span>
                <b>Choose media</b>
                <input
                  type="file"
                  accept="image/*,video/*"
                  disabled={campaign.isUploadingMaterial}
                  onChange={(event) => {
                    campaign.uploadMaterial(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </label>
            )}
            {form.materials[0] && !campaign.isUploadingMaterial ? (
              <label className="marketing-media-replace">
                <FiUploadCloud aria-hidden="true" /> Replace media
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(event) => {
                    campaign.uploadMaterial(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </label>
            ) : null}
          </section>
        </div>
      </section>
    );
  if (activeStep === 4)
    return (
      <section className="marketing-form-card">
        <h2>Budget and schedule</h2>
        <p>Set transparent creator compensation and the campaign window.</p>
        <div className="marketing-form-grid">
          <label>
            Total campaign budget (KES) <strong>*</strong>
            <input
              type="number"
              min="1"
              value={form.budgetAmount}
              onChange={(event) => update("budgetAmount", event.target.value)}
            />
          </label>
          <label>
            Payout per creator (KES) <strong>*</strong>
            <input
              type="number"
              min="1"
              value={form.payoutPerCampaigner}
              onChange={(event) =>
                update("payoutPerCampaigner", event.target.value)
              }
            />
          </label>
          <label>
            Start date <strong>*</strong>
            <input
              type="date"
              value={form.startsAt}
              onChange={(event) => update("startsAt", event.target.value)}
            />
          </label>
          <label>
            End date <strong>*</strong>
            <input
              type="date"
              value={form.endsAt}
              onChange={(event) => update("endsAt", event.target.value)}
            />
          </label>
        </div>
        <div className="marketing-capacity">
          <FiInfo />
          <span>
            This budget can fund{" "}
            <strong>
              {campaign.capacity} creator{campaign.capacity === 1 ? "" : "s"}
            </strong>
            . You currently have {form.creatorsLimit || 0} slots.
          </span>
        </div>
      </section>
    );
  return (
    <section className="marketing-form-card">
      <h2>Review and launch</h2>
      <p>Confirm the brief creators will see before saving or publishing.</p>
      <dl className="marketing-review">
        <div>
          <dt>Campaign</dt>
          <dd>{form.title}</dd>
        </div>
        <div>
          <dt>Objective</dt>
          <dd>{form.objective}</dd>
        </div>
        <div>
          <dt>Platforms</dt>
          <dd>{form.platforms.join(", ")}</dd>
        </div>
        <div>
          <dt>Creator slots</dt>
          <dd>{form.creatorsLimit}</dd>
        </div>
        <div>
          <dt>Creator eligibility</dt>
          <dd>
            {Number(form.minimumFollowers || 0).toLocaleString()} followers ·{" "}
            {Number(form.minimumLikes || 0).toLocaleString()} avg. likes ·{" "}
            {Number(form.minimumEngagement || 0).toLocaleString()} avg.
            engagements
          </dd>
        </div>
        <div>
          <dt>Compensation</dt>
          <dd>
            KES {Number(form.payoutPerCampaigner || 0).toLocaleString()} per
            creator
          </dd>
        </div>
        <div>
          <dt>Total budget</dt>
          <dd>KES {Number(form.budgetAmount || 0).toLocaleString()}</dd>
        </div>
        <div>
          <dt>Schedule</dt>
          <dd>
            {form.startsAt} to {form.endsAt}
          </dd>
        </div>
        <div className="is-wide">
          <dt>Required proof</dt>
          <dd>{form.proofRequirements.join(", ")}</dd>
        </div>
        <div className="is-wide">
          <dt>Tracked destination</dt>
          <dd>{form.destinationUrl || "No external destination"}</dd>
        </div>
        <div className="is-wide">
          <dt>Campaign media</dt>
          <dd>{form.materials[0]?.title || "No media uploaded"}</dd>
        </div>
        <div className="is-wide">
          <dt>Brief</dt>
          <dd>{form.description}</dd>
        </div>
      </dl>
    </section>
  );
}

function BusinessCreateMarketingCampaignPage() {
  const campaign = useMarketingCampaignCreate();
  if (campaign.isLoading)
    return <main className="business-company-state">Loading campaign…</main>;
  return (
    <main className="campus-page business-workspace-page marketing-create-page">
      <Seo
        title={`${campaign.isEditing ? "Edit" : "Create"} Marketing Campaign | Zumbarl`}
        description="Create and publish a first-come, first-served student creator marketing campaign."
        path={
          campaign.isEditing
            ? "/business/marketing/edit"
            : "/business/marketing/create"
        }
      />
      <div className="campus-stage">
        <div className="campus-shell business-workspace-shell marketing-create-shell">
          <BusinessWorkspaceSidebar activeItemId="marketing" />
          <section className="campus-main business-workspace-main marketing-create-main">
            <Breadcrumb
              items={[
                { label: "Marketing", href: "/business/marketing" },
                {
                  label: campaign.isEditing
                    ? "Edit Campaign"
                    : "Create Campaign",
                },
              ]}
            />
            <BusinessWorkspaceHeader
              title={
                campaign.isEditing
                  ? "Edit Marketing Campaign"
                  : "Create Marketing Campaign"
              }
              description="Set measurable eligibility. Qualified creators pick up available slots immediately."
            />
            <nav
              className="marketing-create-steps"
              aria-label="Campaign creation steps"
            >
              {MARKETING_CAMPAIGN_STEPS.map((step) => (
                <button
                  key={step.id}
                  type="button"
                  className={
                    campaign.activeStep === step.id
                      ? "is-active"
                      : campaign.activeStep > step.id
                        ? "is-complete"
                        : ""
                  }
                  onClick={() => campaign.goToStep(step.id)}
                >
                  <span>
                    {campaign.activeStep > step.id ? <FiCheck /> : step.id}
                  </span>
                  <div>
                    <strong>{step.label}</strong>
                    <small>{step.detail}</small>
                  </div>
                </button>
              ))}
            </nav>
            {campaign.error && (
              <div className="marketing-form-error" role="alert">
                {campaign.error}
              </div>
            )}
            <CampaignStep campaign={campaign} />
            <footer className="marketing-create-actions">
              <button
                type="button"
                className="is-secondary"
                disabled={
                  campaign.activeStep === 1 ||
                  campaign.saving ||
                  campaign.isUploadingMaterial
                }
                onClick={() => campaign.goToStep(campaign.activeStep - 1)}
              >
                <FiArrowLeft /> Back
              </button>
              <div>
                {campaign.activeStep === 5 && !campaign.isEditing && (
                  <button
                    type="button"
                    className="is-secondary"
                    disabled={campaign.saving || campaign.isUploadingMaterial}
                    onClick={() => campaign.save("draft")}
                  >
                    <FiSave /> Save draft
                  </button>
                )}
                {campaign.activeStep < 5 ? (
                  <button
                    type="button"
                    disabled={campaign.saving || campaign.isUploadingMaterial}
                    onClick={() => campaign.goToStep(campaign.activeStep + 1)}
                  >
                    Continue <FiArrowRight />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={campaign.saving || campaign.isUploadingMaterial}
                    onClick={() => campaign.save("published")}
                  >
                    {campaign.isEditing ? <FiSave /> : <FiSend />} {" "}
                    {campaign.saving
                      ? "Saving…"
                      : campaign.isEditing
                        ? "Save changes"
                        : "Publish campaign"}
                  </button>
                )}
              </div>
            </footer>
          </section>
          <aside className="marketing-create-rail">
            <h2>Campaign summary</h2>
            <p>Your live summary updates as you build the brief.</p>
            <dl>
              <div>
                <dt>Title</dt>
                <dd>{campaign.form.title || "Untitled campaign"}</dd>
              </div>
              <div>
                <dt>Objective</dt>
                <dd>{campaign.form.objective}</dd>
              </div>
              <div>
                <dt>Platforms</dt>
                <dd>{campaign.form.platforms.join(", ") || "None selected"}</dd>
              </div>
              <div>
                <dt>Budget</dt>
                <dd>
                  KES {Number(campaign.form.budgetAmount || 0).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt>Slots</dt>
                <dd>{campaign.form.creatorsLimit || 0}</dd>
              </div>
            </dl>
            <div className="marketing-rail-note">
              <FiInfo />
              <span>
                Marketing campaigns do not take applications. Qualified
                creators claim the available slots on a first-come,
                first-served basis.
              </span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default BusinessCreateMarketingCampaignPage;
