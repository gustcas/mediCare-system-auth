import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IBcryptService } from '../ports/IBcryptService';
import { IJwtService } from '../ports/IJwtService';
import { LoginDto, AuthResponseDto } from '../dtos/auth.dto';
import { AppError } from '../../shared/errors/AppError';

export class LoginUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly bcryptService: IBcryptService,
    private readonly jwtService: IJwtService,
  ) {}

  async execute(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) throw AppError.unauthorized('Credenciales inválidas');
    if (!user.isActive) throw AppError.unauthorized('Cuenta desactivada');

    const passwordValid = await this.bcryptService.compare(dto.password, user.passwordHash);
    if (!passwordValid) throw AppError.unauthorized('Credenciales inválidas');

    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roleNames,
      permissions: user.permissionKeys,
    };

    const accessToken = this.jwtService.signAccess(payload);
    const refreshToken = this.jwtService.signRefresh({ sub: user.id });
    const expiresIn = this.jwtService.accessExpiresIn;

    const expiresAt = new Date(Date.now() + this.jwtService.refreshExpiresInMs);
    await this.userRepo.saveRefreshToken(user.id, refreshToken, expiresAt);

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
      tokens: { accessToken, refreshToken, expiresIn, tokenType: 'Bearer' },
    };
  }
}
