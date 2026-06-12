import { TaskEntity } from '../../entities/task.entity';
import {
  TaskFilter,
  CreateTaskInput,
  UpdateTaskInput,
} from '../outbound/task-repository.port';

export const TASKS_USE_CASE_PORT = Symbol('TASKS_USE_CASE_PORT');

export interface TasksUseCasePort {
  findAll(userId: string, filter: TaskFilter): Promise<TaskEntity[]>;
  findOne(userId: string, id: string): Promise<TaskEntity>;
  create(userId: string, input: CreateTaskInput): Promise<TaskEntity>;
  bulkCreate(userId: string, inputs: CreateTaskInput[]): Promise<TaskEntity[]>;
  update(
    userId: string,
    id: string,
    input: UpdateTaskInput,
    version?: number,
  ): Promise<TaskEntity>;
  softDelete(userId: string, id: string): Promise<TaskEntity>;
  bulkSoftDelete(userId: string, ids: string[]): Promise<{ deleted: number }>;
}
