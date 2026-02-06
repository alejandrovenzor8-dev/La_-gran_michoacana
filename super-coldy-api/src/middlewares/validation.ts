import { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import { logger } from '../utils/logger';
import { validatePasswordStrength } from '../utils/password';

/**
 * Middleware para manejar errores de validación de express-validator
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    logger.warn('Errores de validación encontrados:', {
      errors: errors.array(),
    });

    res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({
        field: err.type === 'field' ? err.path : 'unknown',
        message: err.msg,
      })),
    });
    return;
  }

  next();
};

/**
 * Validación para login
 * Requiere: email, password
 */
export const validateLogin = (): ValidationChain[] => [
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Contraseña requerida'),
];

/**
 * Validación para registro de usuario
 * Requiere: username, email, password, fullName (opcional)
 */
export const validateRegister = (): ValidationChain[] => [
  body('username')
    .isLength({ min: 3 })
    .withMessage('Username debe tener al menos 3 caracteres')
    .isAlphanumeric('es-ES', { ignore: '_-' })
    .withMessage('Username solo puede contener letras, números, - y _'),
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Contraseña debe tener al menos 8 caracteres')
    .custom((value) => {
      const validation = validatePasswordStrength(value);
      if (!validation.isStrong) {
        throw new Error(validation.message);
      }
      return true;
    }),
  body('fullName')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Nombre completo debe tener al menos 2 caracteres')
    .trim(),
];

/**
 * Validación para cambio de contraseña
 * Requiere: currentPassword, newPassword, confirmPassword
 */
export const validateChangePassword = (): ValidationChain[] => [
  body('currentPassword')
    .isLength({ min: 1 })
    .withMessage('Contraseña actual requerida'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Nueva contraseña debe tener al menos 8 caracteres')
    .custom((value) => {
      const validation = validatePasswordStrength(value);
      if (!validation.isStrong) {
        throw new Error(validation.message);
      }
      return true;
    }),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),
];

/**
 * Validación para crear/actualizar usuario
 */
export const validateUserUpdate = (): ValidationChain[] => [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  body('fullName')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Nombre completo debe tener al menos 2 caracteres')
    .trim(),
  body('role')
    .optional()
    .isIn(['ADMIN', 'CAJERO', 'GERENTE'])
    .withMessage('Rol inválido'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('active debe ser un booleano'),
];

/**
 * Validación para crear producto
 */
export const validateCreateProduct = (): ValidationChain[] => [
  body('name')
    .isLength({ min: 2 })
    .withMessage('Nombre debe tener al menos 2 caracteres')
    .trim(),
  body('price')
    .isDecimal({ decimal_digits: '1,2' })
    .withMessage('Precio inválido')
    .custom((value) => parseFloat(value) > 0)
    .withMessage('Precio debe ser mayor a 0'),
  body('category')
    .isLength({ min: 2 })
    .withMessage('Categoría requerida')
    .trim(),
  body('cost')
    .optional()
    .isDecimal({ decimal_digits: '1,2' })
    .withMessage('Costo inválido'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Descripción muy larga')
    .trim(),
  body('barcode')
    .optional()
    .isLength({ min: 3 })
    .withMessage('Código de barras inválido'),
];

/**
 * Validación para crear venta
 */
export const validateCreateSale = (): ValidationChain[] => [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Debe haber al menos un item en la venta'),
  body('items.*.productId')
    .isInt({ min: 1 })
    .withMessage('ID de producto inválido'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Cantidad debe ser mayor a 0'),
  body('items.*.unitPrice')
    .isDecimal({ decimal_digits: '1,2' })
    .withMessage('Precio unitario inválido'),
  body('paymentMethod')
    .isIn(['EFECTIVO', 'TARJETA', 'MIXTO'])
    .withMessage('Método de pago inválido'),
  body('discount')
    .optional()
    .isDecimal({ decimal_digits: '1,2' })
    .withMessage('Descuento inválido')
    .custom((value) => parseFloat(value) >= 0)
    .withMessage('Descuento no puede ser negativo'),
  body('amountReceived')
    .optional()
    .isDecimal({ decimal_digits: '1,2' })
    .withMessage('Monto recibido inválido'),
];
