import { FiBarChart2, FiCheckCircle, FiDownload, FiFileText, FiMousePointer, FiRepeat } from "react-icons/fi";
import { BusinessMarketingCreatorTable } from "./BusinessMarketingCreatorTable";
import { BusinessMarketingOutlets } from "./BusinessMarketingOutlets";

function DetailList({ rows }) {
  return (
    <dl className="business-marketing-about-list">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>
            {String(value)
              .split("\n")
              .map((line) => (
                <span key={line}>{line}</span>
              ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Timeline({ events }) {
  return (
    <ol className="business-marketing-timeline">
      {events.map((event) => (
        <li key={event.label} className={`is-${event.status}`}>
          <span aria-hidden="true" />
          <div>
            <strong>{event.label}</strong>
            <p>{event.date}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function ProofStats({ campaign }) {
  const stats = campaign.stats || {};
  const items = [
    {
      label: "Verified reach",
      value: Number(stats.reach || 0).toLocaleString(),
    },
    {
      label: "Engagement",
      value: Number(stats.engagement || 0).toLocaleString(),
    },
    {
      label: "Unique clicks",
      value: Number(stats.trackingClicks || 0).toLocaleString(),
    },
    {
      label: "Total visits",
      value: Number(stats.trackingVisits || 0).toLocaleString(),
    },
    {
      label: "Verified proofs",
      value: Number(stats.verifiedProofs || 0).toLocaleString(),
    },
    { label: "Proof submissions", value: String(campaign.proofs?.length || 0) },
  ];
  return (
    <section className="business-profile-card">
      <h2>Proof + Generated Stats</h2>
      <div className="workflow-inline-metrics">
        {items.map((item) => (
          <article key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </div>
      <p>
        <FiCheckCircle aria-hidden="true" /> Stats use OCR-verified analytics
        screenshots and measured creator-link clicks.
      </p>
    </section>
  );
}

function LiveClickProgress({ campaign }) {
  const acceptances = campaign.acceptances || [];
  const totalClicks = acceptances.reduce(
    (total, acceptance) => total + Number(acceptance.trackingClicks || 0),
    0,
  );
  const totalVisits = acceptances.reduce(
    (total, acceptance) => total + Number(acceptance.trackingVisits || 0),
    0,
  );

  return (
    <section className="business-profile-card business-marketing-live-progress">
      <header>
        <div>
          <span className="business-marketing-live-icon" aria-hidden="true"><FiBarChart2 /></span>
          <div>
            <h2>Live Campaign Performance</h2>
            <p>Tracked-link results update automatically while the campaign is active.</p>
          </div>
        </div>
        <em><i /> Live</em>
      </header>
      <div className="business-marketing-live-summary">
        <article aria-live="polite">
          <FiMousePointer aria-hidden="true" />
          <div><strong>{totalClicks.toLocaleString()}</strong><span>Unique clicks</span></div>
        </article>
        <article className="is-visits" aria-live="polite">
          <FiRepeat aria-hidden="true" />
          <div><strong>{totalVisits.toLocaleString()}</strong><span>Total visits</span></div>
        </article>
        <div className="business-marketing-creator-clicks">
          {acceptances.length ? acceptances.map((acceptance, index) => {
            const creatorName = acceptance.student
              ? `${acceptance.student.firstName} ${acceptance.student.lastName}`.trim()
              : `Campaigner ${index + 1}`;
            return (
              <article key={acceptance.id || acceptance.studentId}>
                <span className="business-marketing-creator-avatar">{creatorName.slice(0, 1)}</span>
                <div><strong>{creatorName}</strong><small>{acceptance.promoCode || "Tracked creator link"}</small></div>
                <p>
                  <strong>{Number(acceptance.trackingClicks || 0).toLocaleString()} unique</strong>
                  <span>{Number(acceptance.trackingVisits || 0).toLocaleString()} total visits</span>
                </p>
              </article>
            );
          }) : (
            <p className="business-marketing-no-clicks">Creator-level clicks will appear after a student picks up this campaign.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function Overview({ campaign }) {
  return (
    <>
      <LiveClickProgress campaign={campaign} />
      <section className="business-profile-card business-marketing-overview-card">
        <div>
          <h2>About This Campaign</h2>
          <DetailList rows={campaign.detail.overview} />
          <div className="business-marketing-document-actions">
            <button type="button" className="business-profile-ghost-btn">
              <FiFileText aria-hidden="true" />
              View Brand Guidelines
            </button>
            <button type="button" className="business-profile-ghost-btn">
              <FiDownload aria-hidden="true" />
              Download Brief
            </button>
          </div>
        </div>
        <aside>
          <h2>Campaign Timeline</h2>
          <Timeline events={campaign.detail.timeline} />
        </aside>
      </section>
      <ProofStats campaign={campaign} />
      {campaign.detail.creators.length ? (
        <BusinessMarketingCreatorTable campaign={campaign} />
      ) : null}
    </>
  );
}

function MetricCards({ items }) {
  return (
    <section className="business-marketing-simple-grid">
      {items.map((item) => (
        <article key={item.label}>
          <strong>{item.value}</strong>
          <h2>{item.label}</h2>
          <p>{item.detail}</p>
        </article>
      ))}
    </section>
  );
}

function SimpleList({ items, title }) {
  return (
    <section className="business-profile-card business-marketing-simple-list">
      <h2>{title}</h2>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function BusinessMarketingCampaignBody({
  activeTab,
  campaign,
}) {
  if (activeTab === "creators") {
    return <BusinessMarketingCreatorTable campaign={campaign} />;
  }

  if (activeTab === "outlets") {
    return <BusinessMarketingOutlets campaign={campaign} />;
  }

  if (activeTab === "performance") {
    return (
      <>
        <LiveClickProgress campaign={campaign} />
        <MetricCards
          items={campaign.detail.performance.map((item) => ({
            label: item.label,
            value: item.value,
            detail: item.change,
          }))}
        />
      </>
    );
  }

  if (activeTab === "payments") {
    return (
      <MetricCards
        items={campaign.detail.budget.map((item) => ({
          label: item.label,
          value: item.amount,
          detail: `${item.percent}% of campaign budget`,
        }))}
      />
    );
  }

  if (activeTab === "activity") {
    return (
      <SimpleList title="Campaign Activity" items={campaign.detail.activity} />
    );
  }

  return <Overview campaign={campaign} />;
}
