import { NextRequest, NextResponse } from 'next/server'
import { geminiService } from '@/services/geminiService'
import { errorService } from '@/services/errorService'
import { storageService } from '@/services/storageService'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { 
          error: 'Missing specification ID',
          details: 'Specification ID is required in the URL path'
        },
        { status: 400 }
      )
    }

    // Validate ID format (basic validation)
    if (!id.startsWith('spec_') || id.length < 15) {
      return NextResponse.json(
        { 
          error: 'Invalid specification ID format',
          details: 'The provided specification ID is not valid'
        },
        { status: 400 }
      )
    }

    // Retrieve specification
    const result = await geminiService.getSpecification(id)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error: any) {
    console.error('Specification retrieval error:', error)

    // Check if it's a not found error
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { 
          error: 'Specification not found',
          message: 'The requested specification could not be found',
          details: error.message
        },
        { status: 404 }
      )
    }

    // Create error record for other errors
    const appError = errorService.createError(
      'UNKNOWN_ERROR',
      'Failed to retrieve specification',
      error,
      'get-specification-api'
    )

    // Return user-friendly error
    return NextResponse.json(
      { 
        error: 'Failed to retrieve specification',
        message: errorService.getUserFriendlyMessage(appError),
        details: error.message
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { 
          error: 'Missing specification ID',
          details: 'Specification ID is required in the URL path'
        },
        { status: 400 }
      )
    }

    const { markdown } = body
    
    if (!markdown || markdown.trim().length < 50) {
      return NextResponse.json(
        { 
          error: 'Invalid markdown content',
          details: 'Markdown content is required and must be substantial'
        },
        { status: 400 }
      )
    }

    // Get existing specification to update version
    const existingSpec = await geminiService.getSpecification(id)
    
    // Create updated specification
    const updatedSpec = {
      id,
      markdown: markdown.trim(),
      timestamp: new Date().toISOString(),
      version: existingSpec.version + 1
    }

    // Store the updated specification using storage service
    await storageService.storeSpecification(updatedSpec)

    return NextResponse.json({
      success: true,
      data: updatedSpec
    })

  } catch (error: any) {
    console.error('Specification update error:', error)

    // Check if it's a not found error
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { 
          error: 'Specification not found',
          message: 'The specification to update could not be found',
          details: error.message
        },
        { status: 404 }
      )
    }

    // Create error record
    const appError = errorService.createError(
      'UNKNOWN_ERROR',
      'Failed to update specification',
      error,
      'update-specification-api'
    )

    // Return user-friendly error
    return NextResponse.json(
      { 
        error: 'Failed to update specification',
        message: errorService.getUserFriendlyMessage(appError),
        details: error.message
      },
      { status: 500 }
    )
  }
} 