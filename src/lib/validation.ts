export type ValidationResult = { valid: true } | { valid: false; error: string };

export const validators = {
  required: (value: string, fieldName: string): ValidationResult => {
    if (!value || !value.trim()) {
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true };
  },

  email: (value: string): ValidationResult => {
    if (!value || !value.trim()) {
      return { valid: false, error: "Email is required" };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      return { valid: false, error: "Invalid email format" };
    }
    return { valid: true };
  },

  phone: (value: string): ValidationResult => {
    if (!value || !value.trim()) {
      return { valid: true };
    }
    const cleaned = value.replace(/[\s\-\(\)]/g, "");
    if (cleaned.length < 7) {
      return { valid: false, error: "Phone number too short" };
    }
    return { valid: true };
  },

  minLength: (min: number) => (value: string, fieldName: string): ValidationResult => {
    if (value && value.length < min) {
      return { valid: false, error: `${fieldName} must be at least ${min} characters` };
    }
    return { valid: true };
  },

  maxLength: (max: number) => (value: string, fieldName: string): ValidationResult => {
    if (value && value.length > max) {
      return { valid: false, error: `${fieldName} must be at most ${max} characters` };
    }
    return { valid: true };
  },

  numeric: (value: string, fieldName: string): ValidationResult => {
    if (value && isNaN(Number(value))) {
      return { valid: false, error: `${fieldName} must be a number` };
    }
    return { valid: true };
  },

  positiveNumber: (value: number, fieldName: string): ValidationResult => {
    if (value < 0) {
      return { valid: false, error: `${fieldName} must be positive` };
    }
    return { valid: true };
  },

  url: (value: string): ValidationResult => {
    if (!value || !value.trim()) {
      return { valid: true };
    }
    try {
      new URL(value.trim());
      return { valid: true };
    } catch {
      return { valid: false, error: "Invalid URL format" };
    }
  },
};

export function validateAll(validations: ValidationResult[]): string | null {
  for (const v of validations) {
    if (v.valid === false) {
      return v.error;
    }
  }
  return null;
}