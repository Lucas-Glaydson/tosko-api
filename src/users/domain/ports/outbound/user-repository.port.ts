import { UserEntity } from '../../entities/user.entity';

export interface FindOrCreateUserInput {
  googleSub: string;
  email: string;
  givenName: string;
  familyName: string;
  picture?: string;
  locale?: string;
}

export const USER_REPOSITORY_PORT = Symbol('USER_REPOSITORY_PORT');

export interface UserRepositoryPort {
  findByGoogleSub(googleSub: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  create(input: FindOrCreateUserInput): Promise<UserEntity>;
  updateLastLogin(id: string): Promise<UserEntity>;
  softDelete(id: string): Promise<void>;
}
