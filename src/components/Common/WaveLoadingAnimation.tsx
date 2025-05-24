'use client'

import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface WaveLoadingAnimationProps {
  title?: string
  subtitle?: string
}

export default function WaveLoadingAnimation({ 
  title = "Generating Module Specification",
  subtitle = "Our AI is analyzing your requirements..."
}: WaveLoadingAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationIdRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)

    // Animation parameters
    let time = 0
    const particles: Array<{
      x: number
      y: number
      baseY: number
      vx: number
      vy: number
      alpha: number
      size: number
    }> = []

    // Create particles
    const particleCount = 150
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width / window.devicePixelRatio,
        y: Math.random() * canvas.height / window.devicePixelRatio,
        baseY: Math.random() * canvas.height / window.devicePixelRatio,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        alpha: Math.random() * 0.6 + 0.4,
        size: Math.random() * 2 + 1
      })
    }

    const animate = () => {
      const width = canvas.width / window.devicePixelRatio
      const height = canvas.height / window.devicePixelRatio
      
      // Clear canvas with dark background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, width, height)

      time += 0.01

      // Update and draw particles
      particles.forEach((particle, index) => {
        // Wave motion
        const waveX = Math.sin(time + index * 0.1) * 20
        const waveY = Math.sin(time * 0.8 + index * 0.15) * 15
        
        particle.x += particle.vx + waveX * 0.01
        particle.y = particle.baseY + waveY + Math.sin(time + index * 0.1) * 30

        // Wrap around edges
        if (particle.x > width + 10) particle.x = -10
        if (particle.x < -10) particle.x = width + 10
        if (particle.y > height + 10) particle.baseY = -10
        if (particle.y < -10) particle.baseY = height + 10

        // Dynamic alpha based on wave
        const dynamicAlpha = particle.alpha * (0.5 + 0.5 * Math.sin(time * 2 + index * 0.2))

        // Draw particle with gradient
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 2
        )
        gradient.addColorStop(0, `rgba(139, 92, 246, ${dynamicAlpha})`) // Purple
        gradient.addColorStop(0.5, `rgba(59, 130, 246, ${dynamicAlpha * 0.7})`) // Blue
        gradient.addColorStop(1, `rgba(139, 92, 246, 0)`)

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()

        // Connect nearby particles
        particles.forEach((otherParticle, otherIndex) => {
          if (otherIndex <= index) return
          
          const dx = particle.x - otherParticle.x
          const dy = particle.y - otherParticle.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 80) {
            const opacity = (1 - distance / 80) * 0.3 * dynamicAlpha
            ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(otherParticle.x, otherParticle.y)
            ctx.stroke()
          }
        })
      })

      // Add flowing energy waves
      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        ctx.strokeStyle = `rgba(139, 92, 246, ${0.2 + i * 0.1})`
        ctx.lineWidth = 2 - i * 0.5
        
        for (let x = 0; x <= width; x += 5) {
          const y = height / 2 + 
            Math.sin(x * 0.01 + time * 2 + i * Math.PI * 0.5) * 40 +
            Math.sin(x * 0.005 + time * 1.5 + i * Math.PI * 0.3) * 20
          
          if (x === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.stroke()
      }

      animationIdRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', updateCanvasSize)
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center z-50">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: 'transparent' }}
      />
      
      <div className="relative z-10 text-center text-white max-w-md mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-6"
        >
          {/* Pulsing center orb */}
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-purple-400 to-blue-400 blur-sm"
          />

          <div className="space-y-3">
            <motion.h3 
              className="text-2xl font-bold tracking-wide"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {title}
            </motion.h3>
            
            <motion.p 
              className="text-lg text-white/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              {subtitle}
            </motion.p>
          </div>

          {/* Progress indicators */}
          <motion.div 
            className="flex justify-center space-x-2 pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 rounded-full bg-white/40"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 1, 0.4]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
} 