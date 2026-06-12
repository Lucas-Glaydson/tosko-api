import { GoogleUserEntity } from '../../entities/google-user.entity';

export const GOOGLE_TOKEN_VERIFIER_PORT = Symbol('GOOGLE_TOKEN_VERIFIER_PORT');

export interface GoogleTokenVerifierPort {
  verify(idToken: string): Promise<GoogleUserEntity>;
}
