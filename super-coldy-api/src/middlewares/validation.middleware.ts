import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';
import { logger } from '../utils/logger';

/**
 * Interface para los errores formateados
 */
interface FormattedError {
  field: string;
  message: string;
}

/**
 * Middleware para manejar errores de validación de express-validator
 * Debe ser usado DESPUÉS de los validadores en las rutas
 *
 * @example
 * import { body } from 'express-validator';
 * import { validate } from '@/middlewares/validation.middleware';
 *
 * router.post('/login',
 *   body('username').notEmpty().withMessage('Usuario requerido'),
 *   body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
 *   validate,
 *   loginController
 * );
 */
export const validate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Obtener resultados de validación
  const errors = validationResult(req);

  // Si hay errores, construir respuesta
  if (!errors.isEmpty()) {
    // Formatear errores
    const formattedErrors: FormattedError[] = errors.array().map((error: ValidationError) => {
      // Manejo de diferentes tipos de errores de express-validator
      let field = 'unknown';

      if (error.type === 'field') {
        field = error.path;
      } else if ('param' in error) {
        field = error.param;
      }

      return {
        field,
        message: error.msg,
      };
    });

    // Loguear errores de validación
    logger.warn('Errores de validación encontrados', {
      path: req.path,
      method: req.method,
      errors: formattedErrors,
    });

    // Responder con 400 Bad Request
    res.status(400).json({
      status: 'error',
      message: 'Errores de validación',
      errors: formattedErrors,
    });
    return;
  }

  // Si no hay errores, continuar
  logger.debug('Validación exitosa', {
    path: req.path,
    method: req.method,
  });

  next();
};
