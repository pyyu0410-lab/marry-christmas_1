
import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { CONFIG, COLORS } from '../constants';
import { getRandomInSphere, getTreePosition } from '../utils';

const vertexShader = `
  uniform float uTime;
  uniform float uProgress;
  uniform vec3 uMouse;
  uniform float uInteractionStrength;
  uniform float uIsPulling;
  
  attribute vec3 aTreePos;
  attribute float aSize;
  attribute float aRandom;
  attribute float aType; // 0 for Emerald, 1 for Gold
  
  varying float vRandom;
  varying vec3 vPosition;
  varying float vInteraction;
  varying float vShimmer;
  varying float vGlow;
  varying float vType;

  void main() {
    vRandom = aRandom;
    vType = aType;
    
    // Smooth interpolation between scattered and tree positions
    vec3 basePos = mix(position, aTreePos, uProgress);
    
    // Wind Sway Logic
    float windTime = uTime * 0.8;
    float windX = sin(windTime + basePos.y * 0.5) * 0.1;
    float windZ = cos(windTime * 0.7 + basePos.z * 0.3) * 0.1;
    
    vec3 windOffset = vec3(windX, 0.0, windZ) * (0.5 + uProgress * 0.5);
    vec3 finalPos = basePos + windOffset;

    // Mouse Interaction
    vec3 mouseDir = finalPos - uMouse;
    float mouseDist = length(mouseDir);
    float radius = 4.0;
    vInteraction = 0.0;

    if (mouseDist < radius) {
        float influence = pow(1.0 - mouseDist / radius, 2.0);
        vInteraction = influence;
        vec3 forceDir = normalize(mouseDir);
        vec3 displacement = mix(forceDir, -forceDir, uIsPulling);
        finalPos += displacement * influence * 2.0 * uInteractionStrength;
    }

    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    // Gold particles are slightly larger and sparklier
    float sizeMod = mix(1.0, 1.2, aType);
    gl_PointSize = aSize * sizeMod * (500.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
    vPosition = finalPos;
    
    // Toned down shimmer speed and power
    float shimmerSpeed = mix(1.5, 3.0, aType);
    vShimmer = pow(0.5 + 0.5 * sin(uTime * (shimmerSpeed + aRandom * 1.5)), 4.0);
    vGlow = 0.7 + 0.2 * sin(uTime * 0.8 + aRandom * 10.0);
  }
`;

const fragmentShader = `
  uniform vec3 uColor1; // Emerald
  uniform vec3 uColor2; // Gold
  varying float vRandom;
  varying vec3 vPosition;
  varying float vInteraction;
  varying float vShimmer;
  varying float vGlow;
  varying float vType;

  void main() {
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    float r = dot(cxy, cxy);
    if (r > 1.0) discard;

    // Toned down radial radiance
    float core = exp(-r * 6.0);
    float aura = exp(-r * 2.5);
    
    // Reduce shimmer intensity impact
    float radiance = (core * vShimmer * 0.6) + (aura * vGlow * 0.8);
    radiance += vInteraction * aura * 1.5;
    
    // Base color selection based on type
    vec3 baseEmerald = mix(uColor1 * 0.25, uColor1 * 0.8, vRandom * 0.5 + 0.5);
    vec3 baseGold = mix(uColor2 * 0.5, uColor2 * 0.9, vRandom * 0.5 + 0.5);
    
    vec3 baseColor = mix(baseEmerald, baseGold, vType);
    
    // Vertical color variation for depth
    float depthFactor = smoothstep(-4.0, 4.0, vPosition.y);
    baseColor = mix(baseColor * 0.7, baseColor * 1.1, depthFactor);
    
    // Final color with highlight
    vec3 color = baseColor * (0.3 + radiance);
    
    // Toned down gold core boost
    float coreStrength = mix(12.0, 18.0, vType);
    color += uColor2 * pow(core, coreStrength) * (vShimmer * 0.4 + 0.2);
    
    gl_FragColor = vec4(color, aura * (0.7 + vInteraction * 0.2));
  }
`;

export const Foliage: React.FC<{ progress: number }> = ({ progress }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport, mouse, events } = useThree();
  
  const interactionState = useRef({
    strength: 0,
    pulling: 0,
    targetMouse: new THREE.Vector3(),
    isDown: false
  });

  useEffect(() => {
    const domElement = events.connected as HTMLElement;
    if (!domElement) return;
    const onDown = () => { interactionState.current.isDown = true; };
    const onUp = () => { interactionState.current.isDown = false; };
    domElement.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    return () => {
      domElement.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  }, [events.connected]);

  const [positions, treePositions, sizes, randoms, types] = useMemo(() => {
    const pos = new Float32Array(CONFIG.foliageCount * 3);
    const tPos = new Float32Array(CONFIG.foliageCount * 3);
    const sz = new Float32Array(CONFIG.foliageCount);
    const rnd = new Float32Array(CONFIG.foliageCount);
    const typ = new Float32Array(CONFIG.foliageCount);

    for (let i = 0; i < CONFIG.foliageCount; i++) {
      const scatter = getRandomInSphere(CONFIG.scatterRadius);
      const tree = getTreePosition(CONFIG.treeHeight, CONFIG.treeRadius);
      pos[i * 3] = scatter[0]; pos[i * 3 + 1] = scatter[1]; pos[i * 3 + 2] = scatter[2];
      tPos[i * 3] = tree[0]; tPos[i * 3 + 1] = tree[1]; tPos[i * 3 + 2] = tree[2];
      sz[i] = Math.random() * 0.1 + 0.04;
      rnd[i] = Math.random();
      typ[i] = Math.random() < CONFIG.goldRatio ? 1.0 : 0.0;
    }
    return [pos, tPos, sz, rnd, typ];
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uProgress.value = THREE.MathUtils.lerp(materialRef.current.uniforms.uProgress.value, progress, 0.05);
      interactionState.current.targetMouse.set((mouse.x * viewport.width) / 2, (mouse.y * viewport.height) / 2, 0);
      materialRef.current.uniforms.uMouse.value.lerp(interactionState.current.targetMouse, 0.1);
      interactionState.current.strength = THREE.MathUtils.lerp(interactionState.current.strength, interactionState.current.isDown ? 1.0 : 0.4, 0.1);
      interactionState.current.pulling = THREE.MathUtils.lerp(interactionState.current.pulling, interactionState.current.isDown ? 1.0 : 0.0, 0.1);
      materialRef.current.uniforms.uInteractionStrength.value = interactionState.current.strength;
      materialRef.current.uniforms.uIsPulling.value = interactionState.current.pulling;
    }
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uMouse: { value: new THREE.Vector3() },
    uInteractionStrength: { value: 0 },
    uIsPulling: { value: 0 },
    uColor1: { value: new THREE.Color(COLORS.emerald) },
    uColor2: { value: new THREE.Color(COLORS.gold) }
  }), []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aTreePos" count={treePositions.length / 3} array={treePositions} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={sizes.length} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-aRandom" count={randoms.length} array={randoms} itemSize={1} />
        <bufferAttribute attach="attributes-aType" count={types.length} array={types} itemSize={1} />
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
