import {
  Controller,
  Post,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import type { Request } from 'express';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import {
  AUTH_USE_CASE_PORT,
  type AuthUseCasePort,
} from '../../../domain/ports/inbound/auth-use-case.port';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_USE_CASE_PORT)
    private readonly authUseCase: AuthUseCasePort,
  ) {}

  @Post('google')
  @UseGuards(GoogleAuthGuard)
  @HttpCode(HttpStatus.OK)
  async googleLogin(@Req() req: Request) {
    const authHeader = req.headers.authorization ?? '';
    const idToken = authHeader.replace('Bearer ', '');
    return this.authUseCase.googleLogin(idToken);
  }
}
