import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IJwtService } from '../ports/IJwtService';
import { AuthResponseDto } from '../dtos/auth.dto';
import { AppError } from '../../shared/errors/AppError';

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly jwtService: IJwtService,
  ) {}

  async execute(refreshToken: string): Promise<AuthResponseDto> {
    let payload: { sub: string };
    try {
      payload = this.jwtService.verifyRefresh(refreshToken);
    } catch {
      throw AppError.unauthorized('Refresh token inválido o expirado');
    }

    const stored = await this.userRepo.findRefreshToken(refreshToken);
    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      throw AppError.unauthorized('Refresh token inválido o expirado');
    }

    const user = await this.userRepo.findById(payload.sub);
    if (!user || !user.isActive) throw AppError.unauthorized('Usuario no encontrado o inactivo');

    await this.userRepo.revokeRefreshToken(refreshToken);

    const newPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roleNames,
      permissions: user.permissionKeys,
    };

    const newAccessToken = this.jwtService.signAccess(newPayload);
    const newRefreshToken = this.jwtService.signRefresh({ sub: user.id });
    const expiresAt = new Date(Date.now() + this.jwtService.refreshExpiresInMs);
    await this.userRepo.saveRefreshToken(user.id, newRefreshToken, expiresAt);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        roles: user.roleNames,
        permissions: user.permissionKeys,
        avatarUrl: user.avatarUrl,
      },
      tokens: { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn: this.jwtService.accessExpiresIn, tokenType: 'Bearer' },
    };
  }
}
