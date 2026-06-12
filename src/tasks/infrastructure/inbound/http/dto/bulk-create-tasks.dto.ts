import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTaskDto } from './create-task.dto';

export class BulkCreateTasksDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateTaskDto)
  tasks: CreateTaskDto[];
}
