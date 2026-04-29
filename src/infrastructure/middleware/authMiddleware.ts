import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../security/JwtService';
import { AppError } from '../../shared/errors/AppError';
import { RequestUser } from '../../shared/types';

const jwtService = new JwtService();

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Token no proporcionado'));
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwtService.verifyAccess(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
      permissions: payload.permissions,
    };
    next();
  } catch {
    next(AppError.unauthorized('Token inválido o expirado'));
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(AppError.unauthorized());
    const hasRole = req.user.roles.some(r => roles.includes(r));
    if (!hasRole) return next(AppError.forbidden(`Roles requeridos: ${roles.join(', ')}`));
    next();
  };
}

export function requirePermission(resource: string, action: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(AppError.unauthorized());
    const key = `${resource}:${action}`;
    const hasPermission = req.user.permissions.includes(key);
    if (!hasPermission) return next(AppError.forbidden(`Permiso requerido: ${key}`));
    next();
  };
}
