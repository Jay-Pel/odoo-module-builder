'use client'

import React, { useState } from 'react'
import LandingHero from '@/components/Hero/LandingHero'
import QuestionPortal from '@/components/Onboarding/QuestionPortal'
import SpecificationReview from '@/components/ModuleFlow/SpecificationReview'
import CodeGeneration from '@/components/ModuleFlow/CodeGeneration'
import TestingDashboard from '@/components/ModuleFlow/TestingDashboard'
import { UserRequirements, SpecificationResponse, specificationAdapter } from '@/services/specificationAdapter'
import { CodingResponse, n8nService } from '@/services/n8nService'
import NoSSR from '@/components/Common/NoSSR'
import { useToast } from '@/components/UI/ToastProvider'
import WaveLoadingAnimation from '@/components/Common/WaveLoadingAnimation'

type AppState = 'landing' | 'onboarding' | 'specification' | 'generation' | 'testing'

export default function Home() {
  const [currentState, setCurrentState] = useState<AppState>('landing')
  const [userRequirements, setUserRequirements] = useState<UserRequirements | null>(null)
  const [specification, setSpecification] = useState<SpecificationResponse | null>(null)
  const [generationResponse, setGenerationResponse] = useState<CodingResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const { showSuccess } = useToast()

  const handleGetStarted = () => {
    setCurrentState('onboarding')
  }

  const handleOnboardingComplete = async (requirements: UserRequirements) => {
    setUserRequirements(requirements)
    setLoading(true)
    
    try {
      showSuccess('Requirements submitted successfully! Generating specification...')
      const specResponse = await specificationAdapter.generateSpecification(requirements)
      setSpecification(specResponse)
      setCurrentState('specification')
      showSuccess('Specification generated successfully!')
    } catch (error) {
      console.error('Error generating specification:', error)
      // Error is automatically handled by errorService and shown via toast
    } finally {
      setLoading(false)
    }
  }

  const handleSpecificationApproved = async () => {
    if (!specification) return
    
    setLoading(true)
    try {
      showSuccess('Specification approved! Starting code generation...')
      const codeResponse = await n8nService.generateCode(
        specification.specificationId,
        specification.specification
      )
      setGenerationResponse(codeResponse)
      setCurrentState('generation')
      showSuccess('Code generation started successfully!')
    } catch (error) {
      console.error('Error generating code:', error)
      // Error is automatically handled by errorService and shown via toast
    } finally {
      setLoading(false)
    }
  }

  const handleSpecificationChanges = async (feedback: string, editedSpec?: string) => {
    if (!specification) return
    
    setLoading(true)
    try {
      showSuccess('Submitting feedback...')
      const updatedSpec = await specificationAdapter.modifySpecification(
        specification.specificationId,
        feedback,
        editedSpec || specification.specification
      )
      setSpecification(updatedSpec)
      showSuccess('Specification updated based on your feedback!')
    } catch (error) {
      console.error('Error submitting feedback:', error)
      // Error is automatically handled by errorService and shown via toast
    } finally {
      setLoading(false)
    }
  }

  const handleGenerationComplete = (response: CodingResponse) => {
    setGenerationResponse(response)
    setCurrentState('testing')
    showSuccess('Module generation completed! Ready for testing.')
  }

  const handleCheckCodingStatus = async (generationId: string) => {
    try {
    return await n8nService.checkCodingStatus(generationId)
    } catch (error) {
      console.error('Error checking coding status:', error)
      // Error is automatically handled by errorService and shown via toast
      throw error
    }
  }

  const handleBackToLanding = () => {
    setCurrentState('landing')
    setUserRequirements(null)
    setSpecification(null)
    setGenerationResponse(null)
    showSuccess('Session reset. Ready to start a new module!')
  }

  const renderCurrentState = () => {
    // Show loading animation during specification generation
    if (loading && (currentState === 'onboarding' || currentState === 'specification')) {
      return <WaveLoadingAnimation 
        title="Generating Module Specification" 
        subtitle="Our AI is analyzing your requirements and creating a detailed specification..." 
      />
    }

    switch (currentState) {
      case 'landing':
        return <LandingHero onGetStarted={handleGetStarted} />
      
      case 'onboarding':
        return (
          <QuestionPortal 
            onComplete={handleOnboardingComplete}
            onBack={handleBackToLanding}
          />
        )
      
      case 'specification':
        if (!specification) return null
        return (
          <SpecificationReview 
            specification={specification}
            loading={loading}
            onApprove={handleSpecificationApproved}
            onRequestChanges={handleSpecificationChanges}
            onBack={() => setCurrentState('onboarding')}
          />
        )
      
      case 'generation':
        if (!generationResponse) return null
        return (
          <CodeGeneration 
            generationId={generationResponse.generationId}
            initialResponse={generationResponse}
            onComplete={handleGenerationComplete}
            onRunTests={() => setCurrentState('testing')}
            onCheckStatus={handleCheckCodingStatus}
          />
        )
      
      case 'testing':
        return (
          <TestingDashboard 
            onRunAutomatedTests={async () => {
              // Implementation for automated tests
            }}
            onInitializeUserTesting={async () => {
              // Implementation for user testing
            }}
            onSubmitUserFeedback={async (feedback: string, images?: File[]) => {
              // Implementation for user feedback
            }}
            loading={loading}
          />
        )
      
      default:
        return <LandingHero onGetStarted={handleGetStarted} />
    }
  }

  return (
    <NoSSR fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <div className="min-h-screen">
        {renderCurrentState()}
      </div>
    </NoSSR>
  )
}
