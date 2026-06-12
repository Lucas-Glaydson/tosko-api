import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import type { GoogleTokenVerifierPort } from '../../domain/ports/outbound/google-token-verifier.port';
import { GoogleUserEntity } from '../../domain/entities/google-user.entity';

@Injectable()
export class GoogleTokenAdapter implements GoogleTokenVerifierPort {
  private readonly client: OAuth2Client;
  private readonly clientId: string;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('google.clientId') ?? '';
    this.client = new OAuth2Client(this.clientId);
  }

  async verify(idToken: string): Promise<GoogleUserEntity> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.clientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Token inválido');
      }

      return new GoogleUserEntity(
        payload.sub,
        payload.email ?? '',
        payload.given_name ?? '',
        payload.family_name ?? '',
        payload.picture,
        payload.locale,
      );
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Falha na validação do token Google');
    }
  }
}
