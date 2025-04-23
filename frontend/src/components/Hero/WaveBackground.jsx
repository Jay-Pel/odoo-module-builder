import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";

const WaveMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color(0.1, 0.4, 0.8),
    uColorAccent: new THREE.Color(0.3, 0.6, 0.9)
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying float vElevation;
    uniform float uTime;
    
    void main() {
      vUv = uv;
      
      // Create waves using sine patterns
      float elevation = sin(position.x * 3.0 + uTime * 0.7) * 0.1 +
                       sin(position.y * 2.5 + uTime * 0.65) * 0.1;
      
      vElevation = elevation;
      
      // Apply elevation to vertex position
      vec3 newPosition = position;
      newPosition.z += elevation;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform vec3 uColor;
    uniform vec3 uColorAccent;
    varying vec2 vUv;
    varying float vElevation;
    
    void main() {
      // Mix colors based on the elevation for a gradient effect
      vec3 color = mix(uColor, uColorAccent, vElevation * 5.0 + 0.5);
      
      // Apply some lighting effect
      color += vElevation * 0.3;
      
      gl_FragColor = vec4(color, 0.7);
    }
  `
);

extend({ WaveMaterial });

function WavePlane() {
  const materialRef = useRef();
  
  // Animation loop
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uTime = clock.getElapsedTime();
    }
  });
  
  // Adjust these parameters for different wave effects
  const planeArgs = [12, 8, 64, 64];
  
  return (
    <mesh rotation={[-Math.PI / 3, 0, 0]} position={[0, -2, 0]}>
      <planeGeometry args={planeArgs} />
      <waveMaterial ref={materialRef} transparent />
    </mesh>
  );
}

function Scene() {
  return (
    <Canvas 
      camera={{ position: [0, 0, 2], fov: 70 }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
    >
      <ambientLight intensity={0.5} />
      <WavePlane />
    </Canvas>
  );
}

export default function WaveBackground() {
  return <Scene />;
}