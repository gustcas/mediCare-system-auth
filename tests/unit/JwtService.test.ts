process.env.JWT_SECRET = 'test_secret_key_256_bits_minimum_length_for_testing_purposes_only';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_256_bits_minimum_length_for_testing_purposes';

import { JwtService } from '../../src/infrastructure/security/JwtService';
import { AppError } from '../../src/shared/errors/AppError';

describe('JwtService', () => {
  let jwtService: JwtService;

  beforeEach(() => {
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    jwtService = new JwtService();
  });

  it('should sign and verify access token', () => {
    const payload = { sub: 'user-1', email: 'test@test.com', roles: ['DOCTOR'], permissions: ['patients:READ'] };
    const token = jwtService.signAccess(payload);
    const decoded = jwtService.verifyAccess(token);

    expect(decoded.sub).toBe('user-1');
    expect(decoded.email).toBe('test@test.com');
    expect(decoded.roles).toEqual(['DOCTOR']);
  });

  it('should sign and verify refresh token', () => {
    const token = jwtService.signRefresh({ sub: 'user-1' });
    const decoded = jwtService.verifyRefresh(token);
    expect(decoded.sub).toBe('user-1');
  });

  it('should throw on invalid access token', () => {
    expect(() => jwtService.verifyAccess('invalid_token')).toThrow();
  });

  it('should throw on invalid refresh token', () => {
    expect(() => jwtService.verifyRefresh('invalid_token')).toThrow();
  });

  it('should report correct accessExpiresIn', () => {
    expect(jwtService.accessExpiresIn).toBe(900);
  });

  it('should report correct refreshExpiresInMs', () => {
    expect(jwtService.refreshExpiresInMs).toBe(7 * 24 * 3600 * 1000);
  });
});
