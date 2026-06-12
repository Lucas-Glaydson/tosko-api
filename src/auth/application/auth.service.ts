import { Inject, Injectable } from '@nestjs/common';
import {
  AUTH_USE_CASE_PORT,
  type AuthUseCasePort,
  type GoogleLoginResult,
} from '../domain/ports/inbound/auth-use-case.port';
import {
  GOOGLE_TOKEN_VERIFIER_PORT,
  type GoogleTokenVerifierPort,
} from '../domain/ports/outbound/google-token-verifier.port';
import {
  JWT_GENERATOR_PORT,
  type JwtGeneratorPort,
} from '../domain/ports/outbound/jwt-generator.port';
import {
  USERS_USE_CASE_PORT,
  type UsersUseCasePort,
} from '../../users/domain/ports/inbound/users-use-case.port';

@Injectable()
export class AuthService implements AuthUseCasePort {
  constructor(
    @Inject(GOOGLE_TOKEN_VERIFIER_PORT)
    private readonly googleTokenVerifier: GoogleTokenVerifierPort,
    @Inject(JWT_GENERATOR_PORT)
    private readonly jwtGenerator: JwtGeneratorPort,
    @Inject(USERS_USE_CASE_PORT)
    private readonly usersUseCase: UsersUseCasePort,
  ) {}

  async googleLogin(idToken: string): Promise<GoogleLoginResult> {
    const googleUser = await this.googleTokenVerifier.verify(idToken);
    const user = await this.usersUseCase.findOrCreate({
      googleSub: googleUser.googleSub,
      email: googleUser.email,
      givenName: googleUser.givenName,
      familyName: googleUser.familyName,
      picture: googleUser.picture,
      locale: googleUser.locale,
    });
    const accessToken = this.jwtGenerator.generate(user);
    return { accessToken, user };
  }
}


