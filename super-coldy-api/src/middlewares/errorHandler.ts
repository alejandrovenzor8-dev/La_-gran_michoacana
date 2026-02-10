import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Clase personalizada para errores de la aplicación
 * Extiende Error para mantener compatibilidad y información de stack
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  /**
   * Crear una instancia de AppError
   * @param message - Mensaje de error
   * @param statusCode - Código HTTP de respuesta
   * @param isOperational - Si es error esperado (default: true)
   */
  constructor(message: string, statusCode: number, isOperational: boolean = true) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Mantener la cadena de prototipos correcta
    Object.setPrototypeOf(this, AppError.prototype);

    // Capturar el stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware para manejar rutas no encontradas (404)
 * Debe ser usado DESPUÉS de todas las otras rutas
 *
 * @example
 * app.use(notFound);
 */
export const notFound = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError(`Ruta ${req.originalUrl} no encontrada`, 404);
  next(error);
};

/**
 * Verificar si un error es de Prisma
 */
function isPrismaError(error: any): error is { code: string; meta?: any } {
  return error && typeof error.code === 'string' && error.code.startsWith('P');
}

/**
 * Middleware global para manejo de errores
 * Debe ser el último middleware registrado
 *
 * @example
 * app.use(errorHandler);
 */
export const errorHandler = (
  err: Error | AppError | any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  let statusCode = 500;
  let message = 'Error interno del servidor';
  let stack: string | undefined;

  // Manejar AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    logger.error(`AppError: ${message}`, { statusCode });
  }
  // Manejar errores de Prisma
  else if (isPrismaError(err)) {
    logger.error('Error de Prisma:', { code: err.code, meta: err.meta });

    switch (err.code) {
      case 'P2002':
        // Unique constraint falledback
        statusCode = 409;
        message = `Ya existe un registro con esos datos`;
        break;

      case 'P2025':
        // Record not found
        statusCode = 404;
        message = 'Registro no encontrado';
        break;

      case 'P2003':
        // Foreign key constraint
        statusCode = 400;
        message = 'Referencia inválida - Recurso relacionado no existe';
        break;

      case 'P2014':
        // Required relation violation
        statusCode = 400;
        message = 'No se puede eliminar - Existen registros relacionados';
        break;

      default:
        statusCode = 500;
        message = 'Error en la base de datos';
    }
  }
  // Manejar errores de JWT
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
    logger.warn('JsonWebTokenError:', err.message);
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
    logger.warn('TokenExpiredError:', err.message);
  }
  // Manejar otros errores
  else {
    statusCode = err.statusCode || 500;
    message = err.message || 'Error interno del servidor';
    logger.error('Error no manejado:', { error: err.message, stack: err.stack });
  }

  // Capturar stack trace en desarrollo
  if (isDevelopment && err.stack) {
    stack = err.stack;
  }

  // Construir respuesta
  const response = {
    status: 'error',
    statusCode,
    message,
    ...(stack && { stack }),
  };

  // Loguear información
  logger.error(`[${req.method}] ${req.path} - Error ${statusCode}`, {
    message,
    url: req.originalUrl,
    userAgent: req.get('user-agent'),
  });

  res.status(statusCode).json(response);
};

/**
 * Wrapper para funciones async en rutas Express
 * Captura errores y los pasa al errorHandler
 *
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await prisma.user.findMany();
 *   res.json(users);
 * }));
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
};

