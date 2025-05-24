'use client'

import * as React from "react"
import { Toast, type Toast as ToastType } from "./Toast"
import { errorService, type AppError } from "@/services/errorService"

interface ToastContextType {
  addToast: (toast: Omit<ToastType, 'id'>) => void
  removeToast: (id: string) => void
  showError: (error: AppError) => void
  showSuccess: (message: string, title?: string) => void
  showWarning: (message: string, title?: string) => void
  showInfo: (message: string, title?: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: React.ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<ToastType[]>([])

  const addToast = React.useCallback((toast: Omit<ToastType, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastType = { ...toast, id }
    setToasts(prev => [...prev, newToast])
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showError = React.useCallback((error: AppError) => {
    addToast({
      type: 'error',
      title: 'Error',
      message: errorService.getUserFriendlyMessage(error),
      duration: 7000
    })
  }, [addToast])

  const showSuccess = React.useCallback((message: string, title?: string) => {
    addToast({
      type: 'success',
      title: title || 'Success',
      message,
      duration: 4000
    })
  }, [addToast])

  const showWarning = React.useCallback((message: string, title?: string) => {
    addToast({
      type: 'warning',
      title: title || 'Warning',
      message,
      duration: 5000
    })
  }, [addToast])

  const showInfo = React.useCallback((message: string, title?: string) => {
    addToast({
      type: 'info',
      title: title || 'Info',
      message,
      duration: 4000
    })
  }, [addToast])

  // Listen to error service for automatic error toasts
  React.useEffect(() => {
    const unsubscribe = errorService.addErrorListener((error) => {
      showError(error)
    })

    return unsubscribe
  }, [showError])

  const contextValue: ToastContextType = {
    addToast,
    removeToast,
    showError,
    showSuccess,
    showWarning,
    showInfo
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onDismiss={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
} 