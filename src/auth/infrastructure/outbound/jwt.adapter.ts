import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { type JwtGeneratorPort, type JwtPayload } from '../../domain/ports/outbound/jwt-generator.port';
import type { UserEntity } from '../../../users/domain/entities/user.entity';

@Injectable()
export class JwtAdapter implements JwtGeneratorPort {
  constructor(private readonly jwtService: JwtService) {}

  generate(user: UserEntity): string {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }

  verify(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token);
  }
}
