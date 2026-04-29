import { User } from '../entities/User';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  documentType: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  assignRole(userId: string, roleId: number): Promise<void>;
  saveRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  findRefreshToken(token: string): Promise<{ userId: string; expiresAt: Date; isRevoked: boolean } | null>;
  revokeRefreshToken(token: string): Promise<void>;
  revokeAllUserTokens(userId: string): Promise<void>;
}
