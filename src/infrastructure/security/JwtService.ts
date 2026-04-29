import jwt from 'jsonwebtoken';
import { IJwtService } from '../../application/ports/IJwtService';
import { JwtPayload } from '../../shared/types';

export class JwtService implements IJwtService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessTtl: string;
  private readonly refreshTtl: string;

  readonly accessExpiresIn: number;
  readonly refreshExpiresInMs: number;

  constructor() {
    this.accessSecret = process.env.JWT_SECRET!;
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!;
    this.accessTtl = process.env.JWT_EXPIRES_IN || '15m';
    this.refreshTtl = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    this.accessExpiresIn = this.parseTtlToSeconds(this.accessTtl);
    this.refreshExpiresInMs = this.parseTtlToMs(this.refreshTtl);
  }

  signAccess(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.accessSecret, { expiresIn: this.accessTtl } as jwt.SignOptions);
  }

  signRefresh(payload: { sub: string }): string {
    return jwt.sign(payload, this.refreshSecret, { expiresIn: this.refreshTtl } as jwt.SignOptions);
  }

  verifyAccess(token: string): JwtPayload {
    return jwt.verify(token, this.accessSecret) as JwtPayload;
  }

  verifyRefresh(token: string): { sub: string } {
    return jwt.verify(token, this.refreshSecret) as { sub: string };
  }

  private parseTtlToSeconds(ttl: string): number {
    const match = ttl.match(/^(\d+)([smhd])$/);
    if (!match) return 900;
    const value = parseInt(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return value * multipliers[unit];
  }

  private parseTtlToMs(ttl: string): number {
    return this.parseTtlToSeconds(ttl) * 1000;
  }
}
