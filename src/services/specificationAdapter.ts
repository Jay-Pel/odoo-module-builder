import { apiService, SpecificationResponse as ApiSpecificationResponse, UserRequirements as ApiUserRequirements } from './apiService'
import { SpecificationResponse as N8nSpecificationResponse, UserRequirements as N8nUserRequirements } from './n8nService'

export interface UserRequirements {
  moduleName: string
  odooVersion: string
  odooEdition: string
  requirements: string
  files?: File[]
}

export interface SpecificationResponse {
  specificationId: string
  specification: string
  status: string
  metadata?: any
}

class SpecificationAdapter {
  
  // Convert from N8N UserRequirements to API UserRequirements
  private convertUserRequirements(requirements: UserRequirements): ApiUserRequirements {
    return {
      moduleName: requirements.moduleName,
      odooVersion: requirements.odooVersion,
      odooEdition: requirements.odooEdition,
      requirements: requirements.requirements,
      files: requirements.files
    }
  }

  // Convert from API SpecificationResponse to N8N SpecificationResponse
  private convertSpecificationResponse(apiResponse: ApiSpecificationResponse): SpecificationResponse {
    return {
      specificationId: apiResponse.id,
      specification: apiResponse.markdown,
      status: 'completed',
      metadata: {
        timestamp: apiResponse.timestamp,
        version: apiResponse.version
      }
    }
  }

  async generateSpecification(requirements: UserRequirements): Promise<SpecificationResponse> {
    const apiRequirements = this.convertUserRequirements(requirements)
    const apiResponse = await apiService.generateSpecification(apiRequirements)
    return this.convertSpecificationResponse(apiResponse)
  }

  async modifySpecification(specificationId: string, feedback: string, currentMarkdown: string): Promise<SpecificationResponse> {
    const apiResponse = await apiService.modifySpecification({
      specificationId,
      modificationPrompt: feedback,
      currentMarkdown
    })
    return this.convertSpecificationResponse(apiResponse)
  }

  async getSpecification(specificationId: string): Promise<SpecificationResponse> {
    const apiResponse = await apiService.getSpecification(specificationId)
    return this.convertSpecificationResponse(apiResponse)
  }

  async updateSpecification(specificationId: string, markdown: string): Promise<SpecificationResponse> {
    const apiResponse = await apiService.updateSpecification(specificationId, markdown)
    return this.convertSpecificationResponse(apiResponse)
  }
}

export const specificationAdapter = new SpecificationAdapter() 