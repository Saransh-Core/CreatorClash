type SceneKind = 'arena' | 'trophy' | 'coin'

/** Lightweight CSS artwork keeps decorative scenes responsive without loading a WebGL runtime. */
export function ImmersiveScene({ kind = 'arena' }: { kind?: SceneKind }) {
  return (
    <div aria-hidden="true" className="scene-host">
      <div className={`scene-art scene-art-${kind}`}>
        <span className="scene-halo scene-halo-outer" />
        <span className="scene-halo scene-halo-inner" />
        <span className="scene-relic">
          <span className="scene-relic-mark">{kind === 'trophy' ? '✦' : kind === 'coin' ? '紋' : '刃'}</span>
        </span>
        <span className="scene-floor" />
      </div>
    </div>
  )
}
