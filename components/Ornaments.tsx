
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CONFIG, COLORS } from '../constants';
import { getRandomInSphere, getTreePosition } from '../utils';
import { OrnamentData, OrnamentType } from '../types';

const tempObject = new THREE.Object3D();

const createStarShape = () => {
  const shape = new THREE.Shape();
  const points = 5;
  const outerRadius = 1;
  const innerRadius = 0.4;
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i / points) * Math.PI;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
};

const createHeartShape = () => {
  const shape = new THREE.Shape();
  const x = 0, y = 0;
  shape.moveTo(x + 0.25, y + 0.25);
  shape.bezierCurveTo(x + 0.25, y + 0.25, x + 0.2, y, x, y);
  shape.bezierCurveTo(x - 0.3, y, x - 0.3, y + 0.35, x - 0.3, y + 0.35);
  shape.bezierCurveTo(x - 0.3, y + 0.55, x - 0.1, y + 0.77, x + 0.25, y + 0.95);
  shape.bezierCurveTo(x + 0.6, y + 0.77, x + 0.8, y + 0.55, x + 0.8, y + 0.35);
  shape.bezierCurveTo(x + 0.8, y + 0.35, x + 0.8, y, x + 0.5, y);
  shape.bezierCurveTo(x + 0.35, y, x + 0.25, y + 0.25, x + 0.25, y + 0.25);
  return shape;
};

