import { Request, Response, NextFunction } from 'express';
import { LoginUseCase } from '../../../application/use-cases/LoginUseCase';
import { RegisterUseCase } from '../../../application/use-cases/RegisterUseCase';
import { RefreshTokenUseCase } from '../../../application/use-cases/RefreshTokenUseCase';
import { MeUseCase } from '../../../application/use-cases/MeUseCase';
import { LogoutUseCase } from '../../../application/use-cases/LogoutUseCase';
import { LoginSchema, RegisterSchema, RefreshTokenSchema } from '../../../application/dtos/auth.dto';
import { successResponse } from '../../../shared/types';

export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly refreshUseCase: RefreshTokenUseCase,
    private readonly meUseCase: MeUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = LoginSchema.parse(req.body);
      const result = await this.loginUseCase.execute(dto);
      res.status(200).json(successResponse(result, 'Login exitoso'));
    } catch (err) {
      next(err);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = RegisterSchema.parse(req.body);
      const isAdmin = req.user?.roles.includes('ADMIN') ?? false;
      const result = await this.registerUseCase.execute(dto, isAdmin);
      res.status(201).json(successResponse(result, 'Registro exitoso'));
    } catch (err) {
      next(err);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.meUseCase.execute(req.user!.id);
      res.status(200).json(successResponse(result));
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = RefreshTokenSchema.parse(req.body);
      const result = await this.refreshUseCase.execute(refreshToken);
      res.status(200).json(successResponse(result, 'Token renovado'));
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.body?.refreshToken as string | undefined;
      await this.logoutUseCase.execute(req.user!.id, refreshToken);
      res.status(200).json(successResponse(null, 'Sesión cerrada'));
    } catch (err) {
      next(err);
    }
  };
}
