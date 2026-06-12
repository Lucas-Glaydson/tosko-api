import { UserEntity } from '../../../../users/domain/entities/user.entity';

export const JWT_GENERATOR_PORT = Symbol('JWT_GENERATOR_PORT');

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface JwtGeneratorPort {
  generate(user: UserEntity): string;
  verify(token: string): JwtPayload;
}
