'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/UI/Button'
import { Input } from '@/components/UI/Input'
import { Card, CardContent } from '@/components/UI/Card'
import { ArrowRight, ArrowLeft, CheckCircle, Upload, X, File } from 'lucide-react'
import { UserRequirements } from '@/types'
import GalaxyProgress from '@/components/Common/GalaxyProgress'

interface QuestionPortalProps {
  onComplete: (requirements: UserRequirements) => void
  onBack: () => void
}

interface Question {
  id: string
  title: string
  subtitle: string
  type: 'text' | 'textarea' | 'select' | 'dual-select'
  options?: string[]
  versionOptions?: string[]
  editionOptions?: string[]
  required: boolean
  field: keyof UserRequirements
}

const questions: Question[] = [
  {
    id: 'module-name',
    title: 'What would you like to name your module?',
    subtitle: 'Choose a descriptive name for your Odoo module',
    type: 'text',
    required: true,
    field: 'moduleName'
  },
  {
    id: 'odoo-version-edition',
    title: 'Which Odoo version and edition are you targeting?',
    subtitle: 'Select both the version and edition of Odoo where this module will be installed',
    type: 'dual-select',
    versionOptions: ['18.0', '17.0', '16.0', '15.0', '14.0'],
    editionOptions: ['Community', 'Enterprise'],
    required: true,
    field: 'odooVersion'
  },
  {
    id: 'requirements',
    title: 'Describe the functional requirements of your module',
    subtitle: 'Be as detailed as possible. Include features, workflows, business logic, and any specific functionality you need',
    type: 'textarea',
    required: true,
    field: 'requirements'
  }
]

