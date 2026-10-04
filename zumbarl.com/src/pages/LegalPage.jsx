import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import Seo from '../components/Seo'
import Header from '../components/home/Header'
import '../styles/legal.css'

const LAST_UPDATED = '30 September 2026'

const DOCUMENTS = {
  privacy: {
    title: 'Privacy Notice',
    description: 'How Zumbarl collects, uses, shares, protects and retains personal data.',
    sections: [
      ['Who controls your data', <p key="controller">Zumbarl, an OlsCorpe subsidiary operating in Kenya, determines how personal data is used on the platform. Privacy requests can be sent to <a href="mailto:privacy@zumbarl.com">privacy@zumbarl.com</a>. General support is available at <a href="mailto:help@zumbarl.com">help@zumbarl.com</a>.</p>],
      ['Data we collect', <ul key="data"><li>Account, contact, campus, education and business-profile information.</li><li>Identity and verification records when a feature requires KYC.</li><li>Applications, work submissions, messages, reviews, marketplace activity and support requests.</li><li>Payment references and transaction status. Payment credentials are handled by the applicable payment provider.</li><li>Device, security, access-log, approximate location and usage information needed to operate and protect the service.</li><li>Sensitive wellbeing or safety information only when you choose to use those features or request human support.</li></ul>],
      ['Why we use it', <p key="purpose">We use personal data to provide accounts and platform features, match students and businesses, process and reconcile payments, prevent fraud, protect users, respond to support requests, meet legal obligations, and improve service reliability. We do not sell personal data.</p>],
      ['Who receives it', <p key="sharing">Information is shared only as needed with the people you interact with, authorized Zumbarl personnel, institutions or businesses you explicitly engage, and contracted providers such as hosting, communications, object-storage and payment services. Public profile information is clearly separated from private account, KYC, finance and wellbeing records.</p>],
      ['International processing', <p key="transfer">Some contracted technology providers may process information outside Kenya. Zumbarl must assess those providers and use appropriate contractual, security and legal safeguards before production data is transferred.</p>],
      ['Retention and deletion', <p key="retention">We keep information only for the feature’s operational purpose and any applicable legal, fraud-prevention, accounting or dispute period. KYC, finance, safety and transaction records may need to be retained after account closure. Other information should be deleted or anonymized when it is no longer needed. Formal production retention periods require final legal approval before public launch.</p>],
      ['Your choices and rights', <p key="rights">You may ask to access, correct, object to processing, restrict optional use, receive a portable copy, or request deletion of eligible personal data. Send a request from your registered email to <a href="mailto:privacy@zumbarl.com">privacy@zumbarl.com</a>. We may verify your identity and preserve records that law or an active dispute requires us to keep. You may also raise a complaint with Kenya’s Office of the Data Protection Commissioner.</p>],
      ['Security and incidents', <p key="security">Zumbarl uses access controls, encryption in transit, private file storage, audit records and session revocation. No service can promise absolute security. Report a suspected privacy or security incident immediately to <a href="mailto:privacy@zumbarl.com">privacy@zumbarl.com</a>.</p>],
      ['Changes', <p key="changes">Material changes will receive a new policy version and, where required, renewed notice or consent. The version accepted during registration is recorded with the account.</p>],
    ],
  },
  terms: {
    title: 'Terms of Use',
    description: 'The rules for using Zumbarl accounts, work, marketplace, communication and payment features.',
    sections: [
      ['Agreement', <p key="agreement">These Terms govern use of Zumbarl. By creating an account, you confirm that the information you provide is accurate, that you have legal capacity to agree, and that you accept the version shown at registration. If you act for an organization, you confirm that you are authorized to do so.</p>],
      ['Accounts and verification', <p key="accounts">Keep your sign-in methods secure and promptly report unauthorized access. Zumbarl may require email, identity, business, campus or payment verification before enabling sensitive capabilities. You may not impersonate another person, create deceptive accounts or bypass access controls.</p>],
      ['Acceptable use', <ul key="acceptable"><li>Do not harass, exploit, discriminate against or endanger another user.</li><li>Do not upload unlawful, deceptive, infringing, malicious or privacy-invasive content.</li><li>Do not manipulate reviews, trust scores, applications, payments or verification evidence.</li><li>Do not scrape, probe, overload or interfere with the platform or another account.</li><li>Follow campus, workplace, marketplace and safety rules that apply to an activity.</li></ul>],
      ['Work and marketplace activity', <p key="work">Users are responsible for reviewing scopes, deliverables, prices, deadlines, locations and handoff conditions before accepting work or an order. Businesses and sellers must describe offers truthfully. Students and buyers must submit accurate evidence and use dispute channels in good faith.</p>],
      ['Payments', <p key="payments">Payment availability depends on configured providers such as M-Pesa. Provider delays, reversals and verification requirements may apply. Zumbarl may hold or block a transaction where required for reconciliation, fraud review, KYC, a dispute or law. Production money movement must not be enabled until the applicable workflow and provider have passed launch sign-off.</p>],
      ['Content and intellectual property', <p key="content">You retain ownership of content you create. You grant Zumbarl the limited permission needed to store, process and display it for the service and the audiences you select. You must have rights to everything you upload. Zumbarl branding, software and platform materials may not be copied or misrepresented.</p>],
      ['Safety, moderation and suspension', <p key="safety">Zumbarl may restrict content, transactions or accounts to investigate fraud, abuse, safety concerns, legal requests or Terms violations. Urgent situations should be reported to local emergency services; Zumbarl is not an emergency-response service.</p>],
      ['Service availability', <p key="availability">Features may change, pause or be withdrawn. Zumbarl will use reasonable care to operate the service but cannot guarantee uninterrupted availability, employment, earnings, matches, sales or outcomes.</p>],
      ['Liability and disputes', <p key="liability">To the extent permitted by Kenyan law, each user remains responsible for their conduct, agreements, tax obligations and offline activity. These Terms are governed by Kenyan law. Contact <a href="mailto:help@zumbarl.com">help@zumbarl.com</a> first so the parties can attempt to resolve a dispute in good faith.</p>],
      ['Changes', <p key="changes">Material changes will be versioned and communicated. Continued use may require acceptance of updated Terms.</p>],
    ],
  },
  safety: {
    title: 'Safety and Community Rules',
    description: 'Practical safety boundaries for work, marketplace, communication and wellbeing features.',
    sections: [
      ['Emergencies', <p key="emergency">Zumbarl is not an emergency service. If someone is in immediate danger, contact Kenya emergency services or trusted local support. Do not wait for an in-app response.</p>],
      ['Meeting and delivery safety', <ul key="meeting"><li>Use public, approved or staffed locations for first meetings and handoffs.</li><li>Do not accept requests to move payments or sensitive conversations outside approved channels.</li><li>Verify the person, organization, scope and location before travel or work begins.</li><li>Stop and report an activity if its identity, location, timing or requested conduct changes unexpectedly.</li></ul>],
      ['Sensitive information', <p key="sensitive">Never post identity documents, payment credentials, private health information or another person’s location publicly. KYC and support records belong only in the designated private flows.</p>],
      ['Reporting', <p key="reporting">Use in-product reporting where available. Report fraud to <a href="mailto:fraud@zumbarl.com">fraud@zumbarl.com</a>, immediate platform safety concerns to <a href="mailto:violence@zumbarl.com">violence@zumbarl.com</a>, and general issues to <a href="mailto:help@zumbarl.com">help@zumbarl.com</a>.</p>],
      ['Wellbeing privacy', <p key="wellbeing">Wellbeing tools do not replace professional medical care. Named follow-up should occur only after explicit consent. Alias and voice features reduce exposure but cannot guarantee anonymity.</p>],
    ],
  },
}

