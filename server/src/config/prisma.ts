import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { env } from './env.ts';

declare global {
  var __digithelaPrisma: PrismaClient | undefined;
  var __digithelaPgPool: pg.Pool | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = env.databaseUrl;

  if (!connectionString) {
    // Allow app module initialization when DATABASE_URL is not yet configured;
    // queries will surface a clean database configuration error until DATABASE_URL is set.
    const emptyPool = new pg.Pool({
      connectionString: 'postgresql://unconfigured:unconfigured@127.0.0.1:5432/digithela',
      connectionTimeoutMillis: 2000,
    });
    emptyPool.on('error', () => {
      // Prevent unhandled pool error crashes
    });
    const adapter = new PrismaPg(emptyPool);
    return new PrismaClient({ adapter });
  }

  if (!global.__digithelaPgPool) {
    global.__digithelaPgPool = new pg.Pool({
      connectionString,
      max: 10,
      connectionTimeoutMillis: 10000,
    });
    global.__digithelaPgPool.on('error', (err) => {
      console.error('Unexpected PostgreSQL pool error:', err.message);
    });
  }

  const adapter = new PrismaPg(global.__digithelaPgPool);
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient =
  global.__digithelaPrisma || createPrismaClient();

if (!env.isProduction) {
  global.__digithelaPrisma = prisma;
}
