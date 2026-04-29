export interface IRole {
  id: number;
  name: string;
  description?: string | null;
}

export interface IRoleRepository {
  findByName(name: string): Promise<IRole | null>;
  findDefaultRole(): Promise<IRole | null>;
}
