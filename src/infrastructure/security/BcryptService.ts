import bcrypt from 'bcryptjs';
import { IBcryptService } from '../../application/ports/IBcryptService';

export class BcryptService implements IBcryptService {
  async hash(plain: string, rounds = 12): Promise<string> {
    return bcrypt.hash(plain, rounds);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
