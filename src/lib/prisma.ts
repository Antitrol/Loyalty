import { PrismaClient } from '@prisma/client';

// Avoid creating multiple PrismaClient instances in development (Next.js hot reload)
const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

// Hardcoded for Vercel Debugging
const connectionString = 'postgresql://neondb_owner:npg_gY3P0LXeKZIo@ep-late-flower-agccurrx-pooler.c-2.eu-central-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require';

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient({
    datasources: {
      db: {
        url: connectionString
      }
    }
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}


