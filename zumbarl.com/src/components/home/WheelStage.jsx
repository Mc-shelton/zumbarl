import { WHEEL_IMAGE } from '../../features/home/constants'
import WheelCallouts from './WheelCallouts'

function WheelStage({ getCalloutState, wheelRotation }) {
  return (
    <div className="wheel-stage">
      <div className="wheel-viewport">
        <div
          className="topic-wheel"
          style={{
            '--wheel-rotation': `${wheelRotation.toFixed(2)}deg`,
          }}
        >
          <img className="topic-wheel-image" src={WHEEL_IMAGE} alt="" aria-hidden="true" loading="lazy" />
          <div className="topic-wheel-core">
            <span className="topic-wheel-wordmark">zumbarl.</span>
          </div>
          <WheelCallouts getCalloutState={getCalloutState} />
        </div>
      </div>
    </div>
  )
}

export default WheelStage
