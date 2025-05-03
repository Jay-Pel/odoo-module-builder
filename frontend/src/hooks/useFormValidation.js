import { useState, useCallback } from 'react';
import { validateModuleData, validateField } from '../utils/validation/moduleValidation';
import { useModuleSession } from './useModuleSession';

export const useFormValidation = (step) => {
  const [errors, setErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  const { addError, clearErrors } = useModuleSession();

  const validateForm = useCallback(async (data) => {
    setIsValidating(true);
    try {
      const { isValid, errors: validationErrors } = await validateModuleData(step, data);
      
      setErrors(validationErrors);
      
      // Update global validation state
      if (!isValid) {
        Object.entries(validationErrors).forEach(([field, error]) => {
          addError(field, error);
        });
      } else {
        clearErrors();
      }
      
      return isValid;
    } catch (error) {
      console.error('Validation error:', error);
      setErrors({ general: 'An unexpected error occurred during validation' });
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [step, addError, clearErrors]);

  const validateSingleField = useCallback(async (field, value) => {
    try {
      const error = await validateField(field, value, step);
      
      setErrors(prev => ({
        ...prev,
        [field]: error
      }));
      
      // Update global validation state
      if (error) {
        addError(field, error);
      } else {
        clearErrors();
      }
      
      return !error;
    } catch (error) {
      console.error(`Error validating field ${field}:`, error);
      return false;
    }
  }, [step, addError, clearErrors]);

  const clearValidationErrors = useCallback(() => {
    setErrors({});
    clearErrors();
  }, [clearErrors]);

  return {
    errors,
    isValidating,
    validateForm,
    validateSingleField,
    clearValidationErrors
  };
};

export default useFormValidation; 