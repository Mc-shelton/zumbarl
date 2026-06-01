import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import AuthPage from './pages/AuthPage'
import BusinessPage from './pages/BusinessPage'
import CampusPage from './pages/CampusPage'
import CampusCartOrderPlacedPage from './pages/CampusCartOrderPlacedPage'
import CampusCartPage from './pages/CampusCartPage'
import CampusCartPaymentPage from './pages/CampusCartPaymentPage'
import CampusCartReviewPage from './pages/CampusCartReviewPage'
import CampusProfilePage from './pages/CampusProfilePage'
import ExploreCampusPage from './pages/ExploreCampusPage'
import HelpPage from './pages/HelpPage'
import HomePage from './pages/HomePage'
import OpportunityPlaceBidPage from './pages/OpportunityPlaceBidPage'
import OpportunitiesPage from './pages/OpportunitiesPage'
import OpportunitiesBuySellPage from './pages/OpportunitiesBuySellPage'
import OpportunitiesBuySellProductPage from './pages/OpportunitiesBuySellProductPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/campus" element={<CampusPage />} />
      <Route path="/campus/cart" element={<CampusCartPage />} />
      <Route path="/campus/cart/payment" element={<CampusCartPaymentPage />} />
      <Route path="/campus/cart/review" element={<CampusCartReviewPage />} />
      <Route path="/campus/cart/order-placed" element={<CampusCartOrderPlacedPage />} />
      <Route path="/campus/profile" element={<CampusProfilePage />} />
      <Route path="/campus/explore" element={<ExploreCampusPage />} />
      <Route path="/campus/opportunities" element={<OpportunitiesPage />} />
      <Route path="/campus/opportunities/buy-sell" element={<OpportunitiesBuySellPage />} />
      <Route path="/campus/opportunities/buy-sell/:itemId" element={<OpportunitiesBuySellProductPage />} />
      <Route path="/campus/opportunities/:opportunityId/place-bid" element={<OpportunityPlaceBidPage />} />
      <Route path="/campus/opportunities/jobs-gigs" element={<Navigate to="/campus/opportunities" replace />} />
      <Route path="/business" element={<BusinessPage />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/login" element={<AuthPage defaultMode="login" />} />
      <Route path="/register" element={<AuthPage defaultMode="register" />} />
      <Route path="/web/login" element={<Navigate to="/login" replace />} />
      <Route path="/web/login.html" element={<Navigate to="/login" replace />} />
      <Route path="/web/signup" element={<Navigate to="/register" replace />} />
      <Route path="/web/signup.html" element={<Navigate to="/register" replace />} />
      <Route path="/trial.html" element={<Navigate to="/register" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
