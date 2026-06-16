import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserEntity } from '../domain/entities/user.entity';
import {
  USER_REPOSITORY_PORT,
  type UserRepositoryPort,
} from '../domain/ports/outbound/user-repository.port';
import type { UsersUseCasePort } from '../domain/ports/inbound/users-use-case.port';

@Injectable()
export class UsersService implements UsersUseCasePort {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async findById(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  async softDelete(id: string): Promise<void> {
    await this.userRepository.softDelete(id);
  }
}
