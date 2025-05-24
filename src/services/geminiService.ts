import { UserRequirements } from '@/types'
import { errorService, ErrorType } from './errorService'
import { storageService } from './storageService'

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
    }
  }>
}

interface SpecificationRequest {
  moduleName: string
  odooVersion: string
  odooEdition: string
  requirements: string
  files?: File[]
}

interface SpecificationResult {
  id: string
  markdown: string
  timestamp: string
  version: number
}

interface ModificationRequest {
  specificationId: string
  modificationPrompt: string
  currentMarkdown: string
}

export class GeminiService {
  private readonly apiKey: string
  private readonly model: string
  private readonly baseUrl: string

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
    this.model = process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash-preview-05-20'
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models'

    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required')
    }
  }

  /**
   * Generate initial module specification
   */
  async generateSpecification(request: SpecificationRequest): Promise<SpecificationResult> {
    try {
      const prompt = await this.buildSystemPrompt(request)
      const response = await this.callGeminiAPI(prompt)
      
      const specificationId = this.generateSpecificationId()
      const markdown = this.extractMarkdownFromResponse(response)
      
      const result: SpecificationResult = {
        id: specificationId,
        markdown,
        timestamp: new Date().toISOString(),
        version: 1
      }

      // Store specification for later retrieval/modification
      await this.storeSpecification(result)
      
      return result
    } catch (error) {
      errorService.createError(
        'GENERATION_ERROR',
        'Failed to generate specification',
        { ...request, files: request.files?.map(f => f.name) },
        'generateSpecification'
      )
      throw error
    }
  }

  /**
   * Modify existing specification based on user feedback
   */
  async modifySpecification(request: ModificationRequest): Promise<SpecificationResult> {
    try {
      const modificationPrompt = await this.buildModificationPrompt(request)
      const response = await this.callGeminiAPI(modificationPrompt)
      
      const markdown = this.extractMarkdownFromResponse(response)
      
      // Get current specification to increment version
      const currentSpec = await this.getSpecification(request.specificationId)
      
      const result: SpecificationResult = {
        id: request.specificationId,
        markdown,
        timestamp: new Date().toISOString(),
        version: currentSpec.version + 1
      }

      // Update stored specification
      await this.storeSpecification(result)
      
      return result
    } catch (error) {
      errorService.createError(
        'GENERATION_ERROR',
        'Failed to modify specification',
        { specificationId: request.specificationId },
        'modifySpecification'
      )
      throw error
    }
  }

  /**
   * Retrieve stored specification
   */
  async getSpecification(id: string): Promise<SpecificationResult> {
    try {
      const stored = await storageService.getSpecification(id)
      if (!stored) {
        throw new Error(`Specification with ID ${id} not found`)
      }
      
      return stored
    } catch (error) {
      errorService.createError(
        'UNKNOWN_ERROR',
        'Failed to retrieve specification',
        { specificationId: id },
        'getSpecification'
      )
      throw error
    }
  }

  /**
   * Build system prompt with user requirements
   */
  private async buildSystemPrompt(request: SpecificationRequest): Promise<string> {
    let fileContents = ''
    
    // Process uploaded files if any
    if (request.files && request.files.length > 0) {
      fileContents = await this.processUploadedFiles(request.files)
    }

    return `You are a senior software architect. You are mandated to write a development specification for an Odoo ERP module which will be completely compatible with the Odoo community and Odoo enterprise version ${request.odooVersion} (${request.odooEdition} edition).

You need to make sure the user can validate all important aspects of the development like the user access groups level, testing scenarios/user stories, configurations, workflow modification, etc.

IMPORTANT: Always set the Author field in the specification header to "Odoo Module Builder App".

Use this requirement from the client to generate the module development specification.

**Client Requirements:**
${request.requirements}

**Module Name:** ${request.moduleName}

${fileContents ? `**Additional Files and Context:**\n${fileContents}` : ''}

Please generate a comprehensive development specification in markdown format that includes:

1. **Module Overview**
   - Purpose and objectives
   - Target Odoo version and edition compatibility
   - Dependencies and requirements

2. **Functional Requirements**
   - Detailed feature descriptions
   - User stories and use cases
   - Business logic requirements

3. **Technical Specifications**
   - Data models and relationships
   - Views and user interface requirements
   - Workflow and process definitions
   - API endpoints (if applicable)

4. **Security and Access Control**
   - User groups and permissions
   - Security rules and access rights
   - Data privacy considerations

5. **Configuration and Settings**
   - Module configuration options
   - System parameters
   - Installation and setup requirements

6. **Testing Strategy**
   - Unit testing scenarios
   - Integration testing requirements
   - User acceptance testing criteria
   - Performance testing considerations

7. **Deployment and Maintenance**
   - Installation instructions
   - Update and migration procedures
   - Backup and recovery considerations

Please ensure the specification is detailed, technically accurate, and follows Odoo development best practices.`
  }

  /**
   * Build modification prompt
   */
  private async buildModificationPrompt(request: ModificationRequest): Promise<string> {
    return `You are a senior software architect reviewing and modifying an Odoo module development specification.

**Current Specification:**
\`\`\`markdown
${request.currentMarkdown}
\`\`\`

**Modification Request:**
${request.modificationPrompt}

Please update the specification according to the modification request while maintaining:
- Technical accuracy and Odoo best practices
- Comprehensive coverage of all aspects
- Proper markdown formatting
- Consistency with the existing content

Return the complete updated specification in markdown format.`
  }

  /**
   * Call Gemini API
   */
  private async callGeminiAPI(prompt: string): Promise<GeminiResponse> {
    const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`
    
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`)
    }

    return response.json()
  }

  /**
   * Extract markdown content from Gemini response
   */
  private extractMarkdownFromResponse(response: GeminiResponse): string {
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('No content generated by Gemini API')
    }

    const content = response.candidates[0]?.content?.parts?.[0]?.text
    if (!content) {
      throw new Error('Empty response from Gemini API')
    }

    return content.trim()
  }

  /**
   * Process uploaded files and extract text content
   */
  private async processUploadedFiles(files: File[]): Promise<string> {
    const fileContents: string[] = []
    
    for (const file of files) {
      try {
        const text = await this.extractTextFromFile(file)
        if (text.trim()) {
          fileContents.push(`**File: ${file.name}**\n${text}\n`)
        }
      } catch (error) {
        console.warn(`Could not process file ${file.name}:`, error)
        fileContents.push(`**File: ${file.name}** (Could not process: ${file.type})\n`)
      }
    }
    
    return fileContents.join('\n---\n\n')
  }

  /**
   * Extract text content from file
   */
  private async extractTextFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          resolve('Binary file content not readable')
        }
      }
      
      reader.onerror = () => reject(reader.error)
      
      // Handle different file types
      if (file.type.startsWith('text/') || 
          file.name.endsWith('.md') || 
          file.name.endsWith('.txt') ||
          file.name.endsWith('.json') ||
          file.name.endsWith('.py') ||
          file.name.endsWith('.js') ||
          file.name.endsWith('.xml')) {
        reader.readAsText(file)
      } else {
        resolve(`[Binary file: ${file.name} (${file.type}, ${this.formatFileSize(file.size)})]`)
      }
    })
  }

  /**
   * Generate unique specification ID
   */
  private generateSpecificationId(): string {
    return `spec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Store specification using storage service
   */
  private async storeSpecification(spec: SpecificationResult): Promise<void> {
    try {
      await storageService.storeSpecification(spec)
    } catch (error) {
      console.error('Failed to store specification:', error)
      throw error
    }
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

// Export singleton instance
export const geminiService = new GeminiService() 