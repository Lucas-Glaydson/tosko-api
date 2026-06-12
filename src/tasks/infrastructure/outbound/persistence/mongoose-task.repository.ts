import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { TaskEntity } from '../../../domain/entities/task.entity';
import {
  type CreateTaskInput,
  type TaskFilter,
  type TaskRepositoryPort,
  type UpdateTaskInput,
} from '../../../domain/ports/outbound/task-repository.port';
import { TaskSchemaClass, TaskDocument } from './schemas/task.schema';
import { TaskStatus } from '../../../domain/value-objects/task-status.vo';
import { TaskPriority } from '../../../domain/value-objects/task-priority.vo';

@Injectable()
export class MongooseTaskRepository implements TaskRepositoryPort {
  constructor(
    @InjectModel(TaskSchemaClass.name)
    private readonly taskModel: Model<TaskDocument>,
  ) {}

  async findAll(userId: string, filter: TaskFilter): Promise<TaskEntity[]> {
    const query: Record<string, unknown> = { userId, deleted: false };
    if (filter.status) query.status = filter.status;
    if (filter.priority) query.priority = filter.priority;
    if (filter.dueDateFrom || filter.dueDateTo) {
      const dueDateFilter: Record<string, Date> = {};
      if (filter.dueDateFrom) dueDateFilter['$gte'] = new Date(filter.dueDateFrom);
      if (filter.dueDateTo) dueDateFilter['$lte'] = new Date(filter.dueDateTo);
      query['dueDate'] = dueDateFilter;
    }
    const docs = await this.taskModel.find(query).sort({ createdAt: -1 }).exec();
    return docs.map((d) => this.toEntity(d));
  }

  async findOne(userId: string, id: string): Promise<TaskEntity | null> {
    const doc = await this.taskModel
      .findOne({ _id: id, userId, deleted: false })
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  async create(userId: string, input: CreateTaskInput): Promise<TaskEntity> {
    const doc = await this.taskModel.create({ ...input, userId, deleted: false });
    return this.toEntity(doc);
  }

  async createMany(
    userId: string,
    inputs: CreateTaskInput[],
  ): Promise<TaskEntity[]> {
    const docs = inputs.map((i) => ({ ...i, userId, deleted: false }));
    const inserted = await this.taskModel.insertMany(docs, { ordered: false });
    return (inserted as TaskDocument[]).map((d) => this.toEntity(d));
  }

  async update(
    userId: string,
    id: string,
    input: UpdateTaskInput,
    version?: number,
  ): Promise<TaskEntity> {
    const filter: Record<string, unknown> = { _id: id, userId, deleted: false };
    if (version !== undefined) filter.version = version;

    const doc = await this.taskModel
      .findOneAndUpdate(
        filter,
        { $set: { ...input, updatedAt: new Date() }, $inc: { version: 1 } },
        { new: true, runValidators: true },
      )
      .exec();

    if (!doc) {
      throw new NotFoundException(
        'Tarefa não encontrada ou versão desatualizada',
      );
    }
    return this.toEntity(doc);
  }

  async softDelete(userId: string, id: string): Promise<TaskEntity> {
    const doc = await this.taskModel
      .findOneAndUpdate(
        { _id: id, userId, deleted: false },
        { deleted: true, $inc: { version: 1 } },
        { new: true },
      )
      .exec();

    if (!doc) {
      throw new NotFoundException('Tarefa não encontrada');
    }
    return this.toEntity(doc);
  }

  async softDeleteMany(userId: string, ids: string[]): Promise<number> {
    const result = await this.taskModel
      .updateMany(
        { _id: { $in: ids }, userId, deleted: false },
        { deleted: true, $inc: { version: 1 } },
      )
      .exec();
    return result.modifiedCount;
  }

  private toEntity(doc: TaskDocument): TaskEntity {
    const d = doc as unknown as {
      createdAt: Date;
      updatedAt: Date;
      version: number;
    };
    return new TaskEntity(
      (doc._id as object).toString(),
      doc.userId,
      doc.title,
      doc.description,
      doc.estimatedMinutes,
      doc.status as TaskStatus,
      doc.priority as TaskPriority,
      doc.dueDate,
      d.createdAt,
      d.updatedAt,
      doc.deleted,
      d.version ?? 1,
    );
  }
}
