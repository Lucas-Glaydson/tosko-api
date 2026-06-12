import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { TaskStatus } from '../../../../domain/value-objects/task-status.vo';
import { TaskPriority } from '../../../../domain/value-objects/task-priority.vo';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  estimatedMinutes?: number;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
