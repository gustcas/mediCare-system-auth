import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { PrismaClient } from '@prisma/client';
import { createAuthRouter } from './interfaces/http/routes/authRoutes';
import { errorHandler, notFoundHandler } from './infrastructure/middleware/errorHandler';
import { logger } from './shared/utils/logger';

export function createApp(prisma: PrismaClient) {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  }));
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, error: { code: 'RATE_LIMIT', message: 'Demasiadas solicitudes' } },
  }));

  const swaggerSpec = swaggerJsdoc({
    definition: {
      openapi: '3.0.0',
      info: { title: 'MediCare Auth API', version: '1.0.0', description: 'Microservicio de autenticación' },
      servers: [{ url: `http://localhost:${process.env.PORT || 3001}/api/v1` }],
      components: {
        securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
      },
    },
    apis: ['./src/interfaces/http/routes/*.ts'],
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'auth-service', timestamp: new Date().toISOString() });
  });

  app.use('/api/v1/auth', createAuthRouter(prisma));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
