import * as yup from 'yup';

// Base schemas for reusable validation
const fieldSchema = yup.object().shape({
  name: yup.string().required('Field name is required'),
  type: yup.string().required('Field type is required'),
  required: yup.boolean(),
  help: yup.string(),
  default: yup.mixed(),
  options: yup.array().of(yup.string()).when('type', {
    is: 'selection',
    then: yup.array().min(1, 'Selection field must have at least one option')
  })
});

const modelSchema = yup.object().shape({
  name: yup.string()
    .required('Model name is required')
    .matches(/^[a-z][a-z0-9_]*$/, 'Model name must be lowercase and contain only letters, numbers, and underscores'),
  description: yup.string().required('Model description is required'),
  fields: yup.array().of(fieldSchema).min(1, 'Model must have at least one field')
});

// Requirements validation schema
export const requirementsSchema = yup.object().shape({
  moduleName: yup.string()
    .required('Module name is required')
    .matches(/^[a-z][a-z0-9_]*$/, 'Module name must be lowercase and contain only letters, numbers, and underscores'),
  description: yup.string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters'),
  version: yup.string()
    .required('Version is required')
    .matches(/^\d+\.\d+\.\d+\.\d+\.\d+$/, 'Version must be in format x.y.z.w.v'),
  category: yup.string()
    .required('Category is required'),
  author: yup.string()
    .required('Author is required'),
  website: yup.string()
    .url('Website must be a valid URL'),
  license: yup.string()
    .required('License is required')
    .oneOf(['LGPL-3', 'GPL-3', 'Other'], 'Invalid license type'),
  depends: yup.array()
    .of(yup.string())
    .min(1, 'Module must have at least one dependency')
});

// Specification validation schema
export const specificationSchema = yup.object().shape({
  models: yup.array()
    .of(modelSchema)
    .min(1, 'At least one model is required'),
  views: yup.array().of(yup.object().shape({
    name: yup.string().required('View name is required'),
    model: yup.string().required('View model is required'),
    type: yup.string()
      .required('View type is required')
      .oneOf(['tree', 'form', 'kanban', 'calendar', 'pivot'], 'Invalid view type'),
    priority: yup.number().min(1, 'Priority must be at least 1')
  })),
  security: yup.object().shape({
    groups: yup.array().of(yup.string()),
    rules: yup.array().of(yup.object().shape({
      name: yup.string().required('Rule name is required'),
      model: yup.string().required('Rule model is required'),
      permissions: yup.object().shape({
        read: yup.boolean(),
        write: yup.boolean(),
        create: yup.boolean(),
        unlink: yup.boolean()
      }).test('at-least-one', 'At least one permission must be true', 
        value => value.read || value.write || value.create || value.unlink)
    }))
  })
});

// Development plan validation schema
export const developmentPlanSchema = yup.object().shape({
  tasks: yup.array().of(yup.object().shape({
    id: yup.string().required('Task ID is required'),
    name: yup.string().required('Task name is required'),
    description: yup.string().required('Task description is required'),
    dependencies: yup.array().of(yup.string()),
    status: yup.string()
      .required('Task status is required')
      .oneOf(['pending', 'in_progress', 'completed', 'blocked'], 'Invalid task status')
  })).min(1, 'At least one task is required'),
  timeline: yup.object().shape({
    startDate: yup.date().required('Start date is required'),
    endDate: yup.date()
      .required('End date is required')
      .min(yup.ref('startDate'), 'End date must be after start date')
  })
});

/**
 * Validates module data against the appropriate schema
 * @param {string} step - The validation step ('requirements', 'specification', 'development')
 * @param {Object} data - The data to validate
 * @returns {Promise<{isValid: boolean, errors: Object}>}
 */
export const validateModuleData = async (step, data) => {
  try {
    let schema;
    switch (step) {
      case 'requirements':
        schema = requirementsSchema;
        break;
      case 'specification':
        schema = specificationSchema;
        break;
      case 'development':
        schema = developmentPlanSchema;
        break;
      default:
        throw new Error(`Invalid validation step: ${step}`);
    }

    await schema.validate(data, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (err) {
    if (err.inner) {
      const errors = err.inner.reduce((acc, error) => {
        acc[error.path] = error.message;
        return acc;
      }, {});
      return { isValid: false, errors };
    }
    return { 
      isValid: false, 
      errors: { general: err.message } 
    };
  }
};

/**
 * Validates a single field value
 * @param {string} field - The field name
 * @param {any} value - The value to validate
 * @param {string} step - The validation step
 * @returns {Promise<string|null>} - Returns error message or null if valid
 */
export const validateField = async (field, value, step) => {
  try {
    let schema;
    switch (step) {
      case 'requirements':
        schema = requirementsSchema.fields[field];
        break;
      case 'specification':
        schema = specificationSchema.fields[field];
        break;
      case 'development':
        schema = developmentPlanSchema.fields[field];
        break;
      default:
        throw new Error(`Invalid validation step: ${step}`);
    }

    if (!schema) {
      throw new Error(`No validation schema found for field: ${field}`);
    }

    await schema.validate(value);
    return null;
  } catch (err) {
    return err.message;
  }
}; 