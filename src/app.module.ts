import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import configuration from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { HealthController } from './common/health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isDev = configService.get<string>('NODE_ENV') !== 'production';
        return {
          pinoHttp: {
            level: isDev ? 'debug' : 'info',
            transport: isDev
              ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
              : undefined,
            redact: ['req.headers.authorization'],
            serializers: {
              req(req: { method: string; url: string }) {
                return { method: req.method, url: req.url };
              },
            },
          },
        };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongodb.uri'),
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    AuthModule,
    UsersModule,
    TasksModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

