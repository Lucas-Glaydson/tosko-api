import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { TaskEntity } from '../domain/entities/task.entity';
import {
  TASK_REPOSITORY_PORT,
  type TaskRepositoryPort,
  type TaskFilter,
  type CreateTaskInput,
  type UpdateTaskInput,
} from '../domain/ports/outbound/task-repository.port';
import type { TasksUseCasePort } from '../domain/ports/inbound/tasks-use-case.port';

@Injectable()
export class TasksService implements TasksUseCasePort {
  constructor(
    @Inject(TASK_REPOSITORY_PORT)
    private readonly taskRepository: TaskRepositoryPort,
  ) {}

  async findAll(userId: string, filter: TaskFilter): Promise<TaskEntity[]> {
    return this.taskRepository.findAll(userId, filter);
  }

  async findOne(userId: string, id: string): Promise<TaskEntity> {
    const task = await this.taskRepository.findOne(userId, id);
    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }
    return task;
  }

  async create(userId: string, input: CreateTaskInput): Promise<TaskEntity> {
    return this.taskRepository.create(userId, input);
  }

  async bulkCreate(
    userId: string,
    inputs: CreateTaskInput[],
  ): Promise<TaskEntity[]> {
    return this.taskRepository.createMany(userId, inputs);
  }

  async update(
    userId: string,
    id: string,
    input: UpdateTaskInput,
    version?: number,
  ): Promise<TaskEntity> {
    return this.taskRepository.update(userId, id, input, version);
  }

  async softDelete(userId: string, id: string): Promise<TaskEntity> {
    const task = await this.taskRepository.softDelete(userId, id);
    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }
    return task;
  }

  async bulkSoftDelete(
    userId: string,
    ids: string[],
  ): Promise<{ deleted: number }> {
    const deleted = await this.taskRepository.softDeleteMany(userId, ids);
    return { deleted };
  }
}
