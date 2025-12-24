
import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Float, Stars } from '@react-three/drei';
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { Foliage } from './components/Foliage';
import { Ornaments } from './components/Ornaments';
import { Snow } from './components/Snow';
import { TreeSnow } from './components/TreeSnow';
import { LeafBlocks } from './components/LeafBlocks';
import { Fireworks } from './components/Fireworks';
import { TreeMorphState } from './types';
import { COLORS } from './constants';

interface ExperienceProps {
  state: TreeMorphState;
}

const Experience: React.FC<ExperienceProps> = ({ state }) => {
  const progress = state === TreeMorphState.TREE_SHAPE ? 1 : 0;
  
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const accentLightRef = useRef<THREE.PointLight>(null);
  const rotatingLightRef = useRef<THREE.PointLight>(null);

  useFrame((threeState) => {
    const t = threeState.clock.elapsedTime;

    // Subtle breathing effect for ambient light
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = 0.15 + Math.sin(t * 0.5) * 0.05;
    }

    // Dynamic movement and intensity for the main luxury spotlight
    if (spotLightRef.current) {
      spotLightRef.current.intensity = 1.2 + Math.sin(t * 0.8) * 0.3;
      spotLightRef.current.position.x = 10 + Math.cos(t * 0.5) * 2;
      spotLightRef.current.position.z = 10 + Math.sin(t * 0.5) * 2;
    }

    // Pulsing base light for the emerald depth
    if (accentLightRef.current) {
      accentLightRef.current.intensity = 0.4 + Math.sin(t * 1.2) * 0.2;
    }

    // Rotating "Rim Light" to create moving specular highlights on gold ornaments
    if (rotatingLightRef.current) {
      const radius = 12;
      rotatingLightRef.current.position.x = Math.sin(t * 0.4) * radius;
      rotatingLightRef.current.position.z = Math.cos(t * 0.4) * radius;
      rotatingLightRef.current.intensity = 0.8 + Math.sin(t * 2.0) * 0.4;
    }
  });

  return (
    <>
      <color attach="background" args={[COLORS.darkBg]} />
      <PerspectiveCamera makeDefault position={[0, 2, 18]} fov={45} />
      <OrbitControls 
        enablePan={false} 
        minDistance={5} 
        maxDistance={25} 
        autoRotate={state === TreeMorphState.SCATTERED} 
        autoRotateSpeed={0.5}
      />
      
      {/* Dynamic Light Setup */}
      <ambientLight ref={ambientLightRef} intensity={0.2} />
      
      <spotLight 
        ref={spotLightRef}
        position={[10, 10, 10]} 
        angle={0.25} 
        penumbra={1} 
        intensity={1.5} 
        color={COLORS.highGold} 
        castShadow
      />
      
      <pointLight 
        ref={accentLightRef}
        position={[-10, -5, -10]} 
        intensity={0.5} 
        color={COLORS.emerald} 
      />

      <pointLight 
        ref={rotatingLightRef}
        position={[12, 5, 0]} 
        intensity={1} 
        distance={25}
        color={COLORS.warmWhite} 
      />

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <group rotation={[0, 0, 0]}>
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <Foliage progress={progress} />
          <LeafBlocks progress={progress} />
          <Ornaments progress={progress} />
          <TreeSnow progress={progress} />
          <Fireworks progress={progress} />
          <Snow />
        </Float>
      </group>

      <Environment preset="night" />

      <EffectComposer enableNormalPass={false}>
        <Bloom 
          luminanceThreshold={0.25} 
          mipmapBlur 
          intensity={0.8} 
          radius={0.4} 
        />
        <Noise opacity={0.05} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
};

export default Experience;
