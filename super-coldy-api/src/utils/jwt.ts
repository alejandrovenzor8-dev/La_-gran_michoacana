import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { logger } from './logger.js';

/**
 * Interface para el payload de JWT
 */
export interface JWTPayload {
  userId: number;
  role: string;
}

/**
 * Interface para el payload de refresh token
 */
export interface RefreshTokenPayload {
  userId: number;
}

/**
 * Obtener configuración de JWT del .env
 */
const getJWTConfig = () => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  if (!secret || !refreshSecret) {
    throw new Error('JWT_SECRET y JWT_REFRESH_SECRET deben estar configurados en .env');
  }

  return { secret, expiresIn, refreshSecret, refreshExpiresIn };
};

/**
 * Genera un token de acceso JWT
 * @param userId - ID del usuario
 * @param role - Rol del usuario
 * @returns Token JWT firmado
 */
export const generateAccessToken = (userId: number, role: string): string => {
  try {
    const { secret, expiresIn } = getJWTConfig();

    const payload: JWTPayload = {
      userId,
      role,
    };

    const options: SignOptions = {
      expiresIn: expiresIn as any,
      algorithm: 'HS256',
    };

    const token = jwt.sign(payload, secret, options);
    logger.debug('Token de acceso generado', { userId, role });

    return token;
  } catch (error) {
    logger.error('Error generando token de acceso:', error);
    throw error;
  }
};

/**
 * Genera un refresh token JWT
 * @param userId - ID del usuario
 * @returns Refresh token JWT firmado
 */
export const generateRefreshToken = (userId: number): string => {
  try {
    const { refreshSecret, refreshExpiresIn } = getJWTConfig();

    const payload: RefreshTokenPayload = {
      userId,
    };

    const options: SignOptions = {
      expiresIn: refreshExpiresIn as any,
      algorithm: 'HS256',
    };

    const token = jwt.sign(payload, refreshSecret, options);
    logger.debug('Refresh token generado', { userId });

    return token;
  } catch (error) {
    logger.error('Error generando refresh token:', error);
    throw error;
  }
};

/**
 * Verifica y decodifica un token de acceso
 * @param token - Token JWT a verificar
 * @returns Payload decodificado
 * @throws Error si el token es inválido o expiró
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const { secret } = getJWTConfig();

    const options: VerifyOptions = {
      algorithms: ['HS256'],
    };

    const decoded = jwt.verify(token, secret, options) as JWTPayload;
    logger.debug('Token de acceso verificado', { userId: decoded.userId });

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Token de acceso expirado');
      throw new Error('Token expirado');
    }

    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Token inválido:', error.message);
      throw new Error('Token inválido');
    }

    logger.error('Error verificando token de acceso:', error);
    throw error;
  }
};

/**
 * Verifica y decodifica un refresh token
 * @param token - Refresh token JWT a verificar
 * @returns Payload decodificado con userId
 * @throws Error si el token es inválido o expiró
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    const { refreshSecret } = getJWTConfig();

    const options: VerifyOptions = {
      algorithms: ['HS256'],
    };

    const decoded = jwt.verify(token, refreshSecret, options) as RefreshTokenPayload;
    logger.debug('Refresh token verificado', { userId: decoded.userId });

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Refresh token expirado');
      throw new Error('Refresh token expirado');
    }

    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Refresh token inválido:', error.message);
      throw new Error('Refresh token inválido');
    }

    logger.error('Error verificando refresh token:', error);
    throw error;
  }
};

/**
 * Decodifica un token sin verificar (solo lectura)
 * ⚠️ Usar solo para debugging, no confiar en los datos
 * @param token - Token a decodificar
 * @returns Payload decodificado o null
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.decode(token) as JWTPayload | null;
    return decoded;
  } catch (error) {
    logger.error('Error decodificando token:', error);
    return null;
  }
};
