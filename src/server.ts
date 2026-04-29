import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createApp } from './app';
import { logger } from './shared/utils/logger';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

const PORT = parseInt(process.env.PORT || '3001', 10);
const app = createApp(prisma);

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    const server = app.listen(PORT, () => {
      logger.info(`Auth Service running on port ${PORT}`);
      logger.info(`Swagger: http://localhost:${PORT}/api-docs`);
    });

    const shutdown = async () => {
      logger.info('Shutting down...');
      server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    logger.error('Failed to start', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
