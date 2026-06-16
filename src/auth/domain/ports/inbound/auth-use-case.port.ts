import { UserEntity } from '../../../../users/domain/entities/user.entity';

export const AUTH_USE_CASE_PORT = Symbol('AUTH_USE_CASE_PORT');

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  accessToken: string;
  user: Omit<UserEntity, 'passwordHash'>;
}

export interface AuthUseCasePort {
  register(input: RegisterInput): Promise<AuthResult>;
  login(input: LoginInput): Promise<AuthResult>;
}
