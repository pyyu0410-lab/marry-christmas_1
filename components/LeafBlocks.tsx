import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CONFIG, COLORS } from '../constants';
import { getRandomInSphere, getTreePosition } from '../utils';

const tempObject = new THREE.Object3D();

export const LeafBlocks: React.FC<{ progress: number }> = ({ progress }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const blockData = useMemo(() => {
    const data = [];
    for (let i = 0; i < CONFIG.leafBlockCount; i++) {
      data.push({
        id: i,
        scatterPos: getRandomInSphere(CONFIG.scatterRadius),
        treePos: getTreePosition(CONFIG.treeHeight, CONFIG.treeRadius * 0.9),
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
        scale: 0.12 + Math.random() * 0.3
      });
    }
    return data;
  }, []);

  const currentProgress = useRef(0);

  useFrame((state) => {
    currentProgress.current = THREE.MathUtils.lerp(currentProgress.current, progress, 0.04);
    const t = state.clock.elapsedTime;
    const p = currentProgress.current;

    if (meshRef.current) {
      blockData.forEach((d, i) => {
        const easedP = Math.pow(p, 1.3);
        const x = THREE.MathUtils.lerp(d.scatterPos[0], d.treePos[0], easedP);
        const y = THREE.MathUtils.lerp(d.scatterPos[1], d.treePos[1], easedP);
        const z = THREE.MathUtils.lerp(d.scatterPos[2], d.treePos[2], easedP);
        tempObject.position.set(x, y, z);
        const rotX = d.rotation[0] + t * 0.15 * (1 - p) + Math.sin(t * 0.5 + d.id) * 0.1 * p;
        const rotY = d.rotation[1] + t * 0.1 * (1 - p);
        const rotZ = d.rotation[2] + Math.cos(t * 0.4 + d.id) * 0.05 * p;
        tempObject.rotation.set(rotX, rotY, rotZ);
        tempObject.scale.setScalar(d.scale);
        tempObject.updateMatrix();
        meshRef.current!.setMatrixAt(i, tempObject.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, CONFIG.leafBlockCount]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        color={COLORS.emerald} 
        roughness={0.4} 
        metalness={0.2}
        emissive={COLORS.emerald}
        emissiveIntensity={0.2}
      />
    </instancedMesh>
  );
};