import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useFormValidation } from '../../hooks/useFormValidation';

const InputContainer = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 500;
`;

const InputWrapper = styled.div`
  position: relative;
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${({ theme, error }) => 
    error ? theme.colors.error : theme.colors.border};
  border-radius: 4px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text.primary};

  &:focus {
    outline: none;
    border-color: ${({ theme, error }) => 
      error ? theme.colors.error : theme.colors.primary.main};
    box-shadow: 0 0 0 2px ${({ theme, error }) => 
      error ? `${theme.colors.error}30` : `${theme.colors.primary.main}30`};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.disabled};
    cursor: not-allowed;
  }
`;

const StyledTextarea = styled(StyledInput).attrs({ as: 'textarea' })`
  min-height: 100px;
  resize: vertical;
`;

const StyledSelect = styled(StyledInput).attrs({ as: 'select' })`
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  padding-right: 2.5rem;
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.error};
  font-size: 0.875rem;
  margin-top: 0.25rem;
  min-height: 1.25rem;
`;

const HelpText = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.875rem;
  margin-top: 0.25rem;
`;

const FormInput = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  disabled,
  required,
  options,
  help,
  validationStep,
  error: propError,
  ...props
}) => {
  const [touched, setTouched] = useState(false);
  const { validateSingleField } = useFormValidation(validationStep);
  const [error, setError] = useState(propError);

  useEffect(() => {
    setError(propError);
  }, [propError]);

  const handleBlur = async (e) => {
    setTouched(true);
    if (validationStep) {
      const fieldError = await validateSingleField(name, value);
      setError(fieldError);
    }
    if (onBlur) {
      onBlur(e);
    }
  };

  const renderInput = () => {
    const commonProps = {
      id: name,
      name,
      value: value || '',
      onChange,
      onBlur: handleBlur,
      disabled,
      error: touched && error,
      'aria-invalid': touched && error ? 'true' : 'false',
      'aria-describedby': error ? `${name}-error` : undefined,
      ...props
    };

    switch (type) {
      case 'textarea':
        return <StyledTextarea {...commonProps} placeholder={placeholder} />;
      case 'select':
        return (
          <StyledSelect {...commonProps}>
            {placeholder && <option value="">{placeholder}</option>}
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </StyledSelect>
        );
      default:
        return (
          <StyledInput
            {...commonProps}
            type={type}
            placeholder={placeholder}
          />
        );
    }
  };

  return (
    <InputContainer>
      {label && (
        <Label htmlFor={name}>
          {label}
          {required && <span style={{ color: 'red' }}> *</span>}
        </Label>
      )}
      <InputWrapper>
        {renderInput()}
      </InputWrapper>
      <ErrorMessage id={`${name}-error`} role="alert">
        {touched && error}
      </ErrorMessage>
      {help && <HelpText>{help}</HelpText>}
    </InputContainer>
  );
};

export default FormInput; 