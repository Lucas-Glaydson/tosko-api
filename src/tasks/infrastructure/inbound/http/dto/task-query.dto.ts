import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { TaskStatus } from '../../../../domain/value-objects/task-status.vo';
import { TaskPriority } from '../../../../domain/value-objects/task-priority.vo';

export class TaskQueryDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString()
  dueDateFrom?: string;

  @IsOptional()
  @IsDateString()
  dueDateTo?: string;
}
