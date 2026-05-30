import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/config';

const adapter = new PrismaPg({ connectionString: config.postgres.url });

export const prisma = new PrismaClient({ adapter });

export const connectPrisma = async () => {
  const result = await prisma.$queryRaw<Array<{ database: string }>>`SELECT current_database() AS database`;
  return result[0]?.database || 'unknown';
};

export const disconnectPrisma = () => prisma.$disconnect();
