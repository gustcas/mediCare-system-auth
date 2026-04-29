import { IUserRepository } from '../../domain/repositories/IUserRepository';

export class LogoutUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.userRepo.revokeRefreshToken(refreshToken);
    } else {
      await this.userRepo.revokeAllUserTokens(userId);
    }
  }
}
