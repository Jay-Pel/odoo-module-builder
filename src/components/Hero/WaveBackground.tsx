'use client'

import React, { useEffect, useRef } from 'react'

interface WaveBackgroundProps {
  className?: string
  children?: React.ReactNode
}

export default function WaveBackground({ className = '', children }: WaveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let time = 0

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const drawWave = (amplitude: number, frequency: number, phase: number, color: string) => {
      ctx.beginPath()
      ctx.moveTo(0, canvas.height)

      for (let x = 0; x <= canvas.width; x++) {
        const y = canvas.height / 2 + 
          Math.sin((x * frequency + phase) * Math.PI / 180) * amplitude +
          Math.sin((x * frequency * 2 + phase * 1.5) * Math.PI / 180) * amplitude * 0.5
        
        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.lineTo(canvas.width, canvas.height)
      ctx.lineTo(0, canvas.height)
      ctx.fillStyle = color
      ctx.fill()
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Multiple wave layers with different colors and properties
      drawWave(60, 0.5, time * 0.5, 'rgba(59, 130, 246, 0.1)')
      drawWave(80, 0.3, time * 0.8, 'rgba(147, 51, 234, 0.08)')
      drawWave(40, 0.7, time * 1.2, 'rgba(236, 72, 153, 0.06)')
      drawWave(100, 0.2, time * 0.3, 'rgba(16, 185, 129, 0.04)')

      time += 0.5
      animationId = requestAnimationFrame(animate)
    }

    resizeCanvas()
    animate()

    const handleResize = () => {
      resizeCanvas()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
} 