function LegalPage({ document }) {
  const content = DOCUMENTS[document] || DOCUMENTS.privacy

  return (
    <main className="page legal-page">
      <Seo title={`${content.title} | Zumbarl`} description={content.description} path={`/${document}`} />
      <Header />
      <header className="legal-hero">
        <div className="container">
          <span>Zumbarl policies</span>
          <h1>{content.title}</h1>
          <p>{content.description}</p>
          <small>Last updated: {LAST_UPDATED}</small>
        </div>
      </header>
      <div className="container legal-layout">
        <nav aria-label="Policy documents">
          <Link className={document === 'privacy' ? 'is-current' : ''} to="/privacy">Privacy</Link>
          <Link className={document === 'terms' ? 'is-current' : ''} to="/terms">Terms</Link>
          <Link className={document === 'safety' ? 'is-current' : ''} to="/safety">Safety</Link>
        </nav>
        <article>
          <aside className="legal-review-notice"><strong>Operational policy</strong><span>This text reflects the controls currently implemented or required for launch. Kenyan legal counsel and the designated data-protection owner must approve it before unrestricted public release.</span></aside>
          {content.sections.map(([heading, body]) => <section key={heading}><h2>{heading}</h2>{body}</section>)}
        </article>
      </div>
      <Footer />
    </main>
  )
}

export default LegalPage
