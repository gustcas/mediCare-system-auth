import { JwtPayload } from '../../shared/types';

export interface IJwtService {
  signAccess(payload: Omit<JwtPayload, 'iat' | 'exp'>): string;
  signRefresh(payload: { sub: string }): string;
  verifyAccess(token: string): JwtPayload;
  verifyRefresh(token: string): { sub: string };
  readonly accessExpiresIn: number;
  readonly refreshExpiresInMs: number;
}
