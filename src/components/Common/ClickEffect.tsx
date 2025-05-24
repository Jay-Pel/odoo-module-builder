'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ClickRipple {
  id: number
  x: number
  y: number
}

export default function ClickEffect() {
  const [ripples, setRipples] = useState<ClickRipple[]>([])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const newRipple: ClickRipple = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY,
      }

      setRipples(prev => [...prev, newRipple])

      // Remove ripple after animation completes
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
      }, 600)
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            className="absolute"
            style={{
              left: ripple.x - 10,
              top: ripple.y - 10,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ 
              scale: [0, 1, 1.5],
              opacity: [1, 0.8, 0]
            }}
            transition={{ 
              duration: 0.6,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
          >
            {/* Milky Way spiral arms */}
            <motion.div
              className="absolute inset-0 w-5 h-5 rounded-full"
              style={{
                background: `conic-gradient(from 0deg,
                  rgba(255, 255, 255, 0.8) 0deg,
                  rgba(200, 220, 255, 0.6) 60deg,
                  rgba(180, 190, 255, 0.4) 120deg,
                  rgba(255, 255, 255, 0.8) 180deg,
                  rgba(220, 200, 255, 0.5) 240deg,
                  rgba(190, 180, 255, 0.3) 300deg,
                  rgba(255, 255, 255, 0.8) 360deg
                )`,
                filter: 'blur(0.5px)',
              }}
              animate={{ 
                rotate: [0, 360],
                scale: [0.4, 1.2, 1.6]
              }}
              transition={{ 
                duration: 1.2,
                ease: "easeOut"
              }}
            />

            {/* Galactic center */}
            <motion.div
              className="absolute inset-1 w-3 h-3 rounded-full"
              style={{
                background: `radial-gradient(circle, 
                  rgba(255, 255, 255, 1) 0%,
                  rgba(255, 248, 220, 0.9) 30%,
                  rgba(200, 220, 255, 0.6) 70%,
                  transparent 100%
                )`,
                filter: 'blur(0.2px)',
                boxShadow: '0 0 6px rgba(255, 255, 255, 0.8)',
              }}
              animate={{ 
                scale: [0.3, 1, 0.7, 0],
                opacity: [1, 1, 0.8, 0]
              }}
              transition={{ 
                duration: 0.5,
                ease: "easeOut"
              }}
            />

            {/* Subtle star dust particles */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-0.5 h-0.5 bg-white rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                  filter: 'blur(0.1px)',
                  boxShadow: '0 0 2px rgba(255, 255, 255, 0.6)',
                }}
                animate={{
                  x: [0, Math.cos(i * 120 * Math.PI / 180) * 15],
                  y: [0, Math.sin(i * 120 * Math.PI / 180) * 15],
                  opacity: [1, 0.6, 0],
                  scale: [0, 1, 0]
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.1,
                  ease: "easeOut"
                }}
              />
            ))}

            {/* Outer glow */}
            <motion.div
              className="absolute inset-0 w-5 h-5 rounded-full"
              style={{
                background: `radial-gradient(circle, 
                  transparent 40%,
                  rgba(200, 220, 255, 0.1) 70%,
                  transparent 100%
                )`,
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
              animate={{
                scale: [1, 2.5, 3],
                opacity: [0.6, 0.2, 0]
              }}
              transition={{
                duration: 0.6,
                ease: "easeOut"
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
} 