import { UserEntity } from '../../entities/user.entity';

export const USERS_USE_CASE_PORT = Symbol('USERS_USE_CASE_PORT');

export interface UsersUseCasePort {
  findById(id: string): Promise<UserEntity>;
  softDelete(id: string): Promise<void>;
}
