import { PrismaClient } from '@prisma/client';
import { User } from '../../domain/entities/User';
import { IUserRepository, CreateUserData } from '../../domain/repositories/IUserRepository';

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private mapToUser(raw: any): User {
    const roles = raw.userRoles?.map((ur: any) => ({
      roleId: ur.role.id,
      roleName: ur.role.name,
    })) ?? [];

    const permissionsSet = new Map<string, { resource: string; action: string }>();
    raw.userRoles?.forEach((ur: any) => {
      ur.role.rolePerms?.forEach((rp: any) => {
        const key = `${rp.permission.resource}:${rp.permission.action}`;
        permissionsSet.set(key, { resource: rp.permission.resource, action: rp.permission.action });
      });
    });

    return new User(
      raw.id,
      raw.email,
      raw.passwordHash,
      raw.documentType,
      raw.documentNumber,
      raw.firstName,
      raw.lastName,
      raw.isActive,
      raw.phone ?? null,
      raw.avatarUrl ?? null,
      roles,
      Array.from(permissionsSet.values()),
      raw.createdAt,
      raw.updatedAt,
    );
  }

  private readonly includeRolesPerms = {
    userRoles: {
      include: {
        role: {
          include: {
            rolePerms: { include: { permission: true } },
          },
        },
      },
    },
  };

  async findById(id: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({ where: { id }, include: this.includeRolesPerms });
    return raw ? this.mapToUser(raw) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({ where: { email }, include: this.includeRolesPerms });
    return raw ? this.mapToUser(raw) : null;
  }

  async create(data: CreateUserData): Promise<User> {
    const raw = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        documentType: data.documentType as any,
        documentNumber: data.documentNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      },
      include: this.includeRolesPerms,
    });
    return this.mapToUser(raw);
  }

  async assignRole(userId: string, roleId: number): Promise<void> {
    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId },
    });
  }

  async saveRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await this.prisma.refreshToken.create({ data: { userId, token, expiresAt } });
  }

  async findRefreshToken(token: string) {
    const rt = await this.prisma.refreshToken.findUnique({ where: { token } });
    if (!rt) return null;
    return { userId: rt.userId, expiresAt: rt.expiresAt, isRevoked: rt.isRevoked };
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({ where: { token }, data: { isRevoked: true } });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({ where: { userId }, data: { isRevoked: true } });
  }
}
