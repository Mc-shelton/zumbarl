import { useWheelStoryProgress } from '../../features/home/hooks/useWheelStoryProgress'
import WheelPanel from './WheelPanel'
import WheelStage from './WheelStage'

export default function WheelStory() {
  const {
    activeIndex,
    getCalloutState,
    sectionRef,
    wheelRotation,
  } = useWheelStoryProgress()

  return (
    <section className="wheel-story" ref={sectionRef} aria-label="Zumbarl growth wheel">
      <div className="wheel-story-sticky">
        <div className="container wheel-story-layout">
          <WheelStage getCalloutState={getCalloutState} wheelRotation={wheelRotation} />
          <WheelPanel activeIndex={activeIndex} />
        </div>
      </div>
    </section>
  )
}
