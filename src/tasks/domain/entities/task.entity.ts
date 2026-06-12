import { TaskStatus } from '../value-objects/task-status.vo';
import { TaskPriority } from '../value-objects/task-priority.vo';

export class TaskEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly title: string,
    public readonly description: string | undefined,
    public readonly estimatedMinutes: number,
    public readonly status: TaskStatus,
    public readonly priority: TaskPriority,
    public readonly dueDate: Date | undefined,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deleted: boolean,
    public readonly version: number,
  ) {}
}
