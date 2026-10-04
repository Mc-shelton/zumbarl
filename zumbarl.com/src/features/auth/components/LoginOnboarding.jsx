import { useEffect, useRef, useState } from 'react'
import { HiArrowLeft, HiArrowRight } from 'react-icons/hi2'
import { AppBrandDefinition } from '../../../components/AppBrandLoader'

const ONBOARDING_SLIDES = [
  {
    id: 'meaning',
    title: 'Welcome to Zumbarl.',
    body: 'Find your campus. Build what’s next.',
    visual: 'meaning',
  },
  {
    id: 'community',
    kicker: 'Belong',
    title: 'Find your campus.',
    body: 'Meet students, creators and campus communities that share what you care about.',
    image: '/assets/auth-onboarding/find-your-people.webp',
    alt: 'Students connecting and sharing ideas together on campus',
  },
  {
    id: 'proof',
    kicker: 'Create',
    title: 'Turn skills into proof.',
    body: 'Learn by doing, share your work and build a portfolio that grows with every project.',
    image: '/assets/auth-onboarding/build-your-proof.webp',
    alt: 'A student creator building a portfolio at a bright studio desk',
  },
  {
    id: 'opportunity',
    kicker: 'Grow',
    title: 'Make your next Transition.',
    body: 'Find paid work, collaborate with campus businesses and grow through real experience.',
    image: '/assets/auth-onboarding/make-your-move.webp',
    alt: 'A student and a campus business owner beginning a new collaboration',
  },
]

const SWIPE_THRESHOLD = 42

const PROFILE_MOSAIC_IMAGES = {
  portraitOne: '/assets/auth-onboarding/portraits/student-portrait-1.webp',
  portraitTwo: '/assets/auth-onboarding/portraits/student-portrait-2.webp',
  portraitThree: '/assets/auth-onboarding/portraits/student-portrait-3.webp',
  portraitFour: '/assets/auth-onboarding/portraits/student-portrait-4.webp',
  portraitFive: '/assets/auth-onboarding/portraits/student-portrait-5.webp',
  portraitSix: '/assets/auth-onboarding/portraits/student-portrait-6.webp',
  friends: '/assets/index/business_page_images/optimized/bruno-ngarukiye-IzEcrYJ1G34-unsplash.webp',
  creator: '/assets/index/business_page_images/optimized/vlad-hilitanu-1FI2QAYPa-Y-unsplash.webp',
  students: '/assets/index/business_page_images/optimized/ernest-malimon-XLIywCaTs_M-unsplash.webp',
  team: '/assets/index/business_page_images/optimized/leeder-bose-ne0gCdlSoew-unsplash.webp',
  outdoors: '/assets/index/business_page_images/optimized/toa-heftiba-O3ymvT7Wf9U-unsplash.webp',
  city: '/assets/index/business_page_images/optimized/0xk-y5n-nhkRd7U-unsplash.webp',
  planning: '/assets/index/business_page_images/optimized/alejandro-escamilla-BbQLHCpVUqA-unsplash.webp',
  hiking: '/assets/index/business_page_images/optimized/justin-buisson-vIluu0IH6Ps-unsplash.webp',
  meeting: '/assets/index/business_page_images/optimized/mapbox-ZT5v0puBjZI-unsplash.webp',
  presentation: '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp',
  collaborators: '/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp',
  classroom: '/assets/index/business_page_images/optimized/product-school-XZkk5xT8Xrk-unsplash.webp',
  coast: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
  adventure: '/assets/index/business_page_images/optimized/sayan-nath-RP1uj-umiKk-unsplash.webp',
  collective: '/assets/index/business_page_images/optimized/setengah-limasore-qUcZ3TUlgnM-unsplash.webp',
  hike: '/assets/index/business_page_images/optimized/igor-rodrigues-Wn932wwnpSE-unsplash.webp',
}

const PROFILE_MOSAIC_TILES = [
  { image: 'friends', position: '30% 38%', shape: 'round' },
  { tone: 'soft' },
  { image: 'portraitOne' },
  { image: 'students', position: '22% 45%', shape: 'corner-tr' },
  { tone: 'accent' },
  { image: 'team', position: '18% 38%' },
  { image: 'portraitTwo', position: '18% 42%' },
  { image: 'creator', position: '50% 28%' },
  { tone: 'soft', shape: 'round' },
  { image: 'city' },
  { image: 'outdoors', position: '50% 42%', shape: 'corner-bl' },
  { tone: 'accent' },
  { image: 'hike', shape: 'round' },
  { image: 'portraitThree', position: '50% 44%' },
  { tone: 'soft', position: '50% 48%' },
  { tone: 'soft' },
  { image: 'meeting', position: '58% 42%' },
  { image: 'planning', position: '44% 42%' },
  { tone: 'accent', shape: 'round' },
  { image: 'collaborators', position: '45% 40%' },
  { image: 'classroom', position: '50% 45%', shape: 'corner-br' },
  { tone: 'soft' },
  { image: 'portraitFive' },
  { image: 'coast', position: '50% 42%' },
  { image: 'adventure', position: '50% 34%', shape: 'round' },
  { image: 'soft', position: '50% 42%' },
  { tone: 'accent' },
  { image: 'hiking', position: '50% 48%' },
  { image: 'portraitSix', shape: 'corner-tr' },
  { tone: 'soft', shape: 'round' },
]

