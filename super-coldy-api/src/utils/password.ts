import bcrypt from 'bcryptjs';
import { logger } from './logger.js';

/**
 * Número de rounds de salt para bcryptjs
 * Valores más altos = más seguro pero más lento
 * 10 es un buen balance entre seguridad y performance
 */
const SALT_ROUNDS = 10;

/**
 * Hashea una contraseña usando bcryptjs con salt rounds
 * @param password - Contraseña en texto plano a hashear
 * @returns Promise con el hash generado
 * @throws Error si ocurre un problema durante el hashing
 *
 * @example
 * const hash = await hashPassword('mi_contraseña_segura');
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    // Validar que la contraseña no esté vacía
    if (!password || password.trim().length === 0) {
      throw new Error('La contraseña no puede estar vacía');
    }

    // Generar salt y hashear
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    logger.debug('Contraseña hasheada exitosamente');
    return hash;
  } catch (error) {
    logger.error('Error hasheando contraseña:', error);
    throw error;
  }
};

/**
 * Compara una contraseña en texto plano con su hash
 * Utiliza bcrypt.compare que es seguro contra timing attacks
 * @param password - Contraseña en texto plano a comparar
 * @param hash - Hash de la contraseña almacenada en BD
 * @returns Promise<boolean> - True si la contraseña coincide, false si no
 * @throws Error si ocurre un problema durante la comparación
 *
 * @example
 * const isValid = await comparePassword('contraseña_ingresada', storedHash);
 * if (isValid) {
 *   // Contraseña correcta
 * }
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  try {
    // Validar inputs
    if (!password || !hash) {
      logger.warn('Intento de comparación con contraseña o hash vacío');
      return false;
    }

    // Comparar contraseña con hash
    const isMatch = await bcrypt.compare(password, hash);

    if (isMatch) {
      logger.debug('Contraseña coincide con el hash');
    } else {
      logger.debug('Contraseña no coincide con el hash');
    }

    return isMatch;
  } catch (error) {
    logger.error('Error comparando contraseña:', error);
    throw error;
  }
};

/**
 * Valida la fuerza de una contraseña
 * @param password - Contraseña a validar
 * @returns Objeto con validación y mensaje
 *
 * @example
 * const validation = validatePasswordStrength('MyPass123!');
 * if (!validation.isStrong) {
 *   console.log(validation.message);
 * }
 */
export const validatePasswordStrength = (
  password: string
): { isStrong: boolean; message: string } => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (password.length < minLength) {
    return {
      isStrong: false,
      message: `La contraseña debe tener al menos ${minLength} caracteres`,
    };
  }

  if (!hasUpperCase) {
    return {
      isStrong: false,
      message: 'La contraseña debe incluir al menos una mayúscula',
    };
  }

  if (!hasLowerCase) {
    return {
      isStrong: false,
      message: 'La contraseña debe incluir al menos una minúscula',
    };
  }

  if (!hasNumbers) {
    return {
      isStrong: false,
      message: 'La contraseña debe incluir al menos un número',
    };
  }

  if (!hasSpecialChar) {
    return {
      isStrong: false,
      message: 'La contraseña debe incluir al menos un carácter especial',
    };
  }

  return {
    isStrong: true,
    message: 'Contraseña fuerte',
  };
};
