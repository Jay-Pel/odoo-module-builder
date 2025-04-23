import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, MeshDistortMaterial, Sphere } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

// Custom sphere mesh with distortion
function GradientSphere({ position, scale, speed = 0.5, distort = 0.4, mousePos }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  
  // Animation
  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed;
    
    // Subtle float animation
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(t) * 0.1;
      
      // Apply subtle rotation
      meshRef.current.rotation.x = Math.sin(t / 4) * 0.3;
      meshRef.current.rotation.y = t * 0.2;
      
      // Add mouse interaction if available
      if (mousePos.current) {
        // Influence rotation based on mouse position
        meshRef.current.rotation.x += mousePos.current.y * 0.2;
        meshRef.current.rotation.y += mousePos.current.x * 0.2;
      }
    }
  });

  // Compute scale based on state
  const computedScale = scale * (hovered ? 1.1 : 1) * (clicked ? 1.2 : 1);
  
  // Create custom gradient shader material
  const uniforms = useRef({
    time: { value: 0 },
    color1: { value: new THREE.Color('#4a6fdc') }, // Primary color
    color2: { value: new THREE.Color('#7b93e8') },  // Secondary color
    mousePos: { value: new THREE.Vector2(0, 0) },
  });
  
  // Update shader uniforms
  useFrame(({ clock }) => {
    if (uniforms.current) {
      uniforms.current.time.value = clock.getElapsedTime();
      
      if (mousePos.current) {
        uniforms.current.mousePos.value.x = mousePos.current.x;
        uniforms.current.mousePos.value.y = mousePos.current.y;
      }
    }
  });
  
  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={[computedScale, computedScale, computedScale]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => setClicked(!clicked)}
    >
      <sphereGeometry args={[1, 64, 64]} />
      <MeshDistortMaterial
        color="#4a6fdc"
        attach="material"
        distort={distort * (hovered ? 1.5 : 1)}
        speed={speed * 2}
        roughness={0.2}
        metalness={0.8}
      />
    </mesh>
  );
}

function Scene({ mousePos }) {
  const { camera } = useThree();
  
  // Reset camera position
  useEffect(() => {
    camera.position.set(0, 0, 5);
  }, [camera]);
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <GradientSphere position={[-2, 0, 0]} scale={1.2} mousePos={mousePos} speed={0.3} distort={0.3} />
      <GradientSphere position={[2, 0, 0]} scale={0.8} mousePos={mousePos} speed={0.6} distort={0.6} />
    </>
  );
}

export default function InteractiveGradientSphere() {
  const mousePos = useRef({ x: 0, y: 0 });
  
  const handleMouseMove = (event) => {
    // Normalize mouse position from -1 to 1
    mousePos.current = {
      x: (event.clientX / window.innerWidth) * 2 - 1,
      y: -(event.clientY / window.innerHeight) * 2 + 1,
    };
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, delay: 0.5 }}
      className="absolute inset-0 w-full h-full"
      onMouseMove={handleMouseMove}
      style={{ 
        position: 'absolute', 
        width: '100%', 
        height: '100%', 
        top: 0, 
        left: 0, 
        zIndex: 2,
        pointerEvents: 'none'
      }}
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <Scene mousePos={mousePos} />
      </Canvas>
    </motion.div>
  );
}