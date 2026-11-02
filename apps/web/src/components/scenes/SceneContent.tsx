import { Float, Sparkles } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { MathUtils } from 'three'
import type { Group, Mesh, MeshBasicMaterial } from 'three'

type SceneKind = 'arena' | 'trophy' | 'coin'

function CompetitorPodium({
  position,
  color,
  scale = 1,
}: {
  position: [number, number, number]
  color: string
  scale?: number
}) {
  const orb = useRef<Mesh>(null)
  const ring = useRef<Mesh>(null)
  const orbit = useRef<Group>(null)
  const elapsed = useRef(0)

  useFrame((_, delta) => {
    elapsed.current += delta
    if (orb.current) orb.current.position.y = 0.68 + Math.sin(elapsed.current * 0.9 + position[0]) * 0.06
    if (orb.current) {
      const breath = 1 + Math.sin(elapsed.current * 1.1 + position[0]) * 0.018
      orb.current.scale.setScalar(breath)
      orb.current.rotation.y += delta * (position[0] < 0 ? 0.12 : -0.12)
    }
    if (ring.current) {
      ring.current.rotation.z = elapsed.current * 0.2 * (position[0] < 0 ? 1 : -1)
      ring.current.rotation.y = Math.sin(elapsed.current * 0.35) * 0.08
    }
    if (orbit.current) orbit.current.rotation.y = elapsed.current * (position[0] < 0 ? 0.34 : -0.34)
  })

  return (
    <group position={position} scale={scale}>
      <mesh ref={orb} castShadow position={[0, 0.68, 0]}>
        <icosahedronGeometry args={[0.48, 2]} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.28}
          metalness={0.34}
          roughness={0.28}
          clearcoat={0.7}
        />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2.2, 0, 0]} position={[0, 0.65, 0]}>
        <torusGeometry args={[0.69, 0.018, 8, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.78} />
      </mesh>
      <group ref={orbit} position={[0, 0.68, 0]}>
        <mesh position={[0.78, 0, 0]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshBasicMaterial color={color} />
        </mesh>
        <mesh position={[-0.78, 0, 0]}>
          <sphereGeometry args={[0.026, 10, 10]} />
          <meshBasicMaterial color="#f4efff" transparent opacity={0.78} />
        </mesh>
      </group>
      <mesh position={[0, -0.2, 0]} castShadow>
        <cylinderGeometry args={[0.53, 0.66, 0.78, 6, 1]} />
        <meshStandardMaterial color="#201a2d" metalness={0.72} roughness={0.34} />
      </mesh>
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.72, 0.82, 0.14, 6]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.25} />
      </mesh>
    </group>
  )
}

function ArenaEnvironment() {
  const arena = useRef<Group>(null)
  const centerMark = useRef<Group>(null)
  const stageRingMaterial = useRef<MeshBasicMaterial>(null)
  const elapsed = useRef(0)

  useFrame(({ pointer }, delta) => {
    if (!arena.current || document.hidden) return
    elapsed.current += delta
    arena.current.rotation.y += delta * 0.035
    arena.current.rotation.x = MathUtils.damp(arena.current.rotation.x, pointer.y * -0.035, 2, delta)
    arena.current.rotation.z = MathUtils.damp(arena.current.rotation.z, pointer.x * 0.025, 2, delta)
    if (centerMark.current) centerMark.current.rotation.y = elapsed.current * 0.32
    if (stageRingMaterial.current) {
      stageRingMaterial.current.opacity = 0.52 + (Math.sin(elapsed.current * 0.8) + 1) * 0.09
    }
  })

  return (
    <group ref={arena}>
      <ambientLight intensity={0.65} />
      <pointLight color="#aa8aff" intensity={28} position={[-3, 4, 4]} />
      <pointLight color="#72bde5" intensity={20} position={[3, 1, -1]} />
      <spotLight angle={0.55} color="#ffffff" intensity={22} position={[0, 7, 2]} penumbra={0.8} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.05, 0]} receiveShadow>
        <circleGeometry args={[4.6, 64]} />
        <meshStandardMaterial color="#17131f" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.02, 0]}>
        <ringGeometry args={[2.5, 2.53, 64]} />
        <meshBasicMaterial ref={stageRingMaterial} color="#8562dd" transparent opacity={0.7} />
      </mesh>
      <CompetitorPodium color="#a987ff" position={[-1.55, 0, 0]} scale={0.92} />
      <CompetitorPodium color="#77b7d9" position={[1.55, 0, 0]} scale={0.92} />
      <Float speed={0.8} rotationIntensity={0.1} floatIntensity={0.16}>
        <group ref={centerMark} position={[0, 0.02, 0.2]}>
          <mesh>
            <octahedronGeometry args={[0.39, 0]} />
            <meshPhysicalMaterial
              color="#d8c9ff"
              emissive="#8159df"
              emissiveIntensity={0.5}
              metalness={0.72}
              roughness={0.22}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.58, 0.012, 8, 48]} />
            <meshBasicMaterial color="#c7b2ff" transparent opacity={0.64} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.54, 0.009, 8, 48]} />
            <meshBasicMaterial color="#9b82d2" transparent opacity={0.42} />
          </mesh>
        </group>
      </Float>
      <Sparkles count={18} scale={[5.5, 3.2, 2.6]} size={1.6} speed={0.18} color="#c4adff" />
    </group>
  )
}

