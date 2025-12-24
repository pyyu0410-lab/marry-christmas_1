
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CONFIG, COLORS } from '../constants';

const vertexShader = `
  uniform float uTime;
  uniform float uProgress;
  uniform float uTreeRadius;
  
  attribute float aSize;
  attribute float aSpeed;
  attribute float aOrbitRadius;
  attribute float aOffset;
  attribute float aHeightOffset;
  attribute vec3 aRandom;

  varying float vShimmer;
  varying float vOpacity;
  varying float vDistanceFactor;

  void main() {
    // Basic orbital parameters - aSpeed is now much lower
    float time = uTime * aSpeed + aOffset;
    
    // Spiral motion: orbit around Y axis
    float currentRadius = mix(aOrbitRadius * 1.8, aOrbitRadius, uProgress);
    
    // Calculate position
    float x = cos(time) * currentRadius;
    float z = sin(time) * currentRadius;
    
    // Vertical movement - particles drift up and down slowly
    float y = aHeightOffset + sin(time * 0.5) * 1.2;
    
    // Add some noise based on progress
    x += sin(uTime * 1.5 + aRandom.x * 12.0) * (1.0 - uProgress) * 3.0;
    z += cos(uTime * 1.6 + aRandom.y * 12.0) * (1.0 - uProgress) * 3.0;
    y += sin(uTime * 1.2 + aRandom.z * 12.0) * (1.0 - uProgress) * 3.0;

    vec3 pos = vec3(x, y, z);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Vibrant sparkle pulse - adjusted frequency for slower movement
    float sizePulse = 1.0 + 0.3 * sin(uTime * 4.0 + aOffset);
    gl_PointSize = aSize * sizePulse * (550.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    // Stronger shimmer intensity
    vShimmer = pow(0.5 + 0.5 * sin(uTime * (6.0 + aRandom.x * 10.0)), 3.0);
    
    // Fade based on distance from center when scattered
    float dist = length(pos);
    vOpacity = smoothstep(22.0, 5.0, dist);
    vDistanceFactor = 1.0 - smoothstep(0.0, uTreeRadius * 2.0, length(pos.xz));
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  varying float vShimmer;
  varying float vOpacity;
  varying float vDistanceFactor;

  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    
    // Intense glowing core
    float core = exp(-dist * 10.0);
    float glow = exp(-dist * 4.0);
    
    // Boosted color intensity for "Fireworks" feel
    vec3 finalColor = mix(uColor, vec3(1.0, 1.0, 0.8), core * vShimmer);
    
    // Higher brightness multiplier to make them stand out
    float alpha = (core * 2.5 + glow * 0.6) * vOpacity * (0.4 + vShimmer * 0.6);

    gl_FragColor = vec4(finalColor * 1.5, alpha);
  }
`;

export const Fireworks: React.FC<{ progress: number }> = ({ progress }) => {
  const pointsRef = useRef<THREE.Points>(null);
  // Further reduced count for a cleaner, more sparse appearance
  const count = 1000;

  const [positions, sizes, speeds, radii, offsets, heightOffsets, randoms] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const spd = new Float32Array(count);
    const rad = new Float32Array(count);
    const off = new Float32Array(count);
    const hOff = new Float32Array(count);
    const rnd = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      sz[i] = Math.random() * 0.12 + 0.05;
      // Reduced speed range for much slower rotation (0.05 to 0.25)
      spd[i] = 0.05 + Math.random() * 0.2;
      rad[i] = CONFIG.treeRadius * (0.6 + Math.random() * 1.5);
      off[i] = Math.random() * Math.PI * 2;
      hOff[i] = (Math.random() - 0.5) * (CONFIG.treeHeight + 4);
      
      rnd[i * 3] = Math.random();
      rnd[i * 3 + 1] = Math.random();
      rnd[i * 3 + 2] = Math.random();
    }
    return [pos, sz, spd, rad, off, hOff, rnd];
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uTreeRadius: { value: CONFIG.treeRadius },
    uColor: { value: new THREE.Color(COLORS.highGold) }
  }), []);

  useFrame((state) => {
    if (pointsRef.current) {
      const mat = pointsRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = state.clock.elapsedTime;
      mat.uniforms.uProgress.value = THREE.MathUtils.lerp(
        mat.uniforms.uProgress.value,
        progress,
        0.05
      );
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-aSpeed" count={count} array={speeds} itemSize={1} />
        <bufferAttribute attach="attributes-aOrbitRadius" count={count} array={radii} itemSize={1} />
        <bufferAttribute attach="attributes-aOffset" count={count} array={offsets} itemSize={1} />
        <bufferAttribute attach="attributes-aHeightOffset" count={count} array={heightOffsets} itemSize={1} />
        <bufferAttribute attach="attributes-aRandom" count={count} array={randoms} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
