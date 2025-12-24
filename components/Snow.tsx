
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CONFIG, COLORS } from '../constants';

const vertexShader = `
  uniform float uTime;
  attribute float aSpeed;
  attribute float aOffset;
  attribute float aSize;
  attribute vec3 aRandom;

  varying float vAlpha;
  varying float vRotation;
  varying float vSparkle;

  void main() {
    vec3 pos = position;

    // Falling logic
    float fallHeight = 30.0;
    float currentY = pos.y - (uTime * aSpeed * 2.5);
    
    // Loop position using modulo
    pos.y = mod(currentY + fallHeight/2.0, fallHeight) - fallHeight/2.0;
    
    // Organic Wind drift / Sway (more complex Brownian-like motion)
    pos.x += sin(uTime * 0.8 * aRandom.x + aOffset) * 0.8;
    pos.z += cos(uTime * 0.7 * aRandom.z + aOffset) * 0.8;
    pos.x += sin(uTime * 2.5 + aRandom.y * 10.0) * 0.15; // micro-jitters

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Size varies based on distance and a pulse for "shimmering"
    float sizePulse = 1.0 + 0.2 * sin(uTime * 2.0 + aOffset);
    gl_PointSize = aSize * sizePulse * (600.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    // Fade edges of the volume
    float edgeFade = smoothstep(15.0, 10.0, abs(pos.y));
    vAlpha = edgeFade * (0.6 + 0.4 * aRandom.y);
    
    // Pass rotation and high-freq sparkle factor
    vRotation = uTime * aSpeed * 2.0 + aOffset;
    vSparkle = pow(0.5 + 0.5 * sin(uTime * (15.0 + aRandom.z * 10.0)), 10.0);
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  varying float vAlpha;
  varying float vRotation;
  varying float vSparkle;

  void main() {
    // Coordinate transformation for rotation
    vec2 uv = gl_PointCoord - 0.5;
    float s = sin(vRotation);
    float c = cos(vRotation);
    vec2 rotatedUv = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
    
    float dist = length(uv);
    if (dist > 0.5) discard;

    // Create a crystalline/star shape
    float crystal = 0.0;
    // Main cross
    float crossShape = smoothstep(0.08, 0.0, abs(rotatedUv.x)) * smoothstep(0.5, 0.0, abs(rotatedUv.y));
    crossShape += smoothstep(0.08, 0.0, abs(rotatedUv.y)) * smoothstep(0.5, 0.0, abs(rotatedUv.x));
    
    // Diagonal cross (softer)
    float angle = 0.785398; // 45 degrees
    float s2 = sin(angle);
    float c2 = cos(angle);
    vec2 diagUv = vec2(rotatedUv.x * c2 - rotatedUv.y * s2, rotatedUv.x * s2 + rotatedUv.y * c2);
    float diagShape = smoothstep(0.04, 0.0, abs(diagUv.x)) * smoothstep(0.3, 0.0, abs(diagUv.y));
    diagShape += smoothstep(0.04, 0.0, abs(diagUv.y)) * smoothstep(0.3, 0.0, abs(diagUv.x));

    // Core soft glow
    float core = exp(-dist * 12.0);
    float bokeh = exp(-dist * 5.0);
    
    // Combine into final shape
    float finalShape = mix(bokeh, crossShape + diagShape, 0.4) + core;
    
    // Apply sparkle glint
    vec3 finalColor = mix(uColor, vec3(1.5), vSparkle);
    float finalAlpha = finalShape * vAlpha * (0.5 + vSparkle * 0.5);

    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

export const Snow: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, speeds, offsets, sizes, randoms] = useMemo(() => {
    // Slightly increase snow count for a more lush experience
    const count = 3000;
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const offs = new Float32Array(count);
    const sz = new Float32Array(count);
    const rnd = new Float32Array(count * 3);

    const volume = 30;

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * volume;
      pos[i * 3 + 1] = (Math.random() - 0.5) * volume;
      pos[i * 3 + 2] = (Math.random() - 0.5) * volume;

      spd[i] = 0.3 + Math.random() * 0.8;
      offs[i] = Math.random() * Math.PI * 2;
      // Vary sizes more for depth variation
      sz[i] = Math.random() < 0.1 ? (Math.random() * 0.15 + 0.1) : (Math.random() * 0.06 + 0.03);
      
      rnd[i * 3] = Math.random();
      rnd[i * 3 + 1] = Math.random();
      rnd[i * 3 + 2] = Math.random();
    }
    return [pos, spd, offs, sz, rnd];
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(COLORS.snow) }
  }), []);

  useFrame((state) => {
    if (pointsRef.current) {
      (pointsRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSpeed"
          count={speeds.length}
          array={speeds}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aOffset"
          count={offsets.length}
          array={offsets}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={sizes.length}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={randoms.length / 3}
          array={randoms}
          itemSize={3}
        />
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
