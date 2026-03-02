import { PrismaClient } from '../../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const g = globalThis as unknown as { prisma?: PrismaClient };

// Ensure a single instance of PrismaClient in development
export const prisma = g.prisma ?? new PrismaClient({
    adapter: new PrismaPg(pool),
    log: ['warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') g.prisma = prisma;