export default function QuestionPortal({ onComplete, onBack }: QuestionPortalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Partial<UserRequirements>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isAdvancing, setIsAdvancing] = useState(false)

  const currentQuestion = questions[currentStep]
  const isLastStep = currentStep === questions.length - 1

  // Safety check to prevent undefined access
  if (!currentQuestion) {
    return null
  }

  const handleNext = () => {
    const question = questions[currentStep]

    // Safety check for valid question
    if (!question) {
      return
    }

    // Validation
    if (question.required) {
      if (question.type === 'dual-select') {
        // For dual-select, check both version and edition
        const hasVersion = answers.odooVersion && answers.odooVersion.trim() !== ''
        const hasEdition = (answers as any).odooEdition && (answers as any).odooEdition.trim() !== ''
        
        if (!hasVersion || !hasEdition) {
          const missingFields = []
          if (!hasVersion) missingFields.push('version')
          if (!hasEdition) missingFields.push('edition')
          setErrors({ 
            [question.field]: `Please select both Odoo ${missingFields.join(' and ')}`
          })
          return
        }
      } else {
        // For other types, check the field value
        const value = answers[question.field]
        if (!value || value.toString().trim() === '') {
          setErrors({ [question.field]: 'This field is required' })
          return
        }
      }
    }

    setErrors({})

    if (isLastStep) {
      const finalAnswers = {
        ...answers,
        files: uploadedFiles.length > 0 ? uploadedFiles : undefined
      } as UserRequirements
      onComplete(finalAnswers)
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    } else {
      onBack()
    }
  }

  const handleInputChange = (value: string, field?: keyof UserRequirements) => {
    const targetField = field || currentQuestion.field
    const updatedAnswers = {
      ...answers,
      [targetField]: value
    }
    
    setAnswers(updatedAnswers)
    
    // Clear any existing errors immediately
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[targetField]
      delete newErrors.files // Clear file errors too
      return newErrors
    })

    // Note: Removed auto-advance logic since step 2 now requires dual selection
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentStep === 0) {
      e.preventDefault()
      handleNext()
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Check file count limit
    if (uploadedFiles.length + files.length > 10) {
      setErrors({ files: 'Maximum 10 files allowed' })
      return
    }

    // Check file size limit (25MB each)
    const oversizedFiles = files.filter(file => file.size > 25 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      setErrors({ files: 'Each file must be smaller than 25MB' })
      return
    }

    setUploadedFiles(prev => [...prev, ...files])
    setErrors(prev => ({ ...prev, files: '' }))
    
    // Reset the input so the same file can be uploaded again if removed
    e.target.value = ''
  }

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const progress = ((currentStep + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <GalaxyProgress 
            currentStep={currentStep + 1}
            totalSteps={questions.length}
          />
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card variant="glass" className="backdrop-blur-xl">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {currentQuestion?.title || 'Loading...'}
                  </h2>
                  <p className="text-white/70">
                    {currentQuestion?.subtitle || ''}
                  </p>
                </div>

                <div className="space-y-6">
                  {currentQuestion?.type === 'text' && (
                    <Input
                      type="text"
                      value={answers[currentQuestion.field] as string || ''}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder="Enter your answer..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      error={errors[currentQuestion.field]}
                      onKeyDown={handleKeyDown}
                    />
                  )}

                  {currentQuestion?.type === 'select' && (
                    <div className="space-y-3">
                      {currentQuestion.options?.map((option) => (
                        <motion.button
                          key={option}
                          onClick={() => handleInputChange(option)}
                          className={`w-full p-4 rounded-lg border-2 transition-all ${
                            answers[currentQuestion.field] === option
                              ? 'border-blue-500 bg-blue-500/20 text-white'
                              : 'border-white/20 bg-white/10 text-white/80 hover:border-white/40'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Odoo {option}</span>
                            {answers[currentQuestion.field] === option && (
                              <CheckCircle className="h-5 w-5 text-blue-400" />
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {currentQuestion?.type === 'dual-select' && (
                    <div className="space-y-6">
                      {/* Odoo Version Selection */}
                      <div className="space-y-3">
                        <h3 className="text-white/90 font-medium text-lg">Odoo Version</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {currentQuestion.versionOptions?.map((version) => (
                            <motion.button
                              key={version}
                              onClick={() => handleInputChange(version, 'odooVersion')}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                answers.odooVersion === version
                                  ? 'border-blue-500 bg-blue-500/20 text-white'
                                  : 'border-white/20 bg-white/10 text-white/80 hover:border-white/40'
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Odoo {version}</span>
                                {answers.odooVersion === version && (
                                  <CheckCircle className="h-4 w-4 text-blue-400" />
                                )}
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* Odoo Edition Selection */}
                      <div className="space-y-3">
                        <h3 className="text-white/90 font-medium text-lg">Odoo Edition</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {currentQuestion.editionOptions?.map((edition) => (
                            <motion.button
                              key={edition}
                              onClick={() => handleInputChange(edition, 'odooEdition' as keyof UserRequirements)}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                (answers as any).odooEdition === edition
                                  ? 'border-purple-500 bg-purple-500/20 text-white'
                                  : 'border-white/20 bg-white/10 text-white/80 hover:border-white/40'
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{edition}</span>
                                {(answers as any).odooEdition === edition && (
                                  <CheckCircle className="h-4 w-4 text-purple-400" />
                                )}
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentQuestion?.type === 'textarea' && (
                    <div className="space-y-4">
                      <textarea
                        value={answers[currentQuestion.field] as string || ''}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder="Describe your module requirements in detail..."
                        rows={6}
                        className="w-full p-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                      
                      {/* File Upload Section */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-white/90 font-medium">Attach Files (Optional)</h3>
                          <span className="text-white/60 text-sm">Max 10 files, 25MB each</span>
                        </div>
                        
                        {/* Upload Button */}
                        <div className="relative">
                          <input
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept="*/*"
                          />
                          <div className="flex items-center justify-center w-full p-6 border-2 border-dashed border-white/30 rounded-lg bg-white/5 hover:bg-white/10 hover:border-white/40 transition-all cursor-pointer">
                            <div className="text-center">
                              <Upload className="mx-auto h-8 w-8 text-white/60 mb-2" />
                              <p className="text-white/80 text-sm">
                                Click to upload files or drag and drop
                              </p>
                              <p className="text-white/50 text-xs mt-1">
                                Any file type supported
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Uploaded Files List */}
                        {uploadedFiles.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-white/80 text-sm font-medium">
                              Uploaded Files ({uploadedFiles.length}/10)
                            </h4>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {uploadedFiles.map((file, index) => (
                                <motion.div
                                  key={`${file.name}-${index}`}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="flex items-center justify-between p-2 bg-white/10 rounded border border-white/20"
                                >
                                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                                    <File className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-white text-xs truncate">{file.name}</p>
                                      <p className="text-white/50 text-xs">{formatFileSize(file.size)}</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveFile(index)}
                                    className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* File Upload Errors */}
                        {errors.files && (
                          <p className="text-red-400 text-sm">
                            {errors.files}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {errors[currentQuestion?.field] && (
                    <p className="text-red-400 text-sm">
                      {errors[currentQuestion.field]}
                    </p>
                  )}
                </div>

                <div className="flex justify-between mt-8">
                  <Button
                    variant="ghost"
                    onClick={handlePrevious}
                    className="text-white/80 hover:text-white hover:bg-white/10"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {currentStep === 0 ? 'Back to Home' : 'Previous'}
                  </Button>

                  <Button
                    variant="glow"
                    onClick={handleNext}
                    className="group"
                  >
                    {isLastStep ? 'Generate Module Specifications' : 'Next'}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
} 