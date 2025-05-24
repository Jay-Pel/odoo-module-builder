import { errorService } from './errorService'

export interface UserRequirements {
  moduleName: string;
  odooVersion: string;
  odooEdition: string;
  requirements: string;
  files?: File[];
}

export interface SpecificationResponse {
  id: string;
  markdown: string;
  timestamp: string;
  version: number;
}

export interface SpecificationResult {
  success: boolean;
  data?: SpecificationResponse;
  error?: string;
  message?: string;
  details?: string;
}

export interface ModificationRequest {
  specificationId: string;
  modificationPrompt: string;
  currentMarkdown: string;
}

class ApiService {
  private async handleRequest<T>(
    url: string, 
    options: RequestInit, 
    context: string
  ): Promise<T> {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = errorService.createError(
          'NETWORK_ERROR',
          `API request failed: ${response.status} ${response.statusText}`,
          { 
            status: response.status, 
            statusText: response.statusText,
            details: errorData.details || errorData.message 
          },
          context
        );
        throw error;
      }

      const result = await response.json();
      
      // Check if the API returned an error in the response body
      if (!result.success && result.error) {
        const error = errorService.createError(
          'VALIDATION_ERROR',
          result.error,
          { details: result.details, message: result.message },
          context
        );
        throw error;
      }

      return result;
    } catch (error: any) {
      if (error.code) {
        // Already handled by errorService
        throw error;
      }

      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        const networkError = errorService.handleNetworkError(error, context);
        throw networkError;
      }

      // Handle other errors
      const unknownError = errorService.createError(
        'UNKNOWN_ERROR',
        'An unexpected error occurred',
        error,
        context
      );
      throw unknownError;
    }
  }

  async generateSpecification(requirements: UserRequirements): Promise<SpecificationResponse> {
    const result = await this.handleRequest<SpecificationResult>(
      '/api/generate-specification',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requirements),
      },
      'Generate Specification'
    );

    if (!result.data) {
      throw new Error('No specification data returned from API');
    }

    return result.data;
  }

  async modifySpecification(request: ModificationRequest): Promise<SpecificationResponse> {
    const result = await this.handleRequest<SpecificationResult>(
      '/api/modify-specification',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      },
      'Modify Specification'
    );

    if (!result.data) {
      throw new Error('No specification data returned from API');
    }

    return result.data;
  }

  async getSpecification(specificationId: string): Promise<SpecificationResponse> {
    const result = await this.handleRequest<SpecificationResult>(
      `/api/specification/${specificationId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      'Get Specification'
    );

    if (!result.data) {
      throw new Error('No specification data returned from API');
    }

    return result.data;
  }

  async updateSpecification(specificationId: string, markdown: string): Promise<SpecificationResponse> {
    const result = await this.handleRequest<SpecificationResult>(
      `/api/specification/${specificationId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markdown }),
      },
      'Update Specification'
    );

    if (!result.data) {
      throw new Error('No specification data returned from API');
    }

    return result.data;
  }
}

export const apiService = new ApiService() 