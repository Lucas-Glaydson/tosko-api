import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { TaskStatus } from '../../../../domain/value-objects/task-status.vo';
import { TaskPriority } from '../../../../domain/value-objects/task-priority.vo';

export type TaskDocument = HydratedDocument<TaskSchemaClass>;

@Schema({ timestamps: true, versionKey: 'version' })
export class TaskSchemaClass {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, trim: true, maxlength: 200 })
  title: string;

  @Prop({ trim: true, maxlength: 2000 })
  description?: string;

  @Prop({ default: 25, min: 1 })
  estimatedMinutes: number;

  @Prop({
    type: String,
    enum: TaskStatus,
    default: TaskStatus.TODO,
    index: true,
  })
  status: TaskStatus;

  @Prop({
    type: String,
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
    index: true,
  })
  priority: TaskPriority;

  @Prop({ type: Date, index: true })
  dueDate?: Date;

  @Prop({ default: false, index: true })
  deleted: boolean;
}

export const TaskSchema = SchemaFactory.createForClass(TaskSchemaClass);
TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, dueDate: 1 });
