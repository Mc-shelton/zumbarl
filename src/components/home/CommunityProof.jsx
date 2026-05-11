import { useEffect, useState } from 'react'
import {
  COMMUNITY_ACCENT_SLOTS,
  COMMUNITY_CORNER_BL_SLOTS,
  COMMUNITY_CORNER_BR_SLOTS,
  COMMUNITY_CORNER_TL_SLOTS,
  COMMUNITY_CORNER_TR_SLOTS,
  COMMUNITY_DYNAMIC_SLOTS,
  COMMUNITY_IMAGE_FLOW_INTERVAL_MS,
  COMMUNITY_IMAGE_POOL,
  COMMUNITY_IMAGE_TILE_COOLDOWN_MS,
  COMMUNITY_ROUND_SLOTS,
  COMMUNITY_SOFT_SLOTS,
  COMMUNITY_TILE_COUNT,
  HERO_DOODLE,
  createCommunityTileMediaMap,
  getRandomPoolIndex,
} from '../../features/home/constants'

export default function CommunityProof() {
  const [tileMediaMap, setTileMediaMap] = useState(() => createCommunityTileMediaMap())

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined
    }

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    if (reducedMotionQuery.matches) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setTileMediaMap((previous) => {
        const nextMap = new Map(previous)
        const now = Date.now()
        const eligibleSlots = []

        COMMUNITY_DYNAMIC_SLOTS.forEach((slot) => {
          const currentSlotState = nextMap.get(slot)

          if (!currentSlotState) {
            return
          }

          if (now - currentSlotState.lastUpdatedAt < COMMUNITY_IMAGE_TILE_COOLDOWN_MS) {
            return
          }

          eligibleSlots.push(slot)
        })

        if (!eligibleSlots.length) {
          return previous
        }

        const randomSlot = eligibleSlots[Math.floor(Math.random() * eligibleSlots.length)]
        const currentSlotState = nextMap.get(randomSlot)

        if (!currentSlotState) {
          return previous
        }

        nextMap.set(randomSlot, {
          mediaIndex: getRandomPoolIndex(currentSlotState.mediaIndex),
          blinkId: currentSlotState.blinkId + 1,
          lastUpdatedAt: now,
        })

        return nextMap
      })
    }, COMMUNITY_IMAGE_FLOW_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  return (
    <section className="community-proof" aria-label="Zumbarl community">
      <div className="container community-proof-frame">
        <img
          className="community-proof-doodle community-proof-doodle-top"
          src={HERO_DOODLE}
          alt=""
          aria-hidden="true"
          loading="lazy"
        />
        <img
          className="community-proof-doodle community-proof-doodle-bottom"
          src={HERO_DOODLE}
          alt=""
          aria-hidden="true"
          loading="lazy"
        />
        <div className="community-proof-shell">
          <div className="community-proof-mosaic" aria-hidden="true">
            {Array.from({ length: COMMUNITY_TILE_COUNT }).map((_, index) => {
              const mediaState = tileMediaMap.get(index)
              const mediaItem =
                mediaState !== undefined ? COMMUNITY_IMAGE_POOL[mediaState.mediaIndex % COMMUNITY_IMAGE_POOL.length] : undefined
              const tileClassNames = ['community-proof-tile']
              const hasDynamicMedia = Boolean(mediaItem)

              if (mediaItem) {
                tileClassNames.push('is-avatar')
              }

              if (!hasDynamicMedia) {
                if (COMMUNITY_ACCENT_SLOTS.has(index)) {
                  tileClassNames.push('is-accent')
                } else if (COMMUNITY_SOFT_SLOTS.has(index)) {
                  tileClassNames.push('is-soft')
                }
              }

              if (COMMUNITY_ROUND_SLOTS.has(index)) {
                tileClassNames.push('is-round')
              } else if (COMMUNITY_CORNER_TL_SLOTS.has(index)) {
                tileClassNames.push('is-corner-tl')
              } else if (COMMUNITY_CORNER_TR_SLOTS.has(index)) {
                tileClassNames.push('is-corner-tr')
              } else if (COMMUNITY_CORNER_BR_SLOTS.has(index)) {
                tileClassNames.push('is-corner-br')
              } else if (COMMUNITY_CORNER_BL_SLOTS.has(index)) {
                tileClassNames.push('is-corner-bl')
              }

              return (
                <div key={index} className={tileClassNames.join(' ')}>
                  {mediaItem && (
                    <span key={`${mediaItem.id}-${mediaState?.blinkId ?? 0}`} className="community-proof-avatar community-proof-blink">
                      <img className="community-proof-avatar-logo" src={mediaItem.src} alt="" loading="lazy" />
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          <div className="community-proof-center">
            <h3 className="community-proof-title">Join the growing Zumbarl network</h3>
            <p className="community-proof-subtitle">
              Students and businesses building momentum together.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
