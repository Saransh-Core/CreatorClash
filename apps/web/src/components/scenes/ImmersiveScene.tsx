import { lazy, useEffect, useRef, useState } from 'react'
import { useMotionPreference } from '../../utils/motionPreference'

type SceneKind = 'arena' | 'trophy' | 'coin'
const SceneCanvas = lazy(() => import('./SceneCanvas'))

/** Static composition remains the default; Three.js is only loaded near the viewport on capable devices. */
export function ImmersiveScene({ kind = 'arena' }: { kind?: SceneKind }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [nearViewport, setNearViewport] = useState(false)
  const [eligible, setEligible] = useState(false)
  const [pageVisible, setPageVisible] = useState(true)
  const reduceMotion = useMotionPreference()
  useEffect(() => {
    const compactViewport = window.matchMedia('(max-width: 760px)')
    const updateEligibility = () => setEligible(!reduceMotion && !compactViewport.matches)
    updateEligibility()
    compactViewport.addEventListener('change', updateEligibility)
    const observer = new IntersectionObserver(([entry]) => setNearViewport(entry?.isIntersecting ?? false), { rootMargin: '120px' })
    if (hostRef.current) observer.observe(hostRef.current)
    const onVisibility = () => setPageVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      observer.disconnect()
      compactViewport.removeEventListener('change', updateEligibility)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reduceMotion])
  return <div aria-hidden="true" className="scene-host" ref={hostRef}>{eligible && nearViewport && pageVisible && <SceneCanvas kind={kind} />}</div>
}
