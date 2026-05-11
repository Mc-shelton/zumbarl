import './App.css'
import Footer from './components/Footer'
import {
  AppsWall,
  CommunityProof,
  GrowthCta,
  Header,
  Hero,
  WheelStory,
} from './components/home'

function App() {
  return (
    <main className="page">
      <Header />
      <div id="wrap" className="x_wd">
        <Hero />
        <AppsWall />
        <WheelStory />
        <CommunityProof />
        <GrowthCta />
      </div>
      <Footer />
    </main>
  )
}

export default App
