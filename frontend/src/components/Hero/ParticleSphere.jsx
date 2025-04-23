import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { AdaptiveDpr } from '@react-three/drei';
import * as THREE from 'three';

// Create a simple circular particle texture in memory
function createCircleTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Draw a soft circle
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2;
  
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.5, 'rgba(200, 220, 255, 0.8)');
  gradient.addColorStop(1, 'rgba(200, 220, 255, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function Particles({ count = 2000, mousePosition }) {
  const pointsRef = useRef();
  const [particleTexture, setParticleTexture] = useState(null);
  
  // Create particle texture
  useEffect(() => {
    setParticleTexture(createCircleTexture());
  }, []);
  
  // Generate random particle positions in a sphere
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const radius = 1.5 + Math.random() * 0.5; // Sphere radius with some variation
      const theta = Math.random() * Math.PI * 2; // Random angle in XY plane
      const phi = Math.acos(2 * Math.random() - 1); // Random angle from Z axis
      
      // Convert spherical to cartesian coordinates
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      temp.push({ position: [x, y, z], velocity: [0, 0, 0], originalPosition: [x, y, z] });
    }
    return temp;
  }, [count]);
  
  // Create geometry with positions and attributes
  const [positions, sizes] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = particles[i].position[0];
      positions[i * 3 + 1] = particles[i].position[1];
      positions[i * 3 + 2] = particles[i].position[2];
      
      // Random sizes for particles
      sizes[i] = Math.random() * 0.5 + 0.5;
    }
    
    return [positions, sizes];
  }, [count, particles]);
  
  // Animation loop
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    if (pointsRef.current) {
      const positionArray = pointsRef.current.geometry.attributes.position.array;
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const { position, velocity, originalPosition } = particles[i];
        
        // Apply subtle rotation
        const angle = time * 0.2;
        const x = position[0];
        const z = position[2];
        
        // Mouse interaction
        if (mousePosition.current) {
          const mouseX = mousePosition.current.x;
          const mouseY = mousePosition.current.y;
          
          // Calculate direction from particle to mouse (with inverse effect)
          const dx = position[0] - mouseX * 3;
          const dy = position[1] - mouseY * 3;
          const dz = position[2];
          
          // Distance to mouse
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          // Apply force inversely proportional to distance
          const force = 0.05 / (1 + distance * distance);
          
          velocity[0] += dx * force;
          velocity[1] += dy * force;
          velocity[2] += dz * force;
        }
        
        // Apply velocity with damping
        position[0] += velocity[0];
        position[1] += velocity[1];
        position[2] += velocity[2];
        
        velocity[0] *= 0.95;
        velocity[1] *= 0.95;
        velocity[2] *= 0.95;
        
        // Gradually return to original position
        position[0] += (originalPosition[0] - position[0]) * 0.01;
        position[1] += (originalPosition[1] - position[1]) * 0.01;
        position[2] += (originalPosition[2] - position[2]) * 0.01;
        
        // Rotate the entire sphere
        positionArray[i3] = position[0] * Math.cos(angle) - position[2] * Math.sin(angle);
        positionArray[i3 + 1] = position[1];
        positionArray[i3 + 2] = position[0] * Math.sin(angle) + position[2] * Math.cos(angle);
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  if (!particleTexture) return null;
  
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
          attach="attributes-size" 
          count={sizes.length} 
          array={sizes} 
          itemSize={1} 
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#aaddff"
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        map={particleTexture}
      />
    </points>
  );
}

function Scene({ mousePosition }) {
  return (
    <Canvas 
      camera={{ position: [0, 0, 5], fov: 50 }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}
    >
      <ambientLight intensity={0.5} />
      <Particles mousePosition={mousePosition} />
      <AdaptiveDpr pixelated />
    </Canvas>
  );
}

export default function ParticleSphere() {
  const mousePosition = useRef({ x: 0, y: 0 });
  
  const handleMouseMove = (event) => {
    // Normalize mouse position from -1 to 1
    mousePosition.current = {
      x: (event.clientX / window.innerWidth) * 2 - 1,
      y: -(event.clientY / window.innerHeight) * 2 + 1,
    };
  };
  
  return (
    <div 
      onMouseMove={handleMouseMove}
      style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, zIndex: 1 }}
    >
      <Scene mousePosition={mousePosition} />
    </div>
  );
}