export interface UserRole {
  roleId: number;
  roleName: string;
}

export interface UserPermission {
  resource: string;
  action: string;
}

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly documentType: string,
    public readonly documentNumber: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly isActive: boolean,
    public readonly phone: string | null = null,
    public readonly avatarUrl: string | null = null,
    public readonly roles: UserRole[] = [],
    public readonly permissions: UserPermission[] = [],
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get roleNames(): string[] {
    return this.roles.map(r => r.roleName);
  }

  get permissionKeys(): string[] {
    return this.permissions.map(p => `${p.resource}:${p.action}`);
  }

  hasRole(roleName: string): boolean {
    return this.roleNames.includes(roleName);
  }

  hasPermission(resource: string, action: string): boolean {
    return this.permissions.some(p => p.resource === resource && p.action === action);
  }
}
