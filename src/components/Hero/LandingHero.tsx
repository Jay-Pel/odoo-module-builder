'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/UI/Button'
import { ArrowRight, Sparkles, Zap } from 'lucide-react'
import WaveBackground from './WaveBackground'
import ParticleField from '@/components/Common/ParticleField'
import GradientSphere from '@/components/Common/GradientSphere'

interface LandingHeroProps {
  onGetStarted: () => void
}

export default function LandingHero({ onGetStarted }: LandingHeroProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  }

  return (
    <WaveBackground className="min-h-screen flex items-center justify-center">
      <ParticleField 
        particleCount={30}
        colors={['#60A5FA', '#A78BFA', '#F472B6', '#FBBF24', '#34D399']}
        speed={0.5}
      />
      
      {/* Decorative gradient spheres */}
      <GradientSphere 
        size={120}
        className="absolute top-20 right-20 opacity-30"
        colors={['#8B5CF6', '#06B6D4', '#10B981']}
      />
      <GradientSphere 
        size={80}
        className="absolute bottom-32 left-16 opacity-20"
        colors={['#F59E0B', '#EF4444', '#8B5CF6']}
      />
      
      <motion.div 
        className="container mx-auto px-4 text-center text-white relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="mb-8"
          variants={itemVariants}
        >
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <span className="text-sm font-medium">AI-Powered Module Generation</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Build Your
            <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
              {" "}Odoo Modules{" "}
            </span>
            Effortlessly
          </h1>
        </motion.div>

        <motion.p 
          className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto text-white/90 leading-relaxed"
          variants={itemVariants}
        >
          Transform your business requirements into fully functional Odoo modules with our intelligent AI assistant. 
          No coding required - just describe what you need.
        </motion.p>

        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          variants={itemVariants}
        >
          <Button 
            size="xl" 
            variant="glow"
            onClick={onGetStarted}
            className="group"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
          
          <Button 
            size="xl" 
            variant="outline"
            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
          >
            Watch Demo
          </Button>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          variants={itemVariants}
        >
          <FeatureCard
            icon={<Zap className="h-8 w-8" />}
            title="Lightning Fast"
            description="Generate complete modules in minutes, not hours"
          />
          <FeatureCard
            icon={<Sparkles className="h-8 w-8" />}
            title="AI-Powered"
            description="Advanced AI understands your requirements and creates optimized code"
          />
          <FeatureCard
            icon={<ArrowRight className="h-8 w-8" />}
            title="Ready to Deploy"
            description="Generated modules are tested and ready for production use"
          />
        </motion.div>
      </motion.div>
    </WaveBackground>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <motion.div 
      className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
      whileHover={{ 
        scale: 1.05,
        backgroundColor: "rgba(255, 255, 255, 0.15)"
      }}
      transition={{ duration: 0.2 }}
    >
      <div className="text-yellow-300 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-white/80 text-sm">{description}</p>
    </motion.div>
  )
} 