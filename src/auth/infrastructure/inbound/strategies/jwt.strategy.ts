import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { JwtPayload } from '../../../domain/ports/outbound/jwt-generator.port';
import {
  USER_REPOSITORY_PORT,
  type UserRepositoryPort,
} from '../../../../users/domain/ports/outbound/user-repository.port';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') ?? 'fallback-secret',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
    return user;
  }
}
