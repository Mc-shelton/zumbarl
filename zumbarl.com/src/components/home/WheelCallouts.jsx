import { HERO_DOODLE } from '../../features/home/constants'
import { WHEEL_CALLOUTS } from '../../features/home/wheelStoryData'

function WheelCallouts({ getCalloutState }) {
  return (
    <>
      {WHEEL_CALLOUTS.map((callout) => (
        <div
          key={callout.label}
          className={`wheel-callout ${callout.className} ${getCalloutState(callout.stateIndex)}`}
        >
          <span>{callout.label}</span>
          {callout.showDoodle ? (
            <img
              className="wheel-callout-arrow wheel-callout-arrow-doodle"
              src={HERO_DOODLE}
              alt=""
              aria-hidden="true"
              loading="lazy"
            />
          ) : null}
        </div>
      ))}
    </>
  )
}

export default WheelCallouts
