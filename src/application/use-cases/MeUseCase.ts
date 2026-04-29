import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { AppError } from '../../shared/errors/AppError';

export class MeUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw AppError.notFound('Usuario no encontrado');

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      roles: user.roleNames,
      permissions: user.permissionKeys,
      isActive: user.isActive,
    };
  }
}
