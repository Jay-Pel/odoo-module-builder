'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface GalaxyProgressProps {
  currentStep: number
  totalSteps: number
}

export default function GalaxyProgress({ currentStep, totalSteps }: GalaxyProgressProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Step indicators as constellation */}
      <div className="flex items-center space-x-8">
        {Array.from({ length: totalSteps }, (_, index) => {
          const isCompleted = index < currentStep - 1
          const isCurrent = index === currentStep - 1
          const isUpcoming = index > currentStep - 1
          
          return (
            <div key={index} className="relative flex items-center">
              {/* Star/Planet for each step */}
              <motion.div
                className={`relative w-4 h-4 rounded-full ${
                  isCompleted 
                    ? 'bg-gradient-to-r from-blue-400 to-purple-500' 
                    : isCurrent 
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                    : 'bg-gray-600'
                }`}
                style={{
                  boxShadow: isCompleted || isCurrent 
                    ? '0 0 12px rgba(147, 197, 253, 0.6)' 
                    : 'none'
                }}
                animate={{
                  scale: isCurrent ? [1, 1.3, 1] : 1,
                  rotate: isCurrent ? [0, 360] : 0
                }}
                transition={{
                  scale: { duration: 2, repeat: Infinity },
                  rotate: { duration: 3, repeat: Infinity, ease: "linear" }
                }}
              >
                {/* Orbiting particles for current step */}
                {isCurrent && (
                  <>
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full"
                        style={{
                          left: '50%',
                          top: '50%',
                        }}
                        animate={{
                          x: [0, Math.cos((i * 120 + Date.now() * 0.002) * Math.PI / 180) * 12],
                          y: [0, Math.sin((i * 120 + Date.now() * 0.002) * Math.PI / 180) * 12],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                          delay: i * 0.2
                        }}
                      />
                    ))}
                  </>
                )}
                
                {/* Glow effect for completed steps */}
                {isCompleted && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.6, 0.2, 0.6]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
              </motion.div>
              
              {/* Connection lines between steps */}
              {index < totalSteps - 1 && (
                <motion.div 
                  className="w-12 h-0.5 ml-4"
                  style={{
                    background: isCompleted 
                      ? 'linear-gradient(to right, rgba(147, 197, 253, 0.8), rgba(139, 92, 246, 0.6))'
                      : 'rgba(107, 114, 128, 0.4)'
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ 
                    scaleX: isCompleted ? 1 : 0,
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              )}
            </div>
          )
        })}
      </div>
      
      {/* Animated progress galaxy */}
      <div className="relative w-32 h-32">
        {/* Background galaxy */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 0deg,
              rgba(139, 69, 219, 0.3) 0deg,
              rgba(59, 130, 246, 0.2) 120deg,
              rgba(16, 185, 129, 0.1) 240deg,
              rgba(139, 69, 219, 0.3) 360deg
            )`,
            filter: 'blur(1px)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Progress arc */}
        <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(107, 114, 128, 0.3)"
            strokeWidth="2"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
            animate={{ 
              strokeDashoffset: 2 * Math.PI * 45 * (1 - progress / 100)
            }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 1)" />
              <stop offset="50%" stopColor="rgba(139, 92, 246, 1)" />
              <stop offset="100%" stopColor="rgba(236, 72, 153, 1)" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className="text-2xl font-bold text-white"
            key={currentStep}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep}
          </motion.div>
          <div className="text-xs text-white/60">of {totalSteps}</div>
        </div>
        
        {/* Floating particles around galaxy */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: '50%',
              top: '50%',
              filter: 'blur(0.5px)',
            }}
            animate={{
              x: [0, Math.cos(i * 45 * Math.PI / 180) * (50 + Math.sin(Date.now() * 0.001 + i) * 10)],
              y: [0, Math.sin(i * 45 * Math.PI / 180) * (50 + Math.cos(Date.now() * 0.001 + i) * 10)],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>
      
      {/* Step description */}
      <motion.div 
        className="text-center text-white/80"
        key={currentStep}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-sm font-medium">
          {currentStep === 1 && "Name Your Module"}
          {currentStep === 2 && "Select Odoo Version"}
          {currentStep === 3 && "Define Requirements"}
          {currentStep === 4 && "Ready to Generate"}
        </div>
      </motion.div>
    </div>
  )
} 