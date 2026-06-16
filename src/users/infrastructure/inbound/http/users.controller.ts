import {
  Controller,
  Get,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import type { UserEntity } from '../../../domain/entities/user.entity';
import {
  USERS_USE_CASE_PORT,
  type UsersUseCasePort,
} from '../../../domain/ports/inbound/users-use-case.port';
import { JwtAuthGuard } from '../../../../auth/infrastructure/inbound/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    @Inject(USERS_USE_CASE_PORT)
    private readonly usersUseCase: UsersUseCasePort,
  ) {}

  @Get('me')
  async getProfile(@CurrentUser() user: UserEntity) {
    const { passwordHash: _pw, ...safe } = await this.usersUseCase.findById(user.id);
    return safe;
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@CurrentUser() user: UserEntity) {
    await this.usersUseCase.softDelete(user.id);
    return { message: 'Conta removida com sucesso' };
  }
}
