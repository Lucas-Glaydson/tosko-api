import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import {
  AUTH_USE_CASE_PORT,
  type AuthUseCasePort,
} from '../../../domain/ports/inbound/auth-use-case.port';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_USE_CASE_PORT)
    private readonly authUseCase: AuthUseCasePort,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authUseCase.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authUseCase.login(dto);
  }
}
