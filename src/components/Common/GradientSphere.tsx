'use client'

import React, { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

interface GradientSphereProps {
  size?: number
  className?: string
  colors?: string[]
  intensity?: number
}

export default function GradientSphere({ 
  size = 200, 
  className = '',
  colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'],
  intensity = 0.8
}: GradientSphereProps) {
  const sphereRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const springConfig = { damping: 25, stiffness: 700 }
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), springConfig)
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), springConfig)
  
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!sphereRef.current) return
    
    const rect = sphereRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const x = (event.clientX - centerX) / rect.width
    const y = (event.clientY - centerY) / rect.height
    
    mouseX.set(x)
    mouseY.set(y)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`

  return (
    <motion.div
      ref={sphereRef}
      className={`relative ${className}`}
      style={{
        width: size,
        height: size,
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d'
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Main sphere */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${colors[0]}${Math.round(intensity * 255).toString(16)}, ${colors[1]}${Math.round(intensity * 200).toString(16)}, ${colors[2]}${Math.round(intensity * 150).toString(16)}, ${colors[3]}${Math.round(intensity * 100).toString(16)})`,
          filter: 'blur(1px)',
          transform: 'translateZ(0)'
        }}
      />
      
      {/* Highlight */}
      <div
        className="absolute top-4 left-4 w-8 h-8 rounded-full opacity-60"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
          transform: 'translateZ(10px)'
        }}
      />
      
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-full animate-pulse"
        style={{
          background: `radial-gradient(circle, transparent 60%, ${colors[0]}20, ${colors[1]}15, transparent)`,
          transform: 'scale(1.2) translateZ(-10px)',
          filter: 'blur(20px)'
        }}
      />
      
      {/* Orbiting particles */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: colors[i % colors.length],
            left: '50%',
            top: '50%',
            marginLeft: '-4px',
            marginTop: '-4px'
          }}
          animate={{
            rotate: 360,
            x: [0, Math.cos(i * 120 * Math.PI / 180) * (size * 0.6), 0],
            y: [0, Math.sin(i * 120 * Math.PI / 180) * (size * 0.6), 0]
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      ))}
    </motion.div>
  )
} 