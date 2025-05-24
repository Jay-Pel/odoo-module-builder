import { NextRequest, NextResponse } from 'next/server'
import { geminiService } from '@/services/geminiService'
import { errorService } from '@/services/errorService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const { moduleName, odooVersion, odooEdition, requirements } = body
    
    if (!moduleName || !odooVersion || !odooEdition || !requirements) {
      return NextResponse.json(
        { 
          error: 'Missing required fields', 
          details: 'moduleName, odooVersion, odooEdition, and requirements are required' 
        },
        { status: 400 }
      )
    }

    // Validate Odoo version format
    const validVersions = ['18.0', '17.0', '16.0', '15.0', '14.0']
    if (!validVersions.includes(odooVersion)) {
      return NextResponse.json(
        { 
          error: 'Invalid Odoo version', 
          details: `Version must be one of: ${validVersions.join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Validate Odoo edition
    const validEditions = ['Community', 'Enterprise']
    if (!validEditions.includes(odooEdition)) {
      return NextResponse.json(
        { 
          error: 'Invalid Odoo edition', 
          details: `Edition must be one of: ${validEditions.join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedRequest = {
      moduleName: moduleName.trim(),
      odooVersion: odooVersion.trim(),
      odooEdition: odooEdition.trim(),
      requirements: requirements.trim(),
      files: undefined // Files are handled separately for now
    }

    // Generate specification using Gemini service
    const result = await geminiService.generateSpecification(sanitizedRequest)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error: any) {
    console.error('Specification generation error:', error)

    // Create error record
    const appError = errorService.createError(
      'GENERATION_ERROR',
      'Failed to generate specification',
      error,
      'generate-specification-api'
    )

    // Return user-friendly error
    return NextResponse.json(
      { 
        error: 'Failed to generate specification',
        message: errorService.getUserFriendlyMessage(appError),
        details: error.message
      },
      { status: 500 }
    )
  }
} 