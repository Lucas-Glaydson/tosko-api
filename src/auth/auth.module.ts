import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './infrastructure/inbound/http/auth.controller';
import { AuthService } from './application/auth.service';
import { JwtAdapter } from './infrastructure/outbound/jwt.adapter';
import { JwtStrategy } from './infrastructure/inbound/strategies/jwt.strategy';
import { JWT_GENERATOR_PORT } from './domain/ports/outbound/jwt-generator.port';
import { AUTH_USE_CASE_PORT } from './domain/ports/inbound/auth-use-case.port';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      useFactory: (configService: ConfigService): any => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: configService.get<string>('jwt.expiresIn') ?? '7d' },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: JWT_GENERATOR_PORT,
      useClass: JwtAdapter,
    },
    {
      provide: AUTH_USE_CASE_PORT,
      useClass: AuthService,
    },
    JwtStrategy,
  ],
  exports: [AUTH_USE_CASE_PORT],
})
export class AuthModule {}
