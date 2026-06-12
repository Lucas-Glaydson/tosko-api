import { TaskEntity } from '../../entities/task.entity';
import { TaskStatus } from '../../value-objects/task-status.vo';
import { TaskPriority } from '../../value-objects/task-priority.vo';

export const TASK_REPOSITORY_PORT = Symbol('TASK_REPOSITORY_PORT');

export interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  estimatedMinutes?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  estimatedMinutes?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
}

export interface TaskRepositoryPort {
  findAll(userId: string, filter: TaskFilter): Promise<TaskEntity[]>;
  findOne(userId: string, id: string): Promise<TaskEntity | null>;
  create(userId: string, input: CreateTaskInput): Promise<TaskEntity>;
  createMany(userId: string, inputs: CreateTaskInput[]): Promise<TaskEntity[]>;
  update(
    userId: string,
    id: string,
    input: UpdateTaskInput,
    version?: number,
  ): Promise<TaskEntity>;
  softDelete(userId: string, id: string): Promise<TaskEntity>;
  softDeleteMany(userId: string, ids: string[]): Promise<number>;
}
