import { useEffect, useState } from 'react'
import { FiCreditCard, FiShield } from 'react-icons/fi'
import Seo from '../components/Seo'
import { BusinessCompanyProfileCard } from '../features/business/components/BusinessCompanyProfileCard'
import { BusinessWorkspaceHeader } from '../features/business/components/BusinessWorkspaceHeader'
import { BusinessWorkspaceSidebar } from '../features/business/components/BusinessApplicantSidebar'
import { listBackendFinanceWallets } from '../features/business/services/persistBusinessOpportunity'
import '../styles/campus.css'
import '../styles/business.css'

function formatWalletBalance(wallet) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: wallet.currency || 'KES',
  }).format(Number(wallet.availableBalance ?? wallet.balance ?? 0))
}

function BusinessSettingsPage() {
  const [wallets, setWallets] = useState([])
  const [walletsLoading, setWalletsLoading] = useState(true)
  const [walletsError, setWalletsError] = useState('')

  useEffect(() => {
    let active = true
    listBackendFinanceWallets()
      .then((response) => {
        if (active) setWallets(Array.isArray(response?.data) ? response.data : [])
      })
      .catch((error) => {
        if (active) setWalletsError(error.message || 'Company wallet details could not be loaded.')
      })
      .finally(() => {
        if (active) setWalletsLoading(false)
      })
    return () => { active = false }
  }, [])

  return (
    <main className="campus-page business-workspace-page business-settings-page">
      <Seo
        title="Business Settings | Zumbarl"
        description="Manage Zumbarl business account settings, wallets, and security preferences."
        path="/business/settings"
      />

      <div className="campus-stage">
        <div className="campus-shell business-workspace-shell">
          <BusinessWorkspaceSidebar activeItemId="settings" />

          <section className="campus-main business-workspace-main business-settings-main">
            <BusinessWorkspaceHeader
              title="Settings"
              description="Manage your company profile, funding wallet and business workspace controls."
              primaryActionHref="/business/opportunities/create"
              primaryActionLabel="Create Opportunity"
            />

            <BusinessCompanyProfileCard />

            <section id="payment-methods" className="business-profile-card business-settings-payment-card">
              <header>
                <div>
                  <h2>Funding Wallets</h2>
                  <p>Wallet balances used for opportunity funding, escrow payments, and business transactions.</p>
                </div>
              </header>

              {walletsLoading ? <p aria-live="polite">Loading company wallets…</p> : null}
              {walletsError ? <p role="alert">{walletsError}</p> : null}
              {!walletsLoading && !walletsError && !wallets.length ? <p>No company wallet is available for this account.</p> : null}

              <div className="business-settings-card-list">
                {wallets.map((wallet) => (
                  <article key={wallet.id}>
                    <span aria-hidden="true"><FiCreditCard /></span>
                    <div>
                      <strong>{wallet.name || (wallet.type === 'COMPANY' ? 'Company Wallet' : wallet.type)}</strong>
                      <p>{formatWalletBalance(wallet)} available</p>
                    </div>
                    <em>{wallet.status || 'Active'}</em>
                  </article>
                ))}
              </div>

              <footer>
                <FiShield aria-hidden="true" />
                <p>Wallet funding and escrow movements are recorded by the finance ledger. Card storage is not enabled.</p>
              </footer>
            </section>
          </section>
        </div>
      </div>
    </main>
  )
}

export default BusinessSettingsPage
