import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import type { Request } from 'express';
import {
  GOOGLE_TOKEN_VERIFIER_PORT,
  type GoogleTokenVerifierPort,
} from '../../../domain/ports/outbound/google-token-verifier.port';

@Injectable()
export class GoogleTokenStrategy extends PassportStrategy(Strategy, 'google-token') {
  constructor(
    @Inject(GOOGLE_TOKEN_VERIFIER_PORT)
    private readonly googleTokenVerifier: GoogleTokenVerifierPort,
  ) {
    super();
  }

  async validate(req: Request): Promise<unknown> {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token não fornecido');
    }
    const idToken = authHeader.split(' ')[1];
    return this.googleTokenVerifier.verify(idToken);
  }
}
