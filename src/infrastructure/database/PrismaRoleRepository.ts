import { PrismaClient } from '@prisma/client';
import { IRoleRepository, IRole } from '../../domain/repositories/IRoleRepository';

export class PrismaRoleRepository implements IRoleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByName(name: string): Promise<IRole | null> {
    return this.prisma.role.findUnique({ where: { name } });
  }

  async findDefaultRole(): Promise<IRole | null> {
    return this.prisma.role.findUnique({ where: { name: 'PATIENT' } });
  }
}