export const Ornaments: React.FC<{ progress: number }> = ({ progress }) => {
  const giftsRef = useRef<THREE.InstancedMesh>(null);
  const ribbonsHRef = useRef<THREE.InstancedMesh>(null);
  const ribbonsVRef = useRef<THREE.InstancedMesh>(null);
  const bowsRef = useRef<THREE.InstancedMesh>(null);
  const ballsRef = useRef<THREE.InstancedMesh>(null);
  const starsRef = useRef<THREE.InstancedMesh>(null);
  const baublesRef = useRef<THREE.InstancedMesh>(null);
  const heartsRef = useRef<THREE.InstancedMesh>(null);
  const redCubesRef = useRef<THREE.InstancedMesh>(null);
  const silverBaublesRef = useRef<THREE.InstancedMesh>(null);
  const silverStarsRef = useRef<THREE.InstancedMesh>(null);
  const topStarRef = useRef<THREE.Mesh>(null);
  
  const ballsMaterialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const heartsMaterialRef = useRef<THREE.MeshPhysicalMaterial>(null);

  // Procedural Star Texture for Silver Stars
  const starPatternTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#000000';
      // Draw many small "star" points for roughness variation
      for (let i = 0; i < 200; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const radius = Math.random() * 1.5;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Occasional tiny cross-hairs
        if (Math.random() > 0.8) {
          ctx.lineWidth = 0.5;
          ctx.strokeStyle = '#000000';
          ctx.beginPath();
          ctx.moveTo(x - 3, y);
          ctx.lineTo(x + 3, y);
          ctx.moveTo(x, y - 3);
          ctx.lineTo(x, y + 3);
          ctx.stroke();
        }
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }, []);

  const starGeometry = useMemo(() => {
    const shape = createStarShape();
    return new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05 });
  }, []);

  const heartGeometry = useMemo(() => {
    const shape = createHeartShape();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02 });
    geometry.center();
    geometry.rotateX(Math.PI); 
    return geometry;
  }, []);

  const ornamentData = useMemo(() => {
    const { gifts, balls, stars, baubles, hearts, redCubes, silverBaubles, silverStars } = CONFIG.ornamentCount;
    const total = gifts + balls + stars + baubles + hearts + redCubes + silverBaubles + silverStars;
    const data: OrnamentData[] = [];
    
    let count = 0;
    const addType = (type: OrnamentType, amount: number, weight: number) => {
      for (let i = 0; i < amount; i++) {
        data.push({
          id: count++,
          type,
          scatterPos: getRandomInSphere(CONFIG.scatterRadius),
          treePos: getTreePosition(CONFIG.treeHeight, CONFIG.treeRadius),
          rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
          weight
        });
      }
    };

    addType('GIFT', gifts, 0.35);
    addType('BALL', balls, 0.6);
    addType('STAR', stars, 1.0);
    addType('BAUBLE', baubles, 1.0);
    addType('HEART', hearts, 1.0);
    addType('RED_CUBE', redCubes, 1.0);
    addType('SILVER_BAUBLE', silverBaubles, 1.0);
    addType('SILVER_STAR', silverStars, 1.0);

    return data;
  }, []);

  const topStarLogic = useMemo(() => ({
    scatterPos: getRandomInSphere(CONFIG.scatterRadius),
    treePos: [0, CONFIG.treeHeight / 2 + 0.5, 0] as [number, number, number]
  }), []);

  const currentProgress = useRef(0);

  useFrame((state) => {
    currentProgress.current = THREE.MathUtils.lerp(currentProgress.current, progress, 0.05);
    const t = state.clock.elapsedTime;
    const p = currentProgress.current;

    if (ballsMaterialRef.current) {
        const twinkle = 0.3 + Math.pow(0.5 + 0.5 * Math.sin(t * 4.0), 10.0) * 0.7;
        ballsMaterialRef.current.emissiveIntensity = 0.2 + twinkle * 0.5;
        ballsMaterialRef.current.envMapIntensity = 10 + Math.sin(t * 2.0) * 2;
    }

    if (heartsMaterialRef.current) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 3.0);
        heartsMaterialRef.current.emissiveIntensity = 0.8 + pulse * 0.5;
    }

    const updateInstances = (ref: React.RefObject<THREE.InstancedMesh | null>, type: OrnamentType) => {
      if (!ref.current) return;
      let idx = 0;
      ornamentData.forEach((d) => {
        if (d.type !== type) return;

        const easedP = Math.pow(p, d.weight);
        const windX = Math.sin(t * 0.5 + d.treePos[1] * 0.3) * 0.05 * p;
        const windZ = Math.cos(t * 0.4 + d.treePos[1] * 0.2) * 0.05 * p;

        const x = THREE.MathUtils.lerp(d.scatterPos[0], d.treePos[0] + windX, easedP);
        const y = THREE.MathUtils.lerp(d.scatterPos[1], d.treePos[1], easedP);
        const z = THREE.MathUtils.lerp(d.scatterPos[2], d.treePos[2] + windZ, easedP);

        tempObject.position.set(x, y, z);
        
        const rotScale = (1 - easedP) * 0.5 + 0.05;
        const swayRot = Math.sin(t * 0.3 + d.id) * 0.1 * p;
        
        const rotationX = d.rotation[0] + t * rotScale + swayRot;
        const rotationY = d.rotation[1] + t * rotScale * 1.1;
        const rotationZ = d.rotation[2] + t * rotScale * 0.9 + swayRot;
        
        tempObject.rotation.set(rotationX, rotationY, rotationZ);

        let scale = 0.15;
        if (type === 'STAR' || type === 'SILVER_STAR') scale = 0.05;
        else if (type === 'GIFT') scale = 0.38;
        else if (type === 'BAUBLE') scale = 0.2;
        else if (type === 'HEART') scale = 0.25;
        else if (type === 'RED_CUBE') scale = 0.08;
        else if (type === 'SILVER_BAUBLE') scale = 0.18;

        tempObject.scale.setScalar(scale);
        tempObject.updateMatrix();
        ref.current!.setMatrixAt(idx, tempObject.matrix);

        // Sync decorative elements for Gifts
        if (type === 'GIFT') {
          if (ribbonsHRef.current) ribbonsHRef.current.setMatrixAt(idx, tempObject.matrix);
          if (ribbonsVRef.current) ribbonsVRef.current.setMatrixAt(idx, tempObject.matrix);
          
          if (bowsRef.current) {
            // Apply a small offset for the bow so it sits on the top face
            tempObject.translateY(0.5);
            tempObject.updateMatrix();
            bowsRef.current.setMatrixAt(idx, tempObject.matrix);
          }
        }

        idx++;
      });
      ref.current.instanceMatrix.needsUpdate = true;
      if (type === 'GIFT') {
          if (ribbonsHRef.current) ribbonsHRef.current.instanceMatrix.needsUpdate = true;
          if (ribbonsVRef.current) ribbonsVRef.current.instanceMatrix.needsUpdate = true;
          if (bowsRef.current) bowsRef.current.instanceMatrix.needsUpdate = true;
      }
    };

    updateInstances(giftsRef, 'GIFT');
    updateInstances(ballsRef, 'BALL');
    updateInstances(starsRef, 'STAR');
    updateInstances(baublesRef, 'BAUBLE');
    updateInstances(heartsRef, 'HEART');
    updateInstances(redCubesRef, 'RED_CUBE');
    updateInstances(silverBaublesRef, 'SILVER_BAUBLE');
    updateInstances(silverStarsRef, 'SILVER_STAR');

    if (topStarRef.current) {
      const topP = Math.pow(p, 0.5);
      topStarRef.current.position.set(
        THREE.MathUtils.lerp(topStarLogic.scatterPos[0], topStarLogic.treePos[0], topP),
        THREE.MathUtils.lerp(topStarLogic.scatterPos[1], topStarLogic.treePos[1], topP),
        THREE.MathUtils.lerp(topStarLogic.scatterPos[2], topStarLogic.treePos[2], topP)
      );
      topStarRef.current.rotation.y = t * 1.2;
      topStarRef.current.rotation.z = Math.sin(t * 1.5) * 0.15;
      const pulse = 0.85 + Math.sin(t * 4) * 0.15;
      topStarRef.current.scale.setScalar(0.7 * pulse);

      const starMaterial = topStarRef.current.material as THREE.MeshPhysicalMaterial;
      starMaterial.emissiveIntensity = 4 + Math.sin(t * 6.0) * 2.0;
    }
  });

  return (
    <group>
      {/* High-Fidelity Luxury Gift Boxes */}
      <group>
        <instancedMesh ref={giftsRef} args={[undefined, undefined, CONFIG.ornamentCount.gifts]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshPhysicalMaterial 
            color={COLORS.luxuryRed} 
            roughness={0.45} 
            metalness={0.15} 
            emissive={COLORS.luxuryRed} 
            emissiveIntensity={0.4}
            clearcoat={1.0}
            clearcoatRoughness={0.08}
            sheen={1.0}
            sheenColor={COLORS.brightRed}
            sheenRoughness={0.3}
            envMapIntensity={2}
          />
        </instancedMesh>
        {/* Horizontal Gold Ribbon */}
        <instancedMesh ref={ribbonsHRef} args={[undefined, undefined, CONFIG.ornamentCount.gifts]}>
          <boxGeometry args={[1.04, 0.18, 1.04]} />
          <meshPhysicalMaterial 
            color={COLORS.gold} 
            metalness={1.0} 
            roughness={0.05}
            emissive={COLORS.highGold}
            emissiveIntensity={0.25}
            clearcoat={1.0}
            reflectivity={1.0}
            envMapIntensity={8}
          />
        </instancedMesh>
        {/* Vertical Gold Ribbon */}
        <instancedMesh ref={ribbonsVRef} args={[undefined, undefined, CONFIG.ornamentCount.gifts]}>
          <boxGeometry args={[0.18, 1.04, 1.04]} />
          <meshPhysicalMaterial 
            color={COLORS.gold} 
            metalness={1.0} 
            roughness={0.05}
            emissive={COLORS.highGold}
            emissiveIntensity={0.25}
            clearcoat={1.0}
            reflectivity={1.0}
            envMapIntensity={8}
          />
        </instancedMesh>
        {/* Decorative Bows on Top */}
        <instancedMesh ref={bowsRef} args={[undefined, undefined, CONFIG.ornamentCount.gifts]}>
          <torusKnotGeometry args={[0.2, 0.05, 64, 8, 2, 3]} />
          <meshPhysicalMaterial 
            color={COLORS.gold} 
            metalness={1.0} 
            roughness={0.1}
            emissive={COLORS.highGold}
            emissiveIntensity={0.4}
            clearcoat={1.0}
            reflectivity={1.0}
            envMapIntensity={10}
          />
        </instancedMesh>
      </group>

      {/* Sparkling Gold Balls */}
      <instancedMesh ref={ballsRef} args={[undefined, undefined, CONFIG.ornamentCount.balls]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhysicalMaterial 
          ref={ballsMaterialRef}
          color={COLORS.gold} 
          roughness={0.0}
          metalness={1.0} 
          emissive={COLORS.highGold}
          emissiveIntensity={0.5}
          envMapIntensity={10}
          clearcoat={1.0}
          clearcoatRoughness={0.0}
          reflectivity={1.0}
          iridescence={0.3}
          iridescenceIOR={1.8}
        />
      </instancedMesh>

      {/* Pink Hearts */}
      <instancedMesh ref={heartsRef} args={[heartGeometry, undefined, CONFIG.ornamentCount.hearts]}>
        <meshPhysicalMaterial 
          ref={heartsMaterialRef}
          color={COLORS.pink} 
          emissive={COLORS.pink}
          emissiveIntensity={1.0}
          roughness={0.1}
          metalness={0.8}
          clearcoat={1.0}
          envMapIntensity={3}
        />
      </instancedMesh>

      {/* Small Red Cubes */}
      <instancedMesh ref={redCubesRef} args={[undefined, undefined, CONFIG.ornamentCount.redCubes]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color={COLORS.brightRed} 
          roughness={0.2} 
          metalness={0.8}
          emissive={COLORS.brightRed}
          emissiveIntensity={0.8}
        />
      </instancedMesh>

      {/* Silver Baubles (Sparse & Muted) */}
      <instancedMesh ref={silverBaublesRef} args={[undefined, undefined, CONFIG.ornamentCount.silverBaubles]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhysicalMaterial 
          color={COLORS.silver} 
          roughness={0.3} 
          metalness={0.9} 
          envMapIntensity={2}
          reflectivity={0.5}
          clearcoat={0.2}
        />
      </instancedMesh>

      {/* New: Sparse Silver Stars with Star-like procedural texture */}
      <instancedMesh ref={silverStarsRef} args={[starGeometry, undefined, CONFIG.ornamentCount.silverStars]}>
        <meshPhysicalMaterial 
          color={COLORS.mutedSilver} 
          roughness={0.6} 
          roughnessMap={starPatternTexture}
          metalness={1.0} 
          envMapIntensity={5}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
          clearcoatRoughnessMap={starPatternTexture}
          reflectivity={1.0}
        />
      </instancedMesh>

      {/* Geometric Diamond Baubles */}
      <instancedMesh ref={baublesRef} args={[undefined, undefined, CONFIG.ornamentCount.baubles]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial 
          color={COLORS.pearl} 
          roughness={0.0} 
          metalness={1.0} 
          envMapIntensity={5}
          emissive="#ffffff"
          emissiveIntensity={0.4}
        />
      </instancedMesh>

      {/* Glitter Stars */}
      <instancedMesh ref={starsRef} args={[undefined, undefined, CONFIG.ornamentCount.stars]}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color={COLORS.highGold} />
      </instancedMesh>

      {/* Masterpiece Top Star */}
      <mesh ref={topStarRef} geometry={starGeometry}>
        <meshPhysicalMaterial 
          color={COLORS.highGold} 
          emissive={COLORS.highGold} 
          emissiveIntensity={5} 
          metalness={1.0} 
          roughness={0.0} 
          envMapIntensity={12}
          clearcoat={1.0}
          reflectivity={1.0}
        />
        <pointLight intensity={5} distance={8} color={COLORS.highGold} />
      </mesh>
    </group>
  );
};