import { NextRequest, NextResponse } from 'next/server'
import { geminiService } from '@/services/geminiService'
import { errorService } from '@/services/errorService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { specificationId, modificationPrompt, currentMarkdown } = body
    
    // Validate required fields
    if (!specificationId || !modificationPrompt || !currentMarkdown) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          details: 'specificationId, modificationPrompt, and currentMarkdown are required'
        },
        { status: 400 }
      )
    }

    // Validate specification ID format
    if (!specificationId.startsWith('spec_') || specificationId.length < 15) {
      return NextResponse.json(
        { 
          error: 'Invalid specification ID format',
          details: 'The provided specification ID is not valid'
        },
        { status: 400 }
      )
    }

    // Validate content length
    if (modificationPrompt.trim().length < 10) {
      return NextResponse.json(
        { 
          error: 'Invalid modification prompt',
          details: 'Modification prompt must be at least 10 characters long'
        },
        { status: 400 }
      )
    }

    // Call Gemini service to modify specification
    const result = await geminiService.modifySpecification({
      specificationId,
      modificationPrompt: modificationPrompt.trim(),
      currentMarkdown
    })

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error: any) {
    console.error('Specification modification error:', error)

    // Check if it's a not found error
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { 
          error: 'Specification not found',
          message: 'The specification to modify could not be found',
          details: error.message
        },
        { status: 404 }
      )
    }

    // Create error record
    const appError = errorService.createError(
      'GENERATION_ERROR',
      'Failed to modify specification',
      error,
      'modify-specification-api'
    )

    // Return user-friendly error
    return NextResponse.json(
      { 
        error: 'Failed to modify specification',
        message: errorService.getUserFriendlyMessage(appError),
        details: error.message
      },
      { status: 500 }
    )
  }
} 