function TrophyObject() {
  const trophy = useRef<Group>(null)
  const halo = useRef<Group>(null)
  const elapsed = useRef(0)

  useFrame((_, delta) => {
    elapsed.current += delta
    if (trophy.current && !document.hidden) {
      trophy.current.rotation.y += delta * 0.14
      trophy.current.rotation.z = Math.sin(elapsed.current * 0.42) * 0.025
      trophy.current.position.y = Math.sin(elapsed.current * 0.7) * 0.09
    }
    if (halo.current && !document.hidden) halo.current.rotation.y -= delta * 0.18
  })

  return (
    <group ref={trophy}>
      <ambientLight intensity={0.75} />
      <pointLight color="#eacb83" intensity={26} position={[-2, 3, 3]} />
      <pointLight color="#9d7bff" intensity={18} position={[2, 0, -2]} />
      <group ref={halo} position={[0, 0.3, 0]}>
        <mesh rotation={[Math.PI / 2.7, 0.18, 0]}>
          <torusGeometry args={[1.18, 0.012, 8, 72]} />
          <meshBasicMaterial color="#e8c982" transparent opacity={0.56} />
        </mesh>
        <mesh rotation={[0.2, 0, Math.PI / 2.8]}>
          <torusGeometry args={[1.32, 0.008, 8, 72]} />
          <meshBasicMaterial color="#a890d9" transparent opacity={0.38} />
        </mesh>
      </group>
      <mesh castShadow position={[0, 0.3, 0]}>
        <torusKnotGeometry args={[0.72, 0.2, 96, 12, 2, 3]} />
        <meshPhysicalMaterial color="#e4c580" metalness={0.88} roughness={0.2} clearcoat={1} />
      </mesh>
      <mesh position={[0, -0.7, 0]}>
        <cylinderGeometry args={[0.33, 0.45, 0.55, 8]} />
        <meshStandardMaterial color="#b89045" metalness={0.8} roughness={0.24} />
      </mesh>
      <mesh position={[0, -1.05, 0]}>
        <cylinderGeometry args={[0.86, 0.86, 0.2, 8]} />
        <meshStandardMaterial color="#201b2a" metalness={0.6} roughness={0.34} />
      </mesh>
      <Sparkles count={12} scale={[3.2, 3.2, 2.5]} size={1.8} speed={0.16} color="#f0d18f" />
    </group>
  )
}

function CoinObject() {
  const coin = useRef<Group>(null)
  const elapsed = useRef(0)
  useFrame((_, delta) => {
    elapsed.current += delta
    if (!coin.current || document.hidden) return
    coin.current.rotation.y += delta * 0.48
    coin.current.rotation.x = Math.sin(elapsed.current * 0.6) * 0.08
    coin.current.rotation.z = Math.sin(elapsed.current * 0.42) * 0.025
    coin.current.position.y = Math.sin(elapsed.current * 0.75) * 0.055
  })

  return (
    <group>
      <ambientLight intensity={0.8} />
      <pointLight color="#a982ff" intensity={25} position={[-2, 3, 3]} />
      <pointLight color="#e8d99a" intensity={16} position={[3, 0, -1]} />
      <group ref={coin}>
        <mesh castShadow>
          <cylinderGeometry args={[1.18, 1.18, 0.18, 64]} />
          <meshPhysicalMaterial color="#c4a45f" metalness={0.9} roughness={0.22} clearcoat={0.85} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.105]}>
          <torusGeometry args={[0.87, 0.027, 8, 64]} />
          <meshBasicMaterial color="#f5db9d" />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.12]}>
          <torusGeometry args={[0.5, 0.02, 8, 48]} />
          <meshBasicMaterial color="#f5db9d" transparent opacity={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.13]}>
          <icosahedronGeometry args={[0.24, 0]} />
          <meshStandardMaterial color="#f0d795" metalness={0.88} roughness={0.24} />
        </mesh>
        <group rotation={[Math.PI / 2.4, 0, 0]}>
          <mesh position={[0.66, 0, 0]}>
            <sphereGeometry args={[0.045, 12, 12]} />
            <meshBasicMaterial color="#f8e8b9" />
          </mesh>
          <mesh position={[-0.66, 0, 0]}>
            <sphereGeometry args={[0.025, 10, 10]} />
            <meshBasicMaterial color="#bda4f0" />
          </mesh>
        </group>
      </group>
    </group>
  )
}

export default function SceneContent({ kind }: { kind: SceneKind }) {
  if (kind === 'trophy') return <TrophyObject />
  if (kind === 'coin') return <CoinObject />
  return <ArenaEnvironment />
}
