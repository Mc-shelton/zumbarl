import { memo } from 'react'
import { HERO_DOODLE } from '../../features/home/constants'

function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <h1 className="display-1">
          Where real life meets <span className="x_wd_yellow_highlight_bold_05">campus.</span>
        </h1>
        <h2 className="display-3">
          Simple growth, yet you{' '}
          <span className="x_wd_blue_highlight_01">
            Become!
            <em className="x_wd_doodle">
              <img src={HERO_DOODLE} className="doodle-arrow" width="50" alt="" loading="lazy" />
              <span>
                Campus'
                <br />
                not for struggle.
              </span>
            </em>
          </span>
        </h2>

        <div className="hero-actions">
          <a href="trial.html" className="btn-primary">
            For Campus
          </a>
          <a href="appointment.html" className="btn-light">
            For Business
          </a>
        </div>
      </div>
    </section>
  )
}

export default memo(Hero)
