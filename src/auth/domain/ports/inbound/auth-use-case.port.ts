import { UserEntity } from '../../../../users/domain/entities/user.entity';

export const AUTH_USE_CASE_PORT = Symbol('AUTH_USE_CASE_PORT');

export interface GoogleLoginResult {
  accessToken: string;
  user: UserEntity;
}

export interface AuthUseCasePort {
  googleLogin(idToken: string): Promise<GoogleLoginResult>;
}
