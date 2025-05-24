'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import QuestionPortal from '@/components/Onboarding/QuestionPortal'
import SpecificationEditor from '@/components/Specification/SpecificationEditor'
import { Card, CardContent } from '@/components/UI/Card'
import { Button } from '@/components/UI/Button'
import { useToast } from '@/components/UI'
import { UserRequirements } from '@/types'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'

interface SpecificationData {
  id: string
  markdown: string
  timestamp: string
  version: number
}

type FlowStep = 'questionnaire' | 'generating' | 'editing' | 'complete'

interface SpecificationFlowProps {
  onComplete?: (specification: SpecificationData) => void
  onBack?: () => void
}

export default function SpecificationFlow({ onComplete, onBack }: SpecificationFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>('questionnaire')
  const [userRequirements, setUserRequirements] = useState<UserRequirements | null>(null)
  const [specification, setSpecification] = useState<SpecificationData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const { showSuccess, showError } = useToast()

  const handleQuestionnaireComplete = async (requirements: UserRequirements) => {
    setUserRequirements(requirements)
    setCurrentStep('generating')
    setIsGenerating(true)
    setGenerationError(null)

    try {
      // Call the specification generation API
      const response = await fetch('/api/generate-specification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleName: requirements.moduleName,
          odooVersion: requirements.odooVersion,
          odooEdition: requirements.odooEdition,
          requirements: requirements.requirements
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to generate specification')
      }

      const result = await response.json()
      
      setSpecification(result.data)
      setCurrentStep('editing')
      
      showSuccess('Your module specification has been generated successfully!', 'Specification Ready')

    } catch (error: any) {
      console.error('Specification generation error:', error)
      setGenerationError(error.message || 'Failed to generate specification')
      
      showError({
        code: 'GENERATION_ERROR',
        message: error.message || 'Failed to generate specification',
        timestamp: new Date()
      })
      
      // Go back to questionnaire to retry
      setTimeout(() => {
        setCurrentStep('questionnaire')
        setIsGenerating(false)
        setGenerationError(null)
      }, 3000)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSpecificationApprove = () => {
    if (specification) {
      setCurrentStep('complete')
      if (onComplete) {
        onComplete(specification)
      }
    }
  }

  const handleSpecificationSave = (updatedSpec: SpecificationData) => {
    setSpecification(updatedSpec)
  }

  const handleBackToQuestionnaire = () => {
    setCurrentStep('questionnaire')
    setSpecification(null)
    setUserRequirements(null)
  }

  const renderGeneratingState = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <Card variant="glass" className="backdrop-blur-xl max-w-md w-full">
        <CardContent className="p-8 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mx-auto mb-6"
          >
            <Loader2 className="h-16 w-16 text-blue-400" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-white mb-3">
            Generating Your Specification
          </h2>
          
          <p className="text-white/70 mb-6">
            Our AI is analyzing your requirements and creating a comprehensive development specification for your Odoo module.
          </p>
          
          <div className="space-y-2 text-left text-white/60 text-sm">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
              Analyzing requirements
            </div>
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 text-blue-400 mr-2 animate-spin" />
              Generating technical specifications
            </div>
            <div className="flex items-center text-white/40">
              <div className="h-4 w-4 rounded-full border-2 border-white/20 mr-2" />
              Creating user stories and test cases
            </div>
          </div>

          {generationError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg"
            >
              <div className="flex items-center text-red-300">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="text-sm">{generationError}</span>
              </div>
              <p className="text-red-300/70 text-xs mt-2">
                Returning to questionnaire in a moment...
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderCompleteState = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <Card variant="glass" className="backdrop-blur-xl max-w-md w-full">
        <CardContent className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="mx-auto mb-6"
          >
            <CheckCircle className="h-16 w-16 text-green-400" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-white mb-3">
            Specification Approved!
          </h2>
          
          <p className="text-white/70 mb-6">
            Your module specification is ready for the development phase.
          </p>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleBackToQuestionnaire}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Create Another
            </Button>
            <Button
              variant="glow"
              onClick={() => onComplete && specification && onComplete(specification)}
              className="flex-1"
            >
              Continue to Development
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <AnimatePresence mode="wait">
      {currentStep === 'questionnaire' && (
        <motion.div
          key="questionnaire"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <QuestionPortal
            onComplete={handleQuestionnaireComplete}
            onBack={onBack || (() => {})}
          />
        </motion.div>
      )}

      {currentStep === 'generating' && (
        <motion.div
          key="generating"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {renderGeneratingState()}
        </motion.div>
      )}

      {currentStep === 'editing' && specification && (
        <motion.div
          key="editing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <SpecificationEditor
            specification={specification}
            onSave={handleSpecificationSave}
            onApprove={handleSpecificationApprove}
            onBack={handleBackToQuestionnaire}
          />
        </motion.div>
      )}

      {currentStep === 'complete' && (
        <motion.div
          key="complete"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {renderCompleteState()}
        </motion.div>
      )}
    </AnimatePresence>
  )
} 