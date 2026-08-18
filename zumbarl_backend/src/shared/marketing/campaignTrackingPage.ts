import { escapeHtmlAttribute } from './linkPreview.js'

function absoluteUrl(value: string, origin: string) {
  try {
    return value ? new URL(value, origin).toString() : ''
  } catch {
    return ''
  }
}

function destinationHost(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, '')
  } catch {
    return 'campaign destination'
  }
}

function renderCampaignTrackingPage(tracking: Record<string, any>, origin: string) {
  const campaign = tracking.campaign || {}
  const preview = campaign.linkPreview && typeof campaign.linkPreview === 'object' ? campaign.linkPreview : {}
  const title = String(preview.title || campaign.title || 'Zumbarl Campaign')
  const description = String(preview.description || campaign.description || 'View this campaign from a Zumbarl creator.')
  const imageUrl = absoluteUrl(String(preview.imageUrl || campaign.previewImage || ''), origin)
  const destinationUrl = String(tracking.trackingDestinationUrl)
  const destinationName = destinationHost(destinationUrl)
  const trackingUrl = absoluteUrl(`/api/v1/marketing/track/${tracking.trackingToken}`, origin)
  const imageTags = imageUrl
    ? `<meta property="og:image" content="${escapeHtmlAttribute(imageUrl)}"><meta name="twitter:image" content="${escapeHtmlAttribute(imageUrl)}">`
    : ''
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtmlAttribute(title)}</title>
  <meta name="description" content="${escapeHtmlAttribute(description)}">
  <meta property="og:title" content="${escapeHtmlAttribute(title)}">
  <meta property="og:description" content="${escapeHtmlAttribute(description)}">
  <meta property="og:type" content="${escapeHtmlAttribute(preview.type || 'website')}">
  <meta property="og:url" content="${escapeHtmlAttribute(trackingUrl)}">
  <meta property="og:site_name" content="${escapeHtmlAttribute(preview.siteName || 'Zumbarl')}">
  ${imageTags}
  <meta name="twitter:card" content="${imageUrl ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:title" content="${escapeHtmlAttribute(title)}">
  <meta name="twitter:description" content="${escapeHtmlAttribute(description)}">
  <link rel="canonical" href="${escapeHtmlAttribute(destinationUrl)}">
  <script defer src="/api/v1/marketing/track-client.js"></script>
  <noscript><meta http-equiv="refresh" content="0;url=${escapeHtmlAttribute(destinationUrl)}"></noscript>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; padding: 28px; background: #f4f1f4; color: #292733; display: grid; place-items: center; }
    .shell { width: min(920px, 100%); }
    .brand { margin: 0 0 16px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .wordmark { display: inline-flex; align-items: center; gap: 10px; color: #373643; font-size: 20px; font-weight: 850; letter-spacing: -.04em; }
    .mark { width: 34px; height: 34px; border-radius: 11px; background: #373643; color: #fbb130; display: grid; place-items: center; font-size: 17px; font-weight: 950; box-shadow: 0 7px 18px rgba(55,54,67,.16); }
    .verified { color: #6d6875; display: inline-flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 700; }
    .verified i { width: 8px; height: 8px; border-radius: 50%; background: #2ca772; box-shadow: 0 0 0 4px #dff4ea; }
    .card { border: 1px solid #e3dde5; border-radius: 26px; background: #fff; display: grid; grid-template-columns: minmax(300px,.9fr) minmax(0,1.1fr); overflow: hidden; box-shadow: 0 24px 70px rgba(48,39,51,.12); }
    .media { min-height: 440px; position: relative; overflow: hidden; background: linear-gradient(145deg, #302f3a 0%, #514154 100%); display: grid; place-items: center; }
    .media img { width: 100%; height: 100%; position: absolute; inset: 0; object-fit: cover; }
    .media::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(23,20,28,.02) 35%, rgba(23,20,28,.66)); }
    .media-fallback { width: 148px; height: 148px; border: 1px solid rgba(255,255,255,.18); border-radius: 42px; background: rgba(255,255,255,.09); color: #fff; display: grid; place-items: center; font-size: 58px; font-weight: 900; transform: rotate(-5deg); box-shadow: 0 25px 60px rgba(0,0,0,.2); }
    .media-label { position: absolute; z-index: 1; left: 24px; bottom: 22px; color: #fff; display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 750; }
    .media-label span { width: 8px; height: 8px; border-radius: 50%; background: #fbb130; }
    .content { padding: clamp(30px,5vw,54px); display: flex; flex-direction: column; justify-content: center; }
    .eyebrow { margin: 0; color: #74516f; font-size: 11px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 12px 0 0; color: #24222d; font-size: clamp(30px,4.4vw,46px); line-height: 1.06; letter-spacing: -.045em; }
    .description { margin: 16px 0 0; color: #6d6875; font-size: 15px; line-height: 1.65; }
    .destination { margin-top: 28px; padding: 13px 15px; border: 1px solid #e8e2e9; border-radius: 13px; background: #faf8fa; display: flex; align-items: center; justify-content: space-between; gap: 14px; }
    .destination span { color: #827b87; font-size: 11px; font-weight: 700; }
    .destination strong { max-width: 220px; overflow: hidden; color: #37333e; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
    .progress { height: 4px; margin-top: 22px; border-radius: 999px; background: #ece8ed; overflow: hidden; }
    .progress span { width: 45%; height: 100%; border-radius: inherit; background: linear-gradient(90deg,#74516f,#fbb130); display: block; animation: loading 1.1s ease-in-out infinite; }
    .status { margin: 9px 0 0; color: #7a7480; font-size: 11px; font-weight: 650; }
    .continue { min-height: 48px; margin-top: 22px; padding: 0 18px; border-radius: 13px; background: #373643; color: #fff; display: inline-flex; align-items: center; justify-content: center; gap: 9px; text-decoration: none; font-size: 14px; font-weight: 850; transition: transform .18s ease, background .18s ease; }
    .continue:hover { background: #74516f; transform: translateY(-1px); }
    .privacy { margin: 11px 0 0; color: #96909b; text-align: center; font-size: 10px; line-height: 1.45; }
    .foot { margin: 14px 0 0; color: #817b86; text-align: center; font-size: 11px; }
    @keyframes loading { 0% { transform: translateX(-110%); } 100% { transform: translateX(245%); } }
    @media (max-width: 700px) {
      body { padding: 16px; align-items: start; }
      .verified { display: none; }
      .card { grid-template-columns: 1fr; border-radius: 20px; }
      .media { min-height: 220px; }
      .content { padding: 28px 22px; }
      h1 { font-size: 32px; }
    }
    @media (prefers-reduced-motion: reduce) { .progress span { animation: none; width: 100%; } }
  </style>
</head>
<body data-tracking-token="${escapeHtmlAttribute(tracking.trackingToken)}" data-destination-url="${escapeHtmlAttribute(destinationUrl)}">
  <div class="shell">
    <header class="brand">
      <span class="wordmark"><span class="mark">z.</span> zumbarl.</span>
      <span class="verified"><i></i> Verified campaign link</span>
    </header>
    <main class="card">
      <div class="media">
        ${imageUrl ? `<img src="${escapeHtmlAttribute(imageUrl)}" alt="">` : `<span class="media-fallback">${escapeHtmlAttribute(title.slice(0, 1).toUpperCase())}</span>`}
        <span class="media-label"><span></span> Shared by a Zumbarl creator</span>
      </div>
      <section class="content">
        <p class="eyebrow">Campaign link</p>
        <h1>${escapeHtmlAttribute(title)}</h1>
        <p class="description">${escapeHtmlAttribute(description)}</p>
        <div class="destination"><span>Opening destination</span><strong>${escapeHtmlAttribute(destinationName)}</strong></div>
        <div class="progress" aria-hidden="true"><span></span></div>
        <p class="status" aria-live="polite">Recording your visit and opening the campaign…</p>
        <a class="continue" href="${escapeHtmlAttribute(destinationUrl)}">Continue now <span aria-hidden="true">→</span></a>
        <p class="privacy">The creator receives an anonymous click count. No personal browsing information is shared.</p>
        <noscript><p class="status">Automatic redirect is unavailable. Use “Continue now” above.</p></noscript>
      </section>
    </main>
    <p class="foot">Powered by Zumbarl campaign analytics</p>
  </div>
</body>
</html>`
}

const CAMPAIGN_TRACKING_CLIENT = `(() => {
  const token = document.body.dataset.trackingToken;
  const destination = document.body.dataset.destinationUrl;
  if (!token || !destination) return;
  let redirected = false;
  const go = () => {
    if (redirected) return;
    redirected = true;
    window.location.replace(destination);
  };
  fetch('/api/v1/marketing/track/' + encodeURIComponent(token) + '/click', {
    method: 'POST',
    credentials: 'same-origin',
    keepalive: true,
    headers: { accept: 'application/json' }
  }).finally(go);
  window.setTimeout(go, 1500);
})();`

export {
  CAMPAIGN_TRACKING_CLIENT,
  renderCampaignTrackingPage
}
