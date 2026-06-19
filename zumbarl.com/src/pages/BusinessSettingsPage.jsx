import { FiCreditCard, FiPlus, FiShield } from 'react-icons/fi'
import Seo from '../components/Seo'
import { BusinessWorkspaceHeader } from '../features/business/components/BusinessWorkspaceHeader'
import { BusinessWorkspaceSidebar } from '../features/business/components/BusinessApplicantSidebar'
import '../styles/campus.css'
import '../styles/business.css'

const SAVED_PAYMENT_METHODS = [
  { id: 'visa-8421', brand: 'Visa', label: 'Visa ending 8421', meta: 'Expires 08/28', status: 'Default' },
  { id: 'mastercard-1134', brand: 'Mastercard', label: 'Mastercard ending 1134', meta: 'Expires 11/27', status: 'Backup' },
]

function BusinessSettingsPage() {
  return (
    <main className="campus-page business-workspace-page business-settings-page">
      <Seo
        title="Business Settings | Zumbarl"
        description="Manage Zumbarl business account settings, payment methods, and security preferences."
        path="/business/settings"
      />

      <div className="campus-stage">
        <div className="campus-shell business-workspace-shell">
          <BusinessWorkspaceSidebar activeItemId="settings" />

          <section className="campus-main business-workspace-main business-settings-main">
            <BusinessWorkspaceHeader
              title="Settings"
              description="Manage account preferences, payment methods and business workspace controls."
              primaryActionHref="/business/opportunities/create"
              primaryActionLabel="Create Opportunity"
            />

            <section id="payment-methods" className="business-profile-card business-settings-payment-card">
              <header>
                <div>
                  <h2>Payment Methods</h2>
                  <p>Select cards for opportunity funding, escrow payments and business invoices.</p>
                </div>
                <button type="button" className="business-profile-primary-btn">
                  <FiPlus aria-hidden="true" />
                  Add Card
                </button>
              </header>

              <div className="business-settings-card-list">
                {SAVED_PAYMENT_METHODS.map((method) => (
                  <article key={method.id}>
                    <span aria-hidden="true"><FiCreditCard /></span>
                    <div>
                      <strong>{method.label}</strong>
                      <p>{method.brand} · {method.meta}</p>
                    </div>
                    <em>{method.status}</em>
                  </article>
                ))}
              </div>

              <footer>
                <FiShield aria-hidden="true" />
                <p>Cards are tokenized by the payment provider. Zumbarl only stores a secure payment reference.</p>
              </footer>
            </section>
          </section>
        </div>
      </div>
    </main>
  )
}

export default BusinessSettingsPage
