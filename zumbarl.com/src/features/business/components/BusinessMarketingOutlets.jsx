import { useEffect, useState } from "react";
import {
  FiCheck,
  FiCopy,
  FiExternalLink,
  FiLink,
  FiShare2,
} from "react-icons/fi";

const PLATFORM_ABBREVIATIONS = {
  Instagram: "IG",
  TikTok: "TT",
  YouTube: "YT",
  Facebook: "FB",
  X: "X",
  LinkedIn: "IN",
};

function outletHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

async function copyToClipboard(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

function formatDate(value) {
  if (!value) return "Recently submitted";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently submitted";
  return `Submitted ${date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

export function BusinessMarketingOutlets({ campaign }) {
  const outlets = campaign.outlets || [];
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!feedback) return undefined;
    const timeout = window.setTimeout(() => setFeedback(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  async function copyOutlet(outlet) {
    try {
      await copyToClipboard(outlet.url);
      setFeedback({
        outletId: outlet.id,
        message: `${outlet.platform} link copied`,
      });
    } catch {
      setFeedback({
        outletId: outlet.id,
        message: "The link could not be copied",
      });
    }
  }

  async function shareOutlet(outlet) {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${campaign.title} — ${outlet.creatorName}`,
          text: `${outlet.creatorName}'s ${outlet.platform} campaign post`,
          url: outlet.url,
        });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }
    await copyOutlet(outlet);
  }

  return (
    <section className="business-profile-card business-marketing-outlets-card">
      <header className="business-marketing-outlets-header">
        <div>
          <h2>Campaign Outlets</h2>
          <p>
            Live social posts submitted by student creators for this campaign.
          </p>
        </div>
        {outlets.length ? (
          <strong className="business-marketing-outlet-count">
            {outlets.length} live {outlets.length === 1 ? "link" : "links"}
          </strong>
        ) : null}
      </header>

      <p className="sr-only" aria-live="polite">
        {feedback?.message || ""}
      </p>

      {outlets.length ? (
        <div className="business-marketing-outlet-list">
          {outlets.map((outlet) => (
            <article className="business-marketing-outlet" key={outlet.id}>
              <span
                className={`business-marketing-outlet-platform is-${outlet.platform.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                aria-hidden="true"
              >
                {PLATFORM_ABBREVIATIONS[outlet.platform] ||
                  outlet.platform.slice(0, 2).toUpperCase()}
              </span>

              <div className="business-marketing-outlet-details">
                <div className="business-marketing-outlet-title">
                  <strong>{outlet.creatorName}</strong>
                  <span>{outlet.platform}</span>
                </div>
                <a href={outlet.url} target="_blank" rel="noreferrer">
                  <FiLink aria-hidden="true" />
                  <span>{outletHostname(outlet.url)}</span>
                  <small>{outlet.url}</small>
                </a>
                <p>{formatDate(outlet.submittedAt)}</p>
                <p className={`business-marketing-proof-verification is-${outlet.verificationStatus}`}>
                  {outlet.verificationStatus === "verified_screenshot"
                    ? "Analytics verified"
                    : "Needs review"}
                </p>
                {outlet.analyticsEvidence?.[0]?.url ? (
                  <a href={outlet.analyticsEvidence[0].url} target="_blank" rel="noreferrer">
                    <FiExternalLink aria-hidden="true" /> View analytics screenshot
                  </a>
                ) : null}
              </div>

              <dl className="business-marketing-outlet-metrics">
                <div>
                  <dt>Reach</dt>
                  <dd>{Number(outlet.reach || 0).toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Engagement</dt>
                  <dd>{Number(outlet.engagement || 0).toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Unique clicks</dt>
                  <dd>{Number(outlet.clicks || 0).toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Total visits</dt>
                  <dd>{Number(outlet.visits || 0).toLocaleString()}</dd>
                </div>
              </dl>

              <div className="business-marketing-outlet-actions">
                <button type="button" onClick={() => copyOutlet(outlet)}>
                  {feedback?.outletId === outlet.id &&
                  feedback.message.endsWith("link copied") ? (
                    <FiCheck aria-hidden="true" />
                  ) : (
                    <FiCopy aria-hidden="true" />
                  )}
                  Copy
                </button>
                <button type="button" onClick={() => shareOutlet(outlet)}>
                  <FiShare2 aria-hidden="true" />
                  Share
                </button>
                <a href={outlet.url} target="_blank" rel="noreferrer">
                  <FiExternalLink aria-hidden="true" />
                  Open
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="business-marketing-outlets-empty">
          <span aria-hidden="true">
            <FiLink />
          </span>
          <h3>No live links yet</h3>
          <p>
            Student creators’ social media links will appear here after they
            post the campaign material and submit their proof package.
          </p>
        </div>
      )}
    </section>
  );
}
