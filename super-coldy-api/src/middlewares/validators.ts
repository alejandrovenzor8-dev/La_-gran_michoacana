import { body, param, query, ValidationChain } from 'express-validator';
import { validatePasswordStrength } from '../utils/password.js';

/**
 * Validadores reutilizables para las rutas de la API
 * Cada validador retorna un array de ValidationChain
 */

// ============================================================
// VALIDADORES DE AUTENTICACIÓN
// ============================================================

/**
 * Validadores para login
 * Requiere: email, password
 */
export const validateLogin = (): ValidationChain[] => [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Contraseña requerida')
    .isLength({ min: 6 })
    .withMessage('Contraseña debe tener al menos 6 caracteres'),
];

/**
 * Validadores para registro
 * Requiere: username, email, password, fullName (opcional)
 */
export const validateRegister = (): ValidationChain[] => [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Usuario debe tener al menos 3 caracteres')
    .isAlphanumeric('es-ES', { ignore: '_-' })
    .withMessage('Usuario solo puede contener letras, números, - y _'),
  body('email')
    .trim()
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
    .trim()
    .isLength({ min: 2 })
    .withMessage('Nombre debe tener al menos 2 caracteres'),
];

/**
 * Validadores para cambio de contraseña
 */
export const validateChangePassword = (): ValidationChain[] => [
  body('currentPassword')
    .notEmpty()
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
    .notEmpty()
    .withMessage('Confirmación de contraseña requerida')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),
];

// ============================================================
// VALIDADORES DE USUARIOS
// ============================================================

/**
 * Validadores para crear usuario
 */
export const validateCreateUser = (): ValidationChain[] => [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Usuario debe tener al menos 3 caracteres')
    .isAlphanumeric('es-ES', { ignore: '_-' })
    .withMessage('Usuario solo puede contener letras, números, - y _'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Contraseña debe tener al menos 8 caracteres'),
  body('fullName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Nombre debe tener al menos 2 caracteres'),
  body('role')
    .isIn(['ADMIN', 'CAJERO', 'GERENTE'])
    .withMessage('Rol inválido'),
];

/**
 * Validadores para actualizar usuario
 */
export const validateUpdateUser = (): ValidationChain[] => [
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Nombre debe tener al menos 2 caracteres'),
  body('role')
    .optional()
    .isIn(['ADMIN', 'CAJERO', 'GERENTE'])
    .withMessage('Rol inválido'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('active debe ser verdadero o falso'),
];

// ============================================================
// VALIDADORES DE PARÁMETROS
// ============================================================

/**
 * Validador para ID en parámetros de ruta
 */
export const validateIdParam = (paramName: string = 'id'): ValidationChain[] => [
  param(paramName)
    .isInt({ min: 1 })
    .withMessage(`${paramName} debe ser un número válido`),
];

/**
 * Validadores para paginación
 */
export const validatePagination = (): ValidationChain[] => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page debe ser un número mayor a 0')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit debe estar entre 1 y 100')
    .toInt(),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('search debe tener entre 1 y 100 caracteres'),
];

// ============================================================
// VALIDADORES DE PRODUCTOS
// ============================================================

/**
 * Validadores para crear producto
 */
export const validateCreateProduct = (): ValidationChain[] => [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre debe tener entre 2 y 100 caracteres'),
  body('price')
    .isDecimal({ decimal_digits: '1,2' })
    .withMessage('Precio inválido')
    .custom((value) => parseFloat(value) > 0)
    .withMessage('Precio debe ser mayor a 0'),
  body('category')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Categoría inválida'),
  body('cost')
    .optional()
    .isDecimal({ decimal_digits: '1,2' })
    .withMessage('Costo inválido'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Descripción muy larga'),
  body('barcode')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Código de barras inválido'),
  body('minStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock mínimo inválido'),
];

/**
 * Validadores para actualizar producto
 */
export const validateUpdateProduct = (): ValidationChain[] => [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre debe tener entre 2 y 100 caracteres'),
  body('price')
    .optional()
    .isDecimal({ decimal_digits: '1,2' })
    .withMessage('Precio inválido')
    .custom((value) => parseFloat(value) > 0)
    .withMessage('Precio debe ser mayor a 0'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Categoría inválida'),
  body('cost')
    .optional()
    .isDecimal({ decimal_digits: '1,2' })
    .withMessage('Costo inválido'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Descripción muy larga'),
  body('barcode')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Código de barras inválido'),
  body('minStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock mínimo inválido'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('active debe ser verdadero o falso'),
];

// ============================================================
// VALIDADORES DE VENTAS
// ============================================================

/**
 * Validadores para crear venta
 */
export const validateCreateSale = (): ValidationChain[] => [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Debe incluir al menos un item'),
  body('items.*.productId')
    .notEmpty()
    .withMessage('ID de producto requerido')
    .isString()
    .withMessage('ID de producto debe ser string'),
  body('items.*.productName')
    .notEmpty()
    .withMessage('Nombre de producto requerido')
    .isString()
    .withMessage('Nombre debe ser string')
    .isLength({ max: 200 })
    .withMessage('Nombre muy largo'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Cantidad debe ser entero positivo'),
  body('items.*.unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Precio unitario debe ser número positivo'),
  body('items.*.subtotal')
    .isFloat({ min: 0 })
    .withMessage('Subtotal debe ser número positivo'),
  body('items.*.discount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Descuento debe ser número positivo'),
  body('paymentMethod')
    .notEmpty()
    .withMessage('Método de pago requerido')
    .isIn(['EFECTIVO', 'TARJETA', 'MIXTO'])
    .withMessage('Método de pago inválido'),
  body('amountReceived')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Monto recibido debe ser número positivo'),
  body('discount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Descuento debe ser número positivo'),
  body('tax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Impuesto debe ser número positivo'),
  body('notes')
    .optional()
    .isString()
    .withMessage('Notas deben ser texto')
    .isLength({ max: 500 })
    .withMessage('Notas muy largas (max 500 caracteres)'),
  body('source')
    .optional()
    .isIn(['DESKTOP', 'MOBILE'])
    .withMessage('Source inválido'),
];

/**
 * Validadores para ID de venta
 */
export const validateSaleId = (): ValidationChain[] => [
  param('id')
    .notEmpty()
    .withMessage('ID de venta requerido')
    .isString()
    .withMessage('ID de venta debe ser string'),
];

/**
 * Validadores para filtros de ventas
 */
export const validateSaleFilters = (): ValidationChain[] => [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de inicio inválida (usar formato ISO 8601)'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha fin inválida (usar formato ISO 8601)'),
  query('userId')
    .optional()
    .isString()
    .withMessage('ID de usuario debe ser string'),
  query('paymentMethod')
    .optional()
    .isIn(['EFECTIVO', 'TARJETA', 'MIXTO'])
    .withMessage('Método de pago inválido'),
  query('status')
    .optional()
    .isIn(['COMPLETED', 'CANCELLED', 'REFUNDED'])
    .withMessage('Status inválido'),
  query('source')
    .optional()
    .isIn(['DESKTOP', 'MOBILE'])
    .withMessage('Source inválido'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser entero positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit debe ser entre 1 y 100'),
];

/**
 * Validadores para reporte diario
 */
export const validateDailyReport = (): ValidationChain[] => [
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Fecha inválida (usar formato YYYY-MM-DD)'),
];

/**
 * Validadores para estadísticas de ventas
 */
export const validateStatsQuery = (): ValidationChain[] => [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de inicio inválida'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha fin inválida'),
];
