import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IRoleRepository } from '../../domain/repositories/IRoleRepository';
import { IBcryptService } from '../ports/IBcryptService';
import { IJwtService } from '../ports/IJwtService';
import { RegisterDto, AuthResponseDto } from '../dtos/auth.dto';
import { AppError } from '../../shared/errors/AppError';

export class RegisterUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly roleRepo: IRoleRepository,
    private readonly bcryptService: IBcryptService,
    private readonly jwtService: IJwtService,
  ) {}

  async execute(dto: RegisterDto, requestedByAdmin = false): Promise<AuthResponseDto> {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) throw AppError.conflict('El email ya está registrado');

    const passwordHash = await this.bcryptService.hash(dto.password);

    const user = await this.userRepo.create({
      email: dto.email,
      passwordHash,
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
    });

    let roleId = dto.roleId;
    if (!roleId || !requestedByAdmin) {
      const patientRole = await this.roleRepo.findByName('PATIENT');
      roleId = patientRole?.id;
    }

    if (roleId) await this.userRepo.assignRole(user.id, roleId);

    const fullUser = await this.userRepo.findById(user.id);
    if (!fullUser) throw AppError.internal();

    const payload = {
      sub: fullUser.id,
      email: fullUser.email,
      roles: fullUser.roleNames,
      permissions: fullUser.permissionKeys,
    };

    const accessToken = this.jwtService.signAccess(payload);
    const refreshToken = this.jwtService.signRefresh({ sub: fullUser.id });
    const expiresAt = new Date(Date.now() + this.jwtService.refreshExpiresInMs);
    await this.userRepo.saveRefreshToken(fullUser.id, refreshToken, expiresAt);

    return {
      user: {
        id: fullUser.id,
        email: fullUser.email,
        firstName: fullUser.firstName,
        lastName: fullUser.lastName,
        fullName: fullUser.fullName,
        roles: fullUser.roleNames,
        permissions: fullUser.permissionKeys,
        avatarUrl: fullUser.avatarUrl,
      },
      tokens: { accessToken, refreshToken, expiresIn: this.jwtService.accessExpiresIn, tokenType: 'Bearer' },
    };
  }
}
