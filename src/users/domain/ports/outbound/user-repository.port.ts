import { UserEntity } from '../../entities/user.entity';

export interface CreateUserInput {
  email: string;
  name: string;
  passwordHash: string;
}

export const USER_REPOSITORY_PORT = Symbol('USER_REPOSITORY_PORT');

export interface UserRepositoryPort {
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  create(input: CreateUserInput): Promise<UserEntity>;
  softDelete(id: string): Promise<void>;
}
