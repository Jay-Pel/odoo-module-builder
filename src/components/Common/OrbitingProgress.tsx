'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface OrbitingProgressProps {
  progress: number // 0-100
  size?: number
  className?: string
  particleCount?: number
}

export default function OrbitingProgress({ 
  progress, 
  size = 100, 
  className = '',
  particleCount = 8
}: OrbitingProgressProps) {
  const radius = size / 2 - 10
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg
        className="absolute inset-0 transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="2"
          fill="none"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Orbiting particles */}
      {[...Array(particleCount)].map((_, i) => {
        const angle = (i / particleCount) * 360
        const delay = i * 0.1
        
        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: `hsl(${240 + i * 30}, 70%, 60%)`,
              left: '50%',
              top: '50%',
              marginLeft: '-4px',
              marginTop: '-4px',
              filter: 'blur(0.5px)'
            }}
            animate={{
              rotate: 360,
              x: Math.cos((angle * Math.PI) / 180) * (radius + 15),
              y: Math.sin((angle * Math.PI) / 180) * (radius + 15)
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
              delay
            }}
          />
        )
      })}
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span 
          className="text-white font-bold text-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
        >
          {Math.round(progress)}%
        </motion.span>
      </div>
      
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
          filter: 'blur(10px)'
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </div>
  )
} 