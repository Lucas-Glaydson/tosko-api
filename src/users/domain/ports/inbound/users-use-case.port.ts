import { UserEntity } from '../../entities/user.entity';
import { FindOrCreateUserInput } from '../outbound/user-repository.port';

export const USERS_USE_CASE_PORT = Symbol('USERS_USE_CASE_PORT');

export interface UsersUseCasePort {
  findOrCreate(input: FindOrCreateUserInput): Promise<UserEntity>;
  findById(id: string): Promise<UserEntity>;
  softDelete(id: string): Promise<void>;
}
