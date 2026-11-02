import { Component, Suspense, lazy, type ErrorInfo, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'

const SceneContent = lazy(() => import('./SceneContent'))
type SceneKind = 'arena' | 'trophy' | 'coin'
type BoundaryState = { failed: boolean }

class SceneErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  override state: BoundaryState = { failed: false }
  static getDerivedStateFromError(): BoundaryState { return { failed: true } }
  override componentDidCatch(_error: Error, _info: ErrorInfo) { /* Static artwork remains visible beneath the canvas. */ }
  override render() { return this.state.failed ? <div className="scene-error-fallback" /> : this.props.children }
}

export default function SceneCanvas({ kind }: { kind: SceneKind }) {
  return <SceneErrorBoundary><Suspense fallback={null}><Canvas camera={{ position: [0, 0.4, 7.2], fov: 36 }} dpr={[1, 1.35]} frameloop="always" gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }} fallback={<div className="scene-error-fallback" />} performance={{ min: 0.65 }}><SceneContent kind={kind} /></Canvas></Suspense></SceneErrorBoundary>
}
