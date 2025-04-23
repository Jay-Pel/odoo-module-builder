import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

// Create a canvas element for the shader
const AnimatedCanvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 0.5rem;
`;

// The button container
const ButtonContainer = styled(motion.div)`
  position: relative;
  overflow: hidden;
  border-radius: 0.5rem;
  width: auto;
  padding: 0;
  box-shadow: 0 4px 15px rgba(74, 111, 220, 0.25);
  cursor: pointer;

  &:hover {
    box-shadow: 0 8px 25px rgba(74, 111, 220, 0.4);
  }
`;

// Button text content
const ButtonContent = styled(motion.div)`
  position: relative;
  z-index: 2;
  color: white;
  padding: 0.875rem 2rem;
  font-weight: 600;
  font-size: 1rem;
  text-align: center;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

// Actual button component
const ShaderButton = ({ children, onClick, to = "/chat", icon: Icon }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Initialize and clean up WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get WebGL context
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // Adjust canvas resolution for HiDPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Vertex shader source
    const vertexShaderSrc = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment shader source - create beautiful animated gradient
    const fragmentShaderSrc = `
      precision highp float;
      
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 mouse;
      uniform bool isHovered;
      
      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        
        // Adjust UV coordinates
        vec2 centeredUV = uv * 2.0 - 1.0;
        centeredUV.x *= resolution.x / resolution.y;
        
        // Mouse influence
        float mouseDistance = length(centeredUV - mouse * 2.0);
        float mouseInfluence = isHovered ? (1.0 - smoothstep(0.0, 0.5, mouseDistance)) * 0.5 : 0.0;
        
        // First color: blue with mouse influence
        vec3 color1 = vec3(0.29, 0.44, 0.86); // Primary blue
        
        // Second color: lighter blue with mouse influence
        vec3 color2 = vec3(0.48, 0.58, 0.91); // Secondary blue
        
        // Animated noise pattern
        float noise = sin(centeredUV.x * 5.0 + time * 0.5) * 
                     cos(centeredUV.y * 5.0 + time * 0.3) * 0.5 + 0.5;
        
        // Animate colors
        float t = sin(time * 0.5) * 0.5 + 0.5;
        float angle = atan(centeredUV.y, centeredUV.x);
        float radius = length(centeredUV);
        
        // Create gradient patterns
        float pattern1 = sin(radius * 10.0 - time) * 0.5 + 0.5;
        float pattern2 = sin(angle * 5.0 + time) * 0.5 + 0.5;
        float blend = sin(pattern1 * pattern2 + time * 0.5) * 0.5 + 0.5;
        
        // Adjust blend with hover and mouse
        blend = mix(blend, mouseInfluence + blend, mouseInfluence * 2.0);
        
        // Mix colors
        vec3 finalColor = mix(color1, color2, blend);
        
        // Add subtle sparkle effect on hover
        if (isHovered) {
          float sparkle = max(0.0, sin(gl_FragCoord.x * 0.15 + time * 2.0) * 
                                   sin(gl_FragCoord.y * 0.1 - time * 1.5));
          sparkle = pow(sparkle, 8.0) * 0.5;
          finalColor += sparkle;
        }
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    // Create and compile vertex shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSrc);
    gl.compileShader(vertexShader);

    // Create and compile fragment shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSrc);
    gl.compileShader(fragmentShader);

    // Create shader program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Create a buffer for a simple quad
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    // Set position attribute
    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const timeLocation = gl.getUniformLocation(program, 'time');
    const resolutionLocation = gl.getUniformLocation(program, 'resolution');
    const mouseLocation = gl.getUniformLocation(program, 'mouse');
    const isHoveredLocation = gl.getUniformLocation(program, 'isHovered');

    // Set resolution uniform
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

    // Animation loop
    let startTime = Date.now();

    const animate = () => {
      // Calculate time in seconds
      const currentTime = (Date.now() - startTime) / 1000;

      // Update uniforms
      gl.uniform1f(timeLocation, currentTime);
      gl.uniform2f(mouseLocation, mousePosition.x, mousePosition.y);
      gl.uniform1i(isHoveredLocation, isHovered ? 1 : 0);

      // Render
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animate();

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(buffer);
    };
  }, [isHovered, mousePosition]);

  // Handle mouse movement for shader effects
  const handleMouseMove = (e) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - bounds.left) / bounds.width;
    const y = 1 - (e.clientY - bounds.top) / bounds.height; // Invert Y for WebGL coords
    setMousePosition({ x, y });
  };

  // Button container animation variants
  const containerVariants = {
    initial: { 
      scale: 1,
      y: 0
    },
    hover: { 
      scale: 1.03,
      y: -3
    },
    tap: { 
      scale: 0.98,
      y: 0
    }
  };

  // Button content animation variants
  const contentVariants = {
    initial: { 
      y: 0
    },
    hover: { 
      y: -2
    },
    tap: { 
      y: 1
    }
  };

  // Handle hover state
  const handleHoverStart = () => setIsHovered(true);
  const handleHoverEnd = () => setIsHovered(false);

  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <ButtonContainer
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        variants={containerVariants}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        onHoverStart={handleHoverStart}
        onHoverEnd={handleHoverEnd}
        onMouseMove={handleMouseMove}
        onClick={onClick}
      >
        <AnimatedCanvas ref={canvasRef} />
        <ButtonContent 
          variants={contentVariants}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {Icon && <Icon />}
          {children}
        </ButtonContent>
      </ButtonContainer>
    </Link>
  );
};

export default ShaderButton;