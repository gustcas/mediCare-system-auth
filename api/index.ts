import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app';

// ── Validar variables de entorno obligatorias ────────────────────────────────
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(`[auth-service] Variable de entorno requerida no definida: ${key}`);
  }
}

// ── Singleton de PrismaClient ────────────────────────────────────────────────
// En serverless las invocaciones "cálidas" reutilizan el módulo en memoria.
// El singleton evita abrir una nueva conexión en cada request.
const g = globalThis as typeof globalThis & { _prisma?: PrismaClient };
const prisma = g._prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
g._prisma = prisma;

// ── App Express ──────────────────────────────────────────────────────────────
// createApp recibe el prisma y devuelve la app configurada.
// Vercel invoca esta función como serverless handler; NO se llama app.listen().
const app = createApp(prisma);

export default app;
