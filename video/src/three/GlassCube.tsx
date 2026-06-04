import { Edges, Environment, Lightformer, MeshTransmissionMaterial, RoundedBox } from "@react-three/drei";
import { interpolate, useCurrentFrame } from "remotion";
import * as THREE from "three";

/**
 * The hero glass cube. Driven deterministically by the Remotion frame.
 * `clarity` 0→1 takes it from fogged black-monolith to clear glass.
 */
export const GlassCube: React.FC<{ clarity: number; tint: string; glow: number }> = ({
  clarity,
  tint,
  glow,
}) => {
  const frame = useCurrentFrame();
  const tintColor = new THREE.Color(tint);

  const yaw = frame * 0.012;
  const tilt = 0.4 + Math.sin(frame / 130) * 0.05;
  const roll = 0.08 + Math.cos(frame / 160) * 0.03;

  const roughness = interpolate(clarity, [0, 1], [0.55, 0.12]);
  const corePulse = glow * (0.7 + 0.35 * Math.sin(frame / 14));

  return (
    <>
      <ambientLight intensity={0.12} />
      <pointLight position={[4, 3, 5]} color="#f0b429" intensity={glow * 7} />
      <pointLight position={[-4, -2, 3]} color="#f9617b" intensity={glow * 5} />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={2.2} color="#f0b429" position={[3, 2, 3]} scale={5} />
        <Lightformer form="rect" intensity={1.6} color="#f9617b" position={[-3, -1, 2]} scale={5} />
        <Lightformer form="circle" intensity={1.2} color="#22d3ee" position={[0, 3, -3]} scale={3} />
      </Environment>

      <group rotation={[tilt, yaw, roll]}>
        <RoundedBox args={[2.1, 2.1, 2.1]} radius={0.13} smoothness={6}>
          <MeshTransmissionMaterial
            samples={6}
            resolution={512}
            transmission={1}
            thickness={1.5}
            roughness={roughness}
            ior={1.45}
            chromaticAberration={0.07}
            anisotropicBlur={0.35}
            distortion={0.12}
            distortionScale={0.3}
            temporalDistortion={0.05}
            color={tintColor}
            attenuationColor={tintColor}
            attenuationDistance={2.5}
            background={new THREE.Color("#06080d")}
          />
          <Edges threshold={15} color={tint} />
        </RoundedBox>

        {/* inner glowing core */}
        <mesh>
          <icosahedronGeometry args={[0.42, 1]} />
          <meshStandardMaterial emissive={tintColor} emissiveIntensity={corePulse} color="black" toneMapped={false} />
        </mesh>

        {/* vertical hash-chain spine (verified = cyan) */}
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={i} position={[0, 0.72 - i * 0.36, 0]}>
            <boxGeometry args={[0.16, 0.11, 0.16]} />
            <meshStandardMaterial
              emissive={new THREE.Color("#22d3ee")}
              emissiveIntensity={glow * (0.5 + 0.5 * Math.sin(frame / 12 - i))}
              color="black"
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </>
  );
};