function ProfileMosaic() {
  return (
    <div className="login-onboarding-profile-mosaic" aria-hidden="true">
      {PROFILE_MOSAIC_TILES.map((tile, index) => (
        <span
          className={[
            'login-onboarding-profile-tile',
            tile.tone ? `is-${tile.tone}` : 'has-photo',
            tile.shape ? `is-${tile.shape}` : '',
          ].filter(Boolean).join(' ')}
          key={`${tile.image || tile.tone}-${index}`}
        >
          {tile.image ? (
            <img
              src={PROFILE_MOSAIC_IMAGES[tile.image]}
              alt=""
              style={{ objectPosition: tile.position }}
              draggable="false"
            />
          ) : null}
        </span>
      ))}
    </div>
  )
}

function LoginOnboarding({ onComplete }) {
  const [activeSlide, setActiveSlide] = useState(0)
  const touchStartX = useRef(null)
  const lastSlide = ONBOARDING_SLIDES.length - 1

  const goToSlide = (index) => {
    setActiveSlide(Math.min(Math.max(index, 0), lastSlide))
  }

  const handleNext = () => {
    if (activeSlide === lastSlide) {
      onComplete()
      return
    }

    goToSlide(activeSlide + 1)
  }

  const handleTouchStart = (event) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null
  }

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return

    const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX.current
    const distance = touchEndX - touchStartX.current
    touchStartX.current = null

    if (Math.abs(distance) < SWIPE_THRESHOLD) return
    if (distance < 0 && activeSlide < lastSlide) goToSlide(activeSlide + 1)
    if (distance > 0 && activeSlide > 0) goToSlide(activeSlide - 1)
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight') {
        if (activeSlide === lastSlide) onComplete()
        else setActiveSlide((index) => Math.min(index + 1, lastSlide))
      }
      if (event.key === 'ArrowLeft' && activeSlide > 0) {
        setActiveSlide((index) => Math.max(index - 1, 0))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeSlide, lastSlide, onComplete])

  return (
    <section className="login-onboarding" aria-label="Welcome to Zumbarl">
      <div
        className="login-onboarding-viewport"
        role="region"
        aria-roledescription="carousel"
        aria-label="What you can do on Zumbarl"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="login-onboarding-track"
          style={{ transform: `translate3d(-${activeSlide * 100}%, 0, 0)` }}
        >
          {ONBOARDING_SLIDES.map((slide, index) => (
            <article
              key={slide.id}
              className={`login-onboarding-slide is-${slide.id}`}
              aria-hidden={activeSlide !== index}
            >
              <div className="login-onboarding-visual">
                {slide.visual === 'meaning' ? (
                  <>
                    <ProfileMosaic />
                    <div className="login-onboarding-meaning">
                      <span className="app-brand-loader-mark login-onboarding-welcome-bee" aria-hidden="true">
                        <img src="/assets/index/bee_nobg.png" alt="" />
                      </span>
                      <AppBrandDefinition />
                    </div>
                  </>
                ) : (
                  <img src={slide.image} alt={slide.alt} draggable="false" />
                )}
              </div>

              {slide.visual !== 'meaning' ? (
                <div className="login-onboarding-copy">
                  {slide.kicker ? <p className="login-onboarding-kicker">{slide.kicker}</p> : null}
                  <h1>{slide.title}</h1>
                  <p className="login-onboarding-body">{slide.body}</p>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>

      <footer className="login-onboarding-footer">
        <div className="login-onboarding-progress">
          <span className="login-onboarding-count" aria-live="polite">
            {activeSlide + 1} of {ONBOARDING_SLIDES.length}
          </span>
          <div className="login-onboarding-dots" aria-label="Choose a welcome slide">
            {ONBOARDING_SLIDES.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={activeSlide === index ? 'is-active' : ''}
                aria-label={`Go to slide ${index + 1}: ${slide.title}`}
                aria-current={activeSlide === index ? 'step' : undefined}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        </div>

        <div className="login-onboarding-actions">
          <button
            type="button"
            className="login-onboarding-back"
            aria-label="Previous slide"
            disabled={activeSlide === 0}
            onClick={() => goToSlide(activeSlide - 1)}
          >
            <HiArrowLeft aria-hidden="true" />
          </button>
          <button type="button" className="login-onboarding-next" onClick={handleNext}>
            <span>{activeSlide === lastSlide ? 'Continue to sign in' : 'Next'}</span>
            <HiArrowRight aria-hidden="true" />
          </button>
        </div>
      </footer>
    </section>
  )
}

export default LoginOnboarding
