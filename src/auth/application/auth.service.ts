import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  AUTH_USE_CASE_PORT,
  type AuthUseCasePort,
  type AuthResult,
  type RegisterInput,
  type LoginInput,
} from '../domain/ports/inbound/auth-use-case.port';
import {
  JWT_GENERATOR_PORT,
  type JwtGeneratorPort,
} from '../domain/ports/outbound/jwt-generator.port';
import {
  USER_REPOSITORY_PORT,
  type UserRepositoryPort,
} from '../../users/domain/ports/outbound/user-repository.port';
import { UserEntity } from '../../users/domain/entities/user.entity';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService implements AuthUseCasePort {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    @Inject(JWT_GENERATOR_PORT)
    private readonly jwtGenerator: JwtGeneratorPort,
  ) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await this.userRepository.create({
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash,
    });

    const accessToken = this.jwtGenerator.generate(user);
    return { accessToken, user: this.sanitize(user) };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const accessToken = this.jwtGenerator.generate(user);
    return { accessToken, user: this.sanitize(user) };
  }

  private sanitize(user: UserEntity): Omit<UserEntity, 'passwordHash'> {
    const { passwordHash: _pw, ...safe } = user;
    return safe as Omit<UserEntity, 'passwordHash'>;
  }
}

export { AUTH_USE_CASE_PORT };

