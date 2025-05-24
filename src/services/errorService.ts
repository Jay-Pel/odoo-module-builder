export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: Date
  context?: string
}

export type ErrorType = 
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'GENERATION_ERROR'
  | 'TESTING_ERROR'
  | 'DOWNLOAD_ERROR'
  | 'UNKNOWN_ERROR'

class ErrorService {
  private errors: AppError[] = []
  private listeners: ((error: AppError) => void)[] = []

  createError(
    type: ErrorType,
    message: string,
    details?: any,
    context?: string
  ): AppError {
    const error: AppError = {
      code: type,
      message,
      details,
      timestamp: new Date(),
      context
    }

    this.errors.push(error)
    this.notifyListeners(error)
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${type}] ${message}`, details)
    }

    return error
  }

  handleNetworkError(error: any, context: string): AppError {
    return this.createError(
      'NETWORK_ERROR',
      'Network connection failed. Please check your internet connection.',
      error,
      context
    )
  }

  getErrorMessage(error: AppError): string {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Network connection failed. Please check your internet connection and try again.'
      case 'VALIDATION_ERROR':
        return 'Please check your input and try again.'
      case 'GENERATION_ERROR':
        return 'Failed to generate module. Please try again with different requirements.'
      case 'TESTING_ERROR':
        return 'Testing failed. Please review the generated module and try again.'
      case 'DOWNLOAD_ERROR':
        return 'Failed to download module. Please try again or contact support if the issue persists.'
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }

  getUserFriendlyMessage(error: AppError): string {
    return this.getErrorMessage(error)
  }

  addErrorListener(listener: (error: AppError) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners(error: AppError): void {
    this.listeners.forEach(listener => listener(error))
  }

  getRecentErrors(limit: number = 10): AppError[] {
    return this.errors.slice(-limit)
  }

  clearErrors(): void {
    this.errors = []
  }
}

export const errorService = new ErrorService() 