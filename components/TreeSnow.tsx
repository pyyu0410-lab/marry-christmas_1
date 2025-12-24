
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CONFIG, COLORS } from '../constants';
import { getRandomInSphere, getTreePosition } from '../utils';

const vertexShader = `
  uniform float uTime;
  uniform float uProgress;
  
  attribute vec3 aTreePos;
  attribute float aSize;
  attribute float aRandom;
  
  varying float vShimmer;

  void main() {
    // Morph between scattered and tree positions
    vec3 basePos = mix(position, aTreePos, uProgress);
    
    // Subtle movement
    float t = uTime * (0.5 + aRandom);
    basePos.x += sin(t) * 0.05;
    basePos.z += cos(t) * 0.05;
    basePos.y += sin(t * 1.3) * 0.02;

    vec4 mvPosition = modelViewMatrix * vec4(basePos, 1.0);
    gl_PointSize = aSize * (350.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    // Toned down twinkling for snow crystals
    vShimmer = pow(0.5 + 0.5 * sin(uTime * (3.0 + aRandom * 6.0)), 5.0);
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  varying float vShimmer;

  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    
    // Toned down core and shimmer
    float alpha = smoothstep(0.5, 0.1, dist);
    vec3 color = uColor + vShimmer * 0.5;
    
    gl_FragColor = vec4(color, alpha * (0.4 + vShimmer * 0.3));
  }
`;

export const TreeSnow: React.FC<{ progress: number }> = ({ progress }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const [positions, treePositions, sizes, randoms] = useMemo(() => {
    const pos = new Float32Array(CONFIG.treeSnowCount * 3);
    const tPos = new Float32Array(CONFIG.treeSnowCount * 3);
    const sz = new Float32Array(CONFIG.treeSnowCount);
    const rnd = new Float32Array(CONFIG.treeSnowCount);

    for (let i = 0; i < CONFIG.treeSnowCount; i++) {
      const scatter = getRandomInSphere(CONFIG.scatterRadius);
      const tree = getTreePosition(CONFIG.treeHeight, CONFIG.treeRadius);
      
      pos[i * 3] = scatter[0];
      pos[i * 3 + 1] = scatter[1];
      pos[i * 3 + 2] = scatter[2];

      tPos[i * 3] = tree[0];
      tPos[i * 3 + 1] = tree[1];
      tPos[i * 3 + 2] = tree[2];

      sz[i] = Math.random() * 0.04 + 0.02;
      rnd[i] = Math.random();
    }
    return [pos, tPos, sz, rnd];
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uColor: { value: new THREE.Color(COLORS.snow) }
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uProgress.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uProgress.value,
        progress,
        0.05
      );
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTreePos"
          count={treePositions.length / 3}
          array={treePositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={sizes.length}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={randoms.length}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
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
