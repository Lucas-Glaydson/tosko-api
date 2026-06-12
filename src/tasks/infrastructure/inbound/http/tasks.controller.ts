import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../auth/infrastructure/inbound/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import type { UserEntity } from '../../../../users/domain/entities/user.entity';
import {
  TASKS_USE_CASE_PORT,
  type TasksUseCasePort,
} from '../../../domain/ports/inbound/tasks-use-case.port';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { BulkCreateTasksDto } from './dto/bulk-create-tasks.dto';
import { BulkDeleteTasksDto } from './dto/bulk-delete-tasks.dto';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(
    @Inject(TASKS_USE_CASE_PORT)
    private readonly tasksUseCase: TasksUseCasePort,
  ) {}

  @Get()
  async findAll(
    @CurrentUser() user: UserEntity,
    @Query() query: TaskQueryDto,
  ) {
    return this.tasksUseCase.findAll(user.id, query);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.tasksUseCase.findOne(user.id, id);
  }

  @Post()
  async create(
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateTaskDto,
  ) {
    const input = {
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    };
    return this.tasksUseCase.create(user.id, input);
  }

  @Post('bulk')
  async bulkCreate(
    @CurrentUser() user: UserEntity,
    @Body() dto: BulkCreateTasksDto,
  ) {
    const inputs = dto.tasks.map((t) => ({
      ...t,
      dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
    }));
    return this.tasksUseCase.bulkCreate(user.id, inputs);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: UserEntity,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @Headers('if-match') ifMatch?: string,
  ) {
    const version = ifMatch ? parseInt(ifMatch, 10) : undefined;
    if (ifMatch && isNaN(version!)) {
      throw new BadRequestException('Header If-Match deve ser um número inteiro');
    }
    const input = {
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    };
    return this.tasksUseCase.update(user.id, id, input, version);
  }

  @Delete('bulk')
  @HttpCode(HttpStatus.OK)
  async bulkDelete(
    @CurrentUser() user: UserEntity,
    @Body() dto: BulkDeleteTasksDto,
  ) {
    return this.tasksUseCase.bulkSoftDelete(user.id, dto.ids);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.tasksUseCase.softDelete(user.id, id);
  }
}
