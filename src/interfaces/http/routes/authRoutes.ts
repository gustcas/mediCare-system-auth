import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthController } from '../controllers/AuthController';
import { LoginUseCase } from '../../../application/use-cases/LoginUseCase';
import { RegisterUseCase } from '../../../application/use-cases/RegisterUseCase';
import { RefreshTokenUseCase } from '../../../application/use-cases/RefreshTokenUseCase';
import { MeUseCase } from '../../../application/use-cases/MeUseCase';
import { LogoutUseCase } from '../../../application/use-cases/LogoutUseCase';
import { PrismaUserRepository } from '../../../infrastructure/database/PrismaUserRepository';
import { PrismaRoleRepository } from '../../../infrastructure/database/PrismaRoleRepository';
import { JwtService } from '../../../infrastructure/security/JwtService';
import { BcryptService } from '../../../infrastructure/security/BcryptService';
import { authenticate } from '../../../infrastructure/middleware/authMiddleware';

export function createAuthRouter(prisma: PrismaClient): Router {
  const router = Router();

  const userRepo = new PrismaUserRepository(prisma);
  const roleRepo = new PrismaRoleRepository(prisma);
  const jwtService = new JwtService();
  const bcryptService = new BcryptService();

  const loginUC = new LoginUseCase(userRepo, bcryptService, jwtService);
  const registerUC = new RegisterUseCase(userRepo, roleRepo, bcryptService, jwtService);
  const refreshUC = new RefreshTokenUseCase(userRepo, jwtService);
  const meUC = new MeUseCase(userRepo);
  const logoutUC = new LogoutUseCase(userRepo);

  const controller = new AuthController(loginUC, registerUC, refreshUC, meUC, logoutUC);

  /**
   * @openapi
   * /auth/login:
   *   post:
   *     tags: [Auth]
   *     summary: Iniciar sesión
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email: { type: string, format: email }
   *               password: { type: string }
   *     responses:
   *       200:
   *         description: Login exitoso
   *       401:
   *         description: Credenciales inválidas
   */
  router.post('/login', controller.login);

  /**
   * @openapi
   * /auth/register:
   *   post:
   *     tags: [Auth]
   *     summary: Registrar nuevo usuario
   */
  router.post('/register', controller.register);

  /**
   * @openapi
   * /auth/me:
   *   get:
   *     tags: [Auth]
   *     summary: Obtener usuario autenticado
   *     security:
   *       - bearerAuth: []
   */
  router.get('/me', authenticate, controller.me);

  /**
   * @openapi
   * /auth/refresh:
   *   post:
   *     tags: [Auth]
   *     summary: Renovar access token
   */
  router.post('/refresh', controller.refresh);

  /**
   * @openapi
   * /auth/logout:
   *   post:
   *     tags: [Auth]
   *     summary: Cerrar sesión
   *     security:
   *       - bearerAuth: []
   */
  router.post('/logout', authenticate, controller.logout);

  return router;
}
