import { LoginUseCase } from '../../src/application/use-cases/LoginUseCase';
import { IUserRepository } from '../../src/domain/repositories/IUserRepository';
import { IBcryptService } from '../../src/application/ports/IBcryptService';
import { IJwtService } from '../../src/application/ports/IJwtService';
import { User } from '../../src/domain/entities/User';
import { AppError } from '../../src/shared/errors/AppError';

const mockUser = new User(
  'user-id-1',
  'doctor@medicare.com',
  'hashed_password',
  'DNI',
  '12345678',
  'Roberto',
  'Gómez',
  true,
  null,
  null,
  [{ roleId: 2, roleName: 'DOCTOR' }],
  [{ resource: 'patients', action: 'READ' }],
);

const mockUserRepo: jest.Mocked<IUserRepository> = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
  assignRole: jest.fn(),
  saveRefreshToken: jest.fn(),
  findRefreshToken: jest.fn(),
  revokeRefreshToken: jest.fn(),
  revokeAllUserTokens: jest.fn(),
};

const mockBcrypt: jest.Mocked<IBcryptService> = {
  hash: jest.fn(),
  compare: jest.fn(),
};

const mockJwt: jest.Mocked<IJwtService> = {
  signAccess: jest.fn().mockReturnValue('access_token_mock'),
  signRefresh: jest.fn().mockReturnValue('refresh_token_mock'),
  verifyAccess: jest.fn(),
  verifyRefresh: jest.fn(),
  accessExpiresIn: 900,
  refreshExpiresInMs: 604800000,
};

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    loginUseCase = new LoginUseCase(mockUserRepo, mockBcrypt, mockJwt);
  });

  it('should return tokens when credentials are valid', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockBcrypt.compare.mockResolvedValue(true);
    mockUserRepo.saveRefreshToken.mockResolvedValue();

    const result = await loginUseCase.execute({ email: 'doctor@medicare.com', password: 'Doctor@2024!' });

    expect(result.tokens.accessToken).toBe('access_token_mock');
    expect(result.tokens.refreshToken).toBe('refresh_token_mock');
    expect(result.user.email).toBe('doctor@medicare.com');
    expect(result.user.roles).toContain('DOCTOR');
  });

  it('should throw UNAUTHORIZED when user not found', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);

    await expect(loginUseCase.execute({ email: 'notfound@test.com', password: 'pass' }))
      .rejects.toMatchObject({ code: 'UNAUTHORIZED', statusCode: 401 });
  });

  it('should throw UNAUTHORIZED when password is wrong', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockBcrypt.compare.mockResolvedValue(false);

    await expect(loginUseCase.execute({ email: 'doctor@medicare.com', password: 'wrongpass' }))
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('should throw UNAUTHORIZED when user is inactive', async () => {
    const inactiveUser = new User('id', 'email@test.com', 'hash', 'DNI', '123', 'Name', 'Last', false);
    mockUserRepo.findByEmail.mockResolvedValue(inactiveUser);

    await expect(loginUseCase.execute({ email: 'email@test.com', password: 'pass' }))
      .rejects.toMatchObject({ code: 'UNAUTHORIZED', message: 'Cuenta desactivada' });
  });

  it('should save refresh token after login', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockBcrypt.compare.mockResolvedValue(true);
    mockUserRepo.saveRefreshToken.mockResolvedValue();

    await loginUseCase.execute({ email: 'doctor@medicare.com', password: 'Doctor@2024!' });

    expect(mockUserRepo.saveRefreshToken).toHaveBeenCalledWith(
      mockUser.id,
      'refresh_token_mock',
      expect.any(Date),
    );
  });
});
