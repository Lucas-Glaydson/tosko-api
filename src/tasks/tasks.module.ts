import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskSchemaClass, TaskSchema } from './infrastructure/outbound/persistence/schemas/task.schema';
import { MongooseTaskRepository } from './infrastructure/outbound/persistence/mongoose-task.repository';
import { TasksService } from './application/tasks.service';
import { TasksController } from './infrastructure/inbound/http/tasks.controller';
import { TASK_REPOSITORY_PORT } from './domain/ports/outbound/task-repository.port';
import { TASKS_USE_CASE_PORT } from './domain/ports/inbound/tasks-use-case.port';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TaskSchemaClass.name, schema: TaskSchema },
    ]),
  ],
  controllers: [TasksController],
  providers: [
    {
      provide: TASK_REPOSITORY_PORT,
      useClass: MongooseTaskRepository,
    },
    {
      provide: TASKS_USE_CASE_PORT,
      useClass: TasksService,
    },
  ],
})
export class TasksModule {}
