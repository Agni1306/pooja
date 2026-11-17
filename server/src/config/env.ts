import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const jwtSecret =
  process.env.JWT_SECRET ||
  (isProduction
    ? crypto
        .createHash('sha256')
        .update(
          `digithela:${process.env.K_SERVICE || 'cloudrun'}:${process.env.DATABASE_URL || 'local'}`
        )
        .digest('hex')
    : 'digithela-dev-jwt-secret-change-in-prod');

if (isProduction && !process.env.JWT_SECRET) {
  console.warn(
    'Warning: JWT_SECRET environment variable is not set in production; using derived fallback secret.'
  );
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  adminRegistrationKey: process.env.ADMIN_REGISTRATION_KEY || '',
};
