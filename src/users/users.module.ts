import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchemaClass, UserSchema } from './infrastructure/outbound/persistence/schemas/user.schema';
import { MongooseUserRepository } from './infrastructure/outbound/persistence/mongoose-user.repository';
import { UsersService } from './application/users.service';
import { UsersController } from './infrastructure/inbound/http/users.controller';
import { USER_REPOSITORY_PORT } from './domain/ports/outbound/user-repository.port';
import { USERS_USE_CASE_PORT } from './domain/ports/inbound/users-use-case.port';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserSchemaClass.name, schema: UserSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [
    {
      provide: USER_REPOSITORY_PORT,
      useClass: MongooseUserRepository,
    },
    {
      provide: USERS_USE_CASE_PORT,
      useClass: UsersService,
    },
    MongooseUserRepository,
  ],
  exports: [USERS_USE_CASE_PORT, MongooseUserRepository, USER_REPOSITORY_PORT],
})
export class UsersModule {}
