/**
 * Utilidades de validación para formularios
 */

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validar email
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validar contraseña (mínimo 6 caracteres, al menos una mayúscula, un número)
 */
export const validatePassword = (password: string): boolean => {
  // Mínimo 6 caracteres
  if (password.length < 6) return false;
  // Al menos una mayúscula
  if (!/[A-Z]/.test(password)) return false;
  // Al menos un número
  if (!/[0-9]/.test(password)) return false;
  return true;
};

/**
 * Obtener mensaje de error de contraseña
 */
export const getPasswordErrorMessage = (password: string): string | null => {
  if (password.length === 0) return 'La contraseña es requerida';
  if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
  if (!/[A-Z]/.test(password)) return 'La contraseña debe incluir al menos una mayúscula';
  if (!/[0-9]/.test(password)) return 'La contraseña debe incluir al menos un número';
  return null;
};

/**
 * Validar nombre de usuario (3-20 caracteres, alfanuméricos y guion)
 */
export const validateUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
};

/**
 * Validar teléfono (formato flexible)
 */
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[(]?[0-9]{1,3}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
};

/**
 * Validar número positivo
 */
export const validatePositiveNumber = (value: string | number): boolean => {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  return !isNaN(num) && num > 0;
};

/**
 * Validar que un número esté dentro de un rango
 */
export const validateNumberRange = (
  value: string | number,
  min: number,
  max: number
): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num >= min && num <= max;
};

/**
 * Validar que no esté vacío
 */
export const validateNotEmpty = (value: string | null | undefined): boolean => {
  return value !== null && value !== undefined && value.trim().length > 0;
};

/**
 * Validar longitud de string
 */
export const validateLength = (
  value: string,
  min: number,
  max?: number
): boolean => {
  if (value.length < min) return false;
  if (max && value.length > max) return false;
  return true;
};

/**
 * Validar que dos campos coincidan
 */
export const validateMatch = (value1: string, value2: string): boolean => {
  return value1 === value2;
};

/**
 * Validador de formulario completo
 */
export interface FormValidationRules {
  [field: string]: ((value: any) => boolean | string)[];
}

export const validateForm = (
  data: Record<string, any>,
  rules: FormValidationRules
): ValidationError[] => {
  const errors: ValidationError[] = [];

  for (const field in rules) {
    const validators = rules[field];
    const value = data[field];

    for (const validator of validators) {
      const result = validator(value);
      if (result !== true) {
        errors.push({
          field,
          message: typeof result === 'string' ? result : `${field} es inválido`,
        });
        break; // Solo mostrar el primer error por campo
      }
    }
  }

  return errors;
};

/**
 * Funciones validadoras reutilizables
 */
export const requiredValidator = (value: any) => {
  if (value === null || value === undefined || value === '') {
    return 'Este campo es requerido';
  }
  return true;
};

export const emailValidator = (value: string) => {
  if (!value) return 'El email es requerido';
  if (!validateEmail(value)) {
    return 'El email no es válido';
  }
  return true;
};

export const passwordValidator = (value: string) => {
  const error = getPasswordErrorMessage(value);
  return error || true;
};

export const usernameValidator = (value: string) => {
  if (!value) return 'El usuario es requerido';
  if (!validateUsername(value)) {
    return 'Usuario debe tener 3-20 caracteres (letras, números, guion)';
  }
  return true;
};

export const minLengthValidator = (min: number) => (value: string) => {
  if (!value || value.length < min) {
    return `Mínimo ${min} caracteres`;
  }
  return true;
};

export const maxLengthValidator = (max: number) => (value: string) => {
  if (value && value.length > max) {
    return `Máximo ${max} caracteres`;
  }
  return true;
};

export const numberValidator = (value: any) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) {
    return 'Debe ser un número';
  }
  return true;
};

export const positiveNumberValidator = (value: any) => {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  if (isNaN(num) || num <= 0) {
    return 'Debe ser un número positivo';
  }
  return true;
};

/**
 * Ejemplo de uso:
 * 
 * const rules: FormValidationRules = {
 *   username: [requiredValidator, usernameValidator],
 *   email: [emailValidator],
 *   password: [passwordValidator],
 *   stock: [requiredValidator, positiveNumberValidator],
 * };
 * 
 * const errors = validateForm(formData, rules);
 * if (errors.length > 0) {
 *   console.log('Errores de validación:', errors);
 * }
 */
