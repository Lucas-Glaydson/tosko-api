import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class BulkDeleteTasksDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids: string[];
}
