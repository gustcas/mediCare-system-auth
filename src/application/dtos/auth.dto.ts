import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const RegisterSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Debe contener mayúscula, minúscula y número'),
  documentType: z.enum(['DNI', 'PASSPORT', 'CE', 'RUC', 'OTHER']),
  documentNumber: z.string().min(5, 'Número de documento inválido'),
  firstName: z.string().min(2, 'Nombre muy corto').max(100),
  lastName: z.string().min(2, 'Apellido muy corto').max(100),
  phone: z.string().optional(),
  roleId: z.number().int().positive().optional(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Token requerido'),
});

export type LoginDto = z.infer<typeof LoginSchema>;
export type RegisterDto = z.infer<typeof RegisterSchema>;
export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthResponseDto {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    roles: string[];
    permissions: string[];
    avatarUrl: string | null;
  };
  tokens: AuthTokensDto;
}
