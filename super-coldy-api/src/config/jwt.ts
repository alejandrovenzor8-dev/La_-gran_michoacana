// Configuración de JWT

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your_jwt_secret_here',
  expiresIn: process.env.JWT_EXPIRE || '7d',